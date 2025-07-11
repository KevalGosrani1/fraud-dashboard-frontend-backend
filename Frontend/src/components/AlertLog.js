import { useEffect, useState } from "react";

export default function AlertLog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events?limit=20`);
        const data = await res.json();
        setEvents(data || []);
      } catch (err) {
        console.error("❌ Failed to load alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">🔔 Recent High-Risk Alerts</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">No alerts yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((evt) => (
            <li
              key={evt._id}
              className="p-3 border rounded bg-gray-50 text-sm"
            >
              <div><b>Wallet:</b> {evt.payload.walletAddress}</div>
              <div><b>Report ID:</b> {evt.payload.reportId}</div>
              <div><b>At:</b> {new Date(evt.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
