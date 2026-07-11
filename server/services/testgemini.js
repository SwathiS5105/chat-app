import "dotenv/config";
import { generateAIResponse } from "./gemini.js";

const reply = await generateAIResponse("Say hello in one sentence.");
console.log(reply);