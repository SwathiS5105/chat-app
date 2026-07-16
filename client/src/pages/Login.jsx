import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginApi } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

function ChatrixLogo({ size = 56 }) {
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

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginApi(username, password);
      login(data.token, data.user);
      navigate("/contacts");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0F0E2A" }}
    >
      <div className="w-full max-w-sm">

        {/* Logo + name */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <ChatrixLogo size={64} />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#fff", letterSpacing: "-1px" }}>
              Chatri<span style={{ color: "#6C63FF" }}>X</span>
            </h1>
            <p className="text-xs mt-1 font-medium tracking-widest" style={{ color: "#6C63FF" }}>
              CONNECT · PLAY · CHAT
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "#1A193A", border: "1px solid #2D2C4A" }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: "#fff" }}>
            Welcome back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: "#6C63FF" }}>
                USERNAME
              </label>
              <input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none transition"
                style={{
                  background: "#0F0E2A",
                  color: "#fff",
                  border: "1.5px solid #2D2C4A",
                }}
                onFocus={(e) => e.target.style.borderColor = "#6C63FF"}
                onBlur={(e) => e.target.style.borderColor = "#2D2C4A"}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: "#6C63FF" }}>
                PASSWORD
              </label>
              <input
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none transition"
                style={{
                  background: "#0F0E2A",
                  color: "#fff",
                  border: "1.5px solid #2D2C4A",
                }}
                onFocus={(e) => e.target.style.borderColor = "#6C63FF"}
                onBlur={(e) => e.target.style.borderColor = "#2D2C4A"}
              />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: "#2D1A1A", color: "#FF6B6B", border: "1px solid #FF6B6B33" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold transition"
              style={{
                background: loading ? "#4A4580" : "#6C63FF",
                color: "#fff",
                letterSpacing: "0.3px",
              }}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color: "#888" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#6C63FF", fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#2D2C4A" }}>
          ChatriX · Real-time chat with AI and games
        </p>

      </div>
    </div>
  );
}