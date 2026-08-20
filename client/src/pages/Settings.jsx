import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import API from "../services/api";

function Settings() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");

  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [systemSettings, setSystemSettings] = useState({
    system_name: "",
    support_email: "",
    currency: "",
    toll_rate_car: "",
    toll_rate_bus: "",
    toll_rate_truck: "",
    toll_rate_motorcycle: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await API.get("/settings");
      setSystemSettings(prev => ({
        ...prev,
        system_name: res.data.system_name || "",
        support_email: res.data.support_email || "",
        currency: res.data.currency || "KES",
        toll_rate_car: res.data.toll_rate_car || "",
        toll_rate_bus: res.data.toll_rate_bus || "",
        toll_rate_truck: res.data.toll_rate_truck || "",
        toll_rate_motorcycle: res.data.toll_rate_motorcycle || "",
      }));
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await API.get(`/users/${user?.user_id}`);
      setProfile({
        full_name: res.data.full_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put("/settings/update-profile", {
        user_id: user?.user_id,
        ...profile,
      });

      // Update localStorage
      const updatedUser = { ...user, full_name: profile.full_name, email: profile.email };
      localStorage.setItem("itms_user", JSON.stringify(updatedUser));

      showMessage("✅ Profile updated successfully!", "success");
    } catch (error) {
      showMessage(error.response?.data?.message || "❌ Error updating profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      showMessage("❌ New passwords do not match!", "error");
      return;
    }
    if (passwords.new_password.length < 6) {
      showMessage("❌ Password must be at least 6 characters!", "error");
      return;
    }
    setLoading(true);
    try {
      await API.put("/settings/change-password", {
        user_id: user?.user_id,
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      showMessage("✅ Password changed successfully!", "success");
    } catch (error) {
      showMessage(error.response?.data?.message || "❌ Error changing password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put("/settings", systemSettings);
      showMessage("✅ System settings updated successfully!", "success");
    } catch (error) {
      showMessage("❌ Error updating system settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (tab) => ({
    padding: "10px 20px",
    border: "none",
    borderBottom: activeTab === tab ? "3px solid #198754" : "3px solid transparent",
    backgroundColor: "transparent",
    color: activeTab === tab ? "#198754" : "#666",
    fontWeight: activeTab === tab ? "700" : "500",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  const inputStyle = {
    padding: "10px 14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#555",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">

        <h2>Settings</h2>

        {/* Message */}
        {message.text && (
          <div style={{
            padding: "12px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontWeight: "600",
            fontSize: "14px",
            backgroundColor: message.type === "success" ? "#d1fae5" : "#fee2e2",
            color: message.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${message.type === "success" ? "#6ee7b7" : "#fca5a5"}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>

          <div style={{ display: "flex", borderBottom: "1px solid #eee", padding: "0 20px" }}>
            <button style={tabStyle("profile")} onClick={() => setActiveTab("profile")}>👤 Profile</button>
            <button style={tabStyle("password")} onClick={() => setActiveTab("password")}>🔑 Password</button>
            {user?.role === "Admin" && (
              <>
                <button style={tabStyle("system")} onClick={() => setActiveTab("system")}>⚙️ System</button>
                <button style={tabStyle("toll_rates")} onClick={() => setActiveTab("toll_rates")}>💰 Toll Rates</button>
              </>
            )}
          </div>

          <div style={{ padding: "30px" }}>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate}>
                <h5 style={{ marginBottom: "24px", color: "#198754", fontWeight: "700" }}>👤 Update Profile</h5>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. 0712345678"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Role</label>
                    <input
                      type="text"
                      value={user?.role || ""}
                      style={{ ...inputStyle, backgroundColor: "#f4f6f9", color: "#888" }}
                      disabled
                    />
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: "12px 30px", backgroundColor: "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordChange}>
                <h5 style={{ marginBottom: "24px", color: "#198754", fontWeight: "700" }}>🔑 Change Password</h5>

                <div style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "20px" }}>

                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <input
                      type="password"
                      value={passwords.current_password}
                      onChange={e => setPasswords({ ...passwords, current_password: e.target.value })}
                      style={inputStyle}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input
                      type="password"
                      value={passwords.new_password}
                      onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                      style={inputStyle}
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwords.confirm_password}
                      onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                      style={inputStyle}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: "12px 30px", backgroundColor: "#0d6efd", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                  >
                    {loading ? "Changing..." : "Change Password"}
                  </button>

                </div>
              </form>
            )}

            {/* System Settings Tab */}
            {activeTab === "system" && user?.role === "Admin" && (
              <form onSubmit={handleSystemSettingsUpdate}>
                <h5 style={{ marginBottom: "24px", color: "#198754", fontWeight: "700" }}>⚙️ System Settings</h5>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

                  <div>
                    <label style={labelStyle}>System Name</label>
                    <input
                      type="text"
                      value={systemSettings.system_name}
                      onChange={e => setSystemSettings({ ...systemSettings, system_name: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. Intelligent Toll Management System"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Support Email</label>
                    <input
                      type="email"
                      value={systemSettings.support_email}
                      onChange={e => setSystemSettings({ ...systemSettings, support_email: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. admin@toll.com"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Currency</label>
                    <select
                      value={systemSettings.currency}
                      onChange={e => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                      style={{ ...inputStyle, background: "white" }}
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="UGX">UGX - Ugandan Shilling</option>
                      <option value="TZS">TZS - Tanzanian Shilling</option>
                    </select>
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: "12px 30px", backgroundColor: "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "Save System Settings"}
                </button>
              </form>
            )}

            {/* Toll Rates Tab */}
            {activeTab === "toll_rates" && user?.role === "Admin" && (
              <form onSubmit={handleSystemSettingsUpdate}>
                <h5 style={{ marginBottom: "24px", color: "#198754", fontWeight: "700" }}>💰 Toll Rate Settings</h5>
                <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>Set the toll fee per vehicle type in {systemSettings.currency || "KES"}</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

                  <div>
                    <label style={labelStyle}>🚗 Car Rate ({systemSettings.currency || "KES"})</label>
                    <input
                      type="number"
                      value={systemSettings.toll_rate_car}
                      onChange={e => setSystemSettings({ ...systemSettings, toll_rate_car: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. 100"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>🚌 Bus Rate ({systemSettings.currency || "KES"})</label>
                    <input
                      type="number"
                      value={systemSettings.toll_rate_bus}
                      onChange={e => setSystemSettings({ ...systemSettings, toll_rate_bus: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. 200"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>🚛 Truck Rate ({systemSettings.currency || "KES"})</label>
                    <input
                      type="number"
                      value={systemSettings.toll_rate_truck}
                      onChange={e => setSystemSettings({ ...systemSettings, toll_rate_truck: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. 300"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>🏍️ Motorcycle Rate ({systemSettings.currency || "KES"})</label>
                    <input
                      type="number"
                      value={systemSettings.toll_rate_motorcycle}
                      onChange={e => setSystemSettings({ ...systemSettings, toll_rate_motorcycle: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g. 50"
                      step="0.01"
                    />
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: "12px 30px", backgroundColor: "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  {loading ? "Saving..." : "Save Toll Rates"}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default Settings;