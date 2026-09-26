import { useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaLock } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "driver",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await API.post("/auth/register", formData);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(to right, #0f5132, #198754)",
      }}
    >
      <div
        className="card shadow-lg"
        style={{
          width: "460px",
          borderRadius: "15px",
        }}
      >
        <div className="card-body p-5">

          <h2 className="text-center text-success mb-4">
            Create an Account
          </h2>

          {error && (
            <div className="alert alert-danger py-2" style={{ fontSize: "14px" }} role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success py-2" style={{ fontSize: "14px" }} role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister}>

            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <div className="input-group">
                <span className="input-group-text"><FaUser /></span>
                <input
                  type="text"
                  name="full_name"
                  className="form-control"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <div className="input-group">
                <span className="input-group-text"><FaEnvelope /></span>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Phone</label>
              <div className="input-group">
                <span className="input-group-text"><FaPhone /></span>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text"><FaLock /></span>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-success w-100"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </button>

          </form>

          <p className="text-center mt-3 mb-0">
            Already have an account? <Link to="/">Login</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;