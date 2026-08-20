import {
  FaTachometerAlt,
  FaCar,
  FaRoad,
  FaMoneyBillWave,
  FaUsers,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("itms_user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === "Admin";

  const handleLogout = () => {
    localStorage.removeItem("itms_token");
    localStorage.removeItem("itms_user");
    navigate("/");
  };

  return (
    <div
      style={{
        width: "260px",
        minHeight: "100vh",
        backgroundColor: "#198754",
        color: "white",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <div
        className="text-center py-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <h4 className="fw-bold">ITMS</h4>

        <small>Intelligent Toll Management System</small>

        {user && (
          <div
            style={{
              marginTop: "10px",
              fontSize: "13px",
              opacity: 0.85,
            }}
          >
            Signed in as <strong>{user.full_name}</strong>
            <br />
            <span
              style={{
                fontSize: "11px",
                opacity: 0.75,
              }}
            >
              ({user.role})
            </span>
          </div>
        )}
      </div>

      <ul className="nav flex-column mt-4">
        <li className="nav-item">
          <Link className="nav-link text-white" to="/dashboard">
            <FaTachometerAlt className="me-2" />
            Dashboard
          </Link>
        </li>

        <li className="nav-item">
          <Link className="nav-link text-white" to="/vehicles">
            <FaCar className="me-2" />
            Vehicles
          </Link>
        </li>

        {isAdmin && (
          <li className="nav-item">
            <Link className="nav-link text-white" to="/toll-gates">
              <FaRoad className="me-2" />
              Toll Gates
            </Link>
          </li>
        )}

        <li className="nav-item">
          <Link className="nav-link text-white" to="/payments">
            <FaMoneyBillWave className="me-2" />
            Payments
          </Link>
        </li>

        {isAdmin && (
          <li className="nav-item">
            <Link className="nav-link text-white" to="/users">
              <FaUsers className="me-2" />
              Users
            </Link>
          </li>
        )}

        {isAdmin && (
          <li className="nav-item">
            <Link className="nav-link text-white" to="/reports">
              <FaChartBar className="me-2" />
              Reports
            </Link>
          </li>
        )}

        {isAdmin && (
          <li className="nav-item">
            <Link className="nav-link text-white" to="/settings">
              <FaCog className="me-2" />
              Settings
            </Link>
          </li>
        )}

        <li className="nav-item mt-4">
          <button
            className="nav-link text-warning fw-bold border-0 bg-transparent"
            onClick={handleLogout}
            style={{
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <FaSignOutAlt className="me-2" />
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;