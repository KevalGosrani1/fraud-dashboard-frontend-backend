import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import RiskBadge from "../components/RiskBadge";
import { CopyToClipboard } from "react-copy-to-clipboard";
import LogsViewer from "../components/LogsViewer";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterEmail, setFilterEmail] = useState("");

  const fetchReports = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      alert("Unauthorized: Please log in again.");
      return;
    }

    const query = new URLSearchParams({
      ...(filter !== "all" && { risk: filter }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(sortBy && { sortBy }),
      ...(filterEmail && { user_email: filterEmail }),
    }).toString();

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data?.results) {
        setReports(data.results);
      } else {
        console.error("Error fetching reports:", data?.error || "Unknown error");
      }
    } catch (err) {
      console.error("❌ Admin report fetch error:", err.message);
    }
  }, [filter, fromDate, toDate, sortBy, filterEmail]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportCSV = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      alert("Unauthorized: Please log in again.");
      return;
    }

    const query = new URLSearchParams({
      ...(filter !== "all" && { riskLevel: filter }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(filterEmail && { user_email: filterEmail }),
      format: "csv",
    }).toString();

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports/export?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `fraud-reports-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("❌ Export CSV failed:", err.message);
      alert("Failed to export CSV: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 md:px-8 py-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-md shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">🛡️ Admin Dashboard</h1>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border p-2 rounded-md">
            <option value="all">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border p-2 rounded-md" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border p-2 rounded-md" />

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border p-2 rounded-md">
            <option value="date">Sort by Date</option>
            <option value="risk">Sort by Risk</option>
          </select>

          <input
            type="text"
            placeholder="Filter by Email"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            className="border p-2 rounded-md"
          />

          <button onClick={fetchReports} className="btn btn-primary">
            Apply Filters
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={exportCSV} className="btn btn-outline">
            Export CSV from Backend
          </button>

          <CopyToClipboard text={JSON.stringify(reports, null, 2)} onCopy={() => alert("✅ JSON copied to clipboard!")}>
            <button className="btn btn-outline">Copy JSON</button>
          </CopyToClipboard>
        </div>

        {/* Logs Viewer */}
        {reports.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Logs</h2>
            <LogsViewer />
          </div>
        )}

        {/* Report List */}
        {reports.length === 0 ? (
          <p className="text-gray-500 text-center">No reports found.</p>
        ) : (
          <ul className="space-y-3 mt-4">
            {reports.map((report, index) => (
              <li
                key={index}
                className="bg-white border rounded-md shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div>
                  <p className="text-sm text-gray-500">{report.date || "N/A"}</p>
                  <p className="text-lg font-semibold">
                    {report.wallet
                      ? `${report.wallet.slice(0, 6)}...${report.wallet.slice(-4)}`
                      : "Unknown Wallet"}
                  </p>
                  <p className="text-sm text-gray-400">
                    User: {report.user_email || "N/A"}
                  </p>
                </div>
                <RiskBadge level={report.risk || "unknown"} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
