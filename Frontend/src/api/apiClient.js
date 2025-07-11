import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5050",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = process.env.REACT_APP_AUTH_TOKEN || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('❌ Authentication failed');
      // Optionally redirect to login or show error
    }
    return Promise.reject(error);
  }
);

export default apiClient;
