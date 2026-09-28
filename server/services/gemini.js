import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Shared formatting rules so every reply is short and easy to scan.
// The chat bubble shows plain text, so no markdown symbols.
const FORMAT_RULES = `
RESPONSE FORMAT (follow strictly):
1. Start with a direct answer in ONE sentence.
2. Then give at most 4 short points. Use "- " for bullets, or "1." "2." for steps.
3. Add ONE short example only if it really helps. If code is needed, show one snippet under 10 lines, indented by 2 spaces.
4. Keep the whole reply under 120 words unless the student asks for more detail.
5. Plain text only: no markdown headings, no ** bold **, no tables, no backtick fences.
6. Do not repeat the question or add long introductions or conclusions.`;

export async function generateAIResponse(conversationMessages, subject = null) {
  const systemPrompt = subject
    ? `You are StudyBot, a friendly CS tutor in the "${subject}" study room on ChatriX.
- Answer only questions about ${subject}. If the question is unrelated, say so in one line and steer back to ${subject}.
- Explain simply and build on earlier messages in this conversation.
${FORMAT_RULES}`
    : `You are StudyBot, a friendly academic tutor on ChatriX.
- Answer academic and CS questions clearly and simply.
- Build on earlier messages in this conversation.
${FORMAT_RULES}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationMessages,
    ],
    model: "openai/gpt-oss-20b",
    temperature: 0.4,
    reasoning_effort: "low",
    max_completion_tokens: 700,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  return reply || "Sorry, I couldn't come up with an answer. Could you rephrase your question?";
}