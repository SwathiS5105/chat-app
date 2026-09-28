import User from "../models/User.js";

// Base subject rooms. Each user gets a PRIVATE copy: room_<key>_<userId>
export const ROOMS = [
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

const STUDY_ROOM = /^(room_[a-z]+)_([a-f0-9]{24})$/i;
const DIRECT_ROOM = /^([a-f0-9]{24})_([a-f0-9]{24})$/i;

// Find StudyBot by username so we don't depend on a hand-copied env var.
// Falls back to GEMINI_BOT_ID if the user record can't be found.
let cachedBotId = null;
export async function getBotId() {
  if (cachedBotId) return cachedBotId;
  const bot = await User.findOne({ username: "StudyBot" }).select("_id");
  if (bot) {
    cachedBotId = bot._id.toString();
    return cachedBotId;
  }
  return process.env.GEMINI_BOT_ID || null;
}

// Returns { type: "study", base, ownerId, subject } | { type: "direct", ids } | null
export function parseRoom(room) {
  if (typeof room !== "string") return null;

  const study = room.match(STUDY_ROOM);
  if (study) {
    const base = study[1].toLowerCase();
    const def = ROOMS.find((r) => r.id === base);
    if (!def) return null;
    return { type: "study", base, ownerId: study[2], subject: def.name };
  }

  const direct = room.match(DIRECT_ROOM);
  if (direct) return { type: "direct", ids: [direct[1], direct[2]] };

  return null;
}

// A study room is private to its owner; a direct room only to its two members.
export function canAccessRoom(room, userId) {
  const parsed = parseRoom(room);
  if (!parsed || !userId) return false;
  if (parsed.type === "study") return parsed.ownerId === String(userId);
  return parsed.ids.includes(String(userId));
}

// Games/quizzes are only allowed in a direct room between two real users.
export async function isUserToUserRoom(room, userId) {
  const parsed = parseRoom(room);
  if (!parsed || parsed.type !== "direct") return false;
  if (!canAccessRoom(room, userId)) return false;
  const botId = await getBotId();
  return !(botId && parsed.ids.includes(botId));
}