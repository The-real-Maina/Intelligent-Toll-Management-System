import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function EmployeeManagement() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("itms_token");
        const res = await API.get("/attendance/all", { headers: { Authorization: `Bearer ${token}` } });
        setAttendance(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content" style={{ padding: "30px" }}>
        <h2 style={{ color: "#198754" }}>👥 Employee Attendance & Shifts</h2>
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#198754", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Employee</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Role</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Shift</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Clock In</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Clock Out</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.attendance_id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "#198754" }}>{a.full_name}</td>
                    <td style={{ padding: "12px" }}>{a.role}</td>
                    <td style={{ padding: "12px" }}>{a.shift_type}</td>
                    <td style={{ padding: "12px", fontSize: "13px" }}>{new Date(a.clock_in).toLocaleString()}</td>
                    <td style={{ padding: "12px", fontSize: "13px" }}>{a.clock_out ? new Date(a.clock_out).toLocaleString() : "—"}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: a.shift_status === "Active" ? "#d1fae5" : "#fee2e2", color: a.shift_status === "Active" ? "#065f46" : "#991b1b", padding: "4px 10px", borderRadius: "10px", fontWeight: "bold", fontSize: "12px" }}>
                        {a.shift_status}
                      </span>
                    </td>
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