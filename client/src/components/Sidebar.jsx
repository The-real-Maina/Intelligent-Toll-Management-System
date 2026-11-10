import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FaTachometerAlt, FaCar, FaRoad, FaMoneyBillWave, FaUsers, 
  FaChartBar, FaCog, FaSignOutAlt, FaCheckCircle, FaClipboardList, 
  FaExclamationTriangle, FaMoneyCheckAlt, FaUser, FaBars, FaHistory,
  FaClock, FaTimes, FaWallet, FaBuilding
} from "react-icons/fa";

const MOBILE_QUERY = "(max-width: 768px)";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem("itms_sidebar_collapsed") === "true"; } catch { return false; }
  });
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  // The mobile menu is "open" only for the page it was opened on, so it closes
  // automatically on navigation without needing an effect.
  const [openPath, setOpenPath] = useState(null);
  const mobileOpen = openPath === location.pathname;
  const setMobileOpen = (open) => setOpenPath(open ? location.pathname : null);

  const collapsed = !isMobile && isCollapsed;

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => { document.body.classList.toggle("sidebar-collapsed", collapsed); }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem("itms_sidebar_collapsed", String(isCollapsed)); } catch { /* storage unavailable */ }
  }, [isCollapsed]);

  useEffect(() => { return () => document.body.classList.remove("sidebar-collapsed"); }, []);

  let user = null;
  try {
    const storedUser = localStorage.getItem("itms_user");
    if (storedUser && storedUser !== "undefined") user = JSON.parse(storedUser);
  } catch { /* ignore bad stored user */ }

  const handleLogout = () => {
    localStorage.removeItem("itms_token");
    localStorage.removeItem("itms_user");
    navigate("/login");
  };

  const isAdmin = user?.role === "Admin";
  const isDriver = user?.role === "Driver";
  const isAttendant = user?.role === "Toll Attendant";
  const isCompanyAdmin = user?.role === "Company Admin";

  const panelStyle = {
    ...sidebarStyle,
    width: collapsed ? "80px" : "260px",
    zIndex: 1000,
    ...(isMobile && {
      transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
      visibility: mobileOpen ? "visible" : "hidden",
      transition: "transform 0.3s ease, visibility 0.3s",
      boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.35)" : "none",
    }),
  };

  return (
    <>
    {isMobile && !mobileOpen && (
      <button onClick={() => setMobileOpen(true)} aria-label="Open menu" style={openButtonStyle}><FaBars /></button>
    )}
    {isMobile && mobileOpen && <div onClick={() => setMobileOpen(false)} style={backdropStyle} />}

    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: collapsed ? "center" : "space-between", alignItems: "center", marginBottom: "30px", padding: collapsed ? "0" : "0 10px" }}>
        <button
          onClick={() => (isMobile ? setMobileOpen(false) : setIsCollapsed(!isCollapsed))}
          aria-label={isMobile ? "Close menu" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}
        >
          {isMobile ? <FaTimes /> : <FaBars />}
        </button>
        {!collapsed && <h2 style={{ color: "white", margin: 0, fontSize: "22px" }}>ITMS</h2>}
      </div>

      {!collapsed && (
        <div style={{ textAlign: "center", marginBottom: "30px", fontSize: "12px", color: "#cce3d6" }}>
          Signed in as <strong>{user?.full_name || "User"}</strong><br />({user?.role || "Unknown"})
        </div>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {isAttendant && (
          <>
            <SidebarLink to="/attendant-home" icon={<FaTachometerAlt />} label="Dashboard" location={location} collapsed={collapsed} />
            <SidebarLink to="/verify-gate" icon={<FaCheckCircle />} label="Verify M-Pesa" location={location} collapsed={collapsed} />
            <SidebarLink to="/record-cash" icon={<FaMoneyCheckAlt />} label="Record Cash" location={location} collapsed={collapsed} />
            <SidebarLink to="/issue-citation" icon={<FaExclamationTriangle />} label="Issue Citation" location={location} collapsed={collapsed} />
            <SidebarLink to="/attendant-shift-log" icon={<FaClipboardList />} label="Shift Log" location={location} collapsed={collapsed} />
            <SidebarLink to="/my-shift" icon={<FaClock />} label="My Shift" location={location} collapsed={collapsed} />
            {!collapsed && <hr style={{ border: "1px solid rgba(255,255,255,0.2)", margin: "10px 0" }} />}
            <SidebarLink to="/profile" icon={<FaUser />} label="My Profile" location={location} collapsed={collapsed} />
          </>
        )}

        {isCompanyAdmin && (
          <>
            <SidebarLink to="/company-dashboard" icon={<FaBuilding />} label="My Company" location={location} collapsed={collapsed} />
            <SidebarLink to="/company-vehicles" icon={<FaCar />} label="Fleet Vehicles" location={location} collapsed={collapsed} />
            <SidebarLink to="/company-drivers" icon={<FaUsers />} label="Drivers" location={location} collapsed={collapsed} />
            <SidebarLink to="/company-payments" icon={<FaMoneyBillWave />} label="Payments" location={location} collapsed={collapsed} />
            <SidebarLink to="/company-reports" icon={<FaChartBar />} label="Reports" location={location} collapsed={collapsed} />
          </>
        )}

        {(isAdmin || isDriver) && (
          <SidebarLink to="/dashboard" icon={<FaTachometerAlt />} label="Dashboard" location={location} collapsed={collapsed} />
        )}

        {isDriver && (
          <>
            <SidebarLink to="/vehicles" icon={<FaCar />} label="Vehicles" location={location} collapsed={collapsed} />
            <SidebarLink to="/wallet" icon={<FaWallet />} label="My Wallet" location={location} collapsed={collapsed} />
          </>
        )}

        {isAdmin && <SidebarLink to="/tollgates" icon={<FaRoad />} label="Toll Gates" location={location} collapsed={collapsed} />}
        {isDriver && <SidebarLink to="/pay" icon={<FaMoneyBillWave />} label="Pay Toll" location={location} collapsed={collapsed} />}
        {(isAdmin || isDriver) && <SidebarLink to="/payments" icon={<FaMoneyBillWave />} label="Payments" location={location} collapsed={collapsed} />}

        {isAdmin && <SidebarLink to="/users" icon={<FaUsers />} label="Users" location={location} collapsed={collapsed} />}
        {isAdmin && <SidebarLink to="/companies" icon={<FaBuilding />} label="Companies" location={location} collapsed={collapsed} />}
        {isAdmin && <SidebarLink to="/employee-management" icon={<FaUsers />} label="Employees" location={location} collapsed={collapsed} />}
        {isAdmin && <SidebarLink to="/disputes" icon={<FaExclamationTriangle />} label="Disputes" location={location} collapsed={collapsed} />}
        {isAdmin && <SidebarLink to="/reports" icon={<FaChartBar />} label="Reports" location={location} collapsed={collapsed} />}
        {isAdmin && <SidebarLink to="/audit-logs" icon={<FaHistory />} label="Audit Logs" location={location} collapsed={collapsed} />}
        {isAdmin && <SidebarLink to="/settings" icon={<FaCog />} label="Settings" location={location} collapsed={collapsed} />}
        {isAdmin && <SidebarLink to="/profile" icon={<FaUser />} label="My Profile" location={location} collapsed={collapsed} />}

        <button onClick={handleLogout} style={{ ...logoutButtonStyle, justifyContent: collapsed ? "center" : "flex-start" }}>
          <FaSignOutAlt /> {!collapsed && "Logout"}
        </button>
      </nav>
    </div>
    </>
  );
}

function SidebarLink({ to, icon, label, location, collapsed }) {
  const isActive = location.pathname === to;
  return (
    <Link to={to} style={isActive ? activeLinkStyle : linkStyle} title={label}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

const sidebarStyle = { background: "#198754", color: "white", padding: "20px", height: "100vh", position: "fixed", left: 0, top: 0, overflowY: "auto", boxSizing: "border-box", transition: "width 0.3s ease" };
const linkStyle = { color: "white", textDecoration: "none", display: "flex", alignItems: "center", gap: "15px", padding: "12px 15px", borderRadius: "8px", fontSize: "15px", transition: "0.2s", overflow: "hidden", whiteSpace: "nowrap" };
const activeLinkStyle = { ...linkStyle, background: "rgba(255,255,255,0.2)", fontWeight: "bold" };
const logoutButtonStyle = { ...linkStyle, background: "#dc3545", border: "none", cursor: "pointer", marginTop: "20px", width: "100%", fontWeight: "bold" };
const openButtonStyle = { position: "fixed", top: "14px", left: "14px", zIndex: 998, width: "44px", height: "44px", borderRadius: "50%", border: "none", background: "#198754", color: "white", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" };
const backdropStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999 };

export default Sidebar;