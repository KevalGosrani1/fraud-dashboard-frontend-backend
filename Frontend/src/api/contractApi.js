import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5050";
console.log("✅ Backend URL =", BASE_URL);

// Create axios instance with auth
const contractApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
contractApi.interceptors.request.use((config) => {
  const token = process.env.REACT_APP_AUTH_TOKEN || localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get on-chain report count
export const fetchOnChainReportCount = async () => {
  try {
    const response = await contractApi.get('/api/reports/onchain-count');
    return response.data.count; // assuming backend responds with { count: number }
  } catch (error) {
    console.error("❌ Failed to fetch on-chain count:", error);
    throw new Error("Smart contract unavailable.");
  }
};
