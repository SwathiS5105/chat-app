import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Message from "../models/Message.js";

const router = express.Router();

const ROOMS = [
  { id: "room_python", name: "Python Programming", icon: "🐍" },
  { id: "room_java", name: "Java Programming", icon: "☕" },
  { id: "room_dsa", name: "Data Structures", icon: "🌳" },
  { id: "room_algo", name: "Algorithms", icon: "⚙️" },
  { id: "room_dbms", name: "Database Management", icon: "🗄️" },
  { id: "room_networks", name: "Computer Networks", icon: "🌐" },
  { id: "room_os", name: "Operating Systems", icon: "💻" },
  { id: "room_web", name: "Web Technologies", icon: "🕸️" },
  { id: "room_se", name: "Software Engineering", icon: "📐" },
  { id: "room_ai", name: "Artificial Intelligence", icon: "🤖" },
];

// Get all rooms
router.get("/", verifyToken, (req, res) => {
  res.json(ROOMS);
});

// Get recent message count per room
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const stats = await Promise.all(
      ROOMS.map(async (room) => {
        const count = await Message.countDocuments({
          room: room.id,
          deleted: false,
        });
        return { ...room, messageCount: count };
      })
    );
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch room stats" });
  }
});

export default router;
export { ROOMS };