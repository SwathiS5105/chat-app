import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Chat from "./pages/Chat.jsx";
import Contacts from "./pages/Contacts.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:room"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? "/contacts" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
