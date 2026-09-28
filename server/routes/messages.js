import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Message from "../models/Message.js";
import { canAccessRoom } from "../utils/rooms.js";

const router = express.Router();

// Get message history for a room (only non-deleted messages)
router.get("/:room", verifyToken, async (req, res) => {
  try {
    // Users can only read their own private rooms / chats
    if (!canAccessRoom(req.params.room, req.userId)) {
      return res.status(403).json({ error: "Not allowed to view this room" });
    }

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