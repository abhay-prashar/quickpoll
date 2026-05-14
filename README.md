# PollVault Pro 🗳️

A real-time, production-ready polling application built on the MERN stack. Create polls, share them, and watch results come in live with anonymous voting and duplicate prevention.

## Features ✨

*   **Atomic Duplicate Vote Prevention:** Uses a server-side MongoDB compound unique index (`pollSlug` + `IP`) to ensure true one-vote-per-device integrity, rather than relying solely on client-side cookies or localStorage.
*   **Live Results (REST Polling):** The results page fetches new data automatically every 3 seconds, complete with exponential backoff on failure and seamless UI transitions using Recharts.
*   **Poll Expiry & Countdown:** Set polls to expire after 1 hour, 1 day, or 1 week. Implemented with MongoDB TTL indexes and an active frontend countdown.
*   **Analytics:** Displays unique voters (distinct IPs) and voting velocity (votes in the last hour).
*   **Shareable Links:** 1-click "Copy to Clipboard" for voting and results links using the Clipboard API.
*   **Dark Mode Toggle:** Integrated Tailwind dark mode with localStorage persistence.
*   **Rate Limiting:** `express-rate-limit` secures the vote endpoint (max 10 votes / min / IP).
*   **Responsive & Polished UI:** Minimalist editorial design, Space Grotesk typography, skeleton loaders, and Recharts animations.

## Tech Stack 🛠️

*   **Frontend:** React, Vite, Tailwind CSS, React Router v6, Recharts, `react-hot-toast`
*   **Backend:** Node.js, Express, MongoDB, Mongoose, `express-rate-limit`, `nanoid`
*   **Deployment:** Vercel (Frontend), Render (Backend), MongoDB Atlas (Database)

## Run Locally 🚀

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your MongoDB URI
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Ensure VITE_API_URL points to http://localhost:5000 (or your backend port)
npm run dev
```

Visit `http://localhost:5173` to view the app!

## Live Demo 🌐
**Frontend:** [https://quickpoll-nu.vercel.app](https://quickpoll-nu.vercel.app)
