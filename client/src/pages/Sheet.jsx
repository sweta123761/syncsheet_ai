
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AIPanel from "../components/AIPanel";
 
const colLabel = (i) => String.fromCharCode(65 + i); // 0 -> A, 1 -> B ...
 
const Sheet = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const socketRef = useRef(null);
 
  const [sheet, setSheet] = useState(null);
  const [cells, setCells] = useState({});
  const [error, setError] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [presence, setPresence] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [showAI, setShowAI] = useState(false);
 
  useEffect(() => {
    const fetchSheet = async () => {
      try {
        const { data } = await api.get(`/spreadsheets/${id}`);
        setSheet(data);
        setCells(data.cells || {});
      } catch (err) {
        setError(
          err.response?.data?.message ||
            `Could not load spreadsheet: ${err.message}`
        );
      }
    };
    fetchSheet();
  }, [id]);
 
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: user.token },
    });
    socketRef.current = socket;
 
    // connect (aur reconnect) hote hi room join karo
    socket.on("connect", () => {
      socket.emit("join-sheet", id);
    });
 
    // dusre user ne cell badla
    socket.on("cell-updated", ({ key, value }) => {
      setCells((prev) => ({ ...prev, [key]: value }));
    });
 
    socket.on("presence-update", (list) => setPresence(list));
    socket.on("socket-error", (message) => setError(message));
 
    // cleanup: page chhodte hi connection band
    return () => {
      socket.disconnect();
    };
  }, [id, user.token]);
 
  const handleCellChange = (row, col, value) => {
    const key = `${row}-${col}`;
    setCells((prev) => ({ ...prev, [key]: value }));
    socketRef.current?.emit("cell-update", { key, value });
  };
 
  const handleCellFocus = (row, col) => {
    setActiveCell({ row, col });
    socketRef.current?.emit("cell-focus", `${row}-${col}`);
  };
 
  const handleCellBlur = () => {
    socketRef.current?.emit("cell-focus", null);
  };
 
  const insertFormula = (formula) => {
    if (!activeCell) return;
    handleCellChange(activeCell.row, activeCell.col, formula);
  };
 
  const applyChanges = (changes) => {
    changes.forEach((ch) => {
      const [row, col] = ch.key.split("-").map(Number);
      handleCellChange(row, col, ch.newValue);
    });
  };
 
  const handleShare = async (e) => {
    e.preventDefault();
    setShareMsg("");
    try {
      await api.post(`/spreadsheets/${id}/collaborators`, {
        email: shareEmail,
      });
      setShareMsg("Collaborator added ✅");
      setShareEmail("");
    } catch (err) {
      setShareMsg(err.response?.data?.message || "Could not add collaborator");
    }
  };
 
  if (error) {
    return (
      <div className="sheet-page">
        <p className="error">{error}</p>
        <Link to="/">← Back</Link>
      </div>
    );
  }
 
  if (!sheet) return <p style={{ padding: 24 }}>Loading...</p>;
 
  // same user do tabs mein ho to bhi ek hi avatar
  const onlineUsers = Object.values(
    presence.reduce((acc, p) => {
      acc[p.userId] = p;
      return acc;
    }, {})
  );
 
  // dusron ke cursors: { "2-3": { name, color, ... } }
  const remoteCells = {};
  presence.forEach((p) => {
    if (p.userId !== user._id && p.cell) remoteCells[p.cell] = p;
  });
 
  const isOwner = sheet.owner._id === user._id;
 
  return (
    <div className="sheet-page">
      <header className="sheet-header">
        <div>
          <Link to="/">← Back</Link>
          <h2>{sheet.title}</h2>
 
          <div className="online-users">
            {onlineUsers.map((p) => (
              <span
                key={p.userId}
                className="avatar"
                style={{ background: p.color }}
                title={p.userId === user._id ? `${p.name} (You)` : p.name}
              >
                {p.name[0].toUpperCase()}
              </span>
            ))}
            <small>{onlineUsers.length} online</small>
          </div>
 
          <button className="ai-btn" onClick={() => setShowAI((s) => !s)}>
            ✨ AI Assistant
          </button>
        </div>
 
        {isOwner && (
          <form className="share-form" onSubmit={handleShare}>
            <input
              type="email"
              placeholder="Share with (email)"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              required
            />
            <button type="submit">Share</button>
            {shareMsg && <small>{shareMsg}</small>}
          </form>
        )}
      </header>
 
      <div className="sheet-body">
        <div className="grid-wrapper">
          <table className="grid">
            <thead>
              <tr>
                <th className="corner"></th>
                {Array.from({ length: sheet.cols }, (_, c) => (
                  <th key={c}>{colLabel(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: sheet.rows }, (_, r) => (
                <tr key={r}>
                  <th>{r + 1}</th>
                  {Array.from({ length: sheet.cols }, (_, c) => {
                    const key = `${r}-${c}`;
                    const remote = remoteCells[key];
                    return (
                      <td
                        key={key}
                        className="cell"
                        style={
                          remote
                            ? { boxShadow: `inset 0 0 0 2px ${remote.color}` }
                            : undefined
                        }
                      >
                        {remote && (
                          <span
                            className="remote-label"
                            style={{ background: remote.color }}
                          >
                            {remote.name}
                          </span>
                        )}
                        <input
                          value={cells[key] || ""}
                          onChange={(e) =>
                            handleCellChange(r, c, e.target.value)
                          }
                          onFocus={() => handleCellFocus(r, c)}
                          onBlur={handleCellBlur}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
 
        {showAI && (
          <AIPanel
            sheetId={id}
            activeCell={activeCell}
            onInsertFormula={insertFormula}
            onApplyChanges={applyChanges}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>
    </div>
  );
};
 
export default Sheet;