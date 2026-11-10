import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

const cell = { padding: "12px" };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/companies");
        const data = Array.isArray(res.data) ? res.data : res.data?.companies || [];
        if (!cancelled) {
          setCompanies(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Could not load companies.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "var(--text-heading)", borderBottom: "2px solid #198754", paddingBottom: "10px", marginBottom: "25px" }}>
          🏢 Companies ({companies.length})
        </h2>

        {error && <div className="alert alert-danger" style={{ marginBottom: "20px" }}>❌ {error}</div>}

        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)", overflowX: "auto" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading...</p>
          ) : companies.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>No companies registered yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                  <th style={cell}>Name</th>
                  <th style={cell}>Registration No.</th>
                  <th style={cell}>Wallet (KES)</th>
                  <th style={cell}>Created</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.company_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...cell, fontWeight: "bold", color: "var(--text-heading)" }}>{c.name}</td>
                    <td style={cell}>{c.registration_number || "-"}</td>
                    <td style={cell}>{parseFloat(c.wallet_balance || 0).toLocaleString()}</td>
                    <td style={{ ...cell, fontSize: "13px", color: "var(--text-muted)" }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}