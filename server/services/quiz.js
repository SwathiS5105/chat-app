import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateQuizQuestion(subject, questionNumber) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a quiz generator for CS students. Generate a simple question about ${subject}.
You MUST respond with ONLY a valid JSON object in this exact format with no other text, no markdown, no backticks:
{"question":"your question here","answer":"correct answer here"}`,
        },
        {
          role: "user",
          content: `Generate question ${questionNumber} about ${subject}. Keep it simple and basic level. Respond with JSON only.`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content.trim();

    // Try multiple ways to extract JSON
    let parsed = null;

    // Direct parse
    try { parsed = JSON.parse(text); } catch {}

    // Extract from code block
    if (!parsed) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }
    }

    if (parsed?.question && parsed?.answer) return parsed;

    // Fallback questions per subject
    const fallbacks = {
      "Python Programming": { question: "What is the output of print(type([]))?", answer: "<class 'list'>" },
      "Java Programming": { question: "What keyword is used to create a class in Java?", answer: "class" },
      "Data Structures": { question: "Which data structure works on LIFO principle?", answer: "Stack" },
      "Algorithms": { question: "What is the time complexity of Binary Search?", answer: "O(log n)" },
      "Database Management": { question: "What does SQL stand for?", answer: "Structured Query Language" },
      "Computer Networks": { question: "What does HTTP stand for?", answer: "HyperText Transfer Protocol" },
      "Operating Systems": { question: "What is a deadlock?", answer: "A situation where two or more processes are waiting indefinitely for each other" },
      "Web Technologies": { question: "What does CSS stand for?", answer: "Cascading Style Sheets" },
      "Software Engineering": { question: "What does SDLC stand for?", answer: "Software Development Life Cycle" },
      "Artificial Intelligence": { question: "What is machine learning?", answer: "A subset of AI that enables systems to learn from data" },
    };

    return fallbacks[subject] || { question: `What is an important concept in ${subject}?`, answer: "Please describe your understanding." };

  } catch (err) {
    console.error("Quiz generation error:", err.message);
    return { question: `Name one key concept in ${subject}?`, answer: "Any valid concept in the subject" };
  }
}

export async function evaluateAnswer(question, correctAnswer, studentAnswer) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a fair examiner. Compare the student's answer to the correct answer.
Be lenient — accept answers that show correct understanding even if worded differently.
Respond with ONLY the word "true" if correct or "false" if incorrect. No other text.`,
        },
        {
          role: "user",
          content: `Question: ${question}
Correct answer: ${correctAnswer}
Student answer: ${studentAnswer}
Is the student's answer correct? Reply true or false only.`,
        },
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0,
    });

    const result = completion.choices[0].message.content.trim().toLowerCase();
    return result === "true";
  } catch (err) {
    console.error("Answer evaluation error:", err.message);
    return false;
  }
}