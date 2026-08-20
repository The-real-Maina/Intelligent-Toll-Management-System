import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark shadow"
      style={{ backgroundColor: "#198754" }}
    >
      <div className="container-fluid">

        <Link className="navbar-brand fw-bold" to="/dashboard">
          Intelligent Toll Management System
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">

            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/vehicles">
                Vehicles
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/users">
                Users
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/reports">
                Reports
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link text-warning fw-bold" to="/">
                Logout
              </Link>
            </li>

          </ul>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;