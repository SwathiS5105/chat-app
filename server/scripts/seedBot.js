import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

async function seedBot() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ username: "GeminiBot" });
  if (existing) {
    console.log("GeminiBot already exists:", existing._id);
    process.exit(0);
  }

  const bot = await User.create({
    username: "GeminiBot",
    email: "geminibot@chatapp.internal",
    passwordHash: "not-a-real-password",
  });

  console.log("GeminiBot created with ID:", bot._id);
  process.exit(0);
}

seedBot().catch((err) => {
  console.error(err);
  process.exit(1);
});