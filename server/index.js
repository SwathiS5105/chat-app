import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/users.js";
import { verifySocketToken } from "./middleware/auth.js";
import { registerChatHandlers } from "./sockets/chatHandlers.js";
import { registerGameHandlers } from "./sockets/gameHandlers.js";
import { startDeleteWorker } from "./jobs/deleteMessageQueue.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => res.send("Chat app server is running"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  },
});

// Track online users: Map of userId -> Set of socketIds
// (one user can have multiple tabs open)
const onlineUsers = new Map();

io.use(verifySocketToken);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, "user:", socket.userId);

  // Add this socket to the user's set
  if (!onlineUsers.has(socket.userId)) {
    onlineUsers.set(socket.userId, new Set());
  }
  onlineUsers.get(socket.userId).add(socket.id);

  // Broadcast updated online users list to everyone
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  registerChatHandlers(io, socket);
  registerGameHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);

    // Remove this socket from the user's set
    if (onlineUsers.has(socket.userId)) {
      onlineUsers.get(socket.userId).delete(socket.id);

      // If no more sockets for this user, remove them entirely
      if (onlineUsers.get(socket.userId).size === 0) {
        onlineUsers.delete(socket.userId);
      }
    }

    // Broadcast updated online users list
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    startDeleteWorker(io);
    console.log("Delete worker started");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();