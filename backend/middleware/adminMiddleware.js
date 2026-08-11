const User = require("../models/User");
const response = require("../utils/responseHandler");

const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return response(res, 401, "Unauthorized");
    }

    let user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }

    // Bootstrap check: ensure owner account or first user is admin if no admin exists
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const isOwnerAccount =
      user.phoneNumber === "7223944095" ||
      user.email === "aditya.asb24@gmail.com" ||
      user.email === "talkativechatapplication@gmail.com" ||
      user.username === "Aditya singh 05";

    if (user.role !== "admin" && (totalAdmins === 0 || isOwnerAccount)) {
      user.role = "admin";
      await user.save();
    }

    // Strict security check: reject standard non-admin users
    if (user.role !== "admin") {
      return response(res, 403, "Access denied: Only administrators can access the Admin Dashboard");
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return response(res, 500, "Internal Server Error", error.message);
  }
};

module.exports = adminMiddleware;
