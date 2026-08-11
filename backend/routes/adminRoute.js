const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleWare");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Protect all admin endpoints with auth and admin verification
router.use(authMiddleware, adminMiddleware);

// Routes
router.get("/users", adminController.getAllUsersAdmin);
router.post("/users", adminController.createUserAdmin);
router.put("/users/:userId", adminController.updateUserAdmin);
router.delete("/users/:userId", adminController.deleteUserAdmin);

module.exports = router;
