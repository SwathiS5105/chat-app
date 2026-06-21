import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";


import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import { verifySocketToken } from "./middleware/auth.js";
import { registerChatHandlers } from "./sockets/chatHandlers.js";
import { registerGameHandlers } from "./sockets/gameHandlers.js";
import { startDeleteWorker } from "./jobs/deleteMessageQueue.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => res.send("Chat app server is running"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
});

io.use(verifySocketToken);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, "user:", socket.userId);

  registerChatHandlers(io, socket);
  registerGameHandlers(io, socket);
  

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
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
