export default function RiskBadge({ level }) {
  const color = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  }[level] || "bg-gray-100 text-gray-700";

  return (
    <span className={`px-3 py-1 rounded-full font-semibold text-sm ${color}`}>
      {level?.toUpperCase() || "UNKNOWN"}
    </span>
  );
}
