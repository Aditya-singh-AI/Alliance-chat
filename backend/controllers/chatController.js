const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const response = require("../utils/responseHandler");

// ─── Send Message ────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    // Find or create conversation
    const participants = [senderId, receiverId].sort();
    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    // Handle file upload via Cloudinary
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      if (!uploadResult?.secure_url) {
        return response(res, 400, "Failed to upload file");
      }
      imageOrVideoUrl = uploadResult.secure_url;
      if (file.mimetype?.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype?.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content or media is required");
    }

    // Create and save message
    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: content || "",
      imageOrVideoUrl,
      contentType,
      messageStatus: messageStatus || "sent",
    });
    await message.save();

    // Update conversation's lastMessage and unread count
    conversation.lastMessage = message._id;
    conversation.unreadCount += 1;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    // Real-time: emit to receiver via Socket.IO
    if (req.io && req.socketUserMap) {
      const recIdStr = receiverId ? receiverId.toString() : null;
      const receiverSocketId = recIdStr ? req.socketUserMap.get(recIdStr) : null;
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("received_message", populatedMessage);
        // Mark delivered since receiver is online
        message.messageStatus = "delivered";
        await message.save();
      }
    }

    return response(res, 201, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// ─── Get All Conversations ───────────────────────────────────────────────────
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: userId,
          messageStatus: { $ne: "read" },
        });
        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    return response(
      res,
      200,
      "Conversations retrieved successfully",
      conversationsWithUnread,
    );
  } catch (error) {
    console.error("Error in getConversation:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// ─── Get Messages in a Conversation ──────────────────────────────────────────
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId;
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }
    if (!conversation.participants.map((p) => p.toString()).includes(userId)) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort({ createdAt: 1 });

    // Mark unread messages sent TO this user as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["sent", "delivered"] },
      },
      { $set: { messageStatus: "read" } },
    );

    // Reset unread count
    conversation.unreadCount = 0;
    await conversation.save();

    return response(res, 200, "Messages retrieved successfully", messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// ─── Mark Messages As Read ───────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;
  try {
    const ids = Array.isArray(messageIds) ? messageIds : [messageIds];

    await Message.updateMany(
      { _id: { $in: ids }, receiver: userId },
      { $set: { messageStatus: "read" } },
    );

    // Notify senders via Socket.IO
    if (req.io && req.socketUserMap) {
      const messages = await Message.find({ _id: { $in: ids } }).select(
        "sender",
      );
      const senderIds = [...new Set(messages.map((m) => m.sender.toString()))];
      senderIds.forEach((senderId) => {
        const senderSocket = req.socketUserMap.get(senderId);
        if (senderSocket) {
          ids.forEach((id) => {
            req.io.to(senderSocket).emit("message_status_update", {
              messageId: id,
              messageStatus: "read",
            });
          });
        }
      });
    }

    return response(res, 200, "Messages marked as read");
  } catch (error) {
    console.error("Error in markAsRead:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// ─── Delete Message ──────────────────────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }
    if (message.sender.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this message");
    }

    await Message.findByIdAndDelete(messageId);

    // Notify receiver in real-time
    if (req.io && req.socketUserMap) {
      const receiverSocket = req.socketUserMap.get(message.receiver.toString());
      if (receiverSocket) {
        req.io.to(receiverSocket).emit("message_deleted", messageId);
      }
    }

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};
