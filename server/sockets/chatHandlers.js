import Message from "../models/Message.js";
import { scheduleDeletion } from "../jobs/deleteMessageQueue.js";
import { generateAIResponse } from "../services/gemini.js";

const GEMINI_BOT_ID = process.env.GEMINI_BOT_ID;

export function registerChatHandlers(io, socket) {
  

  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

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
      io.to(room).emit("newMessage", populated);

      if (ttlSeconds) {
        await scheduleDeletion(message._id.toString(), ttlSeconds * 1000);
      }

      // Check if this is a chat with GeminiBot
      const roomIds = room.split("_");
      
      
      

      const isGeminiRoom = GEMINI_BOT_ID && roomIds.includes(GEMINI_BOT_ID);

      if (isGeminiRoom) {
        io.to(room).emit("userTyping", { username: "GeminiBot" });

        try {
          const aiReply = await generateAIResponse(content);

          const botMessage = await Message.create({
            room,
            sender: GEMINI_BOT_ID,
            content: aiReply,
            expiresAt: null,
          });

          const populatedBot = await botMessage.populate("sender", "username");
          io.to(room).emit("newMessage", populatedBot);
        } catch (aiErr) {
          console.error("Gemini error:", aiErr.message);

          const errMessage = await Message.create({
            room,
            sender: GEMINI_BOT_ID,
            content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
            expiresAt: null,
          });

          const populatedErr = await errMessage.populate("sender", "username");
          io.to(room).emit("newMessage", populatedErr);
        }
      }

      if (callback) callback({ success: true });
    } catch (err) {
      console.error(err);
      if (callback) callback({ success: false, error: "Could not send message" });
    }
  });

  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("userTyping", { username });
  });
}