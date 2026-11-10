import { useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function AttendantProfile() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("itms_token");
      await API.put(
        `/users/${user.user_id}/password`,
        { currentPassword: passwords.current, newPassword: passwords.new },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswords({ current: "", new: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "40px" }}>
        <h2 style={{ color: "#198754", marginBottom: "30px" }}>👤 My Profile</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          
          {/* Profile Card */}
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>Account Details</h3>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>Full Name</label>
              <p style={{ margin: "5px 0", fontSize: "18px", fontWeight: "600" }}>{user?.full_name}</p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>Email Address</label>
              <p style={{ margin: "5px 0", fontSize: "16px" }}>{user?.email}</p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>Role</label>
              <p style={{ margin: "5px 0", fontSize: "16px" }}>
                <span style={{ background: "#f3e8ff", color: "#6b21a8", padding: "4px 10px", borderRadius: "10px", fontWeight: "bold" }}>
                  {user?.role}
                </span>
              </p>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#888" }}>Assigned Gate</label>
              <p style={{ margin: "5px 0", fontSize: "16px" }}>Mlolongo Gate (A109)</p>
            </div>
          </div>

          {/* Password Change Card */}
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>Security Settings</h3>
            {message.text && (
              <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`} style={{ padding: "10px", fontSize: "14px" }}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px", display: "block" }}>Current Password</label>
                <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} required />
              </div>
              <div>
                <label style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px", display: "block" }}>New Password</label>
                <input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} required />
              </div>
              <button type="submit" className="btn btn-success" disabled={loading} style={{ padding: "10px", fontWeight: "bold", marginTop: "10px" }}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}