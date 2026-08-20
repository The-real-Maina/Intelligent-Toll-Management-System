import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load users");
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">

        <h2>Users Management</h2>

        {/* Admin Read-only Notice */}
        <div style={{ background: "#dbeafe", borderRadius: "8px", padding: "12px 20px", marginBottom: "24px", color: "#1e40af", fontSize: "14px", fontWeight: "600" }}>
          ℹ️ You are viewing system users in read-only mode.
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>

          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #198754" }}>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Total Users</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#198754", margin: "8px 0 0" }}>{users.length}</h3>
          </div>

          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #0d6efd" }}>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Admins</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#0d6efd", margin: "8px 0 0" }}>{users.filter(u => u.role === "Admin").length}</h3>
          </div>

          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #6f42c1" }}>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Drivers</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#6f42c1", margin: "8px 0 0" }}>{users.filter(u => u.role === "Driver").length}</h3>
          </div>

        </div>

        {/* Users Table */}
        <div style={{ background: "white", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h5 style={{ marginBottom: "20px", color: "#333", fontWeight: "700" }}>
            👥 System Users ({users.length})
          </h5>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>#</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Full Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Phone</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Role</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Created</th>
                </tr>
              </thead>

              <tbody>
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <tr
                      key={user.user_id}
                      style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee" }}
                    >
                      <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#198754" }}>{user.full_name}</td>
                      <td style={{ padding: "12px 16px" }}>{user.email}</td>
                      <td style={{ padding: "12px 16px" }}>{user.phone || "N/A"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: user.role === "Admin" ? "#dbeafe" : "#f3e8ff",
                          color: user.role === "Admin" ? "#1e40af" : "#6b21a8"
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#888" }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                      No users found.
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

export default Users;