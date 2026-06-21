import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext.jsx";

const CHOICES = [
  { value: "rock", emoji: "🪨" },
  { value: "paper", emoji: "📄" },
  { value: "scissors", emoji: "✂️" },
];

export default function RockPaperScissors({ room, onClose }) {
  const { user } = useAuth();
  const [myChoice, setMyChoice] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("rpsResult", (data) => {
      setResult(data);
    });

    socket.emit("startRPS", { room });

    return () => {
      socket.off("rpsResult");
      socket.off("rpsWaiting");
    };
  }, [room]);

  function handleChoice(choice) {
    if (myChoice) return;
    setMyChoice(choice);
    getSocket().emit("makeRPSChoice", { room, choice });
  }

  function playAgain() {
    setMyChoice(null);
    setResult(null);
    getSocket().emit("startRPS", { room });
  }

  function getOutcomeText() {
    if (!result) return null;
    if (result.result === "draw") return "It's a draw!";
    return result.result === user.id ? "You win! 🎉" : "You lose!";
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 mb-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-800">✊ Rock Paper Scissors</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {!result && (
        <>
          <p className="text-center text-sm text-gray-600 mb-3">
            {myChoice ? "Waiting for opponent..." : "Pick your move:"}
          </p>
          <div className="flex justify-center gap-3">
            {CHOICES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleChoice(c.value)}
                disabled={!!myChoice}
                className={`text-3xl w-16 h-16 flex items-center justify-center rounded-xl border transition ${
                  myChoice === c.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                } ${
                  myChoice && myChoice !== c.value
                    ? "opacity-40"
                    : myChoice
                    ? ""
                    : "hover:bg-gray-100 cursor-pointer"
                }`}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {result && (
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">{getOutcomeText()}</p>
          <button
            onClick={playAgain}
            className="mt-3 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}