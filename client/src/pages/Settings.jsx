import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import "../App.css";

// --- REUSABLE UI COMPONENTS (Moved outside to prevent re-rendering) ---
const Toggle = ({ label, description, prefKey, preferences, togglePref }) => (
  <div style={styles.row}>
    <div style={{ flex: 1, paddingRight: "20px" }}>
      <div style={styles.rowTitle}>{label}</div>
      {description && <div style={styles.rowDesc}>{description}</div>}
    </div>
    <div 
      style={{ ...styles.toggle, backgroundColor: preferences[prefKey] ? "#10b981" : "#4b5563" }} 
      onClick={() => togglePref(prefKey)}
    >
      <div style={{ ...styles.toggleKnob, transform: preferences[prefKey] ? "translateX(20px)" : "translateX(0)" }} />
    </div>
  </div>
);

const InputRow = ({ label, description, prefKey, type = "text", placeholder = "", preferences, updatePrefValue }) => (
  <div style={styles.row}>
    <div style={{ flex: 1, paddingRight: "20px" }}>
      <div style={styles.rowTitle}>{label}</div>
      {description && <div style={styles.rowDesc}>{description}</div>}
    </div>
    <input 
      type={type} 
      style={styles.input} 
      value={preferences[prefKey] || ""} 
      onChange={(e) => updatePrefValue(prefKey, e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

function Settings() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const role = user?.role || "Driver";

  // UI State
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Data State
  const [profile, setProfile] = useState({ 
    full_name: user?.full_name || "", 
    email: user?.email || "", 
    phone: "" 
  });
  
  const [passwords, setPasswords] = useState({ 
    current_password: "", 
    new_password: "", 
    confirm_password: "" 
  });
  
  const [preferences, setPreferences] = useState({}); 

  // Fetch initial data safely within useEffect
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [profileRes, prefsRes] = await Promise.all([
          API.get(`/users/${user?.user_id}`),
          API.get("/settings/user-preferences")
        ]);

        if (isMounted) {
          setProfile({
            full_name: profileRes.data.full_name || "",
            email: profileRes.data.email || "",
            phone: profileRes.data.phone || ""
          });
          setPreferences(prefsRes.data.preferences || {});
        }
      } catch (error) {
        console.error("Error loading settings data:", error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user?.user_id]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put("/settings/update-profile", { user_id: user?.user_id, ...profile });
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
      return showMessage("❌ New passwords do not match!", "error");
    }
    if (passwords.new_password.length < 6) {
      return showMessage("❌ Password must be at least 6 characters!", "error");
    }
    setLoading(true);
    try {
      await API.put("/settings/change-password", { 
        user_id: user?.user_id, 
        current_password: passwords.current_password, 
        new_password: passwords.new_password 
      });
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      showMessage("✅ Password changed successfully!", "success");
    } catch (error) {
      showMessage(error.response?.data?.message || "❌ Error changing password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    try {
      await API.put("/settings/user-preferences", { preferences });
      showMessage("✅ Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("❌ Error saving settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const togglePref = (key) => setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  const updatePrefValue = (key, value) => setPreferences(prev => ({ ...prev, [key]: value }));

  // --- ROLE-BASED NAVIGATION CONFIG ---
  const getNavStructure = () => {
    switch(role) {
      case "Admin":
        return [
          { group: "Your Account", items: [{ id: "profile", label: "Edit profile" }, { id: "password", label: "Password and security" }] },
          { group: "Operations", items: [{ id: "toll_rates", label: "Toll rates" }, { id: "toll_gates", label: "Toll gates and categories" }] },
          { group: "Payments", items: [{ id: "mpesa", label: "M-Pesa and limits" }] },
          { group: "System", items: [{ id: "notifications", label: "Notifications" }, { id: "audit", label: "Audit and activity" }, { id: "health", label: "System health" }] },
        ];
      case "Toll Attendant":
        return [
          { group: "Your account", items: [{ id: "profile", label: "Edit profile" }, { id: "password", label: "Password and security" }] },
          { group: "My Work", items: [{ id: "shift", label: "My shift" }, { id: "gate", label: "Assigned gate" }, { id: "rates", label: "Toll rates (view only)" }] },
          { group: "Alerts", items: [{ id: "notifications", label: "Notifications" }] },
        ];
      case "Company Admin":
        return [
          { group: "Your account", items: [{ id: "profile", label: "Edit profile" }, { id: "password", label: "Password and security" }] },
          { group: "My company", items: [{ id: "company", label: "Company details" }, { id: "fleet", label: "Fleet rules" }, { id: "wallet_alerts", label: "Wallet alerts" }] },
          { group: "Team", items: [{ id: "permissions", label: "Driver permissions" }, { id: "notifications", label: "Notifications" }] },
        ];
      case "Driver":
      default:
        return [
          { group: "Your account", items: [{ id: "profile", label: "Edit profile" }, { id: "password", label: "Password and security" }] },
          { group: "How you use ITMS", items: [{ id: "notifications", label: "Notifications" }, { id: "wallet", label: "Wallet and payments" }, { id: "vehicles", label: "My vehicles" }] },
          { group: "Support", items: [{ id: "disputes", label: "My disputes" }, { id: "help", label: "Help and AI assistant" }] },
        ];
    }
  };

  return (
    <div className="dashboard" style={{ backgroundColor: "#111827", minHeight: "100vh", display: "flex" }}>
      <Sidebar />
      
      <div className="content" style={{ padding: "40px", flex: 1, overflowY: "auto", height: "100vh" }}>
        
        <h2 style={{ color: "#f3f4f6", marginBottom: "30px", fontSize: "24px", fontWeight: "600" }}>
          {role} Settings
        </h2>

        {message.text && (
          <div style={{ 
            padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", 
            backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
            color: message.type === "success" ? "#10b981" : "#ef4444",
            border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
          
          {/* INNER SIDEBAR */}
          <div style={{ width: "260px", backgroundColor: "#1f2937", borderRadius: "12px", padding: "20px", border: "1px solid #374151", flexShrink: 0 }}>
            {getNavStructure().map((section, idx) => (
              <div key={idx} style={{ marginBottom: "24px" }}>
                <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600", textTransform: "capitalize", marginBottom: "8px", paddingLeft: "10px" }}>
                  {section.group}
                </div>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "6px", border: "none",
                      backgroundColor: activeTab === item.id ? "rgba(16, 185, 129, 0.15)" : "transparent",
                      color: activeTab === item.id ? "#10b981" : "#d1d5db",
                      fontWeight: activeTab === item.id ? "600" : "400",
                      cursor: "pointer", marginBottom: "2px", fontSize: "14px",
                      transition: "all 0.2s"
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* MAIN CONTENT AREA */}
          <div style={{ flex: 1, backgroundColor: "#1f2937", borderRadius: "12px", padding: "30px", border: "1px solid #374151", color: "#e5e7eb", minHeight: "500px" }}>
            
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div>
                <div style={styles.cardHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "20px" }}>
                      {profile.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "600", color: "white" }}>{profile.full_name}</div>
                      <div style={{ fontSize: "13px", color: "#9ca3af" }}>{role} {user?.company_id ? `• Company ID: ${user.company_id}` : ""}</div>
                    </div>
                  </div>
                  <button style={styles.btnOutline}>Change photo</button>
                </div>

                <div style={{ marginTop: "30px" }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone number</label>
                    <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} style={styles.inputDark} />
                  </div>
                  <button onClick={handleProfileUpdate} disabled={loading} style={styles.btnPrimary}>
                    {loading ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {activeTab === "password" && (
              <div>
                <h3 style={styles.tabTitle}>Password and Security</h3>
                <div style={{ maxWidth: "400px" }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Current Password</label>
                    <input type="password" value={passwords.current_password} onChange={e => setPasswords({...passwords, current_password: e.target.value})} style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input type="password" value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm New Password</label>
                    <input type="password" value={passwords.confirm_password} onChange={e => setPasswords({...passwords, confirm_password: e.target.value})} style={styles.inputDark} />
                  </div>
                  <button onClick={handlePasswordChange} disabled={loading} style={styles.btnPrimary}>
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== ADMIN TABS ==================== */}
            {activeTab === "mpesa" && role === "Admin" && (
              <div>
                <div style={styles.integrationBox}>
                  <div style={{ width: "40px", height: "40px", background: "rgba(16, 185, 129, 0.2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontWeight: "bold" }}>M</div>
                  <div>
                    <div style={{ fontWeight: "600", color: "white", fontSize: "15px" }}>M-Pesa integration</div>
                    <div style={{ fontSize: "13px", color: "#9ca3af" }}>Connected, sandbox mode</div>
                  </div>
                </div>
                <InputRow label="Minimum top-up (KES)" prefKey="min_topup" type="number" placeholder="1" preferences={preferences} updatePrefValue={updatePrefValue} />
                <InputRow label="Maximum top-up (KES)" prefKey="max_topup" type="number" placeholder="150,000" preferences={preferences} updatePrefValue={updatePrefValue} />
                <Toggle label="Accept wallet payments" description="Drivers can pay tolls from their wallet" prefKey="accept_wallet" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Accept cash at gates" description="Attendants can record cash payments" prefKey="accept_cash" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "toll_rates" && role === "Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Toll rates</h3>
                <p style={{ color: "#9ca3af", marginBottom: "20px", fontSize: "14px" }}>Set the default toll fee per vehicle type.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🚗 Car Rate (KES)</label>
                    <input type="number" value={preferences.rate_car || ""} onChange={(e) => updatePrefValue("rate_car", e.target.value)} style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🚌 Bus Rate (KES)</label>
                    <input type="number" value={preferences.rate_bus || ""} onChange={(e) => updatePrefValue("rate_bus", e.target.value)} style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🚛 Truck Rate (KES)</label>
                    <input type="number" value={preferences.rate_truck || ""} onChange={(e) => updatePrefValue("rate_truck", e.target.value)} style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🏍️ Motorcycle Rate (KES)</label>
                    <input type="number" value={preferences.rate_motorcycle || ""} onChange={(e) => updatePrefValue("rate_motorcycle", e.target.value)} style={styles.inputDark} />
                  </div>
                </div>
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save Toll Rates</button>
              </div>
            )}

            {activeTab === "toll_gates" && role === "Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Toll gates and categories</h3>
                <Toggle label="Auto-assign gates" description="Automatically assign available gates to open lanes" prefKey="auto_assign_gates" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Allow category override" description="Attendants can change vehicle category if misidentified" prefKey="allow_category_override" preferences={preferences} togglePref={togglePref} />
                <InputRow label="Max active gates" prefKey="max_active_gates" type="number" placeholder="10" preferences={preferences} updatePrefValue={updatePrefValue} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "notifications" && role === "Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Admin Notifications</h3>
                <Toggle label="New company registration" description="Alert when a new company applies" prefKey="admin_notify_company" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Dispute escalated" description="Alert when a dispute requires admin intervention" prefKey="admin_notify_dispute" preferences={preferences} togglePref={togglePref} />
                <Toggle label="System errors" description="Alert for failed transactions or API issues" prefKey="admin_notify_errors" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "audit" && role === "Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Audit and activity</h3>
                <Toggle label="Log sensitive actions" description="Record every manual override and settings change" prefKey="audit_sensitive" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Log login attempts" description="Record failed and successful login attempts" prefKey="audit_logins" preferences={preferences} togglePref={togglePref} />
                <InputRow label="Log retention period (Days)" prefKey="audit_retention" type="number" placeholder="90" preferences={preferences} updatePrefValue={updatePrefValue} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "health" && role === "Admin" && (
              <div>
                <h3 style={styles.tabTitle}>System health</h3>
                <Toggle label="Daily health report" description="Email a summary of system uptime and errors" prefKey="health_daily_report" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Maintenance mode" description="Temporarily disable new payments (Use with caution)" prefKey="health_maintenance_mode" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {/* ==================== COMPANY ADMIN TABS ==================== */}
            {activeTab === "company" && role === "Company Admin" && (
              <div>
                <div style={styles.cardHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ width: "40px", height: "40px", background: "rgba(16, 185, 129, 0.2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontWeight: "bold" }}>C</div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: "600", color: "white" }}>Company details</div>
                      <div style={{ fontSize: "13px", color: "#9ca3af" }}>Company wallet: KES 29,200.00</div>
                    </div>
                  </div>
                  <button style={styles.btnOutline}>Change logo</button>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Company name</label>
                  <input type="text" defaultValue="Kamau Logistics Ltd" style={styles.inputDark} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Billing email</label>
                  <input type="email" defaultValue="billing@kamau.co.ke" style={styles.inputDark} />
                </div>
                <InputRow label="Daily spend limit per vehicle (KES)" prefKey="daily_limit" type="number" placeholder="3,000" preferences={preferences} updatePrefValue={updatePrefValue} />
                <Toggle label="Require approval for new vehicles" description="Company admin must approve each one" prefKey="require_approval" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Notify me on company wallet payments" description="Each time a driver pays from it" prefKey="notify_company_wallet" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "fleet" && role === "Company Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Fleet rules</h3>
                <Toggle label="Allow drivers to add vehicles" description="If off, drivers must request vehicles from admins" prefKey="fleet_allow_add" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Block blacklisted vehicles" description="Automatically deny entry to blacklisted fleet vehicles" prefKey="fleet_block_blacklist" preferences={preferences} togglePref={togglePref} />
                <InputRow label="Max vehicles allowed" prefKey="fleet_max_vehicles" type="number" placeholder="50" preferences={preferences} updatePrefValue={updatePrefValue} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "wallet_alerts" && role === "Company Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Wallet alerts</h3>
                <Toggle label="Low company balance alert" description="Email me when company wallet drops below threshold" prefKey="wallet_low_alert" preferences={preferences} togglePref={togglePref} />
                <InputRow label="Alert threshold (KES)" prefKey="company_alert_threshold" type="number" placeholder="5,000" preferences={preferences} updatePrefValue={updatePrefValue} />
                <Toggle label="Driver low balance alert" description="Notify me when a driver's wallet is empty" prefKey="wallet_driver_low" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "permissions" && role === "Company Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Driver permissions</h3>
                <Toggle label="Allow drivers to top up wallet" description="Drivers can add funds to their assigned fleet wallet" prefKey="perm_driver_topup" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Allow drivers to view company wallet" description="Shows total company balance to drivers" prefKey="perm_driver_view_wallet" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Allow drivers to resolve disputes" description="If disabled, disputes go straight to Company Admin" prefKey="perm_driver_disputes" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "notifications" && role === "Company Admin" && (
              <div>
                <h3 style={styles.tabTitle}>Company Notifications</h3>
                <Toggle label="New driver registration" description="Notify when a new driver joins the company" prefKey="comp_notify_new_driver" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Driver dispute filed" description="Alert when a fleet driver files a dispute" prefKey="comp_notify_dispute" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Weekly fleet report" description="Receive a summary of all fleet activity every Monday" prefKey="comp_notify_weekly" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {/* ==================== TOLL ATTENDANT TABS ==================== */}
            {activeTab === "shift" && role === "Toll Attendant" && (
              <div>
                <h3 style={styles.tabTitle}>My shift</h3>
                <Toggle label="Auto-clock in" description="Automatically start my shift when I open the app" prefKey="att_auto_clock_in" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Show shift summary at end" description="Display total cars and cash collected when clocking out" prefKey="att_shift_summary" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "gate" && role === "Toll Attendant" && (
              <div>
                <h3 style={styles.tabTitle}>Assigned gate</h3>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preferred Gate</label>
                  <select style={styles.inputDark} value={preferences.att_preferred_gate || ""} onChange={(e) => updatePrefValue("att_preferred_gate", e.target.value)}>
                    <option value="">Auto-assign by system</option>
                    <option value="Gate A">Nairobi Expressway Gate A</option>
                    <option value="Gate B">Nairobi Expressway Gate B</option>
                    <option value="Thika">Thika Superhighway Gate</option>
                  </select>
                </div>
                <Toggle label="Strict gate lock" description="Do not allow me to verify payments for other gates" prefKey="att_strict_gate" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "rates" && role === "Toll Attendant" && (
              <div>
                <h3 style={styles.tabTitle}>Toll rates (view only)</h3>
                <p style={{ color: "#9ca3af", marginBottom: "20px", fontSize: "14px" }}>These rates are set by the system administrator and cannot be changed here.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", opacity: 0.7 }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🚗 Car Rate (KES)</label>
                    <input type="text" value="100.00" disabled style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🚌 Bus Rate (KES)</label>
                    <input type="text" value="200.00" disabled style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🚛 Truck Rate (KES)</label>
                    <input type="text" value="400.00" disabled style={styles.inputDark} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>🏍️ Motorcycle Rate (KES)</label>
                    <input type="text" value="50.00" disabled style={styles.inputDark} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && role === "Toll Attendant" && (
              <div>
                <h3 style={styles.tabTitle}>Attendant Notifications</h3>
                <Toggle label="Sound on verified M-Pesa payment" description="Plays a chime at the gate" prefKey="sound_alerts" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Remind me before shift starts" description="Notification 15 minutes before" prefKey="shift_reminder" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Alert on blacklisted vehicle" description="Flashing warning when a blacklisted plate is entered" prefKey="att_blacklist_alert" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {/* ==================== DRIVER TABS ==================== */}
            {activeTab === "notifications" && role === "Driver" && (
              <div>
                <h3 style={styles.tabTitle}>Driver Notifications</h3>
                <Toggle label="Payment received" description="Notify me after every toll payment" prefKey="notify_payment" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Low wallet balance" description="Alert me below the amount set here" prefKey="low_balance_alert" preferences={preferences} togglePref={togglePref} />
                <InputRow label="Alert threshold (KES)" prefKey="alert_threshold" type="number" placeholder="500" preferences={preferences} updatePrefValue={updatePrefValue} />
                <Toggle label="Dispute updates" description="Tell me when a dispute is resolved" prefKey="dispute_updates" preferences={preferences} togglePref={togglePref} />
                <InputRow label="Default M-Pesa number" description="Pre-fills the top-up form" prefKey="default_mpesa" placeholder="07XX XXX XXX" preferences={preferences} updatePrefValue={updatePrefValue} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "wallet" && role === "Driver" && (
              <div>
                <h3 style={styles.tabTitle}>Wallet and payments</h3>
                <InputRow label="Default M-Pesa number" description="Pre-fills the top-up form" prefKey="wallet_mpesa" placeholder="07XX XXX XXX" preferences={preferences} updatePrefValue={updatePrefValue} />
                <Toggle label="Auto top-up reminder" description="Remind me to top up when my balance is low" prefKey="wallet_auto_topup" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Save payment methods" description="Securely save M-Pesa details for faster checkout" prefKey="wallet_save_methods" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "vehicles" && role === "Driver" && (
              <div>
                <h3 style={styles.tabTitle}>My vehicles</h3>
                <Toggle label="Show vehicle plate on receipts" prefKey="veh_show_plate" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Get notifications for vehicle tolls" description="Receive SMS/Email for tolls on all my vehicles" prefKey="veh_notifications" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Auto-select last used vehicle" description="Pre-selects the most recently used vehicle at the gate" prefKey="veh_auto_select" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "disputes" && role === "Driver" && (
              <div>
                <h3 style={styles.tabTitle}>My disputes</h3>
                <Toggle label="Email me a copy of my dispute" description="Get a PDF copy of the dispute when submitted" prefKey="disp_email_copy" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Notify me on WhatsApp" description="Receive dispute updates on WhatsApp" prefKey="disp_whatsapp" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

            {activeTab === "help" && role === "Driver" && (
              <div>
                <h3 style={styles.tabTitle}>Help and AI assistant</h3>
                <Toggle label="Enable AI chat popup" description="Show the floating chat widget on your dashboard" prefKey="ai_chat_enabled" preferences={preferences} togglePref={togglePref} />
                <Toggle label="Proactive help" description="Let the AI suggest solutions for common errors automatically" prefKey="ai_proactive" preferences={preferences} togglePref={togglePref} />
                <button onClick={handlePreferencesUpdate} disabled={loading} style={styles.btnPrimary}>Save changes</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// --- INLINE STYLES ---
const styles = {
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", backgroundColor: "#111827", borderRadius: "8px", marginBottom: "12px", border: "1px solid #374151" },
  rowTitle: { fontSize: "14px", fontWeight: "600", color: "#f3f4f6" },
  rowDesc: { fontSize: "13px", color: "#9ca3af", marginTop: "4px" },
  toggle: { width: "44px", height: "24px", borderRadius: "12px", padding: "2px", cursor: "pointer", transition: "background-color 0.2s", flexShrink: 0 },
  toggleKnob: { width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white", transition: "transform 0.2s" },
  input: { backgroundColor: "#111827", border: "1px solid #374151", color: "white", padding: "8px 12px", borderRadius: "6px", width: "150px", textAlign: "right", outline: "none", fontSize: "14px" },
  inputDark: { width: "100%", backgroundColor: "#111827", border: "1px solid #374151", color: "white", padding: "10px 14px", borderRadius: "6px", outline: "none", marginTop: "8px", fontSize: "14px" },
  formGroup: { marginBottom: "20px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#9ca3af" },
  btnPrimary: { backgroundColor: "#10b981", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", marginTop: "16px", fontSize: "14px" },
  btnOutline: { backgroundColor: "transparent", border: "1px solid #4b5563", color: "#e5e7eb", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "20px", borderBottom: "1px solid #374151", marginBottom: "24px" },
  tabTitle: { color: "white", fontSize: "18px", marginBottom: "20px", fontWeight: "600" },
  integrationBox: { display: "flex", alignItems: "center", gap: "15px", padding: "16px", backgroundColor: "#111827", borderRadius: "8px", border: "1px solid #374151", marginBottom: "24px" }
};

export default Settings;