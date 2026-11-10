import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import tollBg from "../assets/toll-bg.jpg";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function CompanyRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: "",
    registration_number: "",
    company_email: "",
    company_phone: "",
    admin_full_name: "",
    admin_email: "",
    admin_phone: "",
    admin_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await API.post("/auth/register-company", formData);
      setSuccess(res.data.message);
      setTimeout(() => navigate("/login"), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundImage: `linear-gradient(rgba(15, 81, 50, 0.75), rgba(25, 135, 84, 0.75)), url(${tollBg})`, backgroundSize: "cover", backgroundPosition: "center", padding: "40px 20px" }}>
      <div className="card shadow-lg" style={{ width: "100%", maxWidth: "680px", borderRadius: "15px" }}>
        <div className="card-body p-5">
          <h2 className="text-center text-success mb-2">🏢 Register Your Company</h2>
          <p className="text-center text-muted mb-4" style={{ fontSize: "14px" }}>
            Register your fleet company to manage vehicles and toll payments. An ITMS Admin will approve your account.
          </p>

          {error && <div className="alert alert-danger py-2" style={{ fontSize: "14px" }}>{error}</div>}
          {success && <div className="alert alert-success py-2" style={{ fontSize: "14px" }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <h5 className="mb-3" style={{ color: "#198754", fontWeight: "700" }}>Company Details</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Company Name</label>
                <input type="text" name="company_name" className="form-control" value={formData.company_name} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Registration Number</label>
                <input type="text" name="registration_number" className="form-control" value={formData.registration_number} onChange={handleChange} placeholder="e.g. REG-2026-001" required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Company Email</label>
                <input type="email" name="company_email" className="form-control" value={formData.company_email} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Company Phone</label>
                <input type="tel" name="company_phone" className="form-control" value={formData.company_phone} onChange={handleChange} />
              </div>
            </div>

            <h5 className="mb-3 mt-3" style={{ color: "#198754", fontWeight: "700" }}>Company Admin Account</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Admin Full Name</label>
                <input type="text" name="admin_full_name" className="form-control" value={formData.admin_full_name} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Admin Email</label>
                <input type="email" name="admin_email" className="form-control" value={formData.admin_email} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Admin Phone</label>
                <input type="tel" name="admin_phone" className="form-control" value={formData.admin_phone} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Admin Password</label>
                <input type="password" name="admin_password" className="form-control" value={formData.admin_password} onChange={handleChange} required />
              </div>
            </div>

            <button className="btn btn-success w-100 mt-3" type="submit" disabled={loading} style={{ padding: "12px", fontWeight: "bold" }}>
              {loading ? "Registering..." : "Register Company"}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Already registered? <Link to="/login" className="text-success fw-bold text-decoration-none">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}