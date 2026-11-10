import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";

function Vehicles() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const isAdmin = user?.role === "Admin";

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    plate_number: "",
    owner_name: user?.full_name || "",
    vehicle_type: "Car",
    owner_phone: "",
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      await API.post("/vehicles", formData);
      setMessage({ type: "success", text: "Vehicle added successfully!" });
      setFormData({ ...formData, plate_number: "", owner_phone: "" });
      loadVehicles();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to add vehicle" });
    }
  };

  const handleToggleBlacklist = async (vehicle) => {
    try {
      await API.put(`/vehicles/${vehicle.vehicle_id}/blacklist`, {
        is_blacklisted: !vehicle.is_blacklisted,
        reason: !vehicle.is_blacklisted ? "Flagged by Admin" : null,
      });
      loadVehicles();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle blacklist");
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "#198754", marginBottom: "20px" }}>Vehicle Management</h2>

        {isAdmin && (
          <div style={{ background: "#dbeafe", color: "#1e40af", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "600" }}>
            ℹ️ You can blacklist vehicles below. Drivers manage their own vehicles.
          </div>
        )}

        {!isAdmin && (
          <div style={{ background: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "30px" }}>
            <h4 style={{ color: "#198754", marginBottom: "20px" }}>➕ Register New Vehicle</h4>
            {message.text && (
              <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`} style={{ marginBottom: "15px" }}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleAddVehicle} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "15px", alignItems: "end", background: "transparent", padding: 0, boxShadow: "none" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold" }}>Plate Number</label>
                <input type="text" name="plate_number" value={formData.plate_number} onChange={handleChange} className="form-control" placeholder="e.g. KDA 123A" required />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold" }}>Owner Name</label>
                <input type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} className="form-control" required />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold" }}>Vehicle Type</label>
                <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="form-select">
                  <option value="Car">Car</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Bus">Bus</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold" }}>Phone</label>
                <input type="tel" name="owner_phone" value={formData.owner_phone} onChange={handleChange} className="form-control" placeholder="e.g. 0712345678" required />
              </div>
              <button type="submit" className="btn btn-success" style={{ height: "40px", fontWeight: "bold" }}>Add Vehicle</button>
            </form>
          </div>
        )}

        <div style={{ background: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h4 style={{ color: "#333", marginBottom: "20px" }}>🚗 Registered Vehicles ({vehicles.length})</h4>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Plate Number</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Owner</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Phone</th>
                  {isAdmin && <th style={{ padding: "12px", textAlign: "left" }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr key={v.vehicle_id} style={{ borderBottom: "1px solid #eee", backgroundColor: v.is_blacklisted ? "#fef2f2" : i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                    <td style={{ padding: "12px" }}>{i + 1}</td>
                    <td style={{ padding: "12px", fontWeight: "bold", color: v.is_blacklisted ? "#dc3545" : "#198754" }}>
                      {v.plate_number} {v.is_blacklisted && "🚨"}
                    </td>
                    <td style={{ padding: "12px" }}>{v.owner_name}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ backgroundColor: v.vehicle_type === "Car" ? "#d1fae5" : v.vehicle_type === "Bus" ? "#dbeafe" : v.vehicle_type === "Truck" ? "#fef3c7" : "#f3e8ff", color: v.vehicle_type === "Car" ? "#065f46" : v.vehicle_type === "Bus" ? "#1e40af" : v.vehicle_type === "Truck" ? "#92400e" : "#6b21a8", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                        {v.vehicle_type}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>{v.owner_phone}</td>
                    {isAdmin && (
                      <td style={{ padding: "12px" }}>
                        <button onClick={() => handleToggleBlacklist(v)} style={{ padding: "6px 12px", borderRadius: "5px", fontWeight: "bold", border: "none", cursor: "pointer", color: "white", background: v.is_blacklisted ? "#dc3545" : "#ffc107" }}>
                          {v.is_blacklisted ? "🚨 Remove Blacklist" : "⚠️ Blacklist"}
                        </button>
                      </td>
                    )}
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

export default Vehicles;