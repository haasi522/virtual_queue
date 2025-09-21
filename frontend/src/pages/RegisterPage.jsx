import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "./RegisterPage.css";

function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const [registered, setRegistered] = useState(false); // Track if user has registered
  const [queueInfo, setQueueInfo] = useState(null);    // Token info after "Take Token"
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 1️⃣ Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", form);
      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "customer") {
        setRegistered(true); // show "Take Token" button
      } else if (data.role === "employee") {
        navigate("/employee");
        return;
      } else if (data.role === "admin") {
        navigate("/admin");
        return;
      }
    } catch (err) {
      alert(
        "Registration failed: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Handle "Take Token" click
  const handleTakeToken = async () => {
    setLoading(true);
    try {
      const { data } = await API.post("/queue/take-token", { email: form.email });

      // Map backend response to frontend state
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
    <div className="register-container">
      <h2 className="register-title">Register</h2>

      {/* Registration Form */}
      {!registered && (
        <form onSubmit={handleRegister} className="register-form">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="register-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="register-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="register-input"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="register-select"
          >
            <option value="customer">Customer</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      )}

      {/* Take Token Button */}
      {registered && !queueInfo && (
        <div className="take-token-container">
          <h3>Registration successful!</h3>
          <button
            onClick={handleTakeToken}
            className="register-button"
            disabled={loading}
          >
            {loading ? "Processing..." : "Take Token"}
          </button>
        </div>
      )}

      {/* Queue Card */}
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

export default RegisterPage;
