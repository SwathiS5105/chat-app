import axios from "axios";

const API_URL = "http://localhost:5000/api";

export async function signup(username, email, password) {
  const res = await axios.post(`${API_URL}/auth/signup`, { username, email, password });
  return res.data;
}

export async function login(username, password) {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password });
  return res.data;
}

export async function fetchMessages(room, token) {
  const res = await axios.get(`${API_URL}/messages/${room}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
export async function fetchUsers(token) {
  const res = await axios.get(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
export async function fetchUserById(id, token) {
  const res = await axios.get(`${API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}