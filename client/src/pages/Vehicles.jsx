import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";

function Vehicles() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const isDriver = user?.role === "Driver";

  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ plate_number: "", owner_name: "", vehicle_type: "Car", owner_phone: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data);
    } catch (error) { console.error(error); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/vehicles/${editingId}`, formData);
        alert("Vehicle updated successfully");
      } else {
        await API.post("/vehicles", formData);
        alert("Vehicle added successfully");
      }
      setFormData({ plate_number: "", owner_name: "", vehicle_type: "Car", owner_phone: "" });
      setEditingId(null);
      loadVehicles();
    } catch (error) {
      alert(error.response?.data?.message || "Error saving vehicle");
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.vehicle_id);
    setFormData({ plate_number: vehicle.plate_number, owner_name: vehicle.owner_name, vehicle_type: vehicle.vehicle_type, owner_phone: vehicle.owner_phone });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try { await API.delete(`/vehicles/${id}`); loadVehicles(); }
    catch (error) { alert("Delete failed"); }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <h2>Vehicle Management</h2>

        {/* Driver Only - Add/Edit Form */}
        {isDriver && (
          <div style={{ background: "white", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "30px", borderLeft: "5px solid #198754" }}>
            <h5 style={{ marginBottom: "20px", color: "#198754", fontWeight: "700" }}>{editingId ? "✏️ Update Vehicle" : "➕ Add New Vehicle"}</h5>
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Plate Number</label>
                <input type="text" name="plate_number" placeholder="e.g. KDA123A" value={formData.plate_number} onChange={handleChange} required style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Owner Name</label>
                <input type="text" name="owner_name" placeholder="e.g. John Mwangi" value={formData.owner_name} onChange={handleChange} required style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Vehicle Type</label>
                <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%", background: "white", color: "#333" }}>
                  <option value="Car">Car</option>
                  <option value="Bus">Bus</option>
                  <option value="Truck">Truck</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Phone Number</label>
                <input type="text" name="owner_phone" placeholder="e.g. 0712345678" value={formData.owner_phone} onChange={handleChange} required style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "transparent" }}>Action</label>
                <button type="submit" style={{ padding: "10px 20px", backgroundColor: editingId ? "#f0ad4e" : "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%" }}>{editingId ? "Update Vehicle" : "Add Vehicle"}</button>
              </div>
              {editingId && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "transparent" }}>Cancel</label>
                  <button type="button" onClick={() => { setEditingId(null); setFormData({ plate_number: "", owner_name: "", vehicle_type: "Car", owner_phone: "" }); }} style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%" }}>Cancel</button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Admin View Notice */}
        {!isDriver && (
          <div style={{ background: "#dbeafe", borderRadius: "8px", padding: "12px 20px", marginBottom: "24px", color: "#1e40af", fontSize: "14px", fontWeight: "600" }}>
            ℹ️ You are viewing vehicles in read-only mode. Drivers manage their own vehicles.
          </div>
        )}

        {/* Table */}
        <div style={{ background: "white", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h5 style={{ marginBottom: "20px", color: "#333", fontWeight: "700" }}>🚗 Registered Vehicles ({vehicles.length})</h5>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Plate Number</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Owner</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Phone</th>
                  {isDriver && <th style={{ padding: "12px 16px", textAlign: "left" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.length > 0 ? vehicles.map((vehicle, index) => (
                  <tr key={vehicle.vehicle_id} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#198754" }}>{vehicle.plate_number}</td>
                    <td style={{ padding: "12px 16px" }}>{vehicle.owner_name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: vehicle.vehicle_type === "Car" ? "#d1fae5" : vehicle.vehicle_type === "Bus" ? "#dbeafe" : vehicle.vehicle_type === "Truck" ? "#fef3c7" : "#f3e8ff", color: vehicle.vehicle_type === "Car" ? "#065f46" : vehicle.vehicle_type === "Bus" ? "#1e40af" : vehicle.vehicle_type === "Truck" ? "#92400e" : "#6b21a8" }}>{vehicle.vehicle_type}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{vehicle.owner_phone}</td>
                    {isDriver && (
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => handleEdit(vehicle)} style={{ padding: "6px 14px", backgroundColor: "#0d6efd", color: "white", border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginRight: "8px" }}>Edit</button>
                        <button onClick={() => handleDelete(vehicle.vehicle_id)} style={{ padding: "6px 14px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Delete</button>
                      </td>
                    )}
                  </tr>
                )) : <tr><td colSpan={isDriver ? "6" : "5"} style={{ padding: "30px", textAlign: "center", color: "#888" }}>No vehicles found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Vehicles;