    // src/Pages/ReviewPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";

import {
  faStar as faStarSolid,
  faArrowRight,
  faQuoteLeft,
  faCheckCircle,
  faExclamationCircle,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faFilter,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarEmpty } from "@fortawesome/free-regular-svg-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reviews`;
const SORT_OPTIONS = [
  { value: "newest",  label: "Newest First" },
  { value: "oldest",  label: "Oldest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest",  label: "Lowest Rated" },
];
const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];


/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}
function avatarColor(name = "") {
  const colors = [
    ["#C4510A","#E8763A"], ["#7C3AED","#A78BFA"],
    ["#059669","#34D399"], ["#DC2626","#F87171"],
    ["#D97706","#FCD34D"], ["#2563EB","#60A5FA"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

/* ═══════════════════════════════════════════════════
   STAR DISPLAY (read-only)
═══════════════════════════════════════════════════ */
function StarDisplay({ rating, size = 14, color = "#C4510A" }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <FontAwesomeIcon
          key={n}
          icon={n <= rating ? faStarSolid : faStarEmpty}
          style={{ fontSize: size, color: n <= rating ? color : "#D1C5B8" }}
        />
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   STAR INPUT (interactive)
═══════════════════════════════════════════════════ */
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 2,
            transform: active >= n ? "scale(1.15)" : "scale(1)",
            transition: "transform 0.15s ease",
          }}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <FontAwesomeIcon
            icon={active >= n ? faStarSolid : faStarEmpty}
            style={{
              fontSize: 32,
              color: active >= n ? "#C4510A" : "#D1C5B8",
              filter: active >= n ? "drop-shadow(0 2px 6px rgba(196,81,10,0.4))" : "none",
              transition: "color 0.15s ease, filter 0.15s ease",
            }}
          />
        </button>
      ))}
      {active > 0 && (
        <span style={{
          fontSize: 13, fontWeight: 600, color: "#C4510A",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginLeft: 4, opacity: 0.9,
        }}>
          {STAR_LABELS[active]}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REVIEW CARD
═══════════════════════════════════════════════════ */
function ReviewCard({ review }) {
  const [c1, c2] = avatarColor(review.user?.name || "U");
  return (
    <div className="rv-card">
      <div className="rv-card-header">
        <div className="rv-avatar" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
          {getInitials(review.user?.name)}
        </div>
        <div className="rv-card-meta">
          <span className="rv-card-name">{review.user?.name || "Anonymous"}</span>
          <span className="rv-card-date">{formatDate(review.createdAt)}</span>
        </div>
        <div className="rv-card-stars">
          <StarDisplay rating={review.rating} size={13} />
        </div>
      </div>
      <div className="rv-card-quote">
        <FontAwesomeIcon icon={faQuoteLeft} style={{ fontSize: 14, color: "#C4510A", opacity: 0.4, marginRight: 8 }} />
        <p className="rv-card-msg">{review.message}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STATS PANEL
═══════════════════════════════════════════════════ */
function StatsPanel({ stats }) {
  if (!stats) return null;
  const { avgRating, total, distribution } = stats;
  return (
    <div className="rv-stats-wrap">
      <div className="rv-stats-avg">
        <span className="rv-stats-num">{avgRating.toFixed(1)}</span>
        <StarDisplay rating={Math.round(avgRating)} size={18} />
        <span className="rv-stats-total">{total} review{total !== 1 ? "s" : ""}</span>
      </div>
      <div className="rv-stats-bars">
        {[5,4,3,2,1].map(n => {
          const count = distribution[n] || 0;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={n} className="rv-bar-row">
              <span className="rv-bar-label">{n}</span>
              <FontAwesomeIcon icon={faStarSolid} style={{ fontSize: 10, color: "#C4510A" }} />
              <div className="rv-bar-track">
                <div className="rv-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="rv-bar-pct">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default function ReviewPage({ user, onLogout, cart }) {
  /* ── form state ── */
  const [rating,  setRating]  = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // {type:'success'|'error', msg}
  const navigate = useNavigate();

  /* ── reviews list state ── */
  const [reviews,    setReviews]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [sort,       setSort]       = useState("newest");
  const [page,       setPage]       = useState(1);

  const heroRef = useRef();

  const userName  = user?.name  || user?.email?.split("@")[0] || "";
const userEmail = user?.email || "";
const handleLogout = () => {
  localStorage.removeItem("token");
  onLogout?.();
  navigate("/");
};

  /* ── fetch reviews ── */
  const fetchReviews = useCallback(async (pg = 1, sortBy = "newest") => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}?page=${pg}&limit=6&sort=${sortBy}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch {
      /* silent — list just stays empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(1, "newest"); }, [fetchReviews]);

  /* ── GSAP hero entrance ── */
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".rv-hero-pill",  { scale:0.7, opacity:0 }, { scale:1, opacity:1, duration:0.5, ease:"back.out(2)" });
      gsap.fromTo(".rv-hero-h1",    { y:-40, opacity:0 }, { y:0, opacity:1, duration:0.6, ease:"back.out(1.7)", delay:0.1, stagger:0.1 });
      gsap.fromTo(".rv-hero-sub",   { y:20, opacity:0 },  { y:0, opacity:1, duration:0.5, delay:0.4 });
      gsap.fromTo(".rv-form-card",  { y:60, opacity:0, scale:0.97 }, { y:0, opacity:1, scale:1, duration:0.65, ease:"back.out(1.5)", delay:0.5 });
      gsap.fromTo(".rv-stats-wrap", { x:-40, opacity:0 }, { x:0, opacity:1, duration:0.6, ease:"power3.out",
        scrollTrigger:{ trigger:".rv-stats-wrap", start:"top 85%" } });
      gsap.fromTo(".rv-card",       { y:40, opacity:0 },  { y:0, opacity:1, duration:0.5, ease:"back.out(1.4)", stagger:0.08,
        scrollTrigger:{ trigger:".rv-cards-grid", start:"top 88%" } });
    }, heroRef);
    return () => ctx.revert();
  }, [reviews]); // re-run when reviews load so cards animate

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setSubmitStatus({ type:"error", msg:"Please select a star rating." }); return; }
    if (message.trim().length < 10) { setSubmitStatus({ type:"error", msg:"Message must be at least 10 characters." }); return; }

    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const res  = await fetch(API_BASE, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:    userName || "Guest",
          email:   userEmail || "guest@noirkitchen.com",
          userId:  user?._id || user?.id || null,
          rating,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus({ type:"success", msg:"Thank you! Your review has been posted." });
        setRating(0);
        setMessage("");
        fetchReviews(1, sort);
        setPage(1);
      } else {
        setSubmitStatus({ type:"error", msg: data.message || "Something went wrong." });
      }
    } catch {
      setSubmitStatus({ type:"error", msg:"Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── sort change ── */
  const handleSort = (val) => {
    setSort(val);
    setPage(1);
    fetchReviews(1, val);
  };

  /* ── page change ── */
  const handlePage = (pg) => {
    setPage(pg);
    fetchReviews(pg, sort);
    document.querySelector(".rv-list-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div ref={heroRef} className="rv-root">

  {/* ── FULL PAGE BACKGROUND ── */}
  <img
    src="https://i.postimg.cc/Mpctm9rd/Chat-GPT-Image-Jun-11-2026-05-25-34-PM.png"
    alt="" aria-hidden
    style={{
      position: "fixed",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 0,
      pointerEvents: "none",
    }}
  />

<div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker />
    
<Navbar
  user={user}
  onLogout={handleLogout}
  activeNav="Review"
  cart={cart}
  setActiveNav={() => {}}
/>
  </div>

<div className="rv-hero">
  <div className="rv-hero-overlay" />
          <div className="rv-hero-content">
            <div className="rv-hero-pill">
              <FontAwesomeIcon icon={faUtensils} style={{ color:"#C4510A", fontSize:11 }} />
              <span>Share Your Experience</span>
            </div>
            <h1 className="rv-hero-h1">
              <span className="rv-hero-h1">Your Voice</span>
              <span className="rv-hero-h1" style={{ fontStyle:"italic", color:"#C4510A" }}>Matters to Us</span>
            </h1>
            <p className="rv-hero-sub">Every review helps us craft a better experience for every guest.</p>
          </div>
        </div>

        {/* ── FORM CARD ── */}
        <div className="rv-form-section">
          <form className="rv-form-card" onSubmit={handleSubmit} noValidate>
            <div className="rv-form-top">
              <h2 className="rv-form-title">Write a Review</h2>
              <p className="rv-form-subtitle">Logged in as <strong>{userName || "Guest"}</strong></p>
            </div>

            {/* Star input */}
            <div className="rv-field">
              <label className="rv-label">Your Rating <span style={{color:"#C4510A"}}>*</span></label>
              <StarInput value={rating} onChange={setRating} />
            </div>

            {/* Message */}
            <div className="rv-field">
              <label className="rv-label">
                Your Review <span style={{color:"#C4510A"}}>*</span>
                <span className="rv-char-count">{message.length}/1000</span>
              </label>
              <textarea
                className="rv-textarea"
                placeholder="Tell us about your experience — the food, ambience, service…"
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, 1000))}
                rows={4}
                required
              />
            </div>

            {/* Status message */}
            {submitStatus && (
              <div className={`rv-status rv-status-${submitStatus.type}`}>
                <FontAwesomeIcon icon={submitStatus.type === "success" ? faCheckCircle : faExclamationCircle} />
                <span>{submitStatus.msg}</span>
              </div>
            )}

            <button type="submit" className="rv-submit-btn" disabled={submitting}>
              {submitting
                ? <><FontAwesomeIcon icon={faSpinner} spin /> Submitting…</>
                : <>Submit Review <FontAwesomeIcon icon={faArrowRight} /></>
              }
            </button>
          </form>
        </div>

        {/* ── REVIEWS LIST ── */}
        <div className="rv-list-section">

          {/* Stats + Sort row */}
          <div className="rv-list-header">
            <StatsPanel stats={stats} />

            <div className="rv-sort-wrap">
              <FontAwesomeIcon icon={faFilter} style={{ color:"#C4510A", fontSize:13 }} />
              <select
                className="rv-sort-select"
                value={sort}
                onChange={e => handleSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="rv-loading">
              <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize:28, color:"#C4510A" }} />
              <span>Loading reviews…</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rv-empty">
              <div style={{ fontSize:52, marginBottom:12 }}>🍽️</div>
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="rv-cards-grid">
              {reviews.map(rv => <ReviewCard key={rv._id} review={rv} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="rv-pagination">
              <button
                className="rv-pg-btn"
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  className={`rv-pg-btn${pg === page ? " active" : ""}`}
                  onClick={() => handlePage(pg)}
                >
                  {pg}
                </button>
              ))}
              <button
                className="rv-pg-btn"
                disabled={page >= pagination.pages}
                onClick={() => handlePage(page + 1)}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </div>

      </div>

      <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── ROOT ── */
        .rv-root {
  min-height: 100vh;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative;
}
    /* ── HERO ── */
    .rv-hero {
      position: relative;
      height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .rv-hero-overlay {
      display: none;
    }
    .rv-hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 0 24px;
    }
    .rv-hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(196,81,10,0.3);
      border-radius: 50px;
      padding: 6px 16px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #C4510A;
      margin-bottom: 20px;
    }
    .rv-hero-h1 {
      display: block;
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(36px, 5vw, 62px);
      font-weight: 600;
      line-height: 1.1;
      color: #1A1A1A;
      letter-spacing: -0.01em;
    }
    .rv-hero-sub {
      margin-top: 14px;
      font-size: 14px;
      color: #6B6560;
      line-height: 1.6;
    }

    /* ── FORM SECTION ── */
    .rv-form-section {
      display: flex;
      justify-content: center;
      padding: 0 24px;
      margin-top: -32px;
      position: relative;
      z-index: 10;
    }
    .rv-form-card {
      width: 100%;
      max-width: 680px;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.45);
      border-top: 1px solid rgba(255, 255, 255, 0.65);
      border-left: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 24px;
      padding: 36px 40px;
      box-shadow:
        0 12px 48px rgba(196, 81, 10, 0.1),
        0 4px 16px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }
    .rv-form-top {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(196,81,10,0.1);
    }
    .rv-form-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 600;
      color: #1A1A1A;
      margin-bottom: 4px;
    }
    .rv-form-subtitle {
      font-size: 12px;
      color: #9CA3AF;
    }
    .rv-form-subtitle strong { color: #C4510A; font-weight: 600; }

    /* ── FIELDS ── */
    .rv-field {
      margin-bottom: 22px;
    }
    .rv-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6B6560;
      margin-bottom: 10px;
    }
    .rv-char-count {
      font-size: 11px;
      font-weight: 400;
      color: #9CA3AF;
      text-transform: none;
      letter-spacing: 0;
    }
    .rv-textarea {
      width: 100%;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1.5px solid rgba(196, 81, 10, 0.2);
      border-radius: 14px;
      padding: 14px 16px;
      font-size: 13px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1A1A1A;
      resize: vertical;
      min-height: 110px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      line-height: 1.65;
    }
    .rv-textarea::placeholder { color: #C5B8B0; }
    .rv-textarea:focus {
      border-color: #C4510A;
      background: rgba(255, 255, 255, 0.7);
      box-shadow: 0 0 0 3px rgba(196, 81, 10, 0.08);
    }

    /* ── STATUS ── */
    .rv-status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 18px;
    }
    .rv-status-success {
      background: rgba(5, 150, 105, 0.1);
      border: 1px solid rgba(5, 150, 105, 0.25);
      color: #065F46;
    }
    .rv-status-error {
      background: rgba(220, 38, 38, 0.08);
      border: 1px solid rgba(220, 38, 38, 0.2);
      color: #991B1B;
    }

    /* ── SUBMIT BUTTON ── */
    .rv-submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #C4510A, #E8763A);
      color: #fff;
      border: none;
      padding: 14px 28px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(196, 81, 10, 0.3);
      transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
      letter-spacing: 0.03em;
    }
    .rv-submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(196, 81, 10, 0.42);
    }
    .rv-submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }

    /* ── LIST SECTION ── */
    .rv-list-section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 52px 40px 80px;
    }
    .rv-list-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 36px;
    }

    /* ── STATS ── */
    .rv-stats-wrap {
      display: flex;
      align-items: center;
      gap: 32px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-top: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 20px;
      padding: 20px 28px;
      box-shadow: 0 4px 24px rgba(196,81,10,0.07), inset 0 1px 0 rgba(255,255,255,0.6);
      flex-wrap: wrap;
      gap: 20px;
    }
    .rv-stats-avg {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding-right: 24px;
      border-right: 1px solid rgba(196,81,10,0.12);
    }
    .rv-stats-num {
      font-family: 'Cormorant Garamond', serif;
      font-size: 48px;
      font-weight: 600;
      color: #1A1A1A;
      line-height: 1;
    }
    .rv-stats-total {
      font-size: 11px;
      color: #9CA3AF;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .rv-stats-bars {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 180px;
    }
    .rv-bar-row {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .rv-bar-label {
      font-size: 11px;
      font-weight: 700;
      color: #6B6560;
      width: 8px;
      text-align: right;
    }
    .rv-bar-track {
      flex: 1;
      height: 6px;
      background: rgba(196,81,10,0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    .rv-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #C4510A, #E8763A);
      border-radius: 4px;
      transition: width 0.6s ease;
    }
    .rv-bar-pct {
      font-size: 11px;
      color: #9CA3AF;
      font-weight: 600;
      min-width: 20px;
      text-align: right;
    }

    /* ── SORT ── */
    .rv-sort-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.4);
      border-radius: 12px;
      padding: 10px 16px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
    }
    .rv-sort-select {
      background: transparent;
      border: none;
      outline: none;
      font-size: 13px;
      font-weight: 600;
      color: #1A1A1A;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
    }

    /* ── CARDS GRID ── */
    .rv-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    /* ── REVIEW CARD ── */
    .rv-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-top: 1px solid rgba(255, 255, 255, 0.6);
      border-left: 1px solid rgba(255, 255, 255, 0.45);
      border-radius: 20px;
      padding: 22px 24px;
      box-shadow:
        0 6px 28px rgba(196, 81, 10, 0.07),
        0 2px 8px rgba(0,0,0,0.04),
        inset 0 1px 0 rgba(255,255,255,0.65);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
    }
    .rv-card:hover {
      transform: translateY(-5px) scale(1.01);
      box-shadow:
        0 14px 36px rgba(196,81,10,0.13),
        0 4px 12px rgba(0,0,0,0.06),
        inset 0 1px 0 rgba(255,255,255,0.7);
    }
    .rv-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .rv-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .rv-card-meta {
      flex: 1;
      min-width: 0;
    }
    .rv-card-name {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: #1A1A1A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rv-card-date {
      font-size: 11px;
      color: #9CA3AF;
      font-weight: 500;
    }
    .rv-card-stars { flex-shrink: 0; }
    .rv-card-quote {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      padding-top: 12px;
      border-top: 1px solid rgba(196,81,10,0.08);
    }
    .rv-card-msg {
      font-size: 13px;
      color: #4A4540;
      line-height: 1.7;
      flex: 1;
    }

    /* ── LOADING / EMPTY ── */
    .rv-loading, .rv-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 14px;
      color: #9CA3AF;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
    }

    /* ── PAGINATION ── */
    .rv-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 40px;
    }
    .rv-pg-btn {
      min-width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1.5px solid rgba(196,81,10,0.2);
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #1A1A1A;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
    }
    .rv-pg-btn:hover:not(:disabled) {
      background: rgba(196,81,10,0.08);
      border-color: #C4510A;
      transform: scale(1.05);
    }
    .rv-pg-btn.active {
      background: linear-gradient(135deg, #C4510A, #E8763A);
      border-color: transparent;
      color: #fff;
      box-shadow: 0 4px 14px rgba(196,81,10,0.35);
    }
    .rv-pg-btn:disabled { opacity: 0.3; cursor: default; }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .rv-hero { height: 260px; }
      .rv-form-card { padding: 28px 24px; }
      .rv-list-section { padding: 40px 20px 60px; }
      .rv-list-header { flex-direction: column; align-items: stretch; }
      .rv-stats-wrap { padding: 16px 18px; }
    }
    @media (max-width: 480px) {
      .rv-hero { height: 280px; }
      .rv-hero-h1 { font-size: 30px; }
      .rv-form-section { padding: 0 14px; }
      .rv-form-card { padding: 22px 18px; border-radius: 18px; }
      .rv-cards-grid { grid-template-columns: 1fr; }
      .rv-stats-avg { border-right: none; padding-right: 0; }
    }
  `}</style>
    </>
  );
}