import QueueCard from "./QueueCard";
import "./CounterDashboard.css";

const CounterDashboard = ({ queue }) => {
  return (
    <div className="counter-dashboard">
      {queue.length === 0 ? (
        <p>No tokens in the queue</p>
      ) : (
        queue.map((q) => <QueueCard key={q.token} token={q.token} status={q.status} />)
      )}
    </div>
  );
};

export default CounterDashboard;
