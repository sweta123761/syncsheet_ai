import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Spreadsheet from "../models/Spreadsheet.js";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

// userId se hamesha same color nikalta hai
const colorFor = (userId) => {
  let hash = 0;
  for (const ch of String(userId)) {
    hash = (hash * 31 + ch.charCodeAt(0)) % COLORS.length;
  }
  return COLORS[hash];
};

// sheetId -> Map(socketId -> { userId, name, color, cell })
const presence = new Map();

const getPresenceList = (sheetId) => Array.from(presence.get(sheetId)?.values() || []);

const removeFromPresence = (io, socket) => {
  const sheetId = socket.data.sheetId;
  if (!sheetId) return;

  const roomMap = presence.get(sheetId);
  if (roomMap) {
    roomMap.delete(socket.id);
    if (roomMap.size === 0) presence.delete(sheetId);
  }
  io.to(sheetId).emit("presence-update", getPresenceList(sheetId));
};

const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 ${socket.user.name} connected (${socket.id})`);

    socket.on("join-sheet", async (sheetId) => {
      try {
        const sheet = await Spreadsheet.findById(sheetId);
        if (!sheet) return socket.emit("socket-error", "Spreadsheet not found");

        const hasAccess =
          sheet.owner.equals(socket.user._id) ||
          sheet.collaborators.some((c) => c.equals(socket.user._id));
        if (!hasAccess) return socket.emit("socket-error", "Access denied");

        // pehle kisi room mein tha to wahan se nikalo
        if (socket.data.sheetId) {
          removeFromPresence(io, socket);
          socket.leave(socket.data.sheetId);
        }

        const room = String(sheetId);
        socket.join(room);
        socket.data.sheetId = room;

        if (!presence.has(room)) presence.set(room, new Map());
        presence.get(room).set(socket.id, {
          userId: String(socket.user._id),
          name: socket.user.name,
          color: colorFor(socket.user._id),
          cell: null,
        });

        // room ke SABKO (khud ko bhi) updated list bhejo
        io.to(room).emit("presence-update", getPresenceList(room));
      } catch (error) {
        socket.emit("socket-error", "Could not join spreadsheet");
      }
    });

    socket.on("cell-update", async ({ key, value }) => {
      const sheetId = socket.data.sheetId;
      if (!sheetId) return;

      if (!/^\d+-\d+$/.test(key)) return;
      if (typeof value !== "string" || value.length > 1000) return;

      socket.to(sheetId).emit("cell-updated", { key, value });

      try {
        await Spreadsheet.updateOne(
          { _id: sheetId },
          { $set: { [`cells.${key}`]: value } }
        );
      } catch (error) {
        console.error("Cell save failed:", error.message);
      }
    });

    // NAYA: kaun kis cell pe hai
    socket.on("cell-focus", (key) => {
      const sheetId = socket.data.sheetId;
      if (!sheetId) return;

      if (key !== null && !/^\d+-\d+$/.test(key)) return;

      const me = presence.get(sheetId)?.get(socket.id);
      if (!me) return;

      me.cell = key;
      io.to(sheetId).emit("presence-update", getPresenceList(sheetId));
    });

    socket.on("disconnect", () => {
      console.log(`❌ ${socket.user.name} disconnected`);
      removeFromPresence(io, socket);
    });
  });
};

export default registerSocketHandlers;