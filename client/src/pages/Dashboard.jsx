import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sheets, setSheets] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const { data } = await api.get("/spreadsheets");
        setSheets(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load spreadsheets");
      } finally {
        setLoading(false);
      }
    };
    fetchSheets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/spreadsheets", { title });
      navigate(`/sheet/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create spreadsheet");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this spreadsheet?")) return;
    try {
      await api.delete(`/spreadsheets/${id}`);
      setSheets((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete");
    }
  };

  return (
    <div className="dashboard">
      <header>
        <h2>SyncSheet-AI</h2>
        <div>
          <span>Hi, {user.name} 👋</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dash-main">
        <form className="create-form" onSubmit={handleCreate}>
          <input
            placeholder="New spreadsheet title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit">+ Create</button>
        </form>

        {error && <p className="error">{error}</p>}
        {loading && <p>Loading...</p>}
        {!loading && sheets.length === 0 && <p>No spreadsheets yet. Create one!</p>}

        <div className="sheet-list">
          {sheets.map((sheet) => (
            <div className="sheet-card" key={sheet._id}>
              <Link to={`/sheet/${sheet._id}`}>
                <h3>{sheet.title}</h3>
                <small>Updated {new Date(sheet.updatedAt).toLocaleString()}</small>
              </Link>
              {sheet.owner === user._id && (
                <button className="danger" onClick={() => handleDelete(sheet._id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;