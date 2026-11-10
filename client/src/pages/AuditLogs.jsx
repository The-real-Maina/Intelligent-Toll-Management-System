import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/audit");
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "#198754", marginBottom: "20px" }}>📜 System Audit Logs</h2>
        <div style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#888" }}>Loading logs...</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Time</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>User</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#888" }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>{log.user_name || "System"} ({log.user_role || "N/A"})</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px" }}>{log.details}</td>
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