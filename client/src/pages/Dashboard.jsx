import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../App.css";
import { API } from "../services/api";
import {
  FaCar,
  FaRoad,
  FaMoneyBillWave,
  FaUsers,
  FaPlusCircle,
  FaCreditCard,
  FaHistory,
  FaMobileAlt,
  FaBolt,
  FaReceipt
} from "react-icons/fa";

/* ---------- Shared theme-aware styles ---------- */
const panelStyle = {
  background: "var(--bg-card)",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "var(--shadow)",
};

const panelTitleStyle = {
  marginBottom: "16px",
  fontWeight: "700",
  color: "var(--text)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const mutedTextStyle = { color: "var(--text-muted)" };

const vehicleBadge = (type) => {
  const map = {
    Car: { bg: "var(--badge-green-bg)", color: "var(--badge-green-text)" },
    Bus: { bg: "var(--badge-blue-bg)", color: "var(--badge-blue-text)" },
    Truck: { bg: "var(--badge-amber-bg)", color: "var(--badge-amber-text)" },
  };
  return map[type] || { bg: "var(--badge-purple-bg)", color: "var(--badge-purple-text)" };
};

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");
  const isAdmin = user?.role === "Admin";

  const [stats, setStats] = useState({
    vehicles: 0,
    tollGates: 0,
    payments: 0,
    users: 0,
    totalRevenue: 0,
    mpesaPayments: 0,
  });

  const [recentPayments, setRecentPayments] = useState([]);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const isAdminUser = user?.role === "Admin";

        const requests = [
          API.get("/vehicles"),
          API.get("/tollgates"),
          API.get("/payments"),
        ];

        if (isAdminUser) {
          requests.push(API.get("/users"));
        }

        const results = await Promise.all(requests);

        const vehicles = results[0].data;
        const tollGates = results[1].data;
        const payments = results[2].data;
        const users = isAdminUser ? results[3].data : [];

        const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const mpesaPayments = payments.filter(p => p.payment_method === "Mpesa").length;

        setStats({
          vehicles: vehicles.length,
          tollGates: tollGates.length,
          payments: payments.length,
          users: users.length,
          totalRevenue,
          mpesaPayments,
        });

        setRecentPayments(payments.slice(0, 5));
        setRecentVehicles(vehicles.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error("Dashboard load error:", error);
        setLoading(false);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderReference = (ref) => {
    if (!ref || ref === "null") {
      return (
        <span style={{
          padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
          fontWeight: "600", backgroundColor: "var(--badge-amber-bg)", color: "var(--badge-amber-text)"
        }}>
          Pending
        </span>
      );
    }
    return ref;
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">

        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ margin: 0 }}>
            {isAdmin ? "Admin Dashboard" : "Driver Dashboard"}
          </h2>
          <p style={{ ...mutedTextStyle, fontSize: "14px", marginTop: "4px" }}>
            Welcome back, <strong>{user?.full_name}</strong>!
            {isAdmin ? " Here is your full system overview." : " Here is your personal overview."}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", ...mutedTextStyle }}>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* ADMIN VIEW */}
            {isAdmin && (
              <>
                {/* Stat Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>

                  <div style={{ ...panelStyle, display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #0d6efd" }}>
                    <div style={{ backgroundColor: "var(--badge-blue-bg)", color: "#0d6efd", borderRadius: "12px", padding: "14px" }}>
                      <FaCar size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", ...mutedTextStyle }}>Total Vehicles</p>
                      <h3 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "700", color: "#0d6efd" }}>{stats.vehicles}</h3>
                    </div>
                  </div>

                  <div style={{ ...panelStyle, display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #198754" }}>
                    <div style={{ backgroundColor: "var(--badge-green-bg)", color: "#198754", borderRadius: "12px", padding: "14px" }}>
                      <FaRoad size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", ...mutedTextStyle }}>Toll Gates</p>
                      <h3 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "700", color: "#198754" }}>{stats.tollGates}</h3>
                    </div>
                  </div>

                  <div style={{ ...panelStyle, display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #f0ad4e" }}>
                    <div style={{ backgroundColor: "var(--badge-amber-bg)", color: "#f0ad4e", borderRadius: "12px", padding: "14px" }}>
                      <FaMoneyBillWave size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", ...mutedTextStyle }}>Total Payments</p>
                      <h3 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "700", color: "#f0ad4e" }}>{stats.payments}</h3>
                    </div>
                  </div>

                  <div style={{ ...panelStyle, display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #6f42c1" }}>
                    <div style={{ backgroundColor: "var(--badge-purple-bg)", color: "#6f42c1", borderRadius: "12px", padding: "14px" }}>
                      <FaUsers size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", ...mutedTextStyle }}>System Users</p>
                      <h3 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "700", color: "#6f42c1" }}>{stats.users}</h3>
                    </div>
                  </div>

                </div>

                {/* Revenue Banner */}
                <div style={{
                  background: "linear-gradient(135deg, #198754, #0d6efd)",
                  borderRadius: "12px",
                  padding: "24px",
                  color: "white",
                  marginBottom: "30px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
                }}>
                  <p style={{ margin: 0, fontSize: "14px", opacity: 0.85, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaMoneyBillWave /> Total Revenue Collected
                  </p>
                  <h2 style={{ margin: "8px 0 0", padding: 0, border: "none", fontSize: "36px", fontWeight: "700", color: "white" }}>
                    KES {stats.totalRevenue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </h2>
                  <div style={{ display: "flex", gap: "30px", marginTop: "16px", fontSize: "13px", opacity: 0.9 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FaMobileAlt /> Mpesa: {stats.mpesaPayments}
                    </span>
                  </div>
                </div>

                {/* Two Column */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>

                  {/* Recent Payments */}
                  <div style={panelStyle}>
                    <h5 style={panelTitleStyle}><FaCreditCard color="#198754" /> Recent Payments</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "none" }}>
                      <thead>
                        <tr style={{ backgroundColor: "var(--bg-subtle)" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "var(--text-table)" }}>Reference</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "var(--text-table)" }}>Amount</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "var(--text-table)" }}>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayments.length > 0 ? (
                          recentPayments.map((payment, index) => (
                            <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ padding: "10px 12px", fontSize: "13px", color: "#198754", fontWeight: "600" }}>
                                {renderReference(payment.reference_number)}
                              </td>
                              <td style={{ padding: "10px 12px", fontSize: "13px", fontWeight: "600" }}>KES {parseFloat(payment.amount).toLocaleString()}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                                  backgroundColor: "var(--badge-purple-bg)",
                                  color: "var(--badge-purple-text)"
                                }}>{payment.payment_method}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center", ...mutedTextStyle, fontSize: "13px" }}>No payments yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Recent Vehicles */}
                  <div style={panelStyle}>
                    <h5 style={panelTitleStyle}><FaCar color="#198754" /> Recent Vehicles</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "none" }}>
                      <thead>
                        <tr style={{ backgroundColor: "var(--bg-subtle)" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "var(--text-table)" }}>Plate</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "var(--text-table)" }}>Owner</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "var(--text-table)" }}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentVehicles.length > 0 ? (
                          recentVehicles.map((vehicle, index) => {
                            const badge = vehicleBadge(vehicle.vehicle_type);
                            return (
                              <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ padding: "10px 12px", fontSize: "13px", color: "#198754", fontWeight: "600" }}>{vehicle.plate_number}</td>
                                <td style={{ padding: "10px 12px", fontSize: "13px" }}>{vehicle.owner_name}</td>
                                <td style={{ padding: "10px 12px" }}>
                                  <span style={{
                                    padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                                    backgroundColor: badge.bg,
                                    color: badge.color
                                  }}>{vehicle.vehicle_type}</span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center", ...mutedTextStyle, fontSize: "13px" }}>No vehicles yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </>
            )}

            {/* DRIVER VIEW */}
            {!isAdmin && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>

                  <div style={{ ...panelStyle, borderLeft: "5px solid #198754", textAlign: "center" }}>
                    <FaCar size={40} color="#198754" />
                    <h3 style={{ margin: "12px 0 4px", fontSize: "28px", fontWeight: "700", color: "#198754" }}>{stats.vehicles}</h3>
                    <p style={{ margin: 0, ...mutedTextStyle, fontSize: "13px" }}>Registered Vehicles</p>
                  </div>

                  <div style={{ ...panelStyle, borderLeft: "5px solid #0d6efd", textAlign: "center" }}>
                    <FaMoneyBillWave size={40} color="#0d6efd" />
                    <h3 style={{ margin: "12px 0 4px", fontSize: "28px", fontWeight: "700", color: "#0d6efd" }}>{stats.payments}</h3>
                    <p style={{ margin: 0, ...mutedTextStyle, fontSize: "13px" }}>Total Payments</p>
                  </div>

                  <div style={{ ...panelStyle, borderLeft: "5px solid #f0ad4e", textAlign: "center" }}>
                    <FaRoad size={40} color="#f0ad4e" />
                    <h3 style={{ margin: "12px 0 4px", fontSize: "28px", fontWeight: "700", color: "#f0ad4e" }}>{stats.tollGates}</h3>
                    <p style={{ margin: 0, ...mutedTextStyle, fontSize: "13px" }}>Active Toll Gates</p>
                  </div>

                </div>

                {/* QUICK ACTIONS FOR DRIVER */}
                <div style={{ ...panelStyle, marginBottom: "24px" }}>
                  <h5 style={panelTitleStyle}><FaBolt color="#f0ad4e" /> Quick Actions</h5>
                  <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    <Link to="/vehicles" style={{ flex: 1, textDecoration: "none" }}>
                      <div style={{ border: "2px solid #198754", borderRadius: "10px", padding: "15px", textAlign: "center", backgroundColor: "var(--tint-green)", transition: "0.2s" }}>
                        <FaPlusCircle size={24} color="#198754" />
                        <p style={{ margin: "8px 0 0", fontWeight: "bold", color: "#198754", fontSize: "14px" }}>Add Vehicle</p>
                      </div>
                    </Link>
                    <Link to="/pay" style={{ flex: 1, textDecoration: "none" }}>
                      <div style={{ border: "2px solid #0d6efd", borderRadius: "10px", padding: "15px", textAlign: "center", backgroundColor: "var(--tint-blue)", transition: "0.2s" }}>
                        <FaCreditCard size={24} color="#0d6efd" />
                        <p style={{ margin: "8px 0 0", fontWeight: "bold", color: "#0d6efd", fontSize: "14px" }}>Pay Toll Now</p>
                      </div>
                    </Link>
                    <Link to="/payments" style={{ flex: 1, textDecoration: "none" }}>
                      <div style={{ border: "2px solid #6f42c1", borderRadius: "10px", padding: "15px", textAlign: "center", backgroundColor: "var(--tint-purple)", transition: "0.2s" }}>
                        <FaHistory size={24} color="#6f42c1" />
                        <p style={{ margin: "8px 0 0", fontWeight: "bold", color: "#6f42c1", fontSize: "14px" }}>History</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Driver Recent Payments */}
                <div style={panelStyle}>
                  <h5 style={panelTitleStyle}><FaCreditCard color="#198754" /> Recent Payments</h5>
                  <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "none" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#198754", color: "white" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>#</th>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Reference</th>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Amount</th>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Method</th>
                        <th style={{ padding: "12px 16px", textAlign: "left" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.length > 0 ? (
                        recentPayments.map((payment, index) => (
                          <tr key={index} style={{ borderBottom: "1px solid var(--border)", backgroundColor: index % 2 === 0 ? "var(--bg-card)" : "var(--bg-stripe)" }}>
                            <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                            <td style={{ padding: "12px 16px", color: "#198754", fontWeight: "600" }}>
                              {renderReference(payment.reference_number)}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "600" }}>KES {parseFloat(payment.amount).toLocaleString()}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                                backgroundColor: "var(--badge-purple-bg)",
                                color: "var(--badge-purple-text)"
                              }}>{payment.payment_method}</span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", ...mutedTextStyle }}>
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ padding: "40px", textAlign: "center", ...mutedTextStyle }}>
                            <FaReceipt size={40} style={{ opacity: 0.5, marginBottom: "10px" }} />
                            <p>No payments found yet. Use the <strong>Pay Toll</strong> button to get started.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </>
        )}

      </div>
    </div>
  );
}

export default Dashboard;