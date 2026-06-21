import Message from "../models/Message.js";
import { scheduleDeletion } from "../jobs/deleteMessageQueue.js";

export function registerChatHandlers(io, socket) {
  // Client joins a room (1:1 chat = deterministic room id from both user ids)
  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  // Client sends a message. ttlSeconds is optional — null/undefined means it never expires.
  socket.on("sendMessage", async ({ room, content, ttlSeconds }, callback) => {
    try {
      const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;

      const message = await Message.create({
        room,
        sender: socket.userId,
        content,
        expiresAt,
      });

      const populated = await message.populate("sender", "username");

      // Send to everyone in the room, including sender (keeps UI logic simple)
      io.to(room).emit("newMessage", populated);

      if (ttlSeconds) {
        await scheduleDeletion(message._id.toString(), ttlSeconds * 1000);
      }

      if (callback) callback({ success: true });
    } catch (err) {
      console.error(err);
      if (callback) callback({ success: false, error: "Could not send message" });
    }
  });

  // Optional: typing indicator
  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("userTyping", { username });
  });
}
