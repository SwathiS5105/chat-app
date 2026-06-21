import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Message from "../models/Message.js";

const router = express.Router();

// Get message history for a room (only non-deleted messages)
router.get("/:room", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      room: req.params.room,
      deleted: false,
    })
      .sort({ createdAt: 1 })
      .populate("sender", "username");

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

export default router;
