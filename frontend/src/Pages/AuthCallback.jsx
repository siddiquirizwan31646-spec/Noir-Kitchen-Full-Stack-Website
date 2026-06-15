// src/Pages/AuthCallback.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthCallback({ onSuccess }) {
  const [status, setStatus] = useState("verifying");
  const navigate = useNavigate();
  const calledRef = useRef(false); // prevent double-call in React StrictMode

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const error  = params.get("error");

    if (error || !token) {
      setStatus("error");
      setTimeout(() => navigate("/login?error=google_failed", { replace: true }), 2000);
      return;
    }

    // Store token immediately so PrivateRoute sees it
    localStorage.setItem("token", token);

    fetch(`${API}/api/auth/me`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          // ── KEY FIX: call onSuccess immediately (no delay)
          // App.jsx sets user state + navigates to /dashboard inside handleLoginSuccess
          onSuccess?.({ token, user: data.user });
        } else {
          localStorage.removeItem("token");
          setStatus("error");
          setTimeout(() => navigate("/login?error=google_failed", { replace: true }), 2000);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setStatus("error");
        setTimeout(() => navigate("/login?error=google_failed", { replace: true }), 2000);
      });
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.grain} />
      <div style={styles.ringOuter} />
      <div style={styles.ringInner} />

      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🍽</span>
          <span style={styles.logoText}>Noir Kitchen</span>
        </div>

        {status === "verifying" && (
          <>
            <Spinner />
            <p style={styles.heading}>Signing you in…</p>
            <p style={styles.sub}>Verifying your Google account</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.heading}>Welcome back</p>
            <p style={styles.sub}>Taking you to your dashboard…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={styles.errorIcon}>✕</div>
            <p style={styles.heading}>Authentication failed</p>
            <p style={styles.sub}>Redirecting you back to login…</p>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%   { transform: translate(-50%,-50%) scale(0.85); opacity: 0.5; }
          50%  { transform: translate(-50%,-50%) scale(1.05); opacity: 0.15; }
          100% { transform: translate(-50%,-50%) scale(0.85); opacity: 0.5; }
        }
        @keyframes fade-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pop { 0%{transform:scale(0.5);opacity:0;} 70%{transform:scale(1.15);} 100%{transform:scale(1);opacity:1;} }
      `}</style>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%",
      border: "2px solid rgba(196,81,10,0.2)",
      borderTopColor: "#C4510A",
      animation: "spin 0.9s linear infinite",
      margin: "0 auto 24px",
    }} />
  );
}

const styles = {
  page: { minHeight:"100vh", background:"#fdf8f4", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden" },
  grain: { position:"fixed", inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`, pointerEvents:"none", zIndex:0 },
  ringOuter: { position:"absolute", width:500, height:500, borderRadius:"50%", border:"1px solid rgba(196,81,10,0.08)", top:"50%", left:"50%", animation:"pulse-ring 4s ease-in-out infinite", zIndex:0 },
  ringInner: { position:"absolute", width:320, height:320, borderRadius:"50%", border:"1px solid rgba(196,81,10,0.12)", top:"50%", left:"50%", animation:"pulse-ring 4s ease-in-out infinite 0.8s", zIndex:0 },
  card: { position:"relative", zIndex:1, textAlign:"center", animation:"fade-in 0.5s ease both", padding:"0 24px" },
  logoRow: { display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:48 },
  logoIcon: { fontSize:22 },
  logoText: { fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#C4510A", letterSpacing:"0.08em", fontWeight:600 },
  heading: { fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:"#1A1A1A", margin:"0 0 8px", fontWeight:400, letterSpacing:"0.02em" },
  sub: { fontSize:13, color:"rgba(26,26,26,0.4)", margin:0, letterSpacing:"0.03em", fontWeight:300 },
  successIcon: { width:52, height:52, borderRadius:"50%", background:"rgba(196,81,10,0.08)", border:"1px solid rgba(196,81,10,0.4)", color:"#C4510A", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", animation:"pop 0.4s ease both" },
  errorIcon: { width:52, height:52, borderRadius:"50%", background:"rgba(220,60,60,0.1)", border:"1px solid rgba(220,60,60,0.3)", color:"#dc3c3c", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", animation:"pop 0.4s ease both" },
};