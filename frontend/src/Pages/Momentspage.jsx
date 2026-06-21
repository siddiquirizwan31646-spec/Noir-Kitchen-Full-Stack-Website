import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";
import {
  faCamera, faHeart, faUtensils, faQuoteLeft, faSpinner, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const API_BASE = import.meta.env.VITE_API_URL || "";

/* ── Auto shape pattern — cycles regardless of DB shape field ── */
const SHAPE_PATTERN = [
  "portrait", "landscape", "square",
  "portrait", "wide",      "square",
  "tall",     "landscape", "square",
  "portrait", "landscape", "square",
];

const SHAPE_STYLE = {
  portrait:  { gridRow: "span 2", gridColumn: "span 1" },
  landscape: { gridRow: "span 1", gridColumn: "span 2" },
  square:    { gridRow: "span 1", gridColumn: "span 1" },
  wide:      { gridRow: "span 1", gridColumn: "span 3" },
  tall:      { gridRow: "span 3", gridColumn: "span 1" },
};

function getShape(index) {
  return SHAPE_PATTERN[index % SHAPE_PATTERN.length];
}

/* ══════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════ */
function Lightbox({ moment, onClose }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    );
    gsap.fromTo(contentRef.current,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out", delay: 0.05 }
    );
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleClose = useCallback(() => {
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.25, ease: "power2.in",
      onComplete: onClose,
    });
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="lb-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <button className="lb-close" onClick={handleClose} aria-label="Close">
        <FontAwesomeIcon icon={faXmark} />
      </button>

      <div ref={contentRef} className="lb-content">
        <img src={moment.src} alt={moment.caption} className="lb-img" />
        <div className="lb-details">
          <span className="lb-tag">{moment.tag}</span>
          <FontAwesomeIcon icon={faQuoteLeft} className="lb-quote-icon" />
          <p className="lb-caption">{moment.caption}</p>
          <div className="lb-heart">
            <FontAwesomeIcon icon={faHeart} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MOMENT CARD
══════════════════════════════════════════ */
function MomentCard({ moment, index, onOpen }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const shape = getShape(index);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 40, scale: 0.94, rotate: index % 2 === 0 ? -1.5 : 1.5 },
      {
        opacity: 1, y: 0, scale: 1, rotate: 0,
        duration: 0.7, ease: "power3.out", delay: index * 0.06,
        scrollTrigger: { trigger: cardRef.current, start: "top 90%" },
      }
    );
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="moment-card"
      style={SHAPE_STYLE[shape]}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(moment)}
    >
      <img
        src={moment.src}
        alt={moment.caption}
        className={`moment-img${hovered ? " hovered" : ""}`}
        loading="lazy"
      />
      <span className="moment-tag">{moment.tag}</span>
      <div className={`moment-overlay${hovered ? " visible" : ""}`}>
        <FontAwesomeIcon icon={faQuoteLeft} className="moment-quote-icon" />
        <p className="moment-caption">{moment.caption}</p>
        <div className="moment-heart">
          <FontAwesomeIcon icon={faHeart} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function MomentsPage({ user, onLogout, cart }) {
  const navigate = useNavigate();
  const pageRef  = useRef(null);
  const [moments,  setMoments]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/moments`);
        const json = await res.json();
        if (json.success) setMoments(json.data);
        else setError("Could not load moments.");
      } catch {
        setError("Network error — could not reach the server.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".mg-hero-pill",
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", delay: 0.15 });
      gsap.fromTo(".mg-hero-h1 span",
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: "back.out(1.7)", stagger: 0.12, delay: 0.25 });
      gsap.fromTo(".mg-hero-sub",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 0.55 });
      gsap.fromTo(".mg-hero-line",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, ease: "power3.out", delay: 0.45 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div ref={pageRef} className="mg-root">

        <img
          src="https://i.postimg.cc/Mpctm9rd/Chat-GPT-Image-Jun-11-2026-05-25-34-PM.png"
          alt="" aria-hidden
          style={{
            position: "fixed", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", zIndex: 0, pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker />
       <Navbar
          user={user}
          onLogout={onLogout || (() => { localStorage.removeItem("token"); navigate("/"); })}
          activeNav="Home"
          setActiveNav={() => {}}
          cart={cart}
        />
  </div>

        {/* HERO */}
        <section className="mg-hero">
          <div className="mg-hero-inner">
            <div className="mg-hero-pill">
              <FontAwesomeIcon icon={faCamera} style={{ color: "#C4510A", fontSize: 11 }} />
              <span>Noir Kitchen — Life Behind the Table</span>
            </div>
            <h1 className="mg-hero-h1">
              <span>Unforgettable</span>
              <span style={{ fontStyle: "italic", color: "#C4510A" }}>Experience</span>
            </h1>
            <div className="mg-hero-line" />
            <p className="mg-hero-sub">Moments that stay with you forever</p>
          </div>
        </section>

        {/* GALLERY */}
        <section className="mg-gallery-section">
          {loading && (
            <div className="mg-state">
              <FontAwesomeIcon icon={faSpinner} spin style={{ color: "#C4510A", fontSize: 28 }} />
            </div>
          )}
          {!loading && error && (
            <div className="mg-state">
              <p style={{ color: "#6B6560", fontStyle: "italic" }}>{error}</p>
            </div>
          )}
          {!loading && !error && moments.length === 0 && (
            <div className="mg-state">
              <p style={{ color: "#6B6560", fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
                No moments yet — check back soon.
              </p>
            </div>
          )}
          {!loading && moments.length > 0 && (
            <div className="mg-grid">
              {moments.map((m, i) => (
                <MomentCard key={m._id} moment={m} index={i} onOpen={setSelected} />
              ))}
            </div>
          )}
        </section>

        <footer className="mg-footer">
          <FontAwesomeIcon icon={faUtensils} style={{ color: "#C4510A", fontSize: 13 }} />
          <span>Noir Kitchen &nbsp;·&nbsp; Jaipur, Rajasthan</span>
          <span style={{ color: "#D1C5BF", fontSize: 11 }}>© {new Date().getFullYear()}</span>
        </footer>
      </div>

      {/* LIGHTBOX — rendered outside main div so it can cover everything */}
      {selected && (
        <Lightbox moment={selected} onClose={() => setSelected(null)} />
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mg-root {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }

        /* ── HERO ── */
        .mg-hero {
          position: relative; z-index: 1;
          padding: 110px 48px 64px;
          display: flex; align-items: center; justify-content: center;
        }
        .mg-hero-inner { text-align: center; }
        .mg-hero-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(196,81,10,0.3);
          border-radius: 50px;
          padding: 6px 18px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #C4510A; margin-bottom: 22px;
        }
        .mg-hero-h1 {
          display: flex; flex-direction: column;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(44px, 6vw, 80px);
          font-weight: 600; line-height: 1.06;
          color: #1A1A1A; letter-spacing: -0.01em;
        }
        .mg-hero-line {
          width: 60px; height: 2px;
          background: #C4510A;
          margin: 18px auto 16px;
          transform-origin: left;
        }
        .mg-hero-sub {
          font-size: 15px; color: #6B6560;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300; letter-spacing: 0.02em;
        }

        /* ── GALLERY ── */
        .mg-gallery-section {
          position: relative; z-index: 1;
          padding: 0 32px 80px;
          max-width: 1300px; margin: 0 auto;
        }
        .mg-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-auto-rows: 200px;
          gap: 10px;
        }
        .mg-state {
          display: flex; align-items: center; justify-content: center;
          min-height: 280px;
        }

        /* ── CARD ── */
        .moment-card {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08);
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .moment-card:hover {
          transform: scale(1.025) translateY(-4px);
          box-shadow: 0 16px 48px rgba(196,81,10,0.22), 0 4px 12px rgba(0,0,0,0.12);
          z-index: 10;
        }
        .moment-card:nth-child(5)  { rotate: -0.6deg; }
        .moment-card:nth-child(7)  { rotate:  0.5deg; }
        .moment-card:nth-child(10) { rotate: -0.4deg; }

        .moment-img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94), filter 0.4s ease;
          filter: brightness(0.92) saturate(1.05);
        }
        .moment-img.hovered {
          transform: scale(1.07);
          filter: brightness(0.55) saturate(1.1);
        }
        .moment-tag {
          position: absolute; top: 12px; left: 12px;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.45);
          border-radius: 50px;
          padding: 4px 10px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          color: #fff;
          pointer-events: none;
          text-shadow: 0 1px 4px rgba(0,0,0,0.4);
          transition: opacity 0.3s ease;
        }
        .moment-card:hover .moment-tag { opacity: 0; }
        .moment-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 20px;
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }
        .moment-overlay.visible { opacity: 1; pointer-events: auto; }
        .moment-quote-icon {
          color: rgba(255,255,255,0.5);
          font-size: 18px; margin-bottom: 10px;
          transform: translateY(6px);
          transition: transform 0.35s ease 0.05s;
        }
        .moment-overlay.visible .moment-quote-icon { transform: translateY(0); }
        .moment-caption {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(13px, 1.8vw, 18px);
          font-weight: 400; font-style: italic;
          color: #fff; text-align: center;
          line-height: 1.45;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
          transform: translateY(8px);
          transition: transform 0.35s ease 0.05s;
          letter-spacing: 0.01em;
        }
        .moment-overlay.visible .moment-caption { transform: translateY(0); }
        .moment-heart {
          margin-top: 12px; color: #C4510A;
          font-size: 14px;
          transform: scale(0.6); opacity: 0;
          transition: transform 0.3s ease 0.12s, opacity 0.3s ease 0.12s;
        }
        .moment-overlay.visible .moment-heart { transform: scale(1); opacity: 1; }

        /* ── LIGHTBOX ── */
        .lb-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(10, 8, 6, 0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .lb-close {
          position: fixed; top: 24px; right: 28px;
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 18px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s ease, transform 0.2s ease;
          z-index: 10000;
        }
        .lb-close:hover {
          background: rgba(196,81,10,0.6);
          transform: scale(1.08);
        }
        .lb-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: min(90vw, 1100px);
          max-height: 90vh;
          gap: 28px;
        }
        .lb-img {
          max-width: 100%;
          max-height: 72vh;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
        }
        .lb-details {
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          text-align: center;
        }
        .lb-tag {
          background: rgba(196,81,10,0.25);
          border: 1px solid rgba(196,81,10,0.5);
          border-radius: 50px;
          padding: 4px 14px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #E87A4A;
        }
        .lb-quote-icon {
          color: rgba(255,255,255,0.3);
          font-size: 16px;
        }
        .lb-caption {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(18px, 2.5vw, 28px);
          font-weight: 400; font-style: italic;
          color: #F5F0EB;
          line-height: 1.4;
          letter-spacing: 0.01em;
          max-width: 600px;
        }
        .lb-heart {
          color: #C4510A; font-size: 16px;
          margin-top: 4px;
        }

        /* ── FOOTER ── */
        .mg-footer {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center;
          gap: 10px;
          padding: 20px 48px 32px;
          font-size: 13px; color: #6B6560;
          border-top: 1px solid rgba(196,81,10,0.08);
          background: rgba(255,252,248,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .mg-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 180px; }
          .moment-card[style*="span 3"] { grid-column: span 2 !important; }
        }
        @media (max-width: 700px) {
          .mg-gallery-section { padding: 0 14px 60px; }
          .mg-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 160px; gap: 8px; }
          .moment-card[style*="span 2"],
          .moment-card[style*="span 3"] { grid-column: span 2 !important; }
          .moment-card[style*="row"][style*="span 3"] { grid-row: span 2 !important; }
          .mg-hero { padding: 90px 24px 48px; }
          .lb-content { max-height: 95vh; }
          .lb-img { max-height: 55vh; }
        }
        @media (max-width: 420px) {
          .mg-grid { grid-template-columns: 1fr 1fr; grid-auto-rows: 140px; }
          .mg-hero-h1 { font-size: 38px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .moment-img, .moment-overlay, .moment-caption,
          .moment-quote-icon, .moment-heart, .moment-card,
          .lb-overlay, .lb-content { transition: none !important; }
        }
      `}</style>
    </>
  );
}