const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const response = require("../utils/responseHandler");

// 1. Get all users for Admin Dashboard with stats
const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find()
      .select("-emailOtp -emailOtpExpiry -phoneOtp -phoneOtpExpiry")
      .sort({ createdAt: -1 })
      .lean();

    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Message.countDocuments();

    // Populate conversation & message count for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const conversationCount = await Conversation.countDocuments({
          participants: u._id,
        });
        const messageCount = await Message.countDocuments({
          sender: u._id,
        });
        return {
          ...u,
          conversationCount,
          messageCount,
        };
      })
    );

    return response(res, 200, "Admin user list retrieved successfully", {
      users: usersWithStats,
      stats: {
        totalUsers,
        totalAdmins,
        totalConversations,
        totalMessages,
      },
    });
  } catch (error) {
    console.error("getAllUsersAdmin error:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// 2. Register/Create new user from Admin Dashboard
const createUserAdmin = async (req, res) => {
  let { username, email, phoneNumber, phoneSuffix, about, role } = req.body;

  try {
    // Auto-fix email if missing @ (e.g. talkativechatapplication.gmail.com -> talkativechatapplication@gmail.com)
    if (email && typeof email === "string") {
      email = email.trim().toLowerCase();
      if (!email.includes("@") && email.includes("gmail.com")) {
        email = email.replace("gmail.com", "@gmail.com");
      }
    }

    // Check if user with phone or email already exists
    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        existingPhone.role = role || "admin";
        if (username) existingPhone.username = username;
        if (email) existingPhone.email = email;
        await existingPhone.save();
        return response(res, 200, "Existing user updated to Admin role successfully", existingPhone);
      }
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        existingEmail.role = role || "admin";
        if (username) existingEmail.username = username;
        if (phoneNumber) existingEmail.phoneNumber = phoneNumber;
        await existingEmail.save();
        return response(res, 200, "Existing user updated to Admin role successfully", existingEmail);
      }
    }

    const newUser = new User({
      username: username || "Admin User",
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      phoneSuffix: phoneSuffix || "+91",
      about: about || "Hey there! I am using Alliance.",
      role: role || "admin",
      isVerified: true,
      agreed: true,
    });

    await newUser.save();

    return response(res, 201, "New admin user registered successfully", newUser);
  } catch (error) {
    console.error("createUserAdmin error:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// 3. Edit user details (Admin)
const updateUserAdmin = async (req, res) => {
  const { userId } = req.params;
  const { username, email, phoneNumber, phoneSuffix, about, role, isVerified } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (phoneSuffix !== undefined) user.phoneSuffix = phoneSuffix;
    if (about !== undefined) user.about = about;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (role !== undefined && ["user", "admin"].includes(role)) {
      user.role = role;
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.emailOtp;
    delete updatedUser.phoneOtp;

    return response(res, 200, "User details updated successfully", updatedUser);
  } catch (error) {
    console.error("updateUserAdmin error:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

// 4. Delete user registration permanently (Admin)
const deleteUserAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }

    // Delete all messages associated with this user
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Delete all conversations involving this user
    await Conversation.deleteMany({
      participants: userId,
    });

    // Delete the user registration document
    await User.findByIdAndDelete(userId);

    return response(
      res,
      200,
      `User registration (${user.username || user.email || userId}) deleted permanently`,
      { deletedUserId: userId }
    );
  } catch (error) {
    console.error("deleteUserAdmin error:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

module.exports = {
  getAllUsersAdmin,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
};
