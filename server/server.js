import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import spreadsheetRoutes from "./routes/spreadsheetRoutes.js";
import registerSocketHandlers from "./socket/socketHandler.js";
import aiRoutes from "./routes/aiRoutes.js";
dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());


app.get("/", (req, res) => {
  res.json({ message: "SyncSheet-AI server is running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/spreadsheets", spreadsheetRoutes);
app.use("/api/spreadsheets", spreadsheetRoutes);
app.use("/api/ai", aiRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});