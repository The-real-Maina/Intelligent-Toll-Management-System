import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { FaTrash, FaPlus } from "react-icons/fa";

export default function CompanyVehicles() {
  const [data, setData] = useState({ vehicles: [], company: null });
  const [newVehicle, setNewVehicle] = useState({ plate_number: "", vehicle_type: "Car", owner_phone: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [msg, setMsg] = useState("");

  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get("/companies/my");
        if (!cancelled) {
          setData(res.data);
          setLoadError("");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(err.response?.data?.message || "Could not load fleet data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post("/companies/vehicles", newVehicle);
      setMsg(`✅ Added ${newVehicle.plate_number} to fleet!`);
      setNewVehicle({ plate_number: "", vehicle_type: "Car", owner_phone: "" });
      refresh();
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Error"));
    }
  };

  const handleRemove = async (id, plate) => {
    if (!window.confirm(`Remove ${plate}?`)) return;
    try {
      await API.delete(`/vehicles/${id}`);
      setMsg(`✅ Removed ${plate}`);
      refresh();
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Error"));
    }
  };

  if (loading) return <div className="dashboard"><Sidebar /><div className="content"><p>Loading...</p></div></div>;

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "var(--text-heading)", borderBottom: "2px solid #198754", paddingBottom: "10px", marginBottom: "25px" }}>
          🚗 Fleet Vehicles ({data.vehicles.length})
        </h2>

        {loadError && <div className="alert alert-danger" style={{ marginBottom: "20px" }}>❌ {loadError}</div>}
        {msg && <div className="alert alert-info" style={{ marginBottom: "20px" }}>{msg}</div>}

        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", marginBottom: "25px", border: "1px solid var(--border)" }}>
          <h4 style={{ margin: "0 0 15px", color: "var(--text)" }}>➕ Add New Vehicle</h4>
          <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "15px", background: "transparent", padding: 0, boxShadow: "none" }}>
            <input type="text" placeholder="Plate Number" value={newVehicle.plate_number} onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value })} style={inputStyle} required />
            <select value={newVehicle.vehicle_type} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })} style={inputStyle}>
              <option value="Car">Car</option>
              <option value="Bus">Bus</option>
              <option value="Truck">Truck</option>
              <option value="Motorcycle">Motorcycle</option>
            </select>
            <input type="tel" placeholder="Phone" value={newVehicle.owner_phone} onChange={(e) => setNewVehicle({ ...newVehicle, owner_phone: e.target.value })} style={inputStyle} />
            <button type="submit" className="btn btn-success" style={{ fontWeight: "bold", padding: "0 25px" }}><FaPlus /> Add</button>
          </form>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)" }}>
          {data.vehicles.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>No vehicles yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Plate</th>
                  <th style={{ padding: "12px" }}>Type</th>
                  <th style={{ padding: "12px" }}>Phone</th>
                  <th style={{ padding: "12px" }}>Added</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicles.map((v) => (
                  <tr key={v.vehicle_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "var(--text-heading)" }}>{v.plate_number}</td>
                    <td style={{ padding: "12px" }}>{v.vehicle_type}</td>
                    <td style={{ padding: "12px" }}>{v.owner_phone || "N/A"}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{new Date(v.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <button onClick={() => handleRemove(v.vehicle_id, v.plate_number)} style={{ padding: "6px 14px", background: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
                        <FaTrash /> Remove
                      </button>
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

const inputStyle = { padding: "12px", borderRadius: "6px", border: "1px solid var(--border-input)", background: "var(--bg-input)", color: "var(--text)" };