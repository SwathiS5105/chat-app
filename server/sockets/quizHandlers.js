import { generateQuizQuestion, evaluateAnswer } from "../services/quiz.js";
import { isUserToUserRoom } from "../utils/rooms.js";

const quizGames = {};

export function registerQuizHandlers(io, socket) {

  socket.on("startQuiz", async ({ room, subject }) => {
    if (!(await isUserToUserRoom(room, socket.userId))) return;
    if (!quizGames[room]) {
      quizGames[room] = {
        subject,
        questions: [],
        usedTopics: [],
        currentQuestion: 0,
        scores: {},
        players: [],
        waitingForAnswer: false,
        currentAnswerer: null,
      };
    }

    const game = quizGames[room];
    if (!game.players.includes(socket.userId)) {
      game.players.push(socket.userId);
    }

    if (game.players.length === 2) {
      io.to(room).emit("quizStarted", { subject, players: game.players });
      await sendNextQuestion(io, room);
    } else {
      socket.emit("quizWaiting", { message: "Waiting for your study partner..." });
    }
  });

  socket.on("joinQuiz", async ({ room }) => {
    if (!(await isUserToUserRoom(room, socket.userId))) return;
    const game = quizGames[room];
    if (!game) return;

    if (!game.players.includes(socket.userId)) {
      game.players.push(socket.userId);
    }

    if (game.players.length === 2) {
      io.to(room).emit("quizStarted", { subject: game.subject, players: game.players });
      await sendNextQuestion(io, room);
    }
  });

  socket.on("submitAnswer", async ({ room, answer }) => {
    if (!(await isUserToUserRoom(room, socket.userId))) return;
    const game = quizGames[room];
    if (!game || !game.waitingForAnswer) return;

    // Only the current answerer can submit
    if (game.currentAnswerer !== socket.userId) return;

    game.waitingForAnswer = false;
    const current = game.questions[game.currentQuestion];

    const isCorrect = await evaluateAnswer(
      current.question,
      current.answer,
      answer
    );

    if (!game.scores[socket.userId]) game.scores[socket.userId] = 0;
    if (isCorrect) game.scores[socket.userId] += 1;

    io.to(room).emit("answerResult", {
      userId: socket.userId,
      answer,
      correctAnswer: current.answer,
      isCorrect,
      scores: game.scores,
    });

    game.currentQuestion += 1;

    if (game.currentQuestion >= 5) {
      const [p1, p2] = game.players;
      const s1 = game.scores[p1] || 0;
      const s2 = game.scores[p2] || 0;
      const winner = s1 > s2 ? p1 : s2 > s1 ? p2 : "draw";

      io.to(room).emit("quizOver", {
        scores: game.scores,
        winner,
        players: game.players,
      });

      delete quizGames[room];
    } else {
      setTimeout(() => sendNextQuestion(io, room), 2000);
    }
  });
}

async function sendNextQuestion(io, room) {
  const game = quizGames[room];
  if (!game) return;

  // Alternate who answers each question
  const answererIndex = game.currentQuestion % 2;
  game.currentAnswerer = game.players[answererIndex];
  game.waitingForAnswer = true;

  // Tell the generator what was already asked so every question is new
  const asked = game.questions.map((x) => x.question);
  const q = await generateQuizQuestion(game.subject, game.currentQuestion + 1, asked, game.usedTopics);
  game.questions.push(q);
  if (q.topic) game.usedTopics.push(q.topic);

  // Tell everyone the question AND who should answer
  io.to(room).emit("quizQuestion", {
    question: q.question,
    questionNumber: game.currentQuestion + 1,
    total: 5,
    currentAnswerer: game.currentAnswerer,
  });
}