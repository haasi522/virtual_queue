import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Load user from localStorage whenever it changes
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, [localStorage.getItem("user")]); // <-- rerun when user changes

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null); // clear state
    navigate("/login");
    window.location.reload(); // force reload to clean everything
  };

  return (
    <nav className="navbar">
      <h1 className="navbar-title">Virtual Queue</h1>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-user">
              {user.name} ({user.role})
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
