const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");

const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // userId -> { conversationId -> bool }

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000,
  });

  // Expose online users map for controllers to use via req.socketUserMap
  io.socketUserMap = onlineUsers;

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User comes online
    socket.on("user_connected", async (userId) => {
      try {
        const uid = (typeof userId === "object" ? userId?._id || userId?.id : userId)?.toString();
        if (uid) {
          onlineUsers.set(uid, socket.id);
          socket.join(uid);
          await User.findByIdAndUpdate(uid, {
            isOnline: true,
            lastSeen: new Date(),
          });
          io.emit("user_status", { userId: uid, isOnline: true });
        }
      } catch (err) {
        console.error("user_connected error:", err.message);
      }
    });

    // Online status check
    socket.on("get_user_status", (requestedUserId, callback) => {
      const reqUid = requestedUserId?.toString();
      callback({
        userId: reqUid,
        isOnline: onlineUsers.has(reqUid),
      });
    });

    // Relay message to receiver
    socket.on("send_message", async (message) => {
      try {
        const receiverId = (message.receiver?._id || message.receiver?.id || message.receiver)?.toString();
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("received_message", message);
        }
      } catch (err) {
        console.error("send_message error:", err.message);
        socket.emit("message_error", "Failed to send message.");
      }
    });

    // Mark messages as read
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((id) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId: id,
              messageStatus: "read",
            });
          });
        }
      } catch (err) {
        console.error("message_read error:", err.message);
      }
    });

    // Typing start
    socket.on("typing_start", ({ conversationId, receiverId, userId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      typingUsers.get(userId)[conversationId] = true;

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: true,
        });
      }

      const key = `${conversationId}_${userId}_timeout`;
      if (socket[key]) clearTimeout(socket[key]);
      socket[key] = setTimeout(() => {
        if (typingUsers.get(userId))
          typingUsers.get(userId)[conversationId] = false;
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("user_typing", {
            userId,
            conversationId,
            isTyping: false,
          });
        }
      }, 3000);
    });

    // Typing stop
    socket.on("typing_stop", ({ conversationId, receiverId, userId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (typingUsers.get(userId))
        typingUsers.get(userId)[conversationId] = false;

      const key = `${conversationId}_${userId}_timeout`;
      if (socket[key]) {
        clearTimeout(socket[key]);
        delete socket[key];
      }

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }
    });

    // Emoji reactions
    socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const idx = message.reactions.findIndex(
          (r) => r.user.toString() === reactionUserId,
        );
        if (idx > -1) {
          if (message.reactions[idx].emoji === emoji) {
            message.reactions.splice(idx, 1); // toggle off
          } else {
            message.reactions[idx].emoji = emoji; // swap
          }
        } else {
          message.reactions.push({ user: reactionUserId, emoji });
        }
        await message.save();

        const populated = await Message.findById(messageId)
          .populate("reactions.user", "username profilePicture")
          .populate("sender", "username profilePicture")
          .populate("receiver", "username profilePicture");

        const update = { messageId, reactions: populated.reactions };
        const senderSocket = onlineUsers.get(populated.sender._id.toString());
        const receiverSocket = onlineUsers.get(
          populated.receiver._id.toString(),
        );
        if (senderSocket) io.to(senderSocket).emit("reaction_update", update);
        if (receiverSocket)
          io.to(receiverSocket).emit("reaction_update", update);
      } catch (err) {
        console.error("add_reaction error:", err.message);
      }
    });

    // User disconnects
    socket.on("disconnect", async () => {
      let disconnectedUserId = null;
      onlineUsers.forEach((sid, uid) => {
        if (sid === socket.id) disconnectedUserId = uid;
      });

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        typingUsers.delete(disconnectedUserId);
        try {
          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          io.emit("user_status", {
            userId: disconnectedUserId,
            isOnline: false,
            lastSeen: new Date(),
          });
          console.log(`User ${disconnectedUserId} marked OFFLINE.`);
        } catch (err) {
          console.error("disconnect error:", err.message);
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
