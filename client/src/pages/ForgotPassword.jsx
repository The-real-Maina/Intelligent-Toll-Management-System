import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import tollBg from "../assets/toll-bg.jpg";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", otp: "", newPassword: "" });
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/forgot-password", { email: formData.email });
      setSimulatedOtp(res.data.simulated_otp);
      setStep(2);
      setMessage("OTP sent! Check the blue box below.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/reset-password", formData);
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundImage: `linear-gradient(rgba(15, 81, 50, 0.75), rgba(25, 135, 84, 0.75)), url(${tollBg})`, backgroundSize: "cover" }}>
      <div className="card shadow-lg" style={{ width: "420px", borderRadius: "15px" }}>
        <div className="card-body p-5">
          <h3 className="text-center text-success mb-4">Reset Password</h3>
          
          {error && <div className="alert alert-danger py-2" style={{ fontSize: "14px" }}>{error}</div>}
          {message && <div className="alert alert-success py-2" style={{ fontSize: "14px" }}>{message}</div>}
          {simulatedOtp && <div className="alert alert-info text-center">🔑 Simulated OTP: <strong>{simulatedOtp}</strong></div>}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp}>
              <p className="text-muted text-center mb-3" style={{ fontSize: "14px" }}>Enter your email and we'll send you an OTP to reset your password.</p>
              <input type="email" placeholder="Enter your email" className="form-control mb-3" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <button type="submit" className="btn btn-success w-100" disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <input type="text" placeholder="Enter 6-digit OTP" className="form-control mb-3 text-center" maxLength="6" style={{ letterSpacing: "5px", fontWeight: "bold", fontSize: "20px" }} value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} required />
              <input type="password" placeholder="Enter New Password" className="form-control mb-3" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} required />
              <button type="submit" className="btn btn-success w-100" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
            </form>
          )}

          <div className="text-center mt-3">
            <Link to="/login" className="text-success fw-bold text-decoration-none">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}