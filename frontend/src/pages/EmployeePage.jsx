import React, { useEffect, useState } from "react";
import API from "../utils/api";
import "./EmployeePage.css";

const EmployeePage = () => {
  const [queue, setQueue] = useState([]);

  const fetchQueue = async () => {
    try {
      const res = await API.get("/queue/all");
      setQueue(res.data);
    } catch (err) {
      console.error("Error fetching queue:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  const handleServe = async (token) => {
    try {
      await API.post(`/queue/serve/${token}`);
      fetchQueue(); // refresh queue after serving
    } catch (err) {
      console.error("Error serving token:", err);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Employee Dashboard</h2>
      <table className="queue-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Customer Email</th>
            <th>Status</th>
            <th>Customers Ahead</th>
            <th>Estimated Time (min)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {queue.length === 0 ? (
            <tr>
              <td colSpan="6">No customers in the queue</td>
            </tr>
          ) : (
            queue.map((q) => (
              <tr key={q.token}>
                <td>{q.token}</td>
                <td>{q.email}</td>
                <td
                  className={
                    q.status === "Served" ? "status-served" : "status-pending"
                  }
                >
                  {q.status}
                </td>
                <td>{q.pendingAhead}</td>
                <td>{q.estimatedTime}</td>
                <td>
                  {q.status === "Pending" && (
                    <button onClick={() => handleServe(q.token)}>Serve</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeePage;
