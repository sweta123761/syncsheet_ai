import { useState } from "react";
import api from "../api/axios";

const toA1 = (cell) => (cell ? `${String.fromCharCode(65 + cell.col)}${cell.row + 1}` : null);

const AIPanel = ({ sheetId, activeCell, onInsertFormula, onApplyChanges, onClose }) => {
  const [tab, setTab] = useState("formula");
  const [prompt, setPrompt] = useState("");
  const [formula, setFormula] = useState("");
  const [changes, setChanges] = useState(null);
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (task) => {
    setLoading(true);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(err.response?.data?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFormula = (e) => {
    e.preventDefault();
    run(async () => {
      const { data } = await api.post("/ai/formula", { sheetId, prompt });
      setFormula(data.formula);
    });
  };

  const handleClean = () =>
    run(async () => {
      const { data } = await api.post("/ai/clean", { sheetId });
      setChanges(data.changes);
    });

  const handleInsights = () =>
    run(async () => {
      const { data } = await api.post("/ai/insights", { sheetId });
      setInsights(data.insights);
    });

  const applyAll = () => {
    onApplyChanges(changes);
    setChanges(null);
  };

  return (
    <aside className="ai-panel">
      <div className="ai-head">
        <h3>✨ AI Assistant</h3>
        <button className="ghost" onClick={onClose}>✕</button>
      </div>

      <div className="ai-tabs">
        {[
          ["formula", "Formula"],
          ["clean", "Clean"],
          ["insights", "Insights"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "tab active" : "tab"}
            onClick={() => {
              setTab(id);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {tab === "formula" && (
        <div className="ai-body">
          <form onSubmit={handleFormula}>
            <textarea
              placeholder='e.g. "sum of all numbers in column B"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={300}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Generate formula"}
            </button>
          </form>

          {formula && (
            <div className="result-box">
              <code>{formula}</code>
              <button
                disabled={!activeCell}
                onClick={() => onInsertFormula(formula)}
              >
                {activeCell ? `Insert into ${toA1(activeCell)}` : "Click a cell first"}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "clean" && (
        <div className="ai-body">
          <p className="hint">AI will suggest fixes. You review them before anything changes.</p>
          <button onClick={handleClean} disabled={loading}>
            {loading ? "Scanning..." : "Scan for issues"}
          </button>

          {changes && changes.length === 0 && <p>Looks clean already! ✅</p>}

          {changes && changes.length > 0 && (
            <>
              <ul className="change-list">
                {changes.map((ch) => (
                  <li key={ch.key}>
                    <b>{ch.cell}</b>: <del>{ch.oldValue}</del> → <ins>{ch.newValue}</ins>
                  </li>
                ))}
              </ul>
              <button onClick={applyAll}>Apply {changes.length} changes</button>
            </>
          )}
        </div>
      )}

      {tab === "insights" && (
        <div className="ai-body">
          <button onClick={handleInsights} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze my sheet"}
          </button>
          {insights && <pre className="insights">{insights}</pre>}
        </div>
      )}
    </aside>
  );
};

export default AIPanel;