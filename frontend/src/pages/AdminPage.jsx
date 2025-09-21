import { useEffect, useState } from "react";
import API from "../utils/api";
import { Pie } from "react-chartjs-2";
import "chart.js/auto"; // required for react-chartjs-2
import "./AdminPage.css";

function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("analytics"); // default tab

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await API.get("/admin/employees");
      setEmployees(data);
    };

    const fetchAnalytics = async () => {
      const { data } = await API.get("/admin/analytics");
      setAnalytics(data);
    };

    const fetchCustomers = async () => {
      const { data } = await API.get("/admin/customers/today");
      setCustomers(data.customers || []);
    };

    fetchEmployees();
    fetchAnalytics();
    fetchCustomers();
  }, []);

  const removeEmployee = async (id) => {
    await API.delete(`/admin/employees/${id}`);
    setEmployees(employees.filter((e) => e._id !== id));
  };

  // Pie chart data
  const pieData = {
    labels: ["Served", "Pending"],
    datasets: [
      {
        data: [analytics?.served || 0, analytics?.pending || 0],
        backgroundColor: ["#4CAF50", "#F44336"],
      },
    ],
  };

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "analytics" ? "tab active" : "tab"}
          onClick={() => setActiveTab("analytics")}
        >
          Queue Analytics
        </button>
        <button
          className={activeTab === "customers" ? "tab active" : "tab"}
          onClick={() => setActiveTab("customers")}
        >
          Today's Customers
        </button>
        <button
          className={activeTab === "employees" ? "tab active" : "tab"}
          onClick={() => setActiveTab("employees")}
        >
          Employees
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === "analytics" && analytics && (
        <div className="analytics-tab">
          <div className="analytics">
            <h3>Queue Analytics</h3>
            <p>Total Customers: {analytics.totalCustomers}</p>
            <p>Served: {analytics.served}</p>
            <p>Pending: {analytics.pending}</p>
            <p>Avg Service Time: {analytics.avgServiceTime} mins</p>
            <p>Est. Time Remaining: {analytics.estTimeRemaining} mins</p>
          </div>

          <div className="chart-container">
            <h3>Customer Status</h3>
            <Pie data={pieData} />
          </div>

          <table className="table-common">
            <thead>
              <tr>
                <th>Day</th>
                <th>No. of Customers Served</th>
                <th>No. of Pending Customers</th>
              </tr>
            </thead>
            <tbody>
              {analytics.dailyStats?.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{day.served}</td>
                  <td>{day.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="customers-tab">
          <table className="table-common">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => (
                <tr key={cust._id}>
                  <td>{cust.name}</td>
                  <td>{cust.email}</td>
                  <td
                    className={
                      cust.status === "served"
                        ? "status-served"
                        : "status-pending"
                    }
                  >
                    {cust.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <div className="employees-tab">
          <table className="table-common">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Customers Served</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.servedToday || 0}</td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => removeEmployee(emp._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
