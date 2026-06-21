import { useEffect, useRef, useState } from "react";
import { connectSocket, getSocket } from "../socket";
import { fetchMessages } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import TicTacToe from "../components/TicTacToe";
import RockPaperScissors from "../components/RockPaperScissors";

const ROOM = "test-room";

export default function Chat() {
  const { token, user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ttl, setTtl] = useState("");
  const [showGame, setShowGame] = useState(false);
  const bottomRef = useRef(null);
  const [showRPS, setShowRPS] = useState(false);

  useEffect(() => {
    const socket = connectSocket(token);
    socket.emit("joinRoom", ROOM);

    fetchMessages(ROOM, token).then(setMessages);

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    return () => socket.disconnect();
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    getSocket().emit("sendMessage", {
      room: ROOM,
      content: input,
      ttlSeconds: ttl ? Number(ttl) : null,
    });

    setInput("");
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h3>
        Chat room — logged in as {user.username}{" "}
        <button onClick={logout} style={{ marginLeft: 10 }}>Log out</button>
      </h3>

      <button onClick={() => setShowGame(!showGame)} style={{ marginBottom: 10 }}>
        {showGame ? "Hide game" : "Play Tic-Tac-Toe"}
      </button>

      {showGame && <TicTacToe room={ROOM} onClose={() => setShowGame(false)} />}
        <button onClick={() => setShowRPS(!showRPS)} style={{ marginBottom: 10, marginLeft: 8 }}>
  {showRPS ? "Hide RPS" : "Play Rock-Paper-Scissors"}
</button>

{showRPS && <RockPaperScissors room={ROOM} onClose={() => setShowRPS(false)} />}

      <div style={{ border: "1px solid #ccc", height: 350, overflowY: "auto", padding: 10, marginBottom: 10 }}>
        {messages.map((m) => (
          <div key={m._id} style={{ marginBottom: 6 }}>
            <strong>{m.sender?.username || "?"}:</strong> {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8 }}
        />
        <select value={ttl} onChange={(e) => setTtl(e.target.value)}>
          <option value="">Never delete</option>
          <option value="10">10 sec</option>
          <option value="60">1 min</option>
          <option value="3600">1 hour</option>
        </select>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}