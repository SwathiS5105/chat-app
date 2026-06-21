import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  socket = io("http://localhost:5000", {
    auth: { token },
  });
  return socket;
}

export function getSocket() {
  return socket;
}
