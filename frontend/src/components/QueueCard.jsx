import "./QueueCard.css";

const QueueCard = ({ token, status }) => {
  return (
    <div className="queue-card">
      <h2 className="queue-card-title">Token #{token}</h2>
      <p>
        Status:{" "}
        <span className={status === "Served" ? "status-served" : "status-pending"}>
          {status}
        </span>
      </p>
    </div>
  );
};

export default QueueCard;
