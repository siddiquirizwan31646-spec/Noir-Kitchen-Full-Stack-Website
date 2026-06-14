// src/Pages/ExpertChefsPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/ui/Navbar";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BADGE_IMG = "https://i.postimg.cc/jS9S94QM/Chat-GPT-Image-Jun-11-2026-06-31-54-PM.png";
const ROTATIONS = [-12, -15, 12, 15, -13, 14, -14, 13, 12, -15, 15, -12];

// ── Full-screen modal ──────────────────────────────────────────────────────────
function ChefModal({ chef, onClose }) {
    const overlayRef = useRef();
    const contentRef = useRef();

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // Animate in
    useEffect(() => {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
        gsap.fromTo(contentRef.current,
            { scale: 0.88, opacity: 0, y: 40 },
            { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" }
        );
    }, []);

    const handleClose = () => {
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, onComplete: onClose });
        gsap.to(contentRef.current, { scale: 0.9, opacity: 0, y: 30, duration: 0.25 });
    };

    // Close on backdrop click
    const handleBackdrop = (e) => {
        if (e.target === overlayRef.current) handleClose();
    };

    return (
        <div ref={overlayRef} className="ec-modal-overlay" onClick={handleBackdrop}>
            <div ref={contentRef} className="ec-modal-content">

                {/* Close btn */}
                <button className="ec-modal-close" onClick={handleClose} aria-label="Close">✕</button>

                {/* Image — top half */}
                <div className="ec-modal-img-wrap">
                    <img src={chef.image} alt={chef.name} className="ec-modal-img" />
                    <div className="ec-modal-img-fade" />
                </div>

                {/* Badge */}
                <div className="ec-modal-badge-wrap">
                    <img src={BADGE_IMG} alt="Noir Kitchen Badge" className="ec-modal-badge-img" />
                </div>

                {/* Info — bottom half glass */}
                <div className="ec-modal-info">
                    <p className="ec-role">{chef.role}</p>
                    <h2 className="ec-modal-name">{chef.name}</h2>
                    <div className="ec-divider" />
                    <p className="ec-modal-tagline">"{chef.tagline}"</p>
                    <p className="ec-modal-story">{chef.story}</p>
                    {chef.experience && (
                        <div className="ec-exp-pill">{chef.experience} yrs experience</div>
                    )}
                </div>

            </div>
        </div>
    );
}

// ── Card ───────────────────────────────────────────────────────────────────────
function ChefCard({ chef, index, onOpen }) {
    const ref = useRef();
    const rotate = ROTATIONS[index % ROTATIONS.length];

    useEffect(() => {
        if (!ref.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ref.current,
                { y: 80, opacity: 0, scale: 0.92 },
                {
                    y: 0, opacity: 1, scale: 1,
                    duration: 0.75,
                    ease: "back.out(1.4)",
                    delay: (index % 3) * 0.14,
                    scrollTrigger: { trigger: ref.current, start: "top 87%" },
                }
            );
        }, ref);
        return () => ctx.revert();
    }, [index]);

    return (
        <div
            ref={ref}
            className="ec-chef-card"
            style={{ "--rotate": `${rotate}deg`, transform: `rotate(${rotate}deg)` }}
            onClick={() => onOpen(chef)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && onOpen(chef)}
        >
            {/* Image fills entire card — NO overflow:hidden on card, clip via border-radius on img-wrap */}
            <div className="ec-img-wrap">
                <img src={chef.image} alt={chef.name} className="ec-chef-img" />
            </div>

            {/* Badge outside img-wrap so it's not clipped */}
            <div className="ec-badge-wrap">
                <img src={BADGE_IMG} alt="Noir Kitchen Badge" className="ec-badge-img" />
            </div>

            {/* Glass info overlay */}
            <div className="ec-info-card">
                <p className="ec-role">{chef.role}</p>
                <h3 className="ec-name">{chef.name}</h3>
                <div className="ec-divider" />
                <p className="ec-tagline">"{chef.tagline}"</p>
                <p className="ec-story">{chef.story}</p>
                {chef.experience && (
                    <div className="ec-exp-pill">{chef.experience} yrs experience</div>
                )}
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ExpertChefsPage({ user, onLogout, cart }) {
    const navigate = useNavigate();
    const rootRef = useRef();
    const [chefs, setChefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeChef, setActiveChef] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem("token");
        onLogout?.();
        navigate("/");
    };

    useEffect(() => {
        const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
        fetch(`${BASE}/api/chefs`)
            .then(r => { if (!r.ok) throw new Error("Failed to fetch chefs"); return r.json(); })
            .then(data => { setChefs(Array.isArray(data) ? data : data.chefs || []); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, []);

    useEffect(() => {
        if (!rootRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(".ec-hero-title", { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" });
            gsap.fromTo(".ec-hero-sub", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.3 });
        }, rootRef);
        return () => ctx.revert();
    }, []);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            <div ref={rootRef} className="ec-root">

                <img src="https://i.postimg.cc/vZXW6kyg/Chat-GPT-Image-Jun-11-2026-06-29-31-PM.png"
                    alt="" aria-hidden
                    style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, pointerEvents: "none" }}
                />

                <Navbar user={user} onLogout={handleLogout} activeNav="Home" setActiveNav={() => {}} cart={cart}/>

                <div className="ec-hero">
                    <p className="ec-eyebrow">NOIR KITCHEN —✦</p>
                    <h1 className="ec-hero-title">Meet Our <em>Expert</em> Team Members</h1>
                    <p className="ec-hero-sub">Masters of craft. Architects of flavor. Each with a story.</p>
                </div>

                <section className="ec-chefs-section">
                    {loading && (
                        <div className="ec-state">
                            <div className="ec-spinner" />
                            <p>Loading chefs...</p>
                        </div>
                    )}
                    {error && (
                        <div className="ec-state ec-state--error">
                            <p>⚠️ {error}</p>
                            <p style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>Check your API connection</p>
                        </div>
                    )}
                    {!loading && !error && chefs.length === 0 && (
                        <div className="ec-state"><p>No chefs added yet.</p></div>
                    )}
                    <div className="ec-grid">
                        {chefs.map((chef, i) => (
                            <ChefCard key={chef._id || chef.name} chef={chef} index={i} onOpen={setActiveChef} />
                        ))}
                    </div>
                </section>

            </div>

            {/* Full-screen modal */}
            {activeChef && <ChefModal chef={activeChef} onClose={() => setActiveChef(null)} />}

            <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ec-root {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }

        .ec-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #C4510A; margin-bottom: 14px;
        }

        /* HERO */
        .ec-hero {
          position: relative; z-index: 1;
          padding: 72px 24px 32px;
          text-align: center;
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(4px);
        }
        .ec-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 5vw, 68px);
          font-weight: 600; line-height: 1.1; color: #000000; margin-bottom: 14px;
        }
        .ec-hero-title em { font-style: italic; color: #F4A46A; }
        .ec-hero-sub {
          font-size: 15px; color: rgb(189, 78, 30);
          font-weight: 400; letter-spacing: 0.03em;
        }

        /* SECTION */
        .ec-chefs-section {
          position: relative; z-index: 1;
          padding: 48px 24px 72px;
        }

        /* GRID */
        .ec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 420px));
          gap: 56px 40px;
          justify-content: center;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 0 40px;
        }

        /* ── CARD ── */
        /* overflow: visible so border-radius stays on img-wrap, not card */
        .ec-chef-card {
          width: 100%;
          aspect-ratio: 3 / 4;
          position: relative;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
          box-shadow: 0 14px 44px rgba(0,0,0,0.4);
          border-radius: 24px;
        }
        .ec-chef-card:hover {
          transform: rotate(0deg) translateY(-10px) scale(1.04) !important;
          box-shadow: 0 28px 64px rgba(0,0,0,0.5);
        }

        /* Image wrap — clipping happens here, not on card */
        .ec-img-wrap {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          overflow: hidden;
        }
        .ec-chef-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
          display: block;
          transition: transform 0.5s ease;
        }
        .ec-chef-card:hover .ec-chef-img { transform: scale(1.06); }

        /* BADGE — outside img-wrap, never clipped */
        .ec-badge-wrap {
          position: absolute;
          top: 12px; left: 12px;
          width: 60px; height: 60px;
          z-index: 10; pointer-events: none;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));
        }
        .ec-badge-img { width: 100%; height: 100%; object-fit: contain; display: block; }

        /* GLASS INFO — sits over the image via the card's stacking context */
        .ec-info-card {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          border-radius: 0 0 24px 24px;
          padding: 20px 18px 18px;
          background: rgba(15, 8, 4, 0.5);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-top: 1px solid rgba(255,255,255,0.15);
          z-index: 5;
          display: flex; flex-direction: column; gap: 4px;
        }

        /* Shared text styles */
        .ec-role {
          color: #F4A46A; font-size: 10px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase;
        }
        .ec-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(20px, 2.2vw, 28px);
          font-weight: 600; color: #fff; line-height: 1.15;
        }
        .ec-divider {
          width: 40px; height: 1.5px;
          background: #C4510A; opacity: 0.8;
          border-radius: 2px; margin: 2px 0;
        }
        .ec-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px; font-style: italic;
          color: rgba(255,255,255,0.78); line-height: 1.5;
        }
        .ec-story {
          font-size: 11.5px; color: rgba(255,255,255,0.62);
          line-height: 1.7;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ec-exp-pill {
          display: inline-block;
          background: rgba(196,81,10,0.35);
          border: 1px solid rgba(244,164,106,0.5);
          color: #F4A46A;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          padding: 4px 10px; border-radius: 20px;
          align-self: flex-start; margin-top: 2px;
        }

        /* ── MODAL ── */
        .ec-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }

        .ec-modal-content {
          position: relative;
          width: 100%; max-width: 520px;
          max-height: 92vh;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          display: flex; flex-direction: column;
          background: #0e0804;
        }

        .ec-modal-close {
          position: absolute; top: 14px; right: 14px;
          z-index: 20;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 16px;
          width: 36px; height: 36px;
          border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.2s;
          line-height: 1;
          padding: 0;
        }
        .ec-modal-close:hover {
          background: rgba(196,81,10,0.7);
          transform: scale(1.08);
        }

        .ec-modal-img-wrap {
          position: relative;
          width: 100%; flex-shrink: 0;
          height: 55vh; max-height: 420px;
        }
        .ec-modal-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
          display: block;
        }
        /* Fade from image into info */
        .ec-modal-img-fade {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 80px;
          background: linear-gradient(to bottom, transparent, #0e0804);
        }

        /* Badge on modal */
        .ec-modal-badge-wrap {
          position: absolute;
          top: 14px; left: 14px;
          width: 72px; height: 72px;
          z-index: 20; pointer-events: none;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
        }
        .ec-modal-badge-img { width: 100%; height: 100%; object-fit: contain; display: block; }

        .ec-modal-info {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px 28px;
          display: flex; flex-direction: column; gap: 8px;
          background: #0e0804;
        }
        .ec-modal-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 600; color: #fff; line-height: 1.1;
        }
        .ec-modal-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-style: italic;
          color: rgba(255,255,255,0.78); line-height: 1.6;
        }
        .ec-modal-story {
          font-size: 13.5px; color: rgba(255,255,255,0.68);
          line-height: 1.8; margin-top: 4px;
        }

        /* STATES */
        .ec-state {
          text-align: center; padding: 80px 20px;
          color: rgba(255,255,255,0.7); font-size: 14px;
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.15);
          max-width: 480px; margin: 0 auto;
        }
        .ec-state--error { color: #F4A46A; }
        .ec-spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #C4510A;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* RESPONSIVE */
        @media (max-width: 600px) {
          .ec-hero { padding: 56px 16px 24px; }
          .ec-chefs-section { padding: 24px 32px 48px; }
          .ec-grid { grid-template-columns: 1fr; max-width: 400px; gap: 64px; }

          .ec-modal-overlay { padding: 0; align-items: flex-end; }
          .ec-modal-content {
            width: 100%; max-width: 100%;
            height: 100dvh; max-height: 100vh;
            border-radius: 0;
          }
          .ec-modal-img-wrap { height: 52vh; max-height: none; flex-shrink: 0; }
          .ec-modal-info { padding: 20px 22px 36px; }
          .ec-modal-close { top: 16px; right: 16px; width: 40px; height: 40px; font-size: 18px; }
          .ec-modal-badge-wrap { width: 60px; height: 60px; }
        }

        @media (min-width: 601px) and (max-width: 1000px) {
          .ec-grid { grid-template-columns: repeat(2, minmax(0, 420px)); gap: 56px 28px; }
        }
      `}</style>
        </>
    );
}