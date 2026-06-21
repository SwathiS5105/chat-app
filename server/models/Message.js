import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true }, // for 1:1, use a deterministic room id like sorted "userId1_userId2"
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    expiresAt: { type: Date, default: null }, // null = never expires
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
