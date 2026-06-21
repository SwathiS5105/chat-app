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
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>Rock Paper Scissors</strong>
        <button onClick={onClose} style={{ cursor: "pointer" }}>✕</button>
      </div>

      {!result && (
        <>
          <p style={{ textAlign: "center" }}>
            {myChoice ? "Waiting for opponent..." : "Pick your move:"}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            {CHOICES.map((c) => (
              <button
                key={c.value}
                onClick={() => handleChoice(c.value)}
                disabled={!!myChoice}
                style={{
                  fontSize: 32,
                  padding: 10,
                  cursor: myChoice ? "default" : "pointer",
                  opacity: myChoice && myChoice !== c.value ? 0.4 : 1,
                  border: myChoice === c.value ? "2px solid #333" : "1px solid #ccc",
                  borderRadius: 8,
                  background: "#fafafa",
                }}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {result && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 20 }}>{getOutcomeText()}</p>
          <button onClick={playAgain} style={{ marginTop: 8 }}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}