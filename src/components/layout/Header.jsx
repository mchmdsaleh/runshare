import { Activity, LogIn, LogOut, UserPlus, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="brand" aria-label="RunShare home">
          <span className="brand-icon" aria-hidden="true">
            <Activity size={18} />
          </span>
          <div className="brand-text">
            <h1 className="title">RunShare</h1>
            <p className="subtitle">Share your runs, your way</p>
          </div>
        </Link>

        <nav className="primary-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Activity
          </NavLink>
          <NavLink
            to="/templates"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Templates
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            About
          </NavLink>
        </nav>

        <div className="user-nav">
          {user ? (
            <div className="user-profile">
              <span className="avatar" aria-hidden="true">{initials}</span>
              <div className="user-meta">
                <span className="user-email">{user.email}</span>
                <span className="user-status">Connected</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="btn-ghost btn-icon"
                aria-label="Logout"
              >
                <LogOut size={16} />
                <span className="btn-label">Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">
                <LogIn size={15} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                <UserPlus size={15} />
                <span>Sign up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
