
import { useState, useEffect, useRef } from "react";
 
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const didFetch = useRef(false);
 
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
 
    const url = `${API_BASE}/api/notifications/active`;
    console.log("[Notifications] fetching →", url);
 
    fetch(url)
      .then((r) => {
        console.log("[Notifications] HTTP status:", r.status);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        console.log("[Notifications] raw response:", data);
 
        // Guard: make sure we actually got an array
        const list = Array.isArray(data?.notifications) ? data.notifications : [];
        console.log(`[Notifications] loaded ${list.length} item(s):`, list.map(n => n.title));
        setNotifications(list);
      })
      .catch((err) => {
        console.error("[Notifications] fetch failed:", err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);
 
  return { notifications, loading, error };
}