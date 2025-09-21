import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api"; // <- make sure this is default export

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // <-- PASTE handleSubmit HERE
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(data));
      if (data.role === "customer") navigate("/customer");
      else if (data.role === "employee") navigate("/employee");
      else if (data.role === "admin") navigate("/admin");
    } catch (err) {
      alert("Login failed: " + err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
