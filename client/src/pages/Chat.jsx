import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { connectSocket, getSocket } from "../socket";
import { useAuth } from "../context/AuthContext.jsx";
import TicTacToe from "../components/TicTacToe";
import RockPaperScissors from "../components/RockPaperScissors";
import Quiz from "../components/Quiz";
import { fetchMessages, fetchUserById } from "../api";

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium px-2 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function getDateLabel(dateStr) {
  const msgDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (msgDate.toDateString() === today.toDateString()) return "Today";
  if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
  return msgDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
  const [showQuiz, setShowQuiz] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isAIChat = otherUser?.username === "StudyBot";

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
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
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

  let lastDateLabel = null;

  return (
    <div className="min-h-screen flex items-center justify-center sm:px-4 sm:py-8" style={{ background: "#0F0E2A" }}>
      <div className="w-full max-w-lg h-screen sm:h-auto bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100" style={{ background: "#0F0E2A" }}>
          <button
            onClick={() => navigate("/contacts")}
            className="text-lg transition"
            style={{ color: "#6C63FF" }}
            title="Back to contacts"
          >
            ←
          </button>

          {isAIChat ? (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: "#1E1D3A" }}>
              ⚡
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: "#6C63FF" }}>
              {otherUser?.username?.[0]?.toUpperCase() || "?"}
            </div>
          )}

          <div className="flex-1">
            <p className="font-bold text-white text-sm leading-tight">
              {otherUser?.username || "Unknown user"}
            </p>
            <p className="text-xs" style={{ color: "#6C63FF" }}>
              {isAIChat ? "AI Study Assistant · Always online" : "ChatriX EDU"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setShowGame(!showGame); setShowRPS(false); setShowQuiz(false); }}
              className="text-xs px-3 py-1.5 rounded-full transition"
              style={{ background: showGame ? "#6C63FF" : "#1E1D3A", color: showGame ? "#fff" : "#A78BFF" }}
              title="Tic-Tac-Toe"
            >
              🎮
            </button>
            <button
              onClick={() => { setShowRPS(!showRPS); setShowGame(false); setShowQuiz(false); }}
              className="text-xs px-3 py-1.5 rounded-full transition"
              style={{ background: showRPS ? "#6C63FF" : "#1E1D3A", color: showRPS ? "#fff" : "#A78BFF" }}
              title="Rock Paper Scissors"
            >
              ✊
            </button>
            <button
              onClick={() => { setShowQuiz(!showQuiz); setShowGame(false); setShowRPS(false); }}
              className="text-xs px-3 py-1.5 rounded-full transition"
              style={{ background: showQuiz ? "#FFD700" : "#1E1D3A", color: showQuiz ? "#0F0E2A" : "#A78BFF" }}
              title="Quiz Challenge"
            >
              🎓
            </button>
          </div>

          <button
            onClick={logout}
            className="text-xs transition ml-1"
            style={{ color: "#6C63FF" }}
          >
            Out
          </button>
        </div>

        {/* Game panels */}
        {showGame && (
          <div className="px-4 pt-3">
            <TicTacToe room={room} onClose={() => setShowGame(false)} />
          </div>
        )}
        {showRPS && (
          <div className="px-4 pt-3">
            <RockPaperScissors room={room} onClose={() => setShowRPS(false)} />
          </div>
        )}
        {showQuiz && (
          <div className="px-4 pt-3">
            <Quiz room={room} onClose={() => setShowQuiz(false)} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ background: "#FAFAFE" }}>
          {messages.map((m) => {
            const isMine = m.sender?.username === user.username;
            const isBot = m.sender?.username === "StudyBot";
            const dateLabel = getDateLabel(m.createdAt);
            const showDivider = lastDateLabel !== dateLabel;
            lastDateLabel = dateLabel;

            return (
              <div key={m._id}>
                {showDivider && <DateDivider label={dateLabel} />}
                <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-1"
                      style={{ background: isBot ? "#0F0E2A" : "#6C63FF", color: isBot ? "#FFD700" : "#fff" }}
                    >
                      {isBot ? "⚡" : m.sender?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div
                    className="max-w-xs px-4 py-2.5 text-sm"
                    style={{
                      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isMine ? "#6C63FF" : isBot ? "#0F0E2A" : "#fff",
                      color: isMine || isBot ? "#fff" : "#111",
                      border: (!isMine && !isBot) ? "0.5px solid #e5e5e5" : "none",
                    }}
                  >
                    {!isMine && !isBot && (
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "#6C63FF" }}>
                        {m.sender?.username || "?"}
                      </p>
                    )}
                    {m.content}
                    <p className="text-right mt-1" style={{ fontSize: "9px", opacity: 0.6 }}>
                      {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {typingUser && typingUser !== user.username && (
          <div className="px-5 py-1 flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6C63FF", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6C63FF", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6C63FF", animationDelay: "300ms" }} />
            </div>
            <p className="text-xs text-gray-400 italic">{typingUser} is typing</p>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-4 py-3 border-t border-gray-100"
          style={{ background: "#fff" }}
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              getSocket().emit("typing", { room, username: user.username });
            }}
            placeholder={isAIChat ? "Ask StudyBot anything..." : "Type a message..."}
            className="flex-1 px-4 py-2.5 text-sm rounded-full border focus:outline-none"
            style={{ background: "#F5F4FF", border: "1.5px solid #E8E7FF", color: "#111" }}
          />
          <select
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            className="text-xs rounded-full px-2 py-2 focus:outline-none border"
            style={{ background: "#F5F4FF", border: "1.5px solid #E8E7FF", color: "#6C63FF" }}
          >
            <option value="">∞</option>
            <option value="10">10s</option>
            <option value="60">1m</option>
            <option value="3600">1h</option>
          </select>
          <button
            type="submit"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition"
            style={{ background: "#6C63FF" }}
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
              <path d="M2 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

      </div>
    </div>
  );
}