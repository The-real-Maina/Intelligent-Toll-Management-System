import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import { API } from "../services/api";
import {
  FaCar,
  FaRoad,
  FaMoneyBillWave,
  FaUsers,
} from "react-icons/fa";

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
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const isAdminUser = user?.role === "Admin";

      const requests = [
        API.get("/vehicles"),
        API.get("/tollgates"),
        API.get("/payments"),
      ];

      // Only admins are allowed to hit /users — skip it for drivers
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

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">

        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ margin: 0 }}>
            {isAdmin ? "Admin Dashboard" : "Driver Dashboard"}
          </h2>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "4px" }}>
            Welcome back, <strong>{user?.full_name}</strong>! 
            {isAdmin ? " Here is your full system overview." : " Here is your personal overview."}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* ADMIN VIEW */}
            {isAdmin && (
              <>
                {/* Stat Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>

                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #0d6efd" }}>
                    <div style={{ backgroundColor: "#dbeafe", color: "#0d6efd", borderRadius: "12px", padding: "14px" }}>
                      <FaCar size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Total Vehicles</p>
                      <h3 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "700", color: "#0d6efd" }}>{stats.vehicles}</h3>
                    </div>
                  </div>

                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #198754" }}>
                    <div style={{ backgroundColor: "#d1fae5", color: "#198754", borderRadius: "12px", padding: "14px" }}>
                      <FaRoad size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Toll Gates</p>
                      <h3 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "700", color: "#198754" }}>{stats.tollGates}</h3>
                    </div>
                  </div>

                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #f0ad4e" }}>
                    <div style={{ backgroundColor: "#fef3c7", color: "#f0ad4e", borderRadius: "12px", padding: "14px" }}>
                      <FaMoneyBillWave size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Total Payments</p>
                      <h3 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "700", color: "#f0ad4e" }}>{stats.payments}</h3>
                    </div>
                  </div>

                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "20px", borderLeft: "5px solid #6f42c1" }}>
                    <div style={{ backgroundColor: "#f3e8ff", color: "#6f42c1", borderRadius: "12px", padding: "14px" }}>
                      <FaUsers size={36} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>System Users</p>
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
                  <p style={{ margin: 0, fontSize: "14px", opacity: 0.85 }}>💰 Total Revenue Collected</p>
                  <h2 style={{ margin: "8px 0 0", fontSize: "36px", fontWeight: "700" }}>
                    KES {stats.totalRevenue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </h2>
                  <div style={{ display: "flex", gap: "30px", marginTop: "16px", fontSize: "13px", opacity: 0.9 }}>
                    <span>📱 Mpesa: {stats.mpesaPayments}</span>
                  </div>
                </div>

                {/* Two Column */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>

                  {/* Recent Payments */}
                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                    <h5 style={{ marginBottom: "16px", fontWeight: "700", color: "#333" }}>💳 Recent Payments</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f4f6f9" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "#555" }}>Reference</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "#555" }}>Amount</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "#555" }}>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayments.length > 0 ? (
                          recentPayments.map((payment, index) => (
                            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                              <td style={{ padding: "10px 12px", fontSize: "13px", color: "#198754", fontWeight: "600" }}>{payment.reference_number || "N/A"}</td>
                              <td style={{ padding: "10px 12px", fontSize: "13px", fontWeight: "600" }}>KES {parseFloat(payment.amount).toLocaleString()}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                                  backgroundColor: "#f3e8ff",
                                  color: "#6b21a8"
                                }}>{payment.payment_method}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#888", fontSize: "13px" }}>No payments yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Recent Vehicles */}
                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                    <h5 style={{ marginBottom: "16px", fontWeight: "700", color: "#333" }}>🚗 Recent Vehicles</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f4f6f9" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "#555" }}>Plate</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "#555" }}>Owner</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "13px", color: "#555" }}>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentVehicles.length > 0 ? (
                          recentVehicles.map((vehicle, index) => (
                            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                              <td style={{ padding: "10px 12px", fontSize: "13px", color: "#198754", fontWeight: "600" }}>{vehicle.plate_number}</td>
                              <td style={{ padding: "10px 12px", fontSize: "13px" }}>{vehicle.owner_name}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                                  backgroundColor: vehicle.vehicle_type === "Car" ? "#d1fae5" : vehicle.vehicle_type === "Bus" ? "#dbeafe" : vehicle.vehicle_type === "Truck" ? "#fef3c7" : "#f3e8ff",
                                  color: vehicle.vehicle_type === "Car" ? "#065f46" : vehicle.vehicle_type === "Bus" ? "#1e40af" : vehicle.vehicle_type === "Truck" ? "#92400e" : "#6b21a8"
                                }}>{vehicle.vehicle_type}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#888", fontSize: "13px" }}>No vehicles yet</td></tr>
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

                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #198754", textAlign: "center" }}>
                    <FaCar size={40} color="#198754" />
                    <h3 style={{ margin: "12px 0 4px", fontSize: "28px", fontWeight: "700", color: "#198754" }}>{stats.vehicles}</h3>
                    <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>Registered Vehicles</p>
                  </div>

                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #0d6efd", textAlign: "center" }}>
                    <FaMoneyBillWave size={40} color="#0d6efd" />
                    <h3 style={{ margin: "12px 0 4px", fontSize: "28px", fontWeight: "700", color: "#0d6efd" }}>{stats.payments}</h3>
                    <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>Total Payments</p>
                  </div>

                  <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #f0ad4e", textAlign: "center" }}>
                    <FaRoad size={40} color="#f0ad4e" />
                    <h3 style={{ margin: "12px 0 4px", fontSize: "28px", fontWeight: "700", color: "#f0ad4e" }}>{stats.tollGates}</h3>
                    <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>Active Toll Gates</p>
                  </div>

                </div>

                {/* Driver Recent Payments */}
                <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  <h5 style={{ marginBottom: "16px", fontWeight: "700", color: "#333" }}>💳 Recent Payments</h5>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                          <tr key={index} style={{ borderBottom: "1px solid #eee", backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                            <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                            <td style={{ padding: "12px 16px", color: "#198754", fontWeight: "600" }}>{payment.reference_number || "N/A"}</td>
                            <td style={{ padding: "12px 16px", fontWeight: "600" }}>KES {parseFloat(payment.amount).toLocaleString()}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                                backgroundColor: "#f3e8ff",
                                color: "#6b21a8"
                              }}>{payment.payment_method}</span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#888" }}>
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#888" }}>No payments found</td></tr>
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