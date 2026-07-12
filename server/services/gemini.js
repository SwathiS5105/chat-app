import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateAIResponse(conversationMessages) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful and friendly AI assistant inside a chat app. Keep responses concise and conversational. Remember the context of the conversation.",
      },
      ...conversationMessages,
    ],
    model: "llama-3.1-8b-instant",
  });

  return completion.choices[0].message.content;
}