import Groq from "groq-sdk";

// Fail fast so a slow/failed call falls back to the question bank instead of hanging the game
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 1, timeout: 20000 });

// llama-3.1-8b-instant was retired by Groq on 16 Aug 2026 — use its official replacement
const MODEL = "openai/gpt-oss-20b";

// Each question is generated for a DIFFERENT topic, so quizzes cover the whole subject
const TOPICS = {
  "Python Programming": ["data types and variables", "lists and tuples", "dictionaries and sets", "loops and conditionals", "functions and arguments", "string handling", "classes and objects", "exception handling", "file handling", "list comprehensions", "modules and packages", "lambda and built-in functions"],
  "Java Programming": ["classes and objects", "inheritance", "polymorphism", "interfaces and abstract classes", "exception handling", "collections framework", "String class", "access modifiers", "constructors", "static keyword", "multithreading basics", "JVM and bytecode"],
  "Data Structures": ["arrays", "linked lists", "stacks", "queues", "binary trees", "binary search trees", "heaps", "hash tables", "graphs", "tree traversals", "circular and doubly linked lists", "priority queues"],
  "Algorithms": ["sorting algorithms", "binary search", "time complexity and Big-O", "recursion", "divide and conquer", "greedy algorithms", "dynamic programming", "graph traversal (BFS and DFS)", "shortest path algorithms", "space complexity", "backtracking", "hashing"],
  "Database Management": ["SQL basics", "primary and foreign keys", "normalization", "joins", "transactions and ACID", "indexes", "ER model", "aggregate functions", "views", "DDL vs DML", "constraints", "NoSQL vs SQL"],
  "Computer Networks": ["OSI model layers", "TCP vs UDP", "IP addressing", "DNS", "HTTP and HTTPS", "routing", "subnetting", "network topologies", "firewalls", "common protocols and ports", "MAC address and ARP", "switches vs routers"],
  "Operating Systems": ["process vs thread", "CPU scheduling", "deadlock", "memory management", "paging and segmentation", "virtual memory", "synchronization and semaphores", "file systems", "system calls", "interrupts", "kernel vs user mode", "page replacement"],
  "Web Technologies": ["HTML elements", "CSS selectors", "the CSS box model", "JavaScript basics", "DOM", "HTTP methods", "REST APIs", "responsive design", "cookies and sessions", "AJAX and fetch", "client vs server side", "web security basics"],
  "Software Engineering": ["SDLC models", "Agile and Scrum", "requirements gathering", "UML diagrams", "software testing types", "version control", "design patterns", "coupling and cohesion", "software maintenance", "waterfall model", "CI/CD", "code review"],
  "Artificial Intelligence": ["machine learning types", "supervised learning", "neural networks", "search algorithms", "overfitting", "natural language processing", "computer vision", "reinforcement learning", "decision trees", "training vs testing data", "AI ethics", "expert systems"],
};

// Used only if the AI call fails — several per subject so it never repeats one question
const FALLBACKS = {
  "Python Programming": [
    { question: "What is the output of print(type([]))?", answer: "<class 'list'>" },
    { question: "Which keyword is used to define a function in Python?", answer: "def" },
    { question: "Which Python data type is immutable: list or tuple?", answer: "tuple" },
    { question: "What does len('hello') return?", answer: "5" },
  ],
  "Java Programming": [
    { question: "Which keyword is used to create a class in Java?", answer: "class" },
    { question: "Which keyword is used for inheritance in Java?", answer: "extends" },
    { question: "What is the entry point method of a Java program?", answer: "main" },
    { question: "Which keyword prevents a class from being inherited?", answer: "final" },
  ],
  "Data Structures": [
    { question: "Which data structure works on the LIFO principle?", answer: "Stack" },
    { question: "Which data structure works on the FIFO principle?", answer: "Queue" },
    { question: "What is the time complexity of accessing an array element by index?", answer: "O(1)" },
    { question: "Which traversal of a BST gives sorted order?", answer: "Inorder" },
  ],
  "Algorithms": [
    { question: "What is the time complexity of binary search?", answer: "O(log n)" },
    { question: "Which sorting algorithm repeatedly swaps adjacent out-of-order elements?", answer: "Bubble sort" },
    { question: "Which technique solves a problem by breaking it into overlapping subproblems and storing results?", answer: "Dynamic programming" },
    { question: "Which graph traversal uses a queue?", answer: "BFS" },
  ],
  "Database Management": [
    { question: "What does SQL stand for?", answer: "Structured Query Language" },
    { question: "Which key uniquely identifies each row in a table?", answer: "Primary key" },
    { question: "Which SQL command removes all rows but keeps the table structure?", answer: "TRUNCATE" },
    { question: "What does the 'A' in ACID stand for?", answer: "Atomicity" },
  ],
  "Computer Networks": [
    { question: "What does HTTP stand for?", answer: "HyperText Transfer Protocol" },
    { question: "How many layers are in the OSI model?", answer: "7" },
    { question: "Which protocol translates domain names to IP addresses?", answer: "DNS" },
    { question: "Which transport protocol is connectionless: TCP or UDP?", answer: "UDP" },
  ],
  "Operating Systems": [
    { question: "What is a deadlock?", answer: "Processes waiting indefinitely for resources held by each other" },
    { question: "Which scheduling algorithm gives each process a fixed time slice?", answer: "Round Robin" },
    { question: "What is the smallest unit of CPU execution within a process called?", answer: "Thread" },
    { question: "What is virtual memory?", answer: "Using disk space to extend the available RAM" },
  ],
  "Web Technologies": [
    { question: "What does CSS stand for?", answer: "Cascading Style Sheets" },
    { question: "Which HTML tag is used to create a hyperlink?", answer: "a" },
    { question: "Which HTTP method is normally used to send new data to a server?", answer: "POST" },
    { question: "What does DOM stand for?", answer: "Document Object Model" },
  ],
  "Software Engineering": [
    { question: "What does SDLC stand for?", answer: "Software Development Life Cycle" },
    { question: "Which model follows a strict linear sequence of phases?", answer: "Waterfall" },
    { question: "In Scrum, what is a short fixed-length development cycle called?", answer: "Sprint" },
    { question: "What kind of testing checks individual functions or modules?", answer: "Unit testing" },
  ],
  "Artificial Intelligence": [
    { question: "What is machine learning?", answer: "A subset of AI where systems learn from data" },
    { question: "What is it called when a model performs well on training data but poorly on new data?", answer: "Overfitting" },
    { question: "Which type of learning uses labeled data?", answer: "Supervised learning" },
    { question: "What does NLP stand for?", answer: "Natural Language Processing" },
  ],
};

const normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Pick a random topic that hasn't been used yet in this quiz
export function pickTopic(subject, usedTopics = []) {
  const all = TOPICS[subject] || [subject];
  const unused = all.filter((t) => !usedTopics.includes(t));
  return randomItem(unused.length ? unused : all);
}

// Pull a JSON object out of the model's reply, even if it added extra text
export function parseQuestionJson(text) {
  if (!text) return null;
  const candidates = [text.trim()];
  const match = text.match(/\{[\s\S]*\}/);
  if (match) candidates.push(match[0]);
  for (const c of candidates) {
    try {
      const obj = JSON.parse(c);
      if (obj?.question && obj?.answer) {
        return { question: String(obj.question).trim(), answer: String(obj.answer).trim() };
      }
    } catch { /* try next */ }
  }
  return null;
}

// A fallback question that hasn't been asked in this quiz yet
export function pickFallback(subject, askedQuestions = []) {
  const bank = FALLBACKS[subject] || [{ question: `Name one important concept in ${subject}.`, answer: `Any valid concept in ${subject}` }];
  const asked = askedQuestions.map(normalize);
  const fresh = bank.filter((q) => !asked.includes(normalize(q.question)));
  return { ...randomItem(fresh.length ? fresh : bank), topic: null };
}

export async function generateQuizQuestion(subject, questionNumber, askedQuestions = [], usedTopics = []) {
  const topic = pickTopic(subject, usedTopics);
  const asked = askedQuestions.map(normalize);

  const avoid = askedQuestions.length
    ? `\nDo NOT repeat or rephrase any of these earlier questions:\n${askedQuestions.map((q) => `- ${q}`).join("\n")}`
    : "";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a quiz generator for CS students.
Respond with ONLY a valid JSON object, no markdown, no backticks, no extra text:
{"question":"...","answer":"..."}
The question must be clear, beginner-friendly and answerable in a few words. The answer must be short (1 to 10 words).`,
          },
          {
            role: "user",
            content: `Subject: ${subject}
Topic for this question: ${topic}
Write question ${questionNumber} of 5 about that specific topic.${avoid}`,
          },
        ],
        model: MODEL,
        temperature: 0.9,
        reasoning_effort: "low",
        max_completion_tokens: 800,
      });

      const parsed = parseQuestionJson(completion.choices[0]?.message?.content);
      if (parsed && !asked.includes(normalize(parsed.question))) {
        return { ...parsed, topic };
      }
      // bad format or a repeat — try once more
    } catch (err) {
      console.error("Quiz generation error:", err.message);
      break; // API problem (bad model, rate limit…) — retrying won't help
    }
  }

  return pickFallback(subject, askedQuestions);
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
      model: MODEL,
      temperature: 0,
      reasoning_effort: "low",
      max_completion_tokens: 300,
    });

    const result = (completion.choices[0]?.message?.content || "").trim().toLowerCase();
    return result.startsWith("true");
  } catch (err) {
    console.error("Answer evaluation error:", err.message);
    return false;
  }
}