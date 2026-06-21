import { useState, useEffect, useRef } from "react";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

function useCountdown(targetDate) {
  const calc = () => {
    const diff = targetDate - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000)  / 60000),
      seconds: Math.floor((diff % 60000)    / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

export default function ReserveTable({ user: propUser, onLogout, cart }) {
  const user = propUser || { name: "Guest", email: "" };


  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleNotify = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubmitted(true);
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="rt-root">
        <div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker /><Navbar user={user} onLogout={() => onLogout?.()} activeNav="Menu" setActiveNav={() => {}} cart={cart} />
  </div>

        {/* Floating ambient particles */}
        <div className="rt-particle rt-p1">✦</div>
        <div className="rt-particle rt-p2">✦</div>
        <div className="rt-particle rt-p3">🌿</div>
        <div className="rt-particle rt-p4">🍃</div>
        <div className="rt-particle rt-p5">✦</div>

        <main className="rt-main">

          {/* ── TOP EYEBROW ── */}
          <p className="rt-eyebrow">Noir Kitchen <span className="rt-orn">✦</span> Table Reservations</p>

          {/* ── MAIN HEADLINE ── */}
          <h1 className="rt-h1">
            Something Special<br />
            Is Being <em className="rt-accent">Prepared</em>
          </h1>

          <p className="rt-sub">
            Our reservation experience is being crafted with the same care as our kitchen.<br className="rt-br" />
            We're setting the table — yours will be ready soon.
          </p>

         {/* ── COMING SOON ── */}
<div className="rt-coming-soon">
  <span className="rt-cs-icon">-</span>
  <span className="rt-cs-text">Coming Soon</span>
  <span className="rt-cs-icon">-</span>
</div>

{/* ── DIVIDER ── */}
<div className="rt-divider">
  <span className="rt-div-line" />
  <span className="rt-div-dot">✦</span>
  <span className="rt-div-line" />
</div>

          {/* ── NOTIFY FORM ── */}
          <div className="rt-notify-wrap">
            <p className="rt-notify-label">Be the first to know when reservations open</p>
            {!submitted ? (
              <form className="rt-form" onSubmit={handleNotify}>
                <div className={`rt-input-wrap ${focused ? "rt-input-focused" : ""}`}>
                  <span className="rt-input-icon">✉</span>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="rt-input"
                    required
                  />
                </div>
                <button type="submit" className="rt-btn">
                  Notify Me
                </button>
              </form>
            ) : (
              <div className="rt-success">
                <span className="rt-success-icon">✓</span>
                <div>
                  <p className="rt-success-title">You're on the list</p>
                  <p className="rt-success-sub">We'll reach you at <em>{email}</em> the moment reservations open.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── FEATURE PREVIEW CARDS ── */}
          <div className="rt-features">
            {[
              { icon: "🕯", title: "Private Dining",   desc: "Intimate spaces for celebrations and special occasions." },
              { icon: "👨‍🍳", title: "Chef's Table",     desc: "An exclusive front-row seat to our open kitchen." },
              { icon: "🍷", title: "Curated Pairings", desc: "Wine and beverage pairings selected for each course." },
              { icon: "🌹", title: "Event Planning",   desc: "Bespoke menus and decor for your milestone moments." },
            ].map(f => (
              <div key={f.title} className="rt-feature-card">
                <span className="rt-feature-icon">{f.icon}</span>
                <h4 className="rt-feature-title">{f.title}</h4>
                <p className="rt-feature-desc">{f.desc}</p>
                <span className="rt-feature-pill">Coming Soon</span>
              </div>
            ))}
          </div>

          {/* ── CONTACT FALLBACK ── */}
          <div className="rt-contact">
            <p className="rt-contact-text">Need a table urgently? Call us directly.</p>
            <a href="tel:+911234567890" className="rt-contact-link">+91 45451 45455</a>
          </div>

        </main>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rt-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background-image: url('https://i.postimg.cc/VNwdKN0v/menu.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #1A1208;
          overflow-x: hidden;
          position: relative;
        }

        /* ── PARTICLES ── */
        @keyframes rtFloat { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-14px) rotate(8deg);} }
        @keyframes rtFadeUp { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }
        @keyframes rtPulse { 0%,100%{opacity:0.18;} 50%{opacity:0.35;} }
        @keyframes rtBlink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes rtScaleIn { from{opacity:0;transform:scale(0.88);} to{opacity:1;transform:scale(1);} }

        .rt-particle { position: fixed; pointer-events: none; font-size: 20px; color: #D86A1C; opacity: 0.18; animation: rtFloat 7s ease-in-out infinite; z-index: 0; }
        .rt-p1 { top: 12%; left: 6%;  font-size: 14px; animation-delay: 0s;   animation: rtPulse 4s ease-in-out infinite; }
        .rt-p2 { top: 28%; right: 8%; font-size: 11px; animation-delay: 1.2s; animation: rtPulse 5s ease-in-out infinite 1.2s; }
        .rt-p3 { bottom: 22%; left: 4%;  font-size: 24px; opacity: 0.12; animation: rtFloat 8s ease-in-out infinite 0.5s; }
        .rt-p4 { bottom: 14%; right: 6%; font-size: 20px; opacity: 0.12; animation: rtFloat 6s ease-in-out infinite 2s; }
        .rt-p5 { top: 55%; left: 50%;   font-size: 10px; opacity: 0.1;  animation: rtPulse 6s ease-in-out infinite 3s; }

        /* ── MAIN ── */
        .rt-main {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 80px 24px 80px;
          max-width: 860px;
          margin: 0 auto;
          animation: rtFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* ── TYPE ── */
        .rt-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #D86A1C;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rt-orn { opacity: 0.6; font-size: 11px; }

        .rt-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(38px, 6vw, 80px);
          font-weight: 600;
          line-height: 1.05;
          color: #1A1208;
          margin-bottom: 22px;
          letter-spacing: -0.5px;
        }
        .rt-accent { font-style: italic; color: #D86A1C; }

        .rt-sub {
          font-size: 15px;
          color: #6B5B45;
          line-height: 1.9;
          max-width: 520px;
          margin-bottom: 52px;
        }
        .rt-br { display: block; }

        /* ── COUNTDOWN ── */
        .rt-countdown {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 52px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(216,106,28,0.15);
          border-radius: 24px;
          padding: 28px 36px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08);
          animation: rtScaleIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both;
        }
        .rt-count-block {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 0 28px;
        }
        .rt-count-block:not(:last-child)::after {
          content: ':';
          position: absolute;
          right: -4px;
          top: 8px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 300;
          color: rgba(216,106,28,0.4);
          animation: rtBlink 2s ease-in-out infinite;
        }
        .rt-colon { display: none; } /* handled via ::after */
        .rt-count-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 600;
          color: #1A1208;
          line-height: 1;
          min-width: 64px;
          text-align: center;
          transition: all 0.3s;
        }
        .rt-count-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #9A8570;
        }

        /* ── DIVIDER ── */
        .rt-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 400px;
          margin-bottom: 48px;
        }
        .rt-div-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(216,106,28,0.25), transparent); }
        .rt-div-icon { font-size: 20px; opacity: 0.5; }

        /* ── NOTIFY ── */
        .rt-notify-wrap { width: 100%; max-width: 480px; margin-bottom: 64px; }
        .rt-notify-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #9A8570;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-size: 10px;
        }
        .rt-form {
          display: flex;
          gap: 10px;
          align-items: stretch;
        }
        .rt-input-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.85);
          border: 1.5px solid rgba(216,106,28,0.2);
          border-radius: 50px;
          padding: 0 18px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .rt-input-focused {
          border-color: #D86A1C;
          box-shadow: 0 0 0 3px rgba(216,106,28,0.12);
        }
        .rt-input-icon { font-size: 14px; color: #B8A090; flex-shrink: 0; }
        .rt-input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #1A1208;
          outline: none;
          padding: 14px 0;
        }
          .rt-coming-soon {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 40px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(216,106,28,0.2);
  border-radius: 60px;
  padding: 18px 40px;
  box-shadow: 0 8px 32px rgba(216,106,28,0.12);
  animation: rtScaleIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both;
}
.rt-cs-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 600;
  color: #D86A1C;
  letter-spacing: 2px;
  font-style: italic;
}
.rt-cs-icon { font-size: 22px; opacity: 0.55; }

.rt-div-dot { font-size: 12px; color: #D86A1C; opacity: 0.5; }
        .rt-input::placeholder { color: #C4B5A5; }
        .rt-btn {
          background: linear-gradient(135deg, #D86A1C, #F0924A);
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 14px 28px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 6px 20px rgba(216,106,28,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .rt-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(216,106,28,0.45); }

        .rt-success {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255,255,255,0.85);
          border: 1.5px solid rgba(76,175,80,0.3);
          border-radius: 16px;
          padding: 18px 24px;
          text-align: left;
          animation: rtScaleIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .rt-success-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4CAF50, #66BB6A);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .rt-success-title { font-weight: 700; font-size: 14px; color: #1A1208; margin-bottom: 3px; }
        .rt-success-sub { font-size: 12px; color: #6B5B45; line-height: 1.5; }
        .rt-success-sub em { font-style: normal; color: #D86A1C; font-weight: 600; }

        /* ── FEATURE CARDS ── */
        .rt-features {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          width: 100%;
          margin-bottom: 56px;
        }
        .rt-feature-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(216,106,28,0.12);
          border-radius: 20px;
          padding: 28px 20px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        .rt-feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(216,106,28,0.14);
          border-color: rgba(216,106,28,0.28);
        }
        .rt-feature-icon { font-size: 30px; line-height: 1; }
        .rt-feature-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 600;
          color: #1A1208;
          line-height: 1.2;
        }
        .rt-feature-desc { font-size: 12px; color: #6B5B45; line-height: 1.65; }
        .rt-feature-pill {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #D86A1C;
          background: rgba(216,106,28,0.1);
          border: 1px solid rgba(216,106,28,0.2);
          border-radius: 20px;
          padding: 3px 10px;
          margin-top: 4px;
        }

        /* ── CONTACT FALLBACK ── */
        .rt-contact {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 24px 32px;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(216,106,28,0.12);
          border-radius: 16px;
        }
        .rt-contact-text { font-size: 13px; color: #9A8570; }
        .rt-contact-link {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 600;
          color: #D86A1C;
          text-decoration: none;
          transition: opacity 0.2s;
          letter-spacing: 0.5px;
        }
        .rt-contact-link:hover { opacity: 0.75; }

        /* ══ RESPONSIVE ══ */
        @media (max-width: 900px) {
          .rt-features { grid-template-columns: repeat(2, 1fr); }
          .rt-countdown { padding: 22px 20px; }
          .rt-count-block { padding: 0 18px; }
        }
        @media (max-width: 600px) {
          .rt-main { padding: 48px 16px 60px; }
          .rt-h1 { font-size: clamp(32px, 9vw, 52px); }
          .rt-sub { font-size: 14px; margin-bottom: 36px; }
          .rt-br { display: none; }
          .rt-countdown {
            padding: 18px 10px;
            border-radius: 18px;
            gap: 0;
            width: 100%;
          }
          .rt-count-block { padding: 0 10px; }
          .rt-count-block:not(:last-child)::after { right: -6px; font-size: 26px; top: 6px; }
          .rt-count-num { font-size: clamp(30px, 9vw, 48px); min-width: 48px; }
          .rt-count-label { font-size: 8px; letter-spacing: 1px; }
          .rt-form { flex-direction: column; }
          .rt-input-wrap { border-radius: 14px; padding: 0 16px; }
          .rt-btn { border-radius: 14px; padding: 14px; }
          .rt-features { grid-template-columns: 1fr 1fr; gap: 10px; }
          .rt-feature-card { padding: 20px 14px 18px; border-radius: 16px; }
          .rt-feature-icon { font-size: 24px; }
          .rt-feature-title { font-size: 15px; }
          .rt-feature-desc { font-size: 11px; }
          .rt-contact { padding: 18px 20px; }
        }
        @media (max-width: 380px) {
          .rt-features { grid-template-columns: 1fr; }
          .rt-countdown { padding: 16px 6px; }
          .rt-count-block { padding: 0 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rt-main, .rt-countdown, .rt-success { animation: none; opacity: 1; transform: none; }
          .rt-particle { animation: none; }
          .rt-count-block:not(:last-child)::after { animation: none; }
        }
      `}</style>
    </>
  );
}