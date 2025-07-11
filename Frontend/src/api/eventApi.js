import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';

export async function fetchRecentEvents(limit = 10) {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/api/events?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
