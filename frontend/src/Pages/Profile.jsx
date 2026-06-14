import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/auth/me`, {
      credentials: "include",
      headers: authHeaders(),
    })
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          setUser(data.user);
          setForm({ name: data.user.name, phone: data.user.phone || "" });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((u) => ({ ...u, ...data.user }));
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        setErrorMsg(data.message || "Update failed.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const handleLogout = async () => {
    await fetch(`${API}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
    });
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const authBadge = {
    otp: { label: "Email OTP", color: "#6b9fff" },
    google: { label: "Google", color: "#ea4335" },
    both: { label: "Email + Google", color: "#d4af37" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.grain} />
      <div style={styles.topBar}>
        <span style={styles.logoText}>🍽 The Grand Table</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>

      {loading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
        </div>
      ) : (
        <div style={styles.container}>
          {/* Avatar block */}
          <div style={styles.avatarSection}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarInitials}>{initials}</div>
            )}
            <h1 style={styles.userName}>{user?.name}</h1>
            <p style={styles.userEmail}>{user?.email}</p>
            {user?.authMethod && (
              <span
                style={{
                  ...styles.badge,
                  borderColor: authBadge[user.authMethod]?.color,
                  color: authBadge[user.authMethod]?.color,
                }}
              >
                {authBadge[user.authMethod]?.label}
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Stats row */}
          <div style={styles.statsRow}>
            <Stat label="Role" value={user?.role || "—"} />
            <Stat label="Logins" value={user?.loginCount ?? "—"} />
            <Stat
              label="Last login"
              value={
                user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"
              }
            />
            <Stat
              label="Member since"
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Edit form */}
          <div style={styles.formSection}>
            <h2 style={styles.sectionTitle}>Edit Profile</h2>

            <label style={styles.label}>Full name</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
            />

            <label style={styles.label}>Phone number</label>
            <input
              style={styles.input}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />

            {status === "error" && (
              <p style={styles.errorMsg}>{errorMsg}</p>
            )}

            <button
              style={{
                ...styles.saveBtn,
                opacity: status === "saving" ? 0.6 : 1,
                cursor: status === "saving" ? "not-allowed" : "pointer",
              }}
              onClick={handleSave}
              disabled={status === "saving"}
            >
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                ? "✓ Saved"
                : "Save changes"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        input::placeholder { color: rgba(245,240,232,0.2); }
        input:focus {
          outline: none;
          border-color: rgba(212,175,55,0.5) !important;
          background: rgba(212,175,55,0.04) !important;
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statStyles.block}>
      <span style={statStyles.value}>{value}</span>
      <span style={statStyles.label}>{label}</span>
    </div>
  );
}

const statStyles = {
  block: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    color: "#f5f0e8",
    fontWeight: 500,
    textTransform: "capitalize",
  },
  label: {
    fontSize: 11,
    color: "rgba(245,240,232,0.35)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
  },
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0d0c0a",
    fontFamily: "'DM Sans', sans-serif",
    color: "#f5f0e8",
    position: "relative",
  },
  grain: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid rgba(245,240,232,0.06)",
    position: "relative",
    zIndex: 1,
  },
  logoText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 18,
    color: "#d4af37",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },
  logoutBtn: {
    background: "none",
    border: "1px solid rgba(245,240,232,0.12)",
    color: "rgba(245,240,232,0.45)",
    padding: "6px 16px",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
    letterSpacing: "0.04em",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "80vh",
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "2px solid rgba(212,175,55,0.15)",
    borderTopColor: "#d4af37",
    animation: "spin 0.9s linear infinite",
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "48px 24px 80px",
    animation: "fade-up 0.5s ease both",
    position: "relative",
    zIndex: 1,
  },
  avatarSection: {
    textAlign: "center",
    marginBottom: 36,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "2px solid rgba(212,175,55,0.3)",
    marginBottom: 16,
    objectFit: "cover",
  },
  avatarInitials: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.3)",
    color: "#d4af37",
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    fontWeight: 500,
  },
  userName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 26,
    fontWeight: 400,
    margin: "0 0 4px",
    color: "#f5f0e8",
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(245,240,232,0.4)",
    margin: "0 0 12px",
    fontWeight: 300,
  },
  badge: {
    display: "inline-block",
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    background: "rgba(245,240,232,0.06)",
    margin: "28px 0",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    textAlign: "center",
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 400,
    margin: "0 0 24px",
    color: "#f5f0e8",
    letterSpacing: "0.02em",
  },
  label: {
    fontSize: 11,
    color: "rgba(245,240,232,0.4)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 8,
    fontWeight: 400,
  },
  input: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(245,240,232,0.1)",
    borderRadius: 6,
    padding: "12px 14px",
    color: "#f5f0e8",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 20,
    width: "100%",
    transition: "border-color 0.2s, background 0.2s",
  },
  errorMsg: {
    color: "#dc6b6b",
    fontSize: 13,
    margin: "-8px 0 16px",
  },
  saveBtn: {
    background: "#d4af37",
    color: "#0d0c0a",
    border: "none",
    borderRadius: 6,
    padding: "13px",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.06em",
    cursor: "pointer",
    marginTop: 4,
    transition: "opacity 0.2s",
  },
};