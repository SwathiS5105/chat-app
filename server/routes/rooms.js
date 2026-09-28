import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Message from "../models/Message.js";
import { ROOMS } from "../utils/rooms.js";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  res.json(ROOMS);
});

// Rooms with THIS user's own message count (each user has private rooms)
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const withCounts = await Promise.all(
      ROOMS.map(async (r) => ({
        ...r,
        messageCount: await Message.countDocuments({
          room: `${r.id}_${req.userId}`,
          deleted: false,
        }),
      }))
    );
    res.json(withCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch rooms" });
  }
});

export default router;
export { ROOMS };