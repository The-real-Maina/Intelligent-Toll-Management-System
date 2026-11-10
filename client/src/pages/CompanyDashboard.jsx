import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { FaWallet, FaTrash, FaUserPlus, FaCar, FaMoneyBillWave } from "react-icons/fa";

export default function CompanyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupPhone, setTopupPhone] = useState("");
  const [pendingTopup, setPendingTopup] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plate_number: "", vehicle_type: "Car", owner_phone: "" });
  const [newDriver, setNewDriver] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  }, []);

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
        if (!cancelled) {
          setLoadError(err.response?.data?.message || "Could not load company data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!pendingTopup) return;

    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try {
        const res = await API.get(`/companies/topup/${pendingTopup.id}`);

        if (res.data.status === "completed") {
          clearInterval(timer);
          showMessage("success", `✅ KES ${pendingTopup.amount} added to your company wallet!`);
          setPendingTopup(null);
          setTopupAmount("");
          refresh();
        } else if (res.data.status === "failed") {
          clearInterval(timer);
          showMessage("error", "❌ Top-up failed: " + (res.data.reason || "payment was cancelled or declined"));
          setPendingTopup(null);
        } else if (tries >= 20) {
          clearInterval(timer);
          showMessage("error", "⏱️ No confirmation received yet. If money left your phone, refresh in a minute.");
          setPendingTopup(null);
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [pendingTopup, refresh, showMessage]);

  const handleTopup = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/companies/topup", {
        amount: Number(topupAmount),
        phoneNumber: topupPhone,
      });
      setPendingTopup({ id: res.data.checkoutRequestId, amount: topupAmount });
      showMessage("success", "📲 " + res.data.message);
    } catch (err) {
      showMessage("error", "❌ " + (err.response?.data?.message || "Error starting top-up"));
    }
  };

  const handleSimulateTopup = async () => {
    const value = Number(topupAmount);
    if (!Number.isFinite(value) || value < 1) {
      showMessage("error", "❌ Please enter a valid amount first.");
      return;
    }

    setSimulating(true);
    try {
      // Fake a small delay so it feels real
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await API.post("/companies/simulate-topup", { amount: value });
      showMessage("success", "🧪 " + res.data.message);
      setTopupAmount("");
      refresh();
    } catch (err) {
      showMessage("error", "❌ " + (err.response?.data?.message || "Error simulating top-up"));
    } finally {
      setSimulating(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await API.post("/companies/vehicles", newVehicle);
      showMessage("success", `✅ Added ${newVehicle.plate_number} to fleet!`);
      setNewVehicle({ plate_number: "", vehicle_type: "Car", owner_phone: "" });
      refresh();
    } catch (err) {
      showMessage("error", "❌ " + (err.response?.data?.message || "Error adding vehicle"));
    }
  };

  const handleRemoveVehicle = async (vehicleId, plate) => {
    if (!window.confirm(`Remove ${plate} from your fleet?`)) return;
    try {
      await API.delete(`/vehicles/${vehicleId}`);
      showMessage("success", `✅ Removed ${plate} from fleet`);
      refresh();
    } catch (err) {
      showMessage("error", "❌ " + (err.response?.data?.message || "Error removing vehicle"));
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      await API.post("/users/company-drivers", newDriver);
      showMessage("success", `✅ Driver ${newDriver.full_name} created!`);
      setNewDriver({ full_name: "", email: "", phone: "", password: "" });
      refresh();
    } catch (err) {
      showMessage("error", "❌ " + (err.response?.data?.message || "Error adding driver"));
    }
  };

  if (loading) return <div className="dashboard"><Sidebar /><div className="content"><p>Loading...</p></div></div>;
  if (loadError) return <div className="dashboard"><Sidebar /><div className="content" style={{ padding: "30px" }}><div className="alert alert-danger">❌ {loadError}</div></div></div>;
  if (!data) return <div className="dashboard"><Sidebar /><div className="content"><p>No company linked.</p></div></div>;

  const { company, vehicles, payments } = data;
  const totalSpent = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>

        <div style={{ marginBottom: "25px", borderBottom: "2px solid #198754", paddingBottom: "15px" }}>
          <h2 style={{ margin: 0, color: "var(--text-heading)" }}>🏢 {company.name}</h2>
          <p style={{ margin: "5px 0 0", color: "var(--text-muted)", fontSize: "14px" }}>
            Registration: {company.registration_number} — Company Admin Dashboard
          </p>
        </div>

        {message.text && (
          <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`} style={{ marginBottom: "20px" }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" }}>
          <StatCard icon={<FaWallet />} label="Company Wallet" value={`KES ${parseFloat(company.wallet_balance).toLocaleString()}`} color="#198754" />
          <StatCard icon={<FaCar />} label="Fleet Vehicles" value={vehicles.length} color="#0d6efd" />
          <StatCard icon={<FaMoneyBillWave />} label="Total Spent" value={`KES ${totalSpent.toLocaleString()}`} color="#f0ad4e" />
          <StatCard icon={<FaUserPlus />} label="Total Payments" value={payments.length} color="#6f42c1" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>

          {/* Wallet Top-Up */}
          <div style={{ background: "linear-gradient(135deg, #198754, #0d6efd)", padding: "30px", borderRadius: "16px", color: "white" }}>
            <h4 style={{ margin: "0 0 15px" }}>💰 Top Up Company Wallet</h4>
            <p style={{ margin: "0 0 20px", fontSize: "14px", opacity: 0.9 }}>
              Add funds via M-Pesa. All fleet vehicles will use this wallet.
            </p>
            <form onSubmit={handleTopup} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input type="tel" placeholder="M-Pesa phone (e.g. 0712345678)" value={topupPhone} onChange={(e) => setTopupPhone(e.target.value)} disabled={!!pendingTopup || simulating} style={{ padding: "14px", borderRadius: "8px", border: "none", fontSize: "16px" }} required />
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="number" min="1" max="150000" placeholder="Amount (KES)" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} disabled={!!pendingTopup || simulating} style={{ flex: 1, padding: "14px", borderRadius: "8px", border: "none", fontSize: "16px" }} required />
                <button type="submit" disabled={!!pendingTopup || simulating} style={{ padding: "14px 25px", background: "#ffd700", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: pendingTopup || simulating ? "not-allowed" : "pointer", fontSize: "16px", opacity: pendingTopup || simulating ? 0.6 : 1 }}>
                  {pendingTopup ? "Waiting..." : "Top Up"}
                </button>
              </div>
            </form>

            {/* SIMULATE BUTTON */}
            <button
              type="button"
              onClick={handleSimulateTopup}
              disabled={simulating || !!pendingTopup}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "14px",
                background: simulating || pendingTopup ? "#a5c9f0" : "rgba(255, 255, 255, 0.2)",
                border: "2px solid white",
                color: "white",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: simulating || pendingTopup ? "not-allowed" : "pointer",
                fontSize: "15px",
                opacity: simulating || pendingTopup ? 0.6 : 1,
              }}
            >
              {simulating ? "⏳ Simulating..." : "🧪 Simulate Top Up (For Testing)"}
            </button>

            <p style={{ margin: "15px 0 0", fontSize: "12px", opacity: 0.8 }}>
              {pendingTopup
                ? "📲 Enter your M-Pesa PIN on your phone. Waiting for confirmation..."
                : `Current Balance: KES ${parseFloat(company.wallet_balance).toLocaleString()}`}
            </p>
          </div>

          {/* Add Vehicle */}
          <div style={{ background: "var(--bg-card)", padding: "30px", borderRadius: "16px", border: "1px solid var(--border)" }}>
            <h4 style={{ margin: "0 0 15px", color: "var(--text)" }}>➕ Add Vehicle to Fleet</h4>
            <form onSubmit={handleAddVehicle} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input type="text" placeholder="Plate Number (e.g. KDA 123A)" value={newVehicle.plate_number} onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value })} style={inputStyle} required />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <select value={newVehicle.vehicle_type} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })} style={inputStyle}>
                  <option value="Car">Car</option>
                  <option value="Bus">Bus</option>
                  <option value="Truck">Truck</option>
                  <option value="Motorcycle">Motorcycle</option>
                </select>
                <input type="tel" placeholder="Phone" value={newVehicle.owner_phone} onChange={(e) => setNewVehicle({ ...newVehicle, owner_phone: e.target.value })} style={inputStyle} />
              </div>
              <button type="submit" className="btn btn-success" style={{ padding: "12px", fontWeight: "bold", marginTop: "5px" }}>
                Add to Fleet
              </button>
            </form>
          </div>
        </div>

        {/* Add Company Driver */}
        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", marginBottom: "25px", border: "1px solid var(--border)" }}>
          <h4 style={{ margin: "0 0 15px", color: "var(--text)" }}>👤 Add Company Driver</h4>
          <p style={{ margin: "0 0 15px", fontSize: "13px", color: "var(--text-muted)" }}>
            Create driver accounts for your employees. They can log in and use the fleet vehicles.
          </p>
          <form onSubmit={handleAddDriver} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "10px", background: "transparent", padding: 0, boxShadow: "none" }}>
            <input type="text" placeholder="Full Name" value={newDriver.full_name} onChange={(e) => setNewDriver({ ...newDriver, full_name: e.target.value })} style={inputStyle} required />
            <input type="email" placeholder="Email" value={newDriver.email} onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })} style={inputStyle} required />
            <input type="tel" placeholder="Phone" value={newDriver.phone} onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })} style={inputStyle} required />
            <input type="password" placeholder="Password" value={newDriver.password} onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })} style={inputStyle} required />
            <button type="submit" className="btn btn-primary" style={{ fontWeight: "bold", padding: "0 20px" }}>Create</button>
          </form>
        </div>

        {/* Fleet Vehicles Table */}
        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", marginBottom: "25px", border: "1px solid var(--border)" }}>
          <h4 style={{ margin: "0 0 15px", color: "var(--text)" }}>🚗 Fleet Vehicles ({vehicles.length})</h4>
          {vehicles.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No vehicles in fleet yet. Add one above.</p>
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
                {vehicles.map((v) => (
                  <tr key={v.vehicle_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "var(--text-heading)" }}>{v.plate_number}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: v.vehicle_type === "Car" ? "var(--badge-green-bg)" : v.vehicle_type === "Bus" ? "var(--badge-blue-bg)" : v.vehicle_type === "Truck" ? "var(--badge-amber-bg)" : "var(--badge-purple-bg)", color: v.vehicle_type === "Car" ? "var(--badge-green-text)" : v.vehicle_type === "Bus" ? "var(--badge-blue-text)" : v.vehicle_type === "Truck" ? "var(--badge-amber-text)" : "var(--badge-purple-text)" }}>
                        {v.vehicle_type}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>{v.owner_phone || "N/A"}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{new Date(v.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <button onClick={() => handleRemoveVehicle(v.vehicle_id, v.plate_number)} style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
                        <FaTrash /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Payments Table */}
        <div style={{ background: "var(--bg-card)", padding: "25px", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <h4 style={{ margin: "0 0 15px", color: "var(--text)" }}>💳 Recent Fleet Payments ({payments.length})</h4>
          {payments.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>No toll payments recorded yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Reference</th>
                  <th style={{ padding: "12px" }}>Vehicle</th>
                  <th style={{ padding: "12px" }}>Gate</th>
                  <th style={{ padding: "12px" }}>Amount</th>
                  <th style={{ padding: "12px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map((p) => (
                  <tr key={p.payment_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "600", color: "var(--text-heading)" }}>{p.reference_number || "N/A"}</td>
                    <td style={{ padding: "12px" }}>{p.plate_number}</td>
                    <td style={{ padding: "12px" }}>{p.gate_name || "N/A"}</td>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>KES {parseFloat(p.amount).toLocaleString()}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{new Date(p.payment_date).toLocaleString()}</td>
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

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border)", borderLeft: `5px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>{label}</p>
          <h3 style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "700", color }}>{value}</h3>
        </div>
        <div style={{ fontSize: "28px", color, opacity: 0.8 }}>{icon}</div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid var(--border-input)",
  background: "var(--bg-input)",
  color: "var(--text)",
};