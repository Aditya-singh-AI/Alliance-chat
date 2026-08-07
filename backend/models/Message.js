const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
    },
    imageOrVideoUrl: {
      type: String,
      default: null,
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
        },
      },
    ],
    messageStatus: {
      type: String,
      default: "send",
    },
  },
  { timestamps: true },
);
const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
