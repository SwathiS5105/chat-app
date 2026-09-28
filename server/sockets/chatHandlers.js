import Message from "../models/Message.js";
import { scheduleDeletion } from "../jobs/deleteMessageQueue.js";
import { generateAIResponse } from "../services/gemini.js";
import { decryptMessage } from "../utils/crypto.js";
import { parseRoom, canAccessRoom, getBotId } from "../utils/rooms.js";

export function registerChatHandlers(io, socket) {
  socket.on("joinRoom", (room) => {
    // Only the room's owner / members may join it
    if (!canAccessRoom(room, socket.userId)) return;
    socket.join(room);
  });

  socket.on("sendMessage", async ({ room, content, ttlSeconds }, callback) => {
    try {
      if (!canAccessRoom(room, socket.userId)) {
        if (callback) callback({ success: false, error: "Not allowed in this room" });
        return;
      }

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

      // Decide whether StudyBot should reply
      const parsed = parseRoom(room);
      const botId = await getBotId();
      const isBotChat = parsed?.type === "direct" && botId && parsed.ids.includes(botId);
      const isStudyRoom = parsed?.type === "study";

      if ((isBotChat || isStudyRoom) && !botId) {
        console.error("StudyBot user not found — cannot generate AI reply");
      }

      if ((isBotChat || isStudyRoom) && botId) {
        io.to(room).emit("userTyping", { username: "StudyBot" });

        try {
          // Last 10 messages of THIS room only (rooms are private per user)
          const history = await Message.find({
            room,
            deleted: false,
            content: { $ne: "" },
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("sender", "username");

          history.reverse();

          const conversationMessages = history.map((msg) => ({
            role: msg.sender?._id?.toString() === botId ? "assistant" : "user",
            content: decryptMessage(msg.content),
          }));

          const subject = isStudyRoom ? parsed.subject : null;
          const aiReply = await generateAIResponse(conversationMessages, subject);

          const botMessage = await Message.create({
            room,
            sender: botId,
            content: aiReply,
            expiresAt: null,
          });

          const populatedBot = await botMessage.populate("sender", "username");
          io.to(room).emit("newMessage", populatedBot);
        } catch (aiErr) {
          console.error("AI error:", aiErr.message);

          const errMessage = await Message.create({
            room,
            sender: botId,
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
    if (!canAccessRoom(room, socket.userId)) return;
    socket.to(room).emit("userTyping", { username });
  });
}