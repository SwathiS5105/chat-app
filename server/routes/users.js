import express from "express";
import { verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Get all users except the currently logged-in one
router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select("username email");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch users" });
  }
});
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username email");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch user" });
  }
});

export default router;