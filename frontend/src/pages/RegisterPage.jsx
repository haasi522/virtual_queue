import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "./RegisterPage.css";

function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer", // default role
  });
  const [registered, setRegistered] = useState(false); // track registration success
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/register", form); // ✅ don’t store user in localStorage here

      // Show success message
      setRegistered(true);
    } catch (err) {
      alert(
        "Registration failed: " + (err.response?.data?.message || err.message)
      );
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

          {/* Role Dropdown */}
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="register-select"
            required
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

      {/* Success Message + Login Link */}
      {registered && (
        <div
          className="login-link-container"
          style={{ marginTop: "20px", textAlign: "center" }}
        >
          <h3>✅ Registration successful!</h3>
          <p>
            Please{" "}
            <span
              style={{
                color: "#2563eb",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              onClick={() => navigate("/")}
            >
              Login
            </span>{" "}
            to continue.
          </p>
        </div>
      )}
    </div>
  );
}

export default RegisterPage;
