import Message from "../models/Message.js";
import { scheduleDeletion } from "../jobs/deleteMessageQueue.js";
import { generateAIResponse } from "../services/gemini.js";
import { decryptMessage } from "../utils/crypto.js";

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

      // Check if this is a 1:1 chat with StudyBot
      const roomIds = room.split("_");
      const isGeminiRoom = GEMINI_BOT_ID && roomIds.includes(GEMINI_BOT_ID);

      // Check if this is a named study room (e.g. room_python, room_java)
      const isStudyRoom = room.startsWith("room_");

      if (isGeminiRoom || isStudyRoom) {
        io.to(room).emit("userTyping", { username: "StudyBot" });

        try {
          // Fetch last 10 messages for context
          const history = await Message.find({
            room,
            deleted: false,
            content: { $ne: "" },
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("sender", "username");

          // Reverse so oldest is first
          history.reverse();

          // Build conversation history in Groq's format
          const conversationMessages = history.map((msg) => ({
            role: msg.sender._id.toString() === GEMINI_BOT_ID
              ? "assistant"
              : "user",
            content: decryptMessage(msg.content),
          }));

          // For study rooms, extract subject from room ID and pass as context
          const subject = isStudyRoom
            ? room.replace("room_", "").replace(/_/g, " ")
            : null;

          const aiReply = await generateAIResponse(conversationMessages, subject);

          const botMessage = await Message.create({
            room,
            sender: GEMINI_BOT_ID,
            content: aiReply,
            expiresAt: null,
          });

          const populatedBot = await botMessage.populate("sender", "username");
          io.to(room).emit("newMessage", populatedBot);
        } catch (aiErr) {
          console.error("AI error:", aiErr.message);

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