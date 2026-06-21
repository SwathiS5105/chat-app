import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
    auth: { token },
  });
  return socket;
}

export function getSocket() {
  return socket;
}
