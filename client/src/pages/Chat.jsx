import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { connectSocket, getSocket } from "../socket";
import { useAuth } from "../context/AuthContext.jsx";
import TicTacToe from "../components/TicTacToe";
import RockPaperScissors from "../components/RockPaperScissors";
import { fetchMessages, fetchUserById } from "../api";

export default function Chat() {
  const { token, user, logout } = useAuth();
  const { room } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [otherUser, setOtherUser] = useState(location.state?.otherUser || null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ttl, setTtl] = useState("");
  const [showGame, setShowGame] = useState(false);
  const [showRPS, setShowRPS] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket(token);
    socket.emit("joinRoom", room);
    if (!otherUser) {
  const otherId = room.split("_").find((id) => id !== user.id);
  if (otherId) fetchUserById(otherId, token).then(setOtherUser);
}

    fetchMessages(room, token).then(setMessages);

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("userTyping", ({ username }) => {
      setTypingUser(username);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 2000);
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    return () => socket.disconnect();
  }, [token, room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    getSocket().emit("sendMessage", {
      room,
      content: input,
      ttlSeconds: ttl ? Number(ttl) : null,
    });

    setInput("");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/contacts")}
              className="text-gray-400 hover:text-gray-700 transition text-lg"
              title="Back to contacts"
            >
              ←
            </button>
            <div>
              <p className="text-sm text-gray-500">Chatting with</p>
              <p className="font-semibold text-gray-800">
                {otherUser?.username || "Unknown user"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Log out
          </button>
        </div>

        {/* Game toggles */}
        <div className="flex gap-2 px-5 py-3 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowGame(!showGame)}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition"
          >
            {showGame ? "Hide Tic-Tac-Toe" : "🎮 Tic-Tac-Toe"}
          </button>
          <button
            onClick={() => setShowRPS(!showRPS)}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition"
          >
            {showRPS ? "Hide RPS" : "✊ Rock-Paper-Scissors"}
          </button>
        </div>

        {showGame && (
          <div className="px-5 pt-3">
            <TicTacToe room={room} onClose={() => setShowGame(false)} />
          </div>
        )}
        {showRPS && (
          <div className="px-5 pt-3">
            <RockPaperScissors room={room} onClose={() => setShowRPS(false)} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 h-96 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
          {messages.map((m) => {
            const isMine = m.sender?.username === user.username;
            return (
              <div
                key={m._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">
                      {m.sender?.username || "?"}
                    </p>
                  )}
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {typingUser && typingUser !== user.username && (
          <p className="text-xs text-gray-400 px-5 pb-1 italic">
            {typingUser} is typing...
          </p>
        )}

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-5 py-4 border-t border-gray-200"
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              getSocket().emit("typing", { room, username: user.username });
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            className="text-sm border border-gray-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Never delete</option>
            <option value="10">10 sec</option>
            <option value="60">1 min</option>
            <option value="3600">1 hour</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}