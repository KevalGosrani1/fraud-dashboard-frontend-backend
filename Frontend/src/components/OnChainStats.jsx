import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const OnChainStats = ({ wallet }) => {
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!wallet) return;

    const fetchOnChainCount = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/contract/report-count/${wallet}`
        );
        const data = await res.json();

        if (res.ok && data?.count !== undefined) {
          setCount(data.count);
        } else {
          throw new Error(data?.error || "Invalid response");
        }
      } catch (err) {
        console.error("❌ Error fetching on-chain count:", err);
        toast.error("Failed to fetch on-chain report count. Using mock.");
        // ⛔ fallback to mock value
        setCount(1287);
      }
    };

    fetchOnChainCount();
  }, [wallet]);

  return (
    <div className="bg-blue-100 text-blue-800 p-4 rounded mt-6">
      <p className="text-sm font-semibold">📦 Total On-Chain Reports:</p>
      <p className="text-xl font-bold">
        {count !== null ? count : "Loading..."}
      </p>
    </div>
  );
};

export default OnChainStats;
