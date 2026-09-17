import express from "express";
import { verifyToken } from "../middleware/auth.js";

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

router.get("/", verifyToken, (req, res) => {
  res.json(ROOMS);
});

// Return rooms with messageCount as 0 — no DB query needed
router.get("/stats", verifyToken, (req, res) => {
  res.json(ROOMS.map((r) => ({ ...r, messageCount: 0 })));
});

export default router;
export { ROOMS };