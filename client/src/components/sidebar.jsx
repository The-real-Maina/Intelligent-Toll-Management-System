import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FaTachometerAlt, FaCar, FaRoad, FaMoneyBillWave, FaUsers, 
  FaChartBar, FaCog, FaSignOutAlt, FaCheckCircle 
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("itms_user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("itms_token");
    localStorage.removeItem("itms_user");
    navigate("/login");
  };

  const isAdmin = user?.role === "Admin";
  const isDriver = user?.role === "Driver";
  const isAttendant = user?.role === "Toll Attendant";

  return (
    <div style={sidebarStyle}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2 style={{ color: "white", margin: 0 }}>ITMS</h2>
        <p style={{ color: "#ccc", fontSize: "12px", marginTop: "5px" }}>
          Signed in as <strong>{user?.full_name}</strong>
          <br />({user?.role})
        </p>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {/* Attendant Links */}
        {isAttendant && (
          <Link to="/verify-gate" style={location.pathname === "/verify-gate" ? activeLinkStyle : linkStyle}>
            <FaCheckCircle /> Verify Payment
          </Link>
        )}

        {/* Admin & Driver Links */}
        {(isAdmin || isDriver) && (
          <Link to="/dashboard" style={location.pathname === "/dashboard" ? activeLinkStyle : linkStyle}>
            <FaTachometerAlt /> Dashboard
          </Link>
        )}
        
        {(isAdmin || isDriver) && (
          <Link to="/vehicles" style={location.pathname === "/vehicles" ? activeLinkStyle : linkStyle}>
            <FaCar /> Vehicles
          </Link>
        )}

        {/* Admin Only Links */}
        {isAdmin && (
          <Link to="/tollgates" style={location.pathname === "/tollgates" ? activeLinkStyle : linkStyle}>
            <FaRoad /> Toll Gates
          </Link>
        )}

        {/* Driver Only Links */}
        {isDriver && (
          <Link to="/pay" style={location.pathname === "/pay" ? activeLinkStyle : linkStyle}>
            <FaMoneyBillWave /> Pay Toll
          </Link>
        )}

        {/* Admin & Driver Links */}
        {(isAdmin || isDriver) && (
          <Link to="/payments" style={location.pathname === "/payments" ? activeLinkStyle : linkStyle}>
            <FaMoneyBillWave /> Payments
          </Link>
        )}

        {/* Admin Only Links */}
        {isAdmin && (
          <Link to="/users" style={location.pathname === "/users" ? activeLinkStyle : linkStyle}>
            <FaUsers /> Users
          </Link>
        )}

        {isAdmin && (
          <Link to="/reports" style={location.pathname === "/reports" ? activeLinkStyle : linkStyle}>
            <FaChartBar /> Reports
          </Link>
        )}

        {isAdmin && (
          <Link to="/settings" style={location.pathname === "/settings" ? activeLinkStyle : linkStyle}>
            <FaCog /> Settings
          </Link>
        )}

        <button onClick={handleLogout} style={logoutButtonStyle}>
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </div>
  );
}

const sidebarStyle = {
  width: "260px", background: "#198754", color: "white", padding: "20px", 
  height: "100vh", position: "fixed", left: 0, top: 0, overflowY: "auto", boxSizing: "border-box"
};
const linkStyle = {
  color: "white", textDecoration: "none", display: "flex", alignItems: "center", 
  gap: "10px", padding: "12px 15px", borderRadius: "8px", fontSize: "15px", transition: "0.2s"
};
const activeLinkStyle = {
  ...linkStyle, background: "rgba(255,255,255,0.2)", fontWeight: "bold"
};
const logoutButtonStyle = {
  ...linkStyle, background: "#dc3545", border: "none", cursor: "pointer", 
  marginTop: "20px", width: "100%", fontWeight: "bold"
};

export default Sidebar;