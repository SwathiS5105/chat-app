# ChatriX — An AI-Assisted Real-Time Communication Platform with Interactive Activities

> **Live Demo**: [https://chat-app-three-phi-25.vercel.app](https://chat-app-three-phi-25.vercel.app)

ChatriX is a full-stack real-time communication platform built from scratch using WebSocket architecture, distributed job queues, and AI integration. It combines instant messaging, server-side ephemeral messages, an AI assistant with conversation memory, and multiplayer games — all running on the same WebSocket connection.

---

## Screenshots

| Login | Contacts | Chat | Quiz |
|---|---|---|---|
| Dark navy login screen with ChatriX branding | Contact list with real-time online status | 1:1 chat with message bubbles and date dividers | AI-generated subject quiz with turn-based answering |

---

## Features

- **Real-time 1:1 messaging** — Instant message delivery over WebSockets with persistent chat history
- **Ephemeral messages** — Set messages to auto-delete after 10 seconds, 1 minute, or 1 hour. Deletion is guaranteed server-side via BullMQ + Redis — survives server restarts
- **StudyBot AI assistant** — AI contact powered by Groq (Llama 3.1 8B) with conversation memory built from stored message history
- **Multiplayer Tic-Tac-Toe** — Real-time turn-based game with correct player assignment and win detection
- **Rock-Paper-Scissors** — Simultaneous choice reveal with win/lose/draw result
- **Quiz Challenge** — AI-generated subject questions (Math, Physics, CS, etc.) with intelligent answer evaluation and turn-based answering
- **Real-time online status** — Green dot on contacts who are currently online, tracked server-side with multi-tab support
- **Contact search** — Instant filter by username or email
- **Date dividers in chat** — Messages grouped by Today / Yesterday / date
- **Typing indicator** — Animated bouncing dots when partner is typing
- **Mobile responsive** — Works on any screen size

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| Socket.io-client | WebSocket client |
| Axios | HTTP requests |
| React Router DOM | Client-side routing |
| Tailwind CSS | Styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | Web server |
| Socket.io | Real-time WebSocket server |
| Mongoose | MongoDB object modeling |
| BullMQ + IORedis | Distributed job queue for auto-delete |
| JSON Web Token | Authentication |
| Bcryptjs | Password hashing |
| Groq SDK | AI integration (StudyBot + Quiz) |

### Cloud Services
| Service | Purpose |
|---|---|
| MongoDB Atlas | Database |
| Upstash Redis | Job queue persistence |
| Render | Backend hosting |
| Vercel | Frontend hosting |
| Groq API | LLM inference (Llama 3.1 8B Instant) |

---

## Architecture

```
Client (React + Vite)
        │
        │  WebSocket (Socket.io)
        │  HTTP (Axios)
        ▼
Backend (Node.js + Express + Socket.io)
        │
        ├── MongoDB Atlas ──── Users, Messages
        │
        ├── BullMQ Worker ──── Processes delayed deletion jobs
        │
        ├── Upstash Redis ──── Persists BullMQ jobs
        │
        └── Groq API ────────── StudyBot AI + Quiz generation
```

### How a message flows through the system

1. User types a message and clicks Send
2. Frontend emits `sendMessage` event over WebSocket
3. Backend saves message to MongoDB
4. Backend emits `newMessage` to both clients in the room
5. If TTL is set, a delayed BullMQ job is added to Redis
6. When the delay elapses, the worker deletes the message from MongoDB
7. Worker emits `messageDeleted` to both clients — message disappears from both screens simultaneously

---

## Key Technical Decisions

### Why BullMQ + Redis instead of setTimeout for auto-delete?
`setTimeout` is in-memory — if the server restarts before the timer fires, the deletion never happens. BullMQ persists jobs in Redis, so deletion is guaranteed regardless of server restarts.

### How does StudyBot remember conversations?
Every time a user sends a message in a StudyBot chat, the backend fetches the last 10 messages from MongoDB and passes them as conversation history to the Groq API. This gives the AI genuine multi-turn memory without any separate session management.

### How is online status tracked with multiple tabs?
Each user has a `Set` of socket IDs in a server-side `Map`. When any socket connects, the socket ID is added to that user's set. When it disconnects, it's removed. The user is considered offline only when their set is empty — correctly handling multiple open tabs.

### Why is game state kept in memory instead of Redis?
For a mini project with a single server instance, in-memory state is simpler and has zero latency. In production with multiple server instances, this would be moved to Redis (noted as a future improvement).

---

## Getting Started

### Prerequisites
- Node.js v20+ 
- A MongoDB Atlas account (free tier)
- An Upstash Redis account (free tier)
- A Groq API key (free at console.groq.com)

### Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/chat-app.git
cd chat-app
```

### Backend setup
```bash
cd server
npm install
cp .env.example .env
```

Fill in your `.env`:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
REDIS_URL=your_upstash_redis_connection_string
JWT_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
GEMINI_BOT_ID=run_seed_script_to_get_this
```

Seed the StudyBot user:
```bash
node scripts/seedBot.js
```
Copy the printed ID and paste it as `GEMINI_BOT_ID` in `.env`.

Start the backend:
```bash
npm run dev
```

### Frontend setup
```bash
cd ../client
npm install
```

Create `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
chat-app/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── TicTacToe.jsx        # Tic-Tac-Toe game
│   │   │   ├── RockPaperScissors.jsx
│   │   │   └── Quiz.jsx             # AI-powered quiz game
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Contacts.jsx         # Contact list with search + online status
│   │   │   └── Chat.jsx             # Main chat interface
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # JWT auth state management
│   │   ├── api.js                   # Axios API helpers
│   │   └── socket.js                # Socket.io client setup
│   └── package.json
│
└── server/                          # Node.js backend
    ├── models/
    │   ├── User.js
    │   └── Message.js               # Includes expiresAt TTL field
    ├── routes/
    │   ├── auth.js                  # Signup, login
    │   ├── messages.js              # Fetch chat history
    │   └── users.js                 # Contact list, user by ID
    ├── sockets/
    │   ├── chatHandlers.js          # Messaging + StudyBot AI interception
    │   ├── gameHandlers.js          # Tic-Tac-Toe + Rock-Paper-Scissors
    │   └── quizHandlers.js          # Quiz game with turn management
    ├── services/
    │   └── gemini.js                # Groq AI client (StudyBot + Quiz)
    ├── jobs/
    │   └── deleteMessageQueue.js    # BullMQ queue + worker
    ├── middleware/
    │   └── auth.js                  # JWT verification for routes + sockets
    ├── scripts/
    │   └── seedBot.js               # Creates StudyBot user in MongoDB
    └── index.js                     # Express + Socket.io server entry point
```

---

## Bugs Debugged During Development

These are real bugs encountered and fixed during development — useful for understanding the project deeply:

| Bug | Root Cause | Fix |
|---|---|---|
| Redis connection refused on startup | `dotenv.config()` called after imports; ES module imports are hoisted, so `REDIS_URL` was undefined when Redis connected | Changed to `import 'dotenv/config'` as first import |
| Auto-delete silently failing | `message.save()` triggered Mongoose validation; empty string failed `required: true` on content field | Switched to `findByIdAndUpdate` which bypasses validation |
| CORS error after deployment | Backend `CLIENT_URL` was `localhost`; Vercel URL not in allowlist | Changed CORS origin to a function checking an allowlist of origins |
| Tic-Tac-Toe both players assigned X | `startGame` reset game state every time either player joined | Added check: only create new game if one doesn't exist for the room |
| Quiz both players could answer | `currentAnswerer` compared against `getSocket().userId` which is undefined client-side | Compared against `user.id` from `useAuth()` context instead |

---

## Future Enhancements

- End-to-end encryption (Diffie-Hellman key exchange)
- Group study rooms with named channels
- File and image sharing (Cloudinary integration)
- Push notifications (Web Push API)
- Read receipts
- Message reactions
- Voice notes
- Collaborative notes (real-time shared notepad using Socket.io)
- Study streak tracker
- Horizontal scaling with Redis pub/sub Socket.io adapter

---

## Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://chat-app-three-phi-25.vercel.app |
| Backend | Render | https://chat-app-server-sblb.onrender.com |
| Database | MongoDB Atlas | Cloud hosted |
| Redis | Upstash | Cloud hosted |

> **Note**: The backend is hosted on Render's free tier, which spins down after 15 minutes of inactivity. The first request after inactivity may take 20–30 seconds to respond while the server wakes up. This is a free-tier limitation, not a bug.

---

## Author

**S. Swathi**
M.Sc. Computer Science, St. Joseph's College of Arts and Science (Autonomous), Cuddalore

---

## License

MIT License — free to use, modify, and distribute.