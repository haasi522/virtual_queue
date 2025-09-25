import { useState } from "react";
import API from "../utils/api";

function CustomerPage() {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);

  const takeToken = async () => {
    setLoading(true);
    try {
      const { data } = await API.post("/queue/take-token"); 
      setTokenData(data);
    } catch (err) {
      alert("Error taking token: " + err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  return (
    <div className="customer-page">
      <h2>Welcome Customer</h2>

      {!tokenData ? (
        <button onClick={takeToken} disabled={loading}>
          {loading ? "Processing..." : "Take Token"}
        </button>
      ) : (
        <div className="token-info">
          <p><strong>Token Number:</strong> {tokenData.tokenNumber}</p>
          <p><strong>Customers Ahead:</strong> {tokenData.customersAhead}</p>
          <p><strong>Estimated Waiting Time:</strong> {tokenData.estimatedTime} mins</p>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
