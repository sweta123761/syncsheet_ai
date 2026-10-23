# SyncSheet-AI 📊✨

> A production-ready, full-stack collaborative spreadsheet engine powered by the MERN stack, real-time WebSockets, and Google Gemini.

SyncSheet-AI allows multiple users to edit spreadsheets simultaneously with live presence indicators and cursor telemetry, dynamic client-side formula evaluation with cycle detection, and an integrated AI copilot to generate complex formulas and clean messy data.

---

## 🚀 Key Features

- **⚡ Real-Time Collaboration**: Full-duplex room synchronization via Socket.io. Edits propagate with sub-100ms latency.
- **👥 Live Presence & Cursors**: View active peer avatars and real-time remote cell selection outlines.
- **📐 Sparse Storage Architecture**: MongoDB document model leverages Mongoose `Map` structures indexed by `"row-col"` coordinates, storing only non-empty cells to optimize performance.
- **🧮 Reactive Formula Engine**: Client-side formula parsing (`=SUM(...)`, `=AVERAGE(...)`, etc.) with built-in circular reference detection (`#CIRC!`).
- **🤖 Gemini Copilot**:
  - **Natural Language Formula Generation**: Converts prompt descriptions into Excel-compatible formulas (`=...`).
  - **Human-in-the-Loop Data Cleansing**: Identifies formatting anomalies, whitespace, and capitalization inconsistencies, presenting an interactive diff preview before writing to state.
- **🔒 Security & Auth**: Stateless JWT authentication applied consistently across both REST endpoints and Socket.io connection handshakes.

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **Core Framework**: React 18, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Network & Real-Time**: Axios, Socket.io-client
- **Routing**: React Router DOM (v6)

### Backend (`server/`)
- **Runtime & Server**: Node.js (ES Modules), Express.js
- **Database & ODM**: MongoDB Atlas, Mongoose
- **WebSockets**: Socket.io
- **AI SDK**: `@google/genai` (Google Gemini 2.5 Flash)
- **Security**: JSON Web Tokens (JWT), Bcrypt.js, CORS

---

## 📁 Repository Structure

```text
syncsheet-ai/
├── client/                     # Vite + React single-page frontend
│   ├── src/
│   │   ├── api/                # Central Axios instance & endpoint adapters
│   │   ├── components/         # Reusable UI (AIPanel, ProtectedRoute)
│   │   ├── context/            # AuthContext & global state providers
│   │   ├── pages/              # Views (Dashboard, Sheet, Login, Register)
│   │   ├── utils/              # Client formula parser & coordinate helpers
│   │   ├── App.jsx             # Router layout & protected route boundaries
│   │   └── main.jsx            # React root mount
│   ├── package.json
│   └── vite.config.js
│
└── server/                     # Node.js + Express backend service
    ├── config/                 # Database initialization (Mongoose)
    ├── controllers/            # Request handlers (auth, spreadsheet, AI)
    ├── middleware/             # JWT auth guards
    ├── models/                 # Schemas (User, Spreadsheet)
    ├── routes/                 # Route declarations (/api/auth, /api/spreadsheets, /api/ai)
    ├── services/               # Gemini AI prompt orchestration
    ├── socket/                 # Socket.io connection handler & room manager
    ├── utils/                  # Coordinate parsing, token generation, math utilities
    ├── package.json
    └── server.js               # Entry point (HTTP + Socket.io Server)
```

---

## ⚙️ Environment Variables

Create `.env` files in both the `server/` and `client/` directories.

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/syncsheet?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or later)
- npm or yarn
- MongoDB Atlas cluster URL
- Google AI Studio API Key

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
```
*The server will start listening on `http://localhost:5000`.*

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
*The client app will be accessible at `http://localhost:5173`.*

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | No |

### Spreadsheets
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/spreadsheets` | List all owned and shared spreadsheets | Yes (Bearer) |
| `POST` | `/api/spreadsheets` | Create a new spreadsheet | Yes (Bearer) |
| `GET` | `/api/spreadsheets/:id` | Fetch spreadsheet contents by ID | Yes (Bearer) |
| `DELETE`| `/api/spreadsheets/:id` | Delete a spreadsheet (Owner only) | Yes (Bearer) |

### Gemini AI Copilot
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/formula` | Generate Excel formula from natural language prompt | Yes (Bearer) |
| `POST` | `/api/ai/clean` | Clean spreadsheet discrepancies and return preview diff | Yes (Bearer) |

---

## ⚡ WebSocket Events (Socket.io)

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-room` | Client $\rightarrow$ Server | `{ sheetId }` | Joins isolated spreadsheet room channel |
| `presence-change` | Server $\rightarrow$ Room | `Array<{ userId, name, activeCell }>` | Broadcasts updated online roster |
| `cell-edit` | Client $\rightarrow$ Server | `{ sheetId, cellKey, value }` | Sends typed edit & commits to database |
| `cell-updated` | Server $\rightarrow$ Room (Skip sender) | `{ cellKey, value }` | Broadcasts cell edit to other peers |
| `cursor-position` | Client $\rightarrow$ Server | `{ sheetId, cellKey }` | Informs peers of current active cell focus |
| `cursor-moved` | Server $\rightarrow$ Room (Skip sender) | `{ userId, name, cellKey }` | Renders remote cursor indicator |

---

## 🛡️ License

This project is licensed under the MIT License.