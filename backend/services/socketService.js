const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");
const handleVideoCallEvents = require("./videoCallEvents");
// const socketMiddleware = require("../middleware/socketMiddleware"); // Uncomment to enforce socket auth

const onlineUsers = new Map(); // userId -> socketId
const typingTimeouts = new Map(); // userId -> timeout ID

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000,
  });

  io.socketUserMap = onlineUsers;

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User comes online
    socket.on("user_connected", async (userId) => {
      try {
        const uid = (typeof userId === "object" ? userId?._id || userId?.id : userId)?.toString();
        if (uid) {
          onlineUsers.set(uid, socket.id);
          socket.userId = uid; // Store userId on socket for video call signalling
          socket.join(uid);

          await User.findByIdAndUpdate(uid, {
            isOnline: true,
            lastSeen: new Date(),
          });

          io.emit("user_status", { userId: uid, isOnline: true });

          const onlineUserIds = Array.from(onlineUsers.keys());
          socket.emit("user_status_list", onlineUserIds);
        }
      } catch (err) {
        console.error("user_connected error:", err.message);
      }
    });

    socket.on("get_online_users", (callback) => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      if (typeof callback === "function") {
        callback(onlineUserIds);
      } else {
        socket.emit("user_status_list", onlineUserIds);
      }
    });

    socket.on("get_user_status", (requestedUserId, callback) => {
      const reqUid = requestedUserId?.toString();
      const statusData = {
        userId: reqUid,
        isOnline: onlineUsers.has(reqUid),
      };
      if (typeof callback === "function") {
        callback(statusData);
      } else {
        socket.emit("user_status", statusData);
      }
    });

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

    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );
        const senderSocketId = onlineUsers.get(senderId?.toString());
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

    // Typing start with server auto-expire timeout
    socket.on("typing_start", ({ conversationId, receiverId, userId }) => {
      const uId = userId?.toString();
      const rId = receiverId?.toString();
      const cId = conversationId?.toString();
      if (!uId || !rId) return;

      const receiverSocketId = onlineUsers.get(rId);
      const typingPayload = {
        userId: uId,
        receiverId: rId,
        conversationId: cId,
        isTyping: true,
      };

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", typingPayload);
      }
      socket.to(rId).emit("user_typing", typingPayload);

      // Reset existing timeout for this typing user
      if (typingTimeouts.has(uId)) {
        clearTimeout(typingTimeouts.get(uId));
      }

      // Auto-expire after 2.5 seconds if typing_stop wasn't explicitly received
      const timeoutId = setTimeout(() => {
        const stopPayload = {
          userId: uId,
          receiverId: rId,
          conversationId: cId,
          isTyping: false,
        };
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("user_typing", stopPayload);
        }
        socket.to(rId).emit("user_typing", stopPayload);
        typingTimeouts.delete(uId);
      }, 2500);

      typingTimeouts.set(uId, timeoutId);
    });

    // Typing stop
    socket.on("typing_stop", ({ conversationId, receiverId, userId }) => {
      const uId = userId?.toString();
      const rId = receiverId?.toString();
      const cId = conversationId?.toString();
      if (!uId || !rId) return;

      if (typingTimeouts.has(uId)) {
        clearTimeout(typingTimeouts.get(uId));
        typingTimeouts.delete(uId);
      }

      const stopPayload = {
        userId: uId,
        receiverId: rId,
        conversationId: cId,
        isTyping: false,
      };

      const receiverSocketId = onlineUsers.get(rId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", stopPayload);
      }
      socket.to(rId).emit("user_typing", stopPayload);
    });

    socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const idx = message.reactions.findIndex(
          (r) => r.user.toString() === reactionUserId,
        );
        if (idx > -1) {
          if (message.reactions[idx].emoji === emoji) {
            message.reactions.splice(idx, 1);
          } else {
            message.reactions[idx].emoji = emoji;
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
        const receiverSocket = onlineUsers.get(populated.receiver._id.toString());
        if (senderSocket) io.to(senderSocket).emit("reaction_update", update);
        if (receiverSocket) io.to(receiverSocket).emit("reaction_update", update);
      } catch (err) {
        console.error("add_reaction error:", err.message);
      }
    });

    socket.on("disconnect", async () => {
      let disconnectedUserId = null;
      onlineUsers.forEach((sid, uid) => {
        if (sid === socket.id) disconnectedUserId = uid;
      });

      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId);
        if (typingTimeouts.has(disconnectedUserId)) {
          clearTimeout(typingTimeouts.get(disconnectedUserId));
          typingTimeouts.delete(disconnectedUserId);
        }
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

    // Register WebRTC Video Call signalling events
    handleVideoCallEvents(socket, io, onlineUsers);
  });

  return io;
};

module.exports = initializeSocket;
