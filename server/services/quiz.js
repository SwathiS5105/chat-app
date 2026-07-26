import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateQuizQuestion(subject, questionNumber) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a quiz generator for college students. Generate a simple, clear quiz question about ${subject}.
Return ONLY a JSON object with exactly this format, no other text:
{"question": "the question here", "answer": "the correct answer here"}
Rules:
- Keep questions simple and straightforward — basic college level, not advanced
- Questions should have short, clear answers (1-5 words ideally)
- Avoid trick questions or highly specific dates/numbers
- Examples of good questions: "What is the powerhouse of the cell?", "What does CPU stand for?", "Who wrote Romeo and Juliet?"`,
      },
      {
        role: "user",
        content: `Generate a simple question number ${questionNumber} about ${subject}. Keep it easy to understand.`,
      },
    ],
    model: "llama-3.1-8b-instant",
  });
  

  try {
    const text = completion.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      question: `What is an important concept in ${subject}?`,
      answer: "Please provide your understanding of the topic.",
    };
  }
}

export async function evaluateAnswer(question, correctAnswer, studentAnswer) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a fair examiner. Compare the student's answer to the correct answer.
Be lenient — accept answers that show correct understanding even if worded differently.
Return ONLY "true" if correct or "false" if incorrect. No other text.`,
      },
      {
        role: "user",
        content: `Question: ${question}
Correct answer: ${correctAnswer}
Student answer: ${studentAnswer}
Is the student's answer correct?`,
      },
    ],
    model: "llama-3.1-8b-instant",
  });

  return completion.choices[0].message.content.trim().toLowerCase() === "true";
}