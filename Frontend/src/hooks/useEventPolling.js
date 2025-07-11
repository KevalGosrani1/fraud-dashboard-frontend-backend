import { useEffect, useState } from 'react';
import { fetchRecentEvents } from '../api/eventApi';

export function useEventPolling(intervalMs = 5000) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchRecentEvents();
        if (mounted) setEvents(data);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { events, loading };
}
