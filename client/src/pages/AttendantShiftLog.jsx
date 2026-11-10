import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import "../App.css";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function AttendantShiftLog() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const token = localStorage.getItem("itms_token");
        const res = await API.get("/payments", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setTxns(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to load shift log", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "#198754", marginBottom: "20px" }}>📋 Shift Log History</h2>
        <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#888" }}>Loading history...</p>
          ) : txns.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888" }}>No transactions found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                  <th style={{ padding: "12px 0" }}>Ref</th>
                  <th style={{ padding: "12px 0" }}>Plate</th>
                  <th style={{ padding: "12px 0" }}>Method</th>
                  <th style={{ padding: "12px 0" }}>Amount</th>
                  <th style={{ padding: "12px 0" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 0", fontWeight: "bold", color: "#198754" }}>{t.reference_number}</td>
                    <td style={{ padding: "12px 0" }}>{t.plate_number || "N/A"}</td>
                    <td style={{ padding: "12px 0" }}>
                      <span style={{ background: t.payment_method === "Cash" ? "#fef3c7" : "#f3e8ff", padding: "4px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}>
                        {t.payment_method}
                      </span>
                    </td>
                    <td style={{ padding: "12px 0", fontWeight: "bold" }}>KES {t.amount}</td>
                    <td style={{ padding: "12px 0", color: "#888" }}>{new Date(t.payment_date).toLocaleString()}</td>
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