import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // States for the new user form
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "Toll Attendant", // Default to Toll Attendant for this demo
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch users on mount and whenever refreshKey changes
  useEffect(() => {
    let ignore = false;

    const fetchUsers = async () => {
      try {
        const res = await API.get("/users");
        if (!ignore) setUsers(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Admin bypasses OTP because we will set is_verified to 1 directly in backend for admin-created users
      await API.post("/auth/register", formData);

      setMessage({ type: "success", text: "User created successfully!" });
      setFormData({ full_name: "", email: "", phone: "", password: "", role: "Toll Attendant" });
      setRefreshKey((k) => k + 1); // Refresh the table
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to create user." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">

        <h2>Users Management</h2>

        {/* Create User Form */}
        <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginBottom: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h5 style={{ marginBottom: "20px", color: "#198754", fontWeight: "700" }}>➕ Create New User</h5>

          {message.text && (
            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`} style={{ marginBottom: "15px" }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "end", background: "transparent", padding: 0, boxShadow: "none" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Full Name</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="form-control" required />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" required />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" required />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold" }}>Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="form-select">
                <option value="Driver">Driver</option>
                <option value="Admin">Admin</option>
                <option value="Toll Attendant">Toll Attendant</option>
              </select>
            </div>
            <button type="submit" className="btn btn-success" disabled={loading} style={{ height: "38px" }}>
              {loading ? "Saving..." : "Add User"}
            </button>
          </form>
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
          <div style={{ background: "white", borderRadius: "10px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #f0ad4e" }}>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Toll Attendants</p>
            <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#f0ad4e", margin: "8px 0 0" }}>{users.filter(u => u.role === "Toll Attendant").length}</h3>
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
                    <tr key={user.user_id} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee" }}>
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
                          backgroundColor: user.role === "Admin" ? "#dbeafe" : user.role === "Toll Attendant" ? "#fef3c7" : "#f3e8ff",
                          color: user.role === "Admin" ? "#1e40af" : user.role === "Toll Attendant" ? "#92400e" : "#6b21a8"
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