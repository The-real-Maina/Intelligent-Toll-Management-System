import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

const cell = { padding: "12px" };

export default function CompanyDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/companies/drivers");
        if (!cancelled) {
          setDrivers(res.data?.drivers || []);
          setVehicles(res.data?.vehicles || []);
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
  }, [reloadKey]);

  const assign = async (vehicleId, driverId) => {
    try {
      const res = await API.put("/companies/drivers/assign", {
        vehicle_id: Number(vehicleId),
        driver_id: driverId,
      });
      setMessage("✅ " + res.data.message);
      refresh();
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Could not update assignment"));
    }
    setTimeout(() => setMessage(""), 4000);
  };

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
            paddingRight: "70px",
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

        {error && <div className="alert alert-danger" style={{ marginBottom: "20px" }}>❌ {error}</div>}
        {message && <div className="alert alert-info" style={{ marginBottom: "20px" }}>{message}</div>}

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
                  <th style={cell}>Assigned Vehicles</th>
                  <th style={cell}>Assign Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const available = vehicles.filter((v) => v.assigned_driver_id !== d.user_id);
                  return (
                    <tr key={d.user_id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ ...cell, fontWeight: "bold", color: "var(--text-heading)" }}>{d.full_name || "-"}</td>
                      <td style={cell}>{d.email || "-"}</td>
                      <td style={cell}>{d.phone || "-"}</td>
                      <td style={cell}>
                        {d.vehicles?.length ? (
                          d.vehicles.map((v) => (
                            <span
                              key={v.vehicle_id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "3px 10px",
                                marginRight: "6px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                background: "var(--badge-green-bg)",
                                color: "var(--badge-green-text)",
                              }}
                            >
                              {v.plate_number}
                              <button
                                onClick={() => assign(v.vehicle_id, null)}
                                title="Unassign"
                                style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
                              >
                                ✕
                              </button>
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>None</span>
                        )}
                      </td>
                      <td style={cell}>
                        <select
                          value=""
                          onChange={(e) => e.target.value && assign(e.target.value, d.user_id)}
                          disabled={available.length === 0}
                          style={{
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-input)",
                            background: "var(--bg-input)",
                            color: "var(--text)",
                          }}
                        >
                          <option value="">{available.length ? "Assign vehicle..." : "No vehicles"}</option>
                          {available.map((v) => (
                            <option key={v.vehicle_id} value={v.vehicle_id}>
                              {v.plate_number} ({v.vehicle_type})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}