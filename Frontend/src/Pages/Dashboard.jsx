import React, { useEffect, useState } from "react";
import axios from "axios";
import EventDashboard from "../components/EventDashboard";

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/reports`);
        setReports(res.data?.results || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to load reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <div className="p-4">Loading reports...</div>;

  if (error)
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );

  if (reports.length === 0)
    return (
      <div className="p-4 text-gray-500">
        No reports found.
      </div>
    );

  return (
    <div className="p-4">
      <EventDashboard />
      <h1 className="text-xl font-bold mb-4">Fraud Reports</h1>
      <ul className="space-y-2">
        {reports.map((report) => (
          <li
            key={report._id}
            className="p-3 bg-white border rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-gray-600">{report.date || "Unknown Date"}</p>
              <p className="font-semibold">
                {report.walletAddress || "Unknown Wallet"}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                report.riskLevel === "high"
                  ? "bg-red-100 text-red-700"
                  : report.riskLevel === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {report.riskLevel || "unknown"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
