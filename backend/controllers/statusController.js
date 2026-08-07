const Status = require("../models/Status");
const response = require("../utils/responseHandler");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");

// ─── Create Status ───────────────────────────────────────────────────────────
exports.createStatus = async (req, res) => {
  const { content } = req.body;
  const userId = req.user.userId;

  try {
    let mediaUrl = null;
    let contentType = "text";

    if (req.file) {
      const uploadResult = await uploadFileToCloudinary(req.file);
      mediaUrl = uploadResult.secure_url;
      contentType = req.file.mimetype.startsWith("video") ? "video" : "image";
    } else if (content) {
      mediaUrl = content; // For text-only status, store text in content
      contentType = "text";
    } else {
      return response(res, 400, "Status content or media is required");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const status = new Status({
      user: userId,
      content: mediaUrl,
      contentType,
      expiresAt,
    });
    await status.save();

    const populated = await Status.findById(status._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    // Broadcast to all other online users
    if (req.io && req.socketUserMap) {
      req.socketUserMap.forEach((socketId, onlineUserId) => {
        if (onlineUserId !== userId) {
          req.io.to(socketId).emit("new_status", populated);
        }
      });
    }

    return response(res, 201, "Status created successfully", populated);
  } catch (error) {
    console.error("Error in createStatus:", error.message);
    return response(res, 500, "Internal Server Error");
  }
};

// ─── Get Active Statuses (non-expired) ───────────────────────────────────────
exports.getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({ expiresAt: { $gt: new Date() } })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });

    return response(res, 200, "Statuses retrieved successfully", statuses);
  } catch (error) {
    console.error("Error in getStatuses:", error.message);
    return response(res, 500, "Internal Server Error");
  }
};

// ─── View Status (register viewer) ──────────────────────────────────────────
exports.viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }

    // Add viewer if not already recorded
    if (!status.viewers.map((v) => v.toString()).includes(userId)) {
      status.viewers.push(userId);
      await status.save();
    }

    const updated = await Status.findById(statusId)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    // Notify the status owner in real-time
    if (req.io && req.socketUserMap) {
      const ownerSocket = req.socketUserMap.get(status.user.toString());
      if (ownerSocket) {
        req.io.to(ownerSocket).emit("status_viewed", {
          statusId,
          viewerId: userId,
          totalViewers: updated.viewers.length,
          viewers: updated.viewers,
        });
      }
    }

    return response(res, 200, "Status viewed successfully", updated);
  } catch (error) {
    console.error("Error in viewStatus:", error.message);
    return response(res, 500, "Internal Server Error");
  }
};

// ─── Delete Status ───────────────────────────────────────────────────────────
exports.deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }
    if (status.user.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this status");
    }

    await Status.deleteOne({ _id: statusId });

    // Notify all online users
    if (req.io && req.socketUserMap) {
      req.socketUserMap.forEach((socketId, onlineUserId) => {
        if (onlineUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      });
    }

    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.error("Error in deleteStatus:", error.message);
    return response(res, 500, "Internal Server Error");
  }
};
