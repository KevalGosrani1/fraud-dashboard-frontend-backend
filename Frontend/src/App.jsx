import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import WalletInput from "./components/WalletInput";
import Timeline from "./components/Timeline";
import OnChainStats from "./components/OnChainStats";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { flagWallet } from "./contract";
import { Link } from "react-router-dom";
import { useEventPolling } from "./hooks/useEventPolling"; // ✅ NEW IMPORT
import "./styles/Button.css";
import "./index.css";
import AlertLog from "./components/AlertLog";


function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState("");
  const [reason, setReason] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Live events polling
  const { events, loading: eventsLoading } = useEventPolling(5000);

  useEffect(() => {
    const restoreSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        setUser(sessionData.session.user);
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const fetchReports = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token || !user?.email) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports?user_email=${user.email}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (data?.results) {
        setReports(data.results);
        const latest = data.results[0];
        if (latest?.risk === "high") {
          toast.warn(`🔴 High-risk report: ${latest.wallet}`);
        }
      }
    } catch (err) {
      console.error("❌ Failed to fetch reports:", err.message);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchReports();
  }, [user, fetchReports]);

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Sign up successful!");
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      setUser(data.user);
      alert("Login successful!");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setReports([]);
    setWallet("");
    setReason("");
    setTransactionHash("");
    alert("Logged out successfully!");
  };

  const submitReport = async () => {
    if (!wallet) return alert("Please enter a valid wallet.");
    if (!reason.trim()) return alert("Please enter a reason for reporting.");

    const today = new Date().toISOString().split("T")[0];
    const count = JSON.parse(localStorage.getItem("reportCount") || "{}");
    if (!count[today]) count[today] = 0;
    if (count[today] >= 3) {
      toast.error("⚠️ Daily report limit (3) reached.");
      return;
    }

    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData?.session) {
      alert("Session expired. Please log in again.");
      await supabase.auth.signOut();
      setUser(null);
      return;
    }

    const token = sessionData.session.access_token;

    try {
      toast.info("⏳ Sending to smart contract...");
      const tx = await flagWallet(wallet);
      await tx.wait();
      toast.success("✅ Flag confirmed on-chain!");
      setTransactionHash(tx.hash);
    } catch (err) {
      console.error("❌ Contract error:", err);
      toast.error(`❌ Contract error: ${err.message || "Unknown error"}`);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_email: user.email,
            wallet,
            reason,
            status: "pending",
            date: today,
          }),
        }
      );

      if (response.ok) {
        toast.success("📨 Report submitted!");
        count[today]++;
        localStorage.setItem("reportCount", JSON.stringify(count));
        setReason("");
        fetchReports();
      } else {
        let errorText = "Unknown error";
        try {
          const err = await response.json();
          errorText = err?.error || "Unknown error";
        } catch (parseError) {
          errorText = await response.text();
        }
        alert("Failed to submit report: " + errorText);
        console.error("❌ Error submitting report:", errorText);
      }
    } catch (err) {
      alert("Failed to submit report: Network error");
      console.error("❌ Network error:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 md:px-8 py-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Incident Reporter</h1>
        <div className="text-center mb-4">
          <Link to="/public" className="text-blue-600 underline text-sm">
            🔎 Public Risk Checker (No Login)
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-600">Checking session...</p>
        ) : !user ? (
          <>
            <input
              type="email"
              placeholder="Email"
              className="border p-2 w-full mb-2 rounded-md text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="border p-2 w-full mb-4 rounded-md text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={signUp} className="btn btn-primary w-full sm:w-auto">
                Sign Up
              </button>
              <button onClick={signIn} className="btn btn-outline w-full sm:w-auto">
                Log In
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-2">
              Logged in as <b>{user.email}</b>
            </p>
            <div className="flex justify-between mb-4">
              <Link to="/admin" className="text-blue-500 underline text-sm">
                Go to Admin Dashboard
              </Link>
              <button onClick={signOut} className="text-red-600 underline text-sm">
                Sign Out
              </button>
            </div>

            <WalletInput onValid={(wallet) => setWallet(wallet)} />

            {wallet && (
              <div className="mt-4">
                <OnChainStats wallet={wallet} />
              </div>
            )}

            <label className="block mt-4 mb-1 font-semibold">
              Why do you think this wallet is suspicious?
            </label>
            <textarea
              className="border p-2 w-full mb-4 rounded"
              placeholder="Describe suspicious activity..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />

            <button onClick={submitReport} className="btn btn-primary w-full">
              Submit Report
            </button>

            {transactionHash && (
              <p className="mt-2 text-sm text-blue-600 underline text-center">
                <a
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Etherscan ↗
                </a>
              </p>
            )}

            <Timeline reports={reports} />

            {/* ✅ NEW: Live Flagged Wallet Events */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">🚨 Recent Flagged Wallet Events</h2>
              {eventsLoading ? (
                <p className="text-gray-600">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-gray-600">No events yet.</p>
              ) : (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <li
                      key={event._id}
                      className="border rounded p-2 bg-gray-50 text-sm"
                    >
                      <div><strong>Wallet:</strong> {event.payload.walletAddress}</div>
                      <div><strong>Report ID:</strong> {event.payload.reportId}</div>
                      <div><strong>Time:</strong> {new Date(event.createdAt).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <AlertLog />

            <footer className="text-center text-gray-500 text-sm mt-6">
              &copy; 2025 ChainSafeGuard | Built with ❤️ by Aryan & Keval
            </footer>
          </>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default HomePage;
