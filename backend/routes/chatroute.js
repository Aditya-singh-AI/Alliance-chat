const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleWare");
const { multerMiddleware } = require("../config/cloudinaryConfig");

const router = express.Router();

// Routes
router.post(
  "/send-message",
  authMiddleware,
  multerMiddleware,
  chatController.sendMessage,
);
router.get("/conversations", authMiddleware, chatController.getConversation);
router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  chatController.getMessages,
);
router.put("/messages/read", authMiddleware, chatController.markAsRead);
router.delete(
  "/messages/:messageId",
  authMiddleware,
  chatController.deleteMessage,
);

module.exports = router;
