# PollVault 🗳️

> A real-time, anonymous polling web application built with the MERN stack.

<!-- Demo screenshot placeholder – replace with actual screenshot after deployment -->

## ✨ Features

| Feature | Details |
|---|---|
| **Live Results** | Results page polls the API every 3 s and animates bar chart updates |
| **Atomic Vote Logic** | MongoDB compound unique index prevents duplicate votes server-side |
| **Duplicate Prevention** | IP-based Vote record + `localStorage` flag on client |
| **Shareable Links** | One-click copy for voting + results URLs |
| **Expiry Control** | Set polls to expire in 1h / 1d / 1 week, or never |
| **Dark Mode** | System preference + manual toggle, persisted in `localStorage` |
| **Rate Limiting** | 10 vote requests per IP per minute |
| **Responsive** | Mobile-first Tailwind CSS layout |

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, Recharts, React Router v6 |
| Backend | Node.js 18+, Express 4, Mongoose 8 |
| Database | MongoDB Atlas |
| Auth | Anonymous (IP + localStorage) |

## 📂 Project Structure

```
Voting/
├── backend/
│   ├── src/
│   │   ├── controllers/pollController.js
│   │   ├── middleware/errorHandler.js
│   │   ├── models/Poll.js
│   │   ├── models/Vote.js
│   │   ├── routes/polls.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Icons.jsx
    │   │   ├── LiveBarChart.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── Navbar.jsx
    │   ├── pages/
    │   │   ├── CreatePoll.jsx
    │   │   ├── Vote.jsx
    │   │   └── Results.jsx
    │   ├── utils/api.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    └── package.json
```

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)

### 1. Clone & install

```bash
git clone <your-repo-url>

# Backend
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI in .env

# Frontend
cd ../frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000 (already set)
```

### 2. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## ☁️ Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Set **Root directory** to `backend`.
3. Set **Build command**: `npm install`
4. Set **Start command**: `node src/index.js`
5. Add environment variables:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `PORT` — `10000` (Render default)
   - `FRONTEND_URL` — your Vercel frontend URL (for CORS)

### Frontend → Vercel

1. Import the repo into [Vercel](https://vercel.com).
2. Set **Root directory** to `frontend`.
3. Set **Build command**: `npm run build`
4. Set **Output directory**: `dist`
5. Add environment variable:
   - `VITE_API_URL` — your Render backend URL (e.g. `https://pollvault.onrender.com`)

---

## 🔐 Duplicate Vote Prevention

1. **Client**: `localStorage.setItem("voted_<slug>", "1")` on successful vote → redirect to results on revisit.
2. **Server (atomic)**: A `Vote` document is created with a compound unique index on `{ pollSlug, ip }`. If the same IP votes twice, MongoDB throws a duplicate key error (code 11000) → API returns `409 Already voted`.
3. `Poll.options[n].votes` is incremented atomically with `$inc` only after the Vote document is successfully inserted.

---

## 📄 License

MIT
