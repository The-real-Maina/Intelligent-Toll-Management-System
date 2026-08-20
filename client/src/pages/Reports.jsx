import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../App.css";
import axios from "axios";
import * as XLSX from "xlsx";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

function Reports() {
  const [payments, setPayments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tollGates, setTollGates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const [filteredPayments, setFilteredPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, vehiclesRes, tollGatesRes] = await Promise.all([
        API.get("/payments"),
        API.get("/vehicles"),
        API.get("/tollgates"),
      ]);
      setPayments(paymentsRes.data);
      setFilteredPayments(paymentsRes.data);
      setVehicles(vehiclesRes.data);
      setTollGates(tollGatesRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading report data:", error);
      setLoading(false);
    }
  };

  // Filter payments by date range
  const handleFilter = () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      setFilteredPayments(payments);
      return;
    }

    const filtered = payments.filter((p) => {
      const paymentDate = new Date(p.payment_date);
      const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (start && end) return paymentDate >= start && paymentDate <= end;
      if (start) return paymentDate >= start;
      if (end) return paymentDate <= end;
      return true;
    });

    setFilteredPayments(filtered);
  };

  const handleReset = () => {
    setDateRange({ startDate: "", endDate: "" });
    setFilteredPayments(payments);
  };

  // Calculate stats
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const mpesaPayments = filteredPayments.filter(p => p.payment_method === "Mpesa");
  const mpesaRevenue = mpesaPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Vehicle stats
  const carCount = vehicles.filter(v => v.vehicle_type === "Car").length;
  const busCount = vehicles.filter(v => v.vehicle_type === "Bus").length;
  const truckCount = vehicles.filter(v => v.vehicle_type === "Truck").length;
  const motorcycleCount = vehicles.filter(v => v.vehicle_type === "Motorcycle").length;

  // Active/Inactive toll gates
  const activeTollGates = tollGates.filter(g => g.status === "Active").length;
  const inactiveTollGates = tollGates.filter(g => g.status === "Inactive").length;

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredPayments.map((p, index) => ({
      "#": index + 1,
      "Reference Number": p.reference_number || "N/A",
      "Transaction ID": p.transaction_id || "N/A",
      "Amount (KES)": parseFloat(p.amount).toFixed(2),
      "Payment Method": p.payment_method,
      "Date": new Date(p.payment_date).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments Report");

    // Vehicle sheet
    const vehicleData = vehicles.map((v, index) => ({
      "#": index + 1,
      "Plate Number": v.plate_number,
      "Owner Name": v.owner_name,
      "Vehicle Type": v.vehicle_type,
      "Phone": v.owner_phone,
    }));
    const ws2 = XLSX.utils.json_to_sheet(vehicleData);
    XLSX.utils.book_append_sheet(wb, ws2, "Vehicles Report");

    XLSX.writeFile(wb, "ITMS_Report.xlsx");
  };

  // Export to PDF (print)
  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content" id="report-content">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h2 style={{ margin: 0 }}>Reports & Analytics</h2>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={exportToExcel}
              style={{ padding: "10px 20px", backgroundColor: "#198754", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
            >
              📊 Export Excel
            </button>
            <button
              onClick={exportToPDF}
              style={{ padding: "10px 20px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
            >
              📄 Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
            <p>Loading report data...</p>
          </div>
        ) : (
          <>
            {/* Date Filter */}
            <div style={{ background: "white", borderRadius: "10px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "30px", borderLeft: "5px solid #0d6efd" }}>
              <h5 style={{ marginBottom: "16px", color: "#0d6efd", fontWeight: "700" }}>📅 Filter by Date Range</h5>
              <div style={{ display: "flex", gap: "16px", alignItems: "end", flexWrap: "wrap" }}>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                    style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#555" }}>End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                    style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none" }}
                  />
                </div>

                <button
                  onClick={handleFilter}
                  style={{ padding: "10px 20px", backgroundColor: "#0d6efd", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  Apply Filter
                </button>

                <button
                  onClick={handleReset}
                  style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  Reset
                </button>

              </div>
            </div>

            {/* Revenue Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>

              <div style={{ background: "linear-gradient(135deg, #198754, #0d6efd)", borderRadius: "12px", padding: "24px", color: "white", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}>
                <p style={{ margin: 0, fontSize: "13px", opacity: 0.85 }}>💰 Total Revenue</p>
                <h3 style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: "700" }}>
                  KES {totalRevenue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                </h3>
                <p style={{ margin: "8px 0 0", fontSize: "12px", opacity: 0.8 }}>{filteredPayments.length} payments</p>
              </div>

              <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderLeft: "5px solid #6f42c1" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>📱 Mpesa Payments</p>
                <h3 style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: "700", color: "#6f42c1" }}>
                  KES {mpesaRevenue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888" }}>{mpesaPayments.length} transactions</p>
              </div>

            </div>

            {/* Two Column - Vehicle Stats + Toll Gate Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" }}>

              {/* Vehicle Statistics */}
              <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <h5 style={{ marginBottom: "20px", fontWeight: "700", color: "#333" }}>🚗 Vehicle Statistics</h5>

                {[
                  { label: "Cars", count: carCount, color: "#198754", bg: "#d1fae5" },
                  { label: "Buses", count: busCount, color: "#0d6efd", bg: "#dbeafe" },
                  { label: "Trucks", count: truckCount, color: "#f0ad4e", bg: "#fef3c7" },
                  { label: "Motorcycles", count: motorcycleCount, color: "#6f42c1", bg: "#f3e8ff" },
                ].map((item, index) => (
                  <div key={index} style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}>{item.label}</span>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: item.color }}>{item.count}</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: vehicles.length > 0 ? `${(item.count / vehicles.length) * 100}%` : "0%",
                        backgroundColor: item.color,
                        borderRadius: "4px",
                        transition: "width 0.5s ease"
                      }} />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#f4f6f9", borderRadius: "8px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Total Registered Vehicles</p>
                  <h4 style={{ margin: "4px 0 0", color: "#198754", fontWeight: "700" }}>{vehicles.length}</h4>
                </div>
              </div>

              {/* Toll Gate Statistics */}
              <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <h5 style={{ marginBottom: "20px", fontWeight: "700", color: "#333" }}>🛣️ Toll Gate Statistics</h5>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#d1fae5", borderRadius: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "36px", fontWeight: "700", color: "#198754" }}>{activeTollGates}</h3>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#065f46", fontWeight: "600" }}>Active Gates</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#fee2e2", borderRadius: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "36px", fontWeight: "700", color: "#dc3545" }}>{inactiveTollGates}</h3>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#991b1b", fontWeight: "600" }}>Inactive Gates</p>
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "8px" }}>Gate Activity Rate</p>
                  <div style={{ height: "12px", backgroundColor: "#f0f0f0", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: tollGates.length > 0 ? `${(activeTollGates / tollGates.length) * 100}%` : "0%",
                      backgroundColor: "#198754",
                      borderRadius: "6px"
                    }} />
                  </div>
                  <p style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
                    {tollGates.length > 0 ? Math.round((activeTollGates / tollGates.length) * 100) : 0}% of gates are active
                  </p>
                </div>

                <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#f4f6f9", borderRadius: "8px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Total Toll Gates</p>
                  <h4 style={{ margin: "4px 0 0", color: "#198754", fontWeight: "700" }}>{tollGates.length}</h4>
                </div>
              </div>

            </div>

            {/* Payments Table */}
            <div style={{ background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <h5 style={{ marginBottom: "16px", fontWeight: "700", color: "#333" }}>
                💳 Payment Records ({filteredPayments.length})
              </h5>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#198754", color: "white" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>#</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Reference</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Amount (KES)</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Method</th>
                      <th style={{ padding: "12px 16px", textAlign: "left" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment, index) => (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "12px 16px" }}>{index + 1}</td>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "#198754" }}>{payment.reference_number || "N/A"}</td>
                          <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                            KES {parseFloat(payment.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                              backgroundColor: "#f3e8ff",
                              color: "#6b21a8"
                            }}>
                              {payment.payment_method}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#888" }}>
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                          No payments found for selected date range
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Row */}
              {filteredPayments.length > 0 && (
                <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#f4f6f9", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", color: "#333" }}>Total Revenue</span>
                  <span style={{ fontWeight: "700", fontSize: "18px", color: "#198754" }}>
                    KES {totalRevenue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

          </>
        )}

      </div>
    </div>
  );
}

export default Reports;