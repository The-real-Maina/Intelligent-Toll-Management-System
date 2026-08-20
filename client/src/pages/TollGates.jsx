import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";

import {
  getTollGates,
  createTollGate,
  updateTollGate,
  deleteTollGate,
} from "../services/api";

function TollGates() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [tollGates, setTollGates] = useState([]);

  const [formData, setFormData] = useState({
    gate_name: "",
    location: "",
    road_name: "",
    status: "Active",
  });

  const [editId, setEditId] = useState(null);

  const loadTollGates = async () => {
    try {
      const res = await getTollGates();
      setTollGates(res.data);
    } catch (error) {
      console.error("Error loading toll gates:", error);
    }
  };

  useEffect(() => {
    loadTollGates();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateTollGate(editId, formData);
        alert("Toll gate updated successfully");
      } else {
        await createTollGate(formData);
        alert("Toll gate added successfully");
      }

      setFormData({ gate_name: "", location: "", road_name: "", status: "Active" });
      setEditId(null);
      loadTollGates();
    } catch (error) {
      console.error("Error saving toll gate:", error);
      alert("Failed to save toll gate");
    }
  };

  const handleEdit = (gate) => {
    setEditId(gate.gate_id);
    setFormData({
      gate_name: gate.gate_name,
      location: gate.location,
      road_name: gate.road_name,
      status: gate.status,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this toll gate?")) {
      try {
        await deleteTollGate(id);
        loadTollGates();
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">

        <h2>Toll Gates Management</h2>

        {/* Form Card — Admins only */}
        {isAdmin && (
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "30px",
          borderLeft: "5px solid #198754"
        }}>
          <h5 style={{ marginBottom: "20px", color: "#198754", fontWeight: "700" }}>
            {editId ? "✏️ Update Toll Gate" : "➕ Add New Toll Gate"}
          </h5>

          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "end" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Gate Name</label>
              <input
                type="text"
                name="gate_name"
                placeholder="e.g. Mlolongo Gate"
                value={formData.gate_name}
                onChange={handleChange}
                required
                style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Mlolongo"
                value={formData.location}
                onChange={handleChange}
                required
                style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Road Name</label>
              <input
                type="text"
                name="road_name"
                placeholder="e.g. Nairobi Expressway"
                value={formData.road_name}
                onChange={handleChange}
                required
                style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none", width: "100%", background: "white", color: "#333" }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "transparent" }}>Action</label>
              <button
                type="submit"
                style={{ padding: "10px 20px", backgroundColor: editId ? "#f0ad4e" : "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%" }}
              >
                {editId ? "Update Toll Gate" : "Add Toll Gate"}
              </button>
            </div>

            {editId && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "transparent" }}>Cancel</label>
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setFormData({ gate_name: "", location: "", road_name: "", status: "Active" });
                  }}
                  style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%" }}
                >
                  Cancel
                </button>
              </div>
            )}

          </form>
        </div>
        )}

        {/* Table Card */}
        <div style={{ background: "white", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h5 style={{ marginBottom: "20px", color: "#333", fontWeight: "700" }}>
            🛣️ Toll Gates List ({tollGates.length})
          </h5>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Gate Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Location</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Road</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                  {isAdmin && (
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {tollGates.length > 0 ? (
                  tollGates.map((gate, index) => (
                    <tr key={gate.gate_id} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 16px" }}>{gate.gate_id}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#198754" }}>{gate.gate_name}</td>
                      <td style={{ padding: "12px 16px" }}>{gate.location}</td>
                      <td style={{ padding: "12px 16px" }}>{gate.road_name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: gate.status === "Active" ? "#d1fae5" : "#fee2e2",
                          color: gate.status === "Active" ? "#065f46" : "#991b1b"
                        }}>
                          {gate.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => handleEdit(gate)}
                            style={{ padding: "6px 14px", backgroundColor: "#0d6efd", color: "white", border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginRight: "8px" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(gate.gate_id)}
                            style={{ padding: "6px 14px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                      No toll gates found. Add one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TollGates;