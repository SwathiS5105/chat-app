import express from "express";
import { verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { getBotId } from "../utils/rooms.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select("username email");

    const botId = await getBotId();

    // For each user, find the last message in their shared room
    const usersWithLastMessage = await Promise.all(
      users.map(async (u) => {
        const roomId = [req.userId, u._id.toString()].sort().join("_");
        const lastMsg = await Message.findOne({
          room: roomId,
          deleted: false,
          content: { $ne: "" },
        })
          .sort({ createdAt: -1 })
          .populate("sender", "username");

        return {
          _id: u._id,
          username: u.username,
          email: u.email,
          isBot: u._id.toString() === botId,
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                senderUsername: lastMsg.sender?.username,
                createdAt: lastMsg.createdAt,
              }
            : null,
        };
      })
    );

    res.json(usersWithLastMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username email");
    if (!user) return res.status(404).json({ error: "User not found" });
    const botId = await getBotId();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isBot: user._id.toString() === botId,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch user" });
  }
});

export default router;