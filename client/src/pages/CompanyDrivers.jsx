import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

const cell = { padding: "12px" };

export default function CompanyDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/companies/drivers");
        const data = Array.isArray(res.data) ? res.data : res.data?.drivers || [];
        if (!cancelled) {
          setDrivers(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Could not load drivers right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = drivers.filter((d) =>
    `${d.full_name || ""} ${d.email || ""} ${d.phone || ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
            borderBottom: "2px solid #198754",
            paddingBottom: "15px",
          }}
        >
          <h2 style={{ margin: 0, color: "var(--text-heading)" }}>👤 Company Drivers</h2>
          <input
            type="text"
            placeholder="Search name, email or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              padding: "10px 12px",
              minWidth: "260px",
              borderRadius: "6px",
              border: "1px solid var(--border-input)",
              background: "var(--bg-input)",
              color: "var(--text)",
            }}
          />
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            ❌ {error}
          </div>
        )}

        <div
          style={{
            background: "var(--bg-card)",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            overflowX: "auto",
          }}
        >
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading drivers...</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
              No drivers found. Add them from the Company Dashboard.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                  <th style={cell}>Name</th>
                  <th style={cell}>Email</th>
                  <th style={cell}>Phone</th>
                  <th style={cell}>Added</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.user_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ ...cell, fontWeight: "bold", color: "var(--text-heading)" }}>
                      {d.full_name || "-"}
                    </td>
                    <td style={cell}>{d.email || "-"}</td>
                    <td style={cell}>{d.phone || "-"}</td>
                    <td style={{ ...cell, fontSize: "13px", color: "var(--text-muted)" }}>
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : "-"}
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