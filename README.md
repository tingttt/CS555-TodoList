# CS555 TodoList

A full-stack collaborative task management application built for CS555. Users can create, organize, and share tasks with other registered members, with changes reflected in real time across all connected clients.

## Features

- **Task Management** – Create, edit, delete, and reorder tasks with title, description, due date, priority (low / medium / high), category, and notes.
- **Task Sharing & Collaboration** – Share tasks with other registered users. Shared tasks support comment threads so collaborators can discuss progress.
- **Real-Time Updates** – Live task sync via WebSockets; all collaborators see changes instantly without refreshing.
- **User Authentication** – Session-based sign-up and sign-in with password hashing.
- **Protected Routes** – Task, calendar, and settings pages are only accessible to authenticated users.
- **Calendar View** – Visualize tasks by due date on a calendar.
- **Dark Mode** – User-level dark mode preference, persisted in the database.
- **Invite Links** – Share a task with another user via a unique invite link (`/shared/:taskId`).

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI component framework |
| **Vite** | Development server and build tool |
| **React Router v7** | Client-side routing and protected routes |
| **React Bootstrap / Bootstrap 5** | UI component library and styling |
| **Axios** | HTTP client for API calls |
| **Socket.IO Client** | Real-time WebSocket communication |

The frontend is organized into pages (`src/Pages/`), reusable components (`src/components/`), and a global auth context (`src/context/AuthContext.jsx`). Input validation utilities live in `src/utils/validation.js`.

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB + Mongoose** | Database and ODM for tasks, users, and sessions |
| **Socket.IO** | WebSocket server for real-time events |
| **express-session + connect-mongo** | Session management with MongoDB-backed storage |
| **bcryptjs** | Password hashing |
| **dotenv** | Environment variable management |

The server exposes a REST API and a Socket.IO layer from a single HTTP server. Sessions are shared between Express routes and Socket.IO so that WebSocket connections are authenticated automatically.

---

## Project Structure

```
CS555-TodoList/
├── src/                        # Frontend source
│   ├── Pages/                  # Route-level page components
│   │   ├── Home.jsx
│   │   ├── Signin.jsx
│   │   ├── Signup.jsx
│   │   ├── Tasks.jsx           # Main task management page
│   │   ├── Calendar.jsx
│   │   ├── Settings.jsx
│   │   └── InviteAccept.jsx    # Shared task invite handler
│   ├── components/             # Shared UI components
│   │   ├── Nav.jsx
│   │   ├── Footer.jsx
│   │   ├── AddTodo.jsx
│   │   ├── TodoList.jsx
│   │   ├── CompletedTodos.jsx
│   │   ├── CommentThread.jsx
│   │   ├── MemberSearch.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx     # Global auth state
│   └── utils/
│       └── validation.js
├── server/                     # Backend source
│   ├── index.js                # Express + Socket.IO server entry point
│   └── models/
│       ├── Task.js             # Mongoose Task schema
│       └── User.js             # Mongoose User schema
├── public/                     # Static assets
├── index.html
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- A running MongoDB instance (local or Atlas)

### Environment Variables

Create a `.env` file inside the `server/` directory:

```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

### Installation & Running

**1. Install frontend dependencies and start the dev server:**
```bash
npm install
npm run dev
```

**2. In a separate terminal, install backend dependencies and start the server:**
```bash
cd server
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:5000`.
