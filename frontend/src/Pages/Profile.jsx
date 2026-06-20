import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FONT_LINK =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

const FA_LINK =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";

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
    otp: { label: "Email OTP", color: "#1565C0", icon: "fa-solid fa-key" },
    google: { label: "Google", color: "#D32F2F", icon: "fa-brands fa-google" },
    both: { label: "Email + Google", color: "#D86A1C", icon: "fa-solid fa-shield-halved" },
  };
  const badgeInfo = user?.authMethod ? authBadge[user.authMethod] : null;

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <link href={FA_LINK} rel="stylesheet" />
      <div className="pf-root">
        <div className="pf-topbar">
          <span className="pf-logo">
            <img
              src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
              alt="Noir Kitchen"
              className="pf-logo-img"
            />
            Noir Kitchen
          </span>
          <button className="pf-logout-btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            Sign out
          </button>
        </div>

        {loading ? (
          <div className="pf-center">
            <div className="pf-spinner" />
          </div>
        ) : (
          <div className="pf-container">
            {/* Avatar block */}
            <div className="pf-avatar-section">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="pf-avatar-img" />
              ) : (
                <div className="pf-avatar-initials">{initials}</div>
              )}
              <h1 className="pf-username">{user?.name}</h1>
              <p className="pf-useremail">{user?.email}</p>
              {badgeInfo && (
                <span
                  className="pf-badge"
                  style={{ borderColor: badgeInfo.color, color: badgeInfo.color }}
                >
                  <i className={badgeInfo.icon} />
                  {badgeInfo.label}
                </span>
              )}
            </div>

            <div className="pf-divider" />

            {/* Stats row */}
            <div className="pf-stats-row">
              <Stat icon="fa-solid fa-user-tag" label="Role" value={user?.role || "—"} />
              <Stat icon="fa-solid fa-arrow-right-to-bracket" label="Logins" value={user?.loginCount ?? "—"} />
              <Stat
                icon="fa-regular fa-clock"
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
                icon="fa-regular fa-calendar"
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

            <div className="pf-divider" />

            {/* Edit form */}
            <div className="pf-form-section">
              <h2 className="pf-section-title">Edit Profile</h2>

              <label className="pf-label">Full name</label>
              <input
                className="pf-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
              />

              <label className="pf-label">Phone number</label>
              <input
                className="pf-input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />

              {status === "error" && <p className="pf-error-msg">{errorMsg}</p>}

              <button
                className={`pf-save-btn ${status === "saving" ? "pf-save-btn-saving" : ""} ${status === "saved" ? "pf-save-btn-saved" : ""}`}
                onClick={handleSave}
                disabled={status === "saving"}
              >
                {status === "saving" ? (
                  <><span className="pf-btn-spinner" /> Saving…</>
                ) : status === "saved" ? (
                  <><i className="fa-solid fa-check" /> Saved</>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </div>
        )}

        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          @keyframes pfSpin { to { transform: rotate(360deg); } }
          @keyframes pfFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .pf-root {
            min-height: 100vh;
            background: #F8F1EA;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #1A1208;
            position: relative;
          }

          .pf-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 32px;
            border-bottom: 1px solid rgba(216,106,28,0.12);
            background: #fff;
          }
          .pf-logo {
            font-family: 'Cormorant Garamond', serif;
            font-size: 19px;
            color: #D86A1C;
            letter-spacing: 0.02em;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }
          .pf-logo i { font-size: 16px; }
          .pf-logo-img {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
          }
          .pf-logout-btn {
            background: none;
            border: 1.5px solid rgba(216,106,28,0.25);
            color: #9A8570;
            padding: 8px 18px;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            letter-spacing: 0.02em;
            font-family: 'Plus Jakarta Sans', sans-serif;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .pf-logout-btn:hover {
            border-color: #D86A1C;
            color: #D86A1C;
            background: rgba(216,106,28,0.06);
          }

          .pf-center {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 80vh;
          }
          .pf-spinner {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 3px solid rgba(216,106,28,0.15);
            border-top-color: #D86A1C;
            animation: pfSpin 0.8s linear infinite;
          }

          .pf-container {
            max-width: 560px;
            margin: 0 auto;
            padding: 48px 24px 80px;
            animation: pfFadeUp 0.5s ease both;
          }

          .pf-avatar-section { text-align: center; margin-bottom: 32px; }
          .pf-avatar-img {
            width: 84px; height: 84px; border-radius: 50%;
            border: 2.5px solid rgba(216,106,28,0.3);
            margin-bottom: 16px; object-fit: cover;
            box-shadow: 0 8px 24px rgba(216,106,28,0.15);
          }
          .pf-avatar-initials {
            width: 84px; height: 84px; border-radius: 50%;
            background: rgba(216,106,28,0.1);
            border: 1.5px solid rgba(216,106,28,0.3);
            color: #D86A1C;
            font-family: 'Cormorant Garamond', serif;
            font-size: 30px; font-weight: 600;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 16px;
          }
          .pf-username {
            font-family: 'Cormorant Garamond', serif;
            font-size: 30px; font-weight: 600;
            margin: 0 0 4px; color: #1A1208;
          }
          .pf-useremail {
            font-size: 13px; color: #9A8570;
            margin: 0 0 14px; font-weight: 400;
          }
          .pf-badge {
            display: inline-flex; align-items: center; gap: 7px;
            font-size: 11px; font-weight: 700;
            padding: 5px 14px; border-radius: 20px;
            border: 1.5px solid;
            letter-spacing: 0.04em; text-transform: uppercase;
            background: rgba(255,255,255,0.6);
          }

          .pf-divider { height: 1px; background: rgba(216,106,28,0.12); margin: 28px 0; }

          .pf-stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            text-align: center;
          }
          .pf-stat-block {
            display: flex; flex-direction: column; align-items: center; gap: 6px;
            background: #fff; border-radius: 14px; padding: 16px 10px;
            border: 1px solid rgba(216,106,28,0.1);
            box-shadow: 0 3px 12px rgba(0,0,0,0.04);
          }
          .pf-stat-icon { color: #D86A1C; font-size: 14px; margin-bottom: 2px; }
          .pf-stat-value {
            font-family: 'Cormorant Garamond', serif;
            font-size: 19px; color: #1A1208; font-weight: 600;
            text-transform: capitalize;
          }
          .pf-stat-label {
            font-size: 10px; color: #9A8570;
            letter-spacing: 0.08em; text-transform: uppercase;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }

          .pf-form-section { display: flex; flex-direction: column; }
          .pf-section-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 22px; font-weight: 600;
            margin: 0 0 22px; color: #1A1208;
          }
          .pf-label {
            font-size: 11px; color: #9A8570;
            letter-spacing: 1.5px; text-transform: uppercase;
            margin-bottom: 8px; font-weight: 700;
          }
          .pf-input {
            background: #fff;
            border: 1.5px solid rgba(216,106,28,0.2);
            border-radius: 12px;
            padding: 13px 14px;
            color: #1A1208;
            font-size: 14px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            margin-bottom: 20px;
            width: 100%;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
          }
          .pf-input::placeholder { color: #C4B09A; }
          .pf-input:focus {
            border-color: #D86A1C;
            box-shadow: 0 0 0 3px rgba(216,106,28,0.1);
          }

          .pf-error-msg { color: #D32F2F; font-size: 13px; margin: -8px 0 16px; font-weight: 500; }

          .pf-save-btn {
            background: linear-gradient(135deg,#D86A1C,#F0924A);
            color: #fff;
            border: none;
            border-radius: 50px;
            padding: 14px;
            font-size: 13px;
            font-weight: 700;
            font-family: 'Plus Jakarta Sans', sans-serif;
            letter-spacing: 0.04em;
            cursor: pointer;
            margin-top: 4px;
            box-shadow: 0 8px 24px rgba(216,106,28,0.3);
            transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          }
          .pf-save-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(216,106,28,0.4);
          }
          .pf-save-btn:disabled { cursor: not-allowed; }
          .pf-save-btn-saving { opacity: 0.7; }
          .pf-save-btn-saved { background: linear-gradient(135deg,#4CAF50,#66BB6A); box-shadow: 0 8px 24px rgba(76,175,80,0.3); }
          .pf-btn-spinner {
            width: 14px; height: 14px; border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
            animation: pfSpin 0.7s linear infinite;
          }

          @media (max-width: 560px) {
            .pf-topbar { padding: 16px 20px; }
            .pf-container { padding: 36px 18px 60px; }
            .pf-stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .pf-container { animation: none; }
          }
        `}</style>
      </div>
    </>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="pf-stat-block">
      {icon && <i className={`${icon} pf-stat-icon`} />}
      <span className="pf-stat-value">{value}</span>
      <span className="pf-stat-label">{label}</span>
    </div>
  );
}