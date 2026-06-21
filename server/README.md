# Chat app — backend starter

This is the starter backend for your chat app project: auth, real-time chat, auto-delete (TTL) messages via BullMQ, and a Tic-Tac-Toe game module — all wired through Socket.io.

## What's already built
- Signup/login with JWT (`routes/auth.js`)
- MongoDB models for users and messages (`models/`)
- Real-time chat over Socket.io (`sockets/chatHandlers.js`)
- Auto-delete messages using a BullMQ + Redis job queue (`jobs/deleteMessageQueue.js`)
- A working Tic-Tac-Toe game over sockets (`sockets/gameHandlers.js`) — use this as the template for adding Rock-Paper-Scissors or trivia later

## Setup steps

1. **Extract this folder** wherever you keep your projects.

2. **Install dependencies.** Open a terminal inside the `server` folder and run:
   ```bash
   npm install
   ```

3. **Set up your environment variables.**
   - Copy `.env.example` to a new file named `.env`
   - Paste in your real MongoDB Atlas connection string (`MONGO_URI`)
   - Paste in your real Upstash Redis connection string (`REDIS_URL`)
   - Set `JWT_SECRET` to any long random string (you can generate one at https://generate-secret.vercel.app/32 or just type random characters)

4. **Run the server:**
   ```bash
   npm run dev
   ```
   You should see in the terminal:
   ```
   MongoDB connected
   Delete worker started
   Server running on port 5000
   ```

5. **Test it's alive** — open http://localhost:5000 in your browser. You should see "Chat app server is running".

6. **Test the signup endpoint** using Thunder Client or Postman:
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/signup`
   - Body (JSON):
     ```json
     {
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - You should get back a token and user object.

## Next step: the frontend

This package only contains the backend. To create the frontend, run this in your main project folder (one level above `server`):

```bash
npm create vite@latest client -- --template react
cd client
npm install
npm install socket.io-client axios react-router-dom
```

Then run `npm run dev` inside `client` to start the React dev server (usually on http://localhost:5173).

## A note on testing real-time chat locally

To test two users chatting, open two different browsers (or one normal + one incognito window) and log in as two different test accounts in each. This lets you see messages arrive in real time on both sides.

## Common issues

- **"MongoDB connection error"** — double check your `MONGO_URI` in `.env`, and make sure your Atlas Network Access allows your IP (or is set to allow from anywhere for development).
- **"Redis connection error" / BullMQ hangs** — double check `REDIS_URL`, and make sure you copied the full string including the password.
- **CORS errors in the browser console** — make sure `CLIENT_URL` in `.env` matches exactly where your frontend is running (e.g. `http://localhost:5173`, no trailing slash).
