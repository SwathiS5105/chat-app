import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext.jsx";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "Computer Science", "History", "Literature", "Economics"
];

export default function Quiz({ room, onClose }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState("select");
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState(null);
  const [questionNum, setQuestionNum] = useState(0);
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [scores, setScores] = useState({});
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [waitingQuestion, setWaitingQuestion] = useState(false);
  const [currentAnswerer, setCurrentAnswerer] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("quizWaiting", () => setPhase("waiting"));

    socket.on("quizStarted", ({ subject, players }) => {
      setPhase("playing");
      setPlayers(players);
      setWaitingQuestion(true);
    });

    socket.on("quizQuestion", ({ question, questionNumber, total, currentAnswerer }) => {
      setQuestion({ question, total });
      setQuestionNum(questionNumber);
      setAnswer("");
      setLastResult(null);
      setWaitingQuestion(false);
      setCurrentAnswerer(currentAnswerer);
    });

    socket.on("answerResult", ({ userId, answer, correctAnswer, isCorrect, scores }) => {
      setLastResult({ userId, answer, correctAnswer, isCorrect });
      setScores(scores);
      setWaitingQuestion(true);
    });

    socket.on("quizOver", ({ scores, winner, players }) => {
      setScores(scores);
      setWinner(winner);
      setPlayers(players);
      setPhase("result");
    });

    return () => {
      socket.off("quizWaiting");
      socket.off("quizStarted");
      socket.off("quizQuestion");
      socket.off("answerResult");
      socket.off("quizOver");
    };
  }, []);

  function handleStart() {
    if (!subject) return;
    getSocket().emit("startQuiz", { room, subject });
    setPhase("waiting");
  }

  function handleJoin() {
    getSocket().emit("joinQuiz", { room });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!answer.trim()) return;
    getSocket().emit("submitAnswer", { room, answer });
    setAnswer("");
  }

  function playAgain() {
    setPhase("select");
    setSubject("");
    setQuestion(null);
    setLastResult(null);
    setScores({});
    setWinner(null);
    setWaitingQuestion(false);
    setCurrentAnswerer(null);
  }
const isMyTurn = currentAnswerer === user.id;
  

  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: "#0F0E2A", border: "1px solid #2D2C4A" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm" style={{ color: "#fff" }}>
          🎓 Quiz Challenge
        </span>
        <button onClick={onClose} style={{ color: "#6C63FF" }}>✕</button>
      </div>

      {/* Subject selection */}
      {phase === "select" && (
        <div>
          <p className="text-xs mb-3" style={{ color: "#A78BFF" }}>
            Pick a subject to quiz your study partner:
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="text-xs py-2 px-3 rounded-lg transition text-left"
                style={{
                  background: subject === s ? "#6C63FF" : "#1A193A",
                  color: subject === s ? "#fff" : "#A78BFF",
                  border: `1px solid ${subject === s ? "#6C63FF" : "#2D2C4A"}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={handleStart}
            disabled={!subject}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition"
            style={{ background: subject ? "#6C63FF" : "#2D2C4A", color: "#fff" }}
          >
            Start Quiz →
          </button>
        </div>
      )}

      {/* Waiting for partner */}
      {phase === "waiting" && (
        <div className="text-center py-4">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-sm mb-3" style={{ color: "#A78BFF" }}>
            Waiting for your study partner...
          </p>
          <p className="text-xs mb-3" style={{ color: "#6C63FF" }}>
            Ask them to click "Join Quiz" in their chat
          </p>
          <button
            onClick={handleJoin}
            className="text-xs px-4 py-2 rounded-full"
            style={{ background: "#1A193A", color: "#A78BFF", border: "1px solid #2D2C4A" }}
          >
            I want to join instead
          </button>
        </div>
      )}

      {/* Playing */}
      {phase === "playing" && (
        <div>
          {waitingQuestion && !lastResult && (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">🤔</div>
              <p className="text-xs" style={{ color: "#A78BFF" }}>Generating question...</p>
            </div>
          )}

          {lastResult && (
            <div
              className="rounded-lg p-3 mb-3 text-xs"
              style={{
                background: lastResult.isCorrect ? "#0D2B1A" : "#2B0D0D",
                border: `1px solid ${lastResult.isCorrect ? "#2E7D32" : "#C62828"}`,
                color: lastResult.isCorrect ? "#4CAF50" : "#FF6B6B",
              }}
            >
              <p className="font-bold mb-1">
                {lastResult.userId === user.id
                  ? lastResult.isCorrect ? "✅ You got it right!" : "❌ You got it wrong"
                  : lastResult.isCorrect ? "✅ Partner got it right!" : "❌ Partner got it wrong"}
              </p>
              <p style={{ color: "#aaa" }}>
                Correct answer: <span style={{ color: "#fff" }}>{lastResult.correctAnswer}</span>
              </p>
              <p className="mt-1" style={{ color: "#888" }}>
                Next question coming up...
              </p>
            </div>
          )}

          {question && !waitingQuestion && (
            <div>
              {/* Progress bar */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs" style={{ color: "#6C63FF" }}>
                  Question {questionNum} of {question.total}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: question.total }).map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-1 rounded-full"
                      style={{ background: i < questionNum ? "#6C63FF" : "#2D2C4A" }}
                    />
                  ))}
                </div>
              </div>

              {/* Turn indicator */}
              <div
                className="text-xs px-3 py-1.5 rounded-full mb-3 text-center font-medium"
                style={{
                  background: isMyTurn ? "#1A2D1A" : "#1A1A2D",
                  color: isMyTurn ? "#4CAF50" : "#A78BFF",
                  border: `1px solid ${isMyTurn ? "#2E7D32" : "#2D2C4A"}`,
                }}
              >
                {isMyTurn ? "🟢 Your turn to answer!" : "👀 Watch and learn — partner is answering"}
              </div>

              {/* Question */}
              <div className="rounded-xl p-3 mb-3" style={{ background: "#1A193A" }}>
                <p className="text-sm" style={{ color: "#fff", lineHeight: 1.5 }}>
                  {question.question}
                </p>
              </div>

              {/* Answer input — only for current answerer */}
              {isMyTurn ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    autoFocus
                    className="flex-1 px-3 py-2 text-sm rounded-xl focus:outline-none"
                    style={{ background: "#1A193A", color: "#fff", border: "1.5px solid #6C63FF" }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: "#6C63FF", color: "#fff" }}
                  >
                    →
                  </button>
                </form>
              ) : (
                <div
                  className="text-center py-3 rounded-xl text-xs"
                  style={{ background: "#1A193A", color: "#A78BFF" }}
                >
                  ⏳ Waiting for your partner to answer...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {phase === "result" && (
        <div className="text-center py-2">
          <div className="text-4xl mb-2">
            {winner === "draw" ? "🤝" : "🏆"}
          </div>
          <p className="font-bold text-sm mb-1" style={{ color: "#fff" }}>
            {winner === "draw"
              ? "It's a draw!"
              : winner === user.id
              ? "You won! 🎉"
              : "Your partner won!"}
          </p>
          <div className="flex justify-center gap-6 my-3">
            {players.map((p) => (
              <div key={p} className="text-center">
                <div className="text-2xl font-bold" style={{ color: "#6C63FF" }}>
                  {scores[p] || 0}
                  <span className="text-xs ml-1" style={{ color: "#aaa" }}>/5</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "#aaa" }}>
                  {p === user.id ? "You" : "Partner"}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={playAgain}
            className="text-sm px-5 py-2 rounded-full font-bold mt-2"
            style={{ background: "#6C63FF", color: "#fff" }}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}