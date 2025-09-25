import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "./LoginPage.css"; // Your CSS for styling

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [customerLoggedIn, setCustomerLoggedIn] = useState(false);
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email, password, role });
      localStorage.setItem("user", JSON.stringify(data));

      if (role === "customer") {
        setCustomerLoggedIn(true); // show Take Token button
      } else if (role === "employee") {
        navigate("/employee");
        return;
      } else if (role === "admin") {
        navigate("/admin");
        return;
      }
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle Take Token click for customers
  const handleTakeToken = async () => {
    setLoading(true);
    try {
      const { data } = await API.post("/queue/take-token", { email });
      setQueueInfo({
        token: data.queueToken,
        customersAhead: data.customersAhead,
        estWaitingTime: data.estWaitingTime,
        name: data.name,
      });
    } catch (err) {
      alert("Failed to take token: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>

      {/* Login Form */}
      {!customerLoggedIn && (
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="login-input"
          >
            <option value="customer">Customer</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      )}

      {/* Customer Take Token */}
      {customerLoggedIn && !queueInfo && (
        <div className="take-token-container">
          <h3>Welcome, {email}!</h3>
          <button
            className="login-btn"
            onClick={handleTakeToken}
            disabled={loading}
          >
            {loading ? "Processing..." : "Take Token"}
          </button>
        </div>
      )}

      {/* Queue Info */}
      {queueInfo && (
        <div className="queue-card">
          <h3>Welcome, {queueInfo.name}!</h3>
          <p><strong>Your Token:</strong> #{queueInfo.token}</p>
          <p><strong>Customers Ahead:</strong> {queueInfo.customersAhead}</p>
          <p><strong>Estimated Waiting Time:</strong> {queueInfo.estWaitingTime} minutes</p>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
