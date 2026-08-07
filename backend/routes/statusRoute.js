const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleWare");
const { multerMiddleware } = require("../config/cloudinaryConfig");
const {
  createStatus,
  getStatuses,
  viewStatus,
  deleteStatus,
} = require("../controllers/statusController");

router.post("/", authMiddleware, multerMiddleware, createStatus);
router.get("/", authMiddleware, getStatuses);
router.put("/:statusId/view", authMiddleware, viewStatus);
router.delete("/:statusId", authMiddleware, deleteStatus);

module.exports = router;
