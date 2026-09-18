import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateAIResponse(conversationMessages, subject = null) {
  const systemPrompt = subject
    ? `You are StudyBot, an expert CS tutor inside the "${subject}" study room on ChatriX EDU.
Your role in this room:
- Answer questions specifically about ${subject}
- Explain concepts clearly with examples
- Help students clear doubts step by step
- If someone asks something unrelated to ${subject}, gently redirect them back to the topic
- Keep responses concise and conversational — this is a chat, not a textbook
Remember the conversation context and build on previous messages.`
    : `You are StudyBot, an intelligent academic tutor inside ChatriX EDU — a student collaboration platform.
- Answer academic questions clearly across all CS subjects
- Break down complex concepts into simple explanations
- Give step-by-step solutions when asked
- Keep responses concise and conversational
Remember the context of the conversation and build on previous messages.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationMessages,
    ],
    model: "openai/gpt-oss-20b",
  });

  return completion.choices[0].message.content;
}