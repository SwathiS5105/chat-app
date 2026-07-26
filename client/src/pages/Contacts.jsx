import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUsers } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { connectSocket } from "../socket";

function getRoomId(id1, id2) {
  return [id1, id2].sort().join("_");
}

function ChatrixLogo({ size = 28 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <rect x="0" y="0" width="64" height="64" rx="18" fill="#0F0E2A" />
      <circle cx="26" cy="28" r="20" fill="#6C63FF" opacity="0.15" />
      <rect x="6" y="12" width="34" height="26" rx="10" fill="#6C63FF" />
      <polygon points="8,38 20,38 12,50" fill="#6C63FF" />
      <polygon points="42,8 32,30 40,30 30,56 52,24 42,24" fill="#FFD700" />
      <polygon points="42,8 32,30 40,30 30,56 52,24 42,24" fill="none" stroke="#FFF0A0" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function Contacts() {
  const { token, user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers(token).then(setUsers);
  }, [token]);

  useEffect(() => {
    const socket = connectSocket(token);
    socket.on("onlineUsers", (ids) => {
      setOnlineUserIds(ids);
    });
    return () => socket.disconnect();
  }, [token]);

  function openChat(otherUser) {
    const room = getRoomId(user.id, otherUser._id);
    navigate(`/chat/${room}`, { state: { otherUser } });
  }

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const avatarColors = [
    { bg: "#EDE9FF", color: "#6C63FF" },
    { bg: "#FFE8E8", color: "#E85555" },
    { bg: "#E8F5E9", color: "#2E7D32" },
    { bg: "#FFF3E0", color: "#E65100" },
    { bg: "#E3F2FD", color: "#1565C0" },
    { bg: "#FCE4EC", color: "#C62828" },
  ];

  function getAvatarColor(username) {
    const index = username.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center sm:px-4 sm:py-8"
      style={{ background: "#0F0E2A" }}
    >
      <div className="w-full max-w-md h-screen sm:h-auto bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-5 py-4" style={{ background: "#0F0E2A" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChatrixLogo size={30} />
              <span className="text-xl font-bold tracking-tight" style={{ color: "#fff", letterSpacing: "-0.5px" }}>
                Chatri<span style={{ color: "#6C63FF" }}>X</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "#6C63FF", color: "#fff" }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background: "#4CAF50", borderColor: "#0F0E2A" }}
                />
              </div>
              <button
                onClick={logout}
                className="text-xs transition"
                style={{ color: "#6C63FF" }}
              >
                Sign out
              </button>
            </div>
          </div>

          <p className="text-xs mb-3" style={{ color: "#6C63FF", letterSpacing: "1px", fontWeight: 600 }}>
            CONTACTS · {onlineUserIds.length} online
          </p>

          {/* Search bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="#6C63FF" strokeWidth="1.5" />
              <path d="M10 10l3 3" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-full focus:outline-none"
              style={{
                background: "#1E1D3A",
                color: "#fff",
                border: "1.5px solid #2D2C4A",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "#6C63FF" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm text-gray-400">
                No contacts found for "{search}"
              </p>
            </div>
          )}

          {filtered.map((u) => {
            const isBot = u.username === "StudyBot";
            const isOnline = onlineUserIds.includes(u._id);
            const color = getAvatarColor(u.username);

            return (
              <button
                key={u._id}
                onClick={() => openChat(u)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition text-left"
              >
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  {isBot ? (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                      style={{ background: "#0F0E2A" }}
                    >
                      ⚡
                    </div>
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold"
                      style={{ background: color.bg, color: color.color }}
                    >
                      {u.username[0].toUpperCase()}
                    </div>
                  )}
                  {/* Online dot */}
                  {(isBot || isOnline) && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                      style={{ background: isBot ? "#6C63FF" : "#4CAF50" }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {u.username}
                  </p>
                  <p className="text-xs truncate" style={{ color: isBot ? "#6C63FF" : isOnline ? "#4CAF50" : "#aaa" }}>
                    {isBot ? "AI assistant · Always online" : isOnline ? "Online" : u.email}
                  </p>
                </div>

                {isBot && (
                  <div
                    className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ background: "#EDE9FF", color: "#6C63FF" }}
                  >
                    AI
                  </div>
                )}

                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" style={{ color: "#ccc", flexShrink: 0 }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-center"
          style={{ background: "#FAFAFE", borderTop: "0.5px solid #f0f0f0" }}
        >
          <p className="text-xs text-gray-400">
            {users.length} contact{users.length !== 1 ? "s" : ""} · ChatriX
          </p>
        </div>

      </div>
    </div>
  );
}