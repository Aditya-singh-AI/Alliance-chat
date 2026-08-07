const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    phoneSuffix: {
      type: String,
      unique: false,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
      validate: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: "Invalid email address",
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiry: {
      type: String,
    },

    profilePicture: {
      type: String,
    },
    about: {
      type: String,
    },
    lastSeen: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    agreed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
