import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUsers } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

// Builds a consistent room id for any pair of users, regardless of who clicks first
function getRoomId(id1, id2) {
  return [id1, id2].sort().join("_");
}

export default function Contacts() {
  const { token, user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers(token).then(setUsers);
  }, [token]);

  function openChat(otherUser) {
    const room = getRoomId(user.id, otherUser._id);
    navigate(`/chat/${room}`, { state: { otherUser } });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Logged in as</p>
            <p className="font-semibold text-gray-800">{user.username}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Log out
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {users.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              No other users yet — sign up a second account to test chatting.
            </p>
          )}
          {users.map((u) => (
            <button
              key={u._id}
              onClick={() => openChat(u)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                {u.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800">{u.username}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}