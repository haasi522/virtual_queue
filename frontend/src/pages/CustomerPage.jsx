import { useState, useEffect } from "react";
import API from "../utils/api";
import "./FormPage.css"; // use your form CSS

function CustomerPage() {
  const [token, setToken] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const WAIT_TIME_PER_CUSTOMER = 5; // in minutes

  // Fetch full queue
  const fetchQueue = async () => {
    try {
      const res = await API.get("/queue/all");
      setQueue(res.data.filter((q) => q.status === "Pending"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueue();

    // refresh queue every 10 seconds
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const takeToken = async () => {
    setLoading(true);
    try {
      const res = await API.post("/queue/take-token", { email: user.email });
      setToken(res.data.token);
      fetchQueue();
    } catch (err) {
      console.error(err);
      alert("Failed to take token");
    }
    setLoading(false);
  };

  // Calculate customers ahead
  const customersAhead = queue
    .filter((q) => q.token < token)
    .length;

  const estimatedTime = customersAhead * WAIT_TIME_PER_CUSTOMER;

  return (
    <div className="form-container">
      <h2>Welcome, {user.name}</h2>

      {!token ? (
        <button
          onClick={takeToken}
          disabled={loading}
          className="form-button"
        >
          {loading ? "Processing..." : "Take Token"}
        </button>
      ) : (
        <div className="queue-info">
          <h3>Your Token: #{token}</h3>
          <p>Customers Ahead: {customersAhead}</p>
          <p>Estimated Waiting Time: {estimatedTime} minutes</p>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
