import { useState, useEffect, useRef } from "react";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";
import { Navigate, useNavigate } from "react-router-dom";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

/* ── Reveal hook ── */
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

/* ── HERO ── */
function Hero() {
  const [ref, vis] = useReveal(0.05);
  return (
    <section ref={ref} className="ea-hero">
      <div className="ea-hero-deco ea-deco1">✦</div>
      <div className="ea-hero-deco ea-deco2">✦</div>
      <div className="ea-hero-deco ea-deco3">✦</div>
      <div className="ea-hero-leaf ea-leaf1">🕯</div>
      <div className="ea-hero-leaf ea-leaf2">🌿</div>

      <div className={`ea-hero-content ${vis ? "ea-fade-up" : "ea-hidden"}`}>
        <p className="ea-eyebrow">
          Noir Kitchen <span className="ea-orn">✦</span> The Space
        </p>
        <h1 className="ea-hero-h1">
          Elegant <em className="ea-accent">Ambience</em>
        </h1>
        <p className="ea-hero-sub">
          Step into a world where candlelight meets craftsmanship — every corner
          of Noir Kitchen is designed to transform your evening into a memory.
        </p>
        <div className="ea-hero-line">
          <span className="ea-line-seg" />
          <span className="ea-line-icon">🕯</span>
          <span className="ea-line-seg" />
        </div>
      </div>

      {/* Stats row */}
      <div className={`ea-stats-row ${vis ? "ea-fade-up" : "ea-hidden"}`} style={{ animationDelay: "0.18s" }}>
        {[
          { num: "12+", label: "Years of Craft" },
          { num: "340", label: "Seats Across Spaces" },
          { num: "4", label: "Distinct Dining Rooms" },
          { num: "★ 4.9", label: "Ambience Rating" },
        ].map((s) => (
          <div key={s.label} className="ea-stat">
            <span className="ea-stat-num">{s.num}</span>
            <span className="ea-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── GALLERY GRID ── */
const GALLERY = [
  {
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80",
    tag: "The Grand Hall",
    desc: "Vaulted ceilings, brass chandeliers, and long linen tables set the tone for celebration.",
    wide: true,
  },
  {
    img: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&auto=format&fit=crop&q=80",
    tag: "Candlelit Alcoves",
    desc: "Intimate booths wrapped in velvet for two.",
    wide: false,
  },
  {
    img: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&auto=format&fit=crop&q=80",
    tag: "The Terrace",
    desc: "Open-air dining beneath a canopy of café lights.",
    wide: false,
  },
  {
    img: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&auto=format&fit=crop&q=80",
    tag: "Chef's Counter",
    desc: "Eight seats facing the open kitchen — pure theatre.",
    wide: false,
  },
  {
    img: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=800&auto=format&fit=crop&q=80",
    tag: "The Wine Cellar Room",
    desc: "Surrounded by our curated cellar — the most coveted table in the house.",
    wide: true,
  },
];

function GalleryCard({ item, index }) {
  const [ref, vis] = useReveal(0.08);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={`ea-gcard ${item.wide ? "ea-gcard-wide" : ""} ${vis ? "ea-fade-up" : "ea-hidden"}`}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="ea-gcard-img-wrap">
        <img
          src={item.img}
          alt={item.tag}
          className={`ea-gcard-img ${hovered ? "ea-img-zoom" : ""}`}
          loading="lazy"
        />
        <div className="ea-gcard-gradient" />
        <span className="ea-gcard-tag">✦ {item.tag}</span>
      </div>
      <div className="ea-gcard-body">
        <h3 className="ea-gcard-name">{item.tag}</h3>
        <p className="ea-gcard-desc">{item.desc}</p>
      </div>
    </div>
  );
}

function Gallery() {
  const [ref, vis] = useReveal(0.06);
  return (
    <section className="ea-section">
      <div
        ref={ref}
        className={`ea-section-head ${vis ? "ea-fade-up" : "ea-hidden"}`}
      >
        <p className="ea-eyebrow">
          Our Spaces <span className="ea-orn">✦</span> Explore
        </p>
        <h2 className="ea-section-h2">
          Rooms That <em className="ea-accent">Remember You</em>
        </h2>
        <p className="ea-section-sub">
          From grand celebrations to quiet dinners for two — every space at Noir
          Kitchen is designed to feel like it was made for the occasion.
        </p>
      </div>
      <div className="ea-gallery-grid">
        {GALLERY.map((item, i) => (
          <GalleryCard key={item.tag} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ── FEATURES ── */
const FEATURES = [
  {
    icon: "🕯",
    title: "Candlelit Every Evening",
    body:
      "Over 800 handpoured beeswax candles illuminate Noir Kitchen each night, casting a warmth no fixture can replicate.",
  },
  {
    icon: "🎵",
    title: "Live Acoustic Sessions",
    body:
      "Friday and Saturday evenings feature live jazz and classical guitar, curated to complement — never compete with — conversation.",
  },
  {
    icon: "🌿",
    title: "Botanist-Designed Greenery",
    body:
      "Our in-house botanist refreshes seasonal tablescapes weekly — native blooms, sculptural foliage, and fragrant herbs.",
  },
  {
    icon: "🖼",
    title: "Rotating Art Collection",
    body:
      "Works from emerging Indian artists line our walls, with a new exhibition opening every two months. Dinner and a gallery — always.",
  },
  {
    icon: "🪑",
    title: "Custom Upholstery",
    body:
      "Every chair and banquette was designed for Noir Kitchen by Jaipur's own Rumi Ateliers, in hand-loomed velvet and linen.",
  },
  {
    icon: "✨",
    title: "Private Event Dressing",
    body:
      "For private bookings, our event team transforms the space entirely — florals, linens, lighting — with a single brief from you.",
  },
];

function FeatureCard({ item, index }) {
  const [ref, vis] = useReveal(0.1);
  return (
    <div
      ref={ref}
      className={`ea-feat-card ${vis ? "ea-fade-up" : "ea-hidden"}`}
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
    >
      <span className="ea-feat-icon">{item.icon}</span>
      <h3 className="ea-feat-title">{item.title}</h3>
      <p className="ea-feat-body">{item.body}</p>
    </div>
  );
}

function Features() {
  const [ref, vis] = useReveal(0.06);
  return (
    <section className="ea-section ea-section-alt">
      <div
        ref={ref}
        className={`ea-section-head ${vis ? "ea-fade-up" : "ea-hidden"}`}
      >
        <p className="ea-eyebrow">
          Details <span className="ea-orn">✦</span> The Craft
        </p>
        <h2 className="ea-section-h2">
          Atmosphere Is <em className="ea-accent">Intentional</em>
        </h2>
        <p className="ea-section-sub">
          Great dining is never just about the plate. Every element here is a
          choice — deliberate, considered, and made to make you feel something.
        </p>
      </div>
      <div className="ea-feat-grid">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} item={f} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ── QUOTE STRIP ── */
function QuoteStrip() {
  const [ref, vis] = useReveal(0.1);
  return (
    <section ref={ref} className={`ea-quote-strip ${vis ? "ea-fade-up" : "ea-hidden"}`}>
      <div className="ea-hero-deco ea-deco1" style={{ top: "20%", opacity: 0.1 }}>✦</div>
      <span className="ea-quote-mark">"</span>
      <blockquote className="ea-quote-text">
        The room itself is a dish — composed, seasoned, and served with intention.
      </blockquote>
      <p className="ea-quote-attr">— Chef Arjun Mehra, Founder, Noir Kitchen</p>
      <div className="ea-hero-line" style={{ justifyContent: "center", marginTop: "28px" }}>
        <span className="ea-line-seg" />
        <span className="ea-line-icon">✦</span>
        <span className="ea-line-seg" />
      </div>
    </section>
  );
}

/* ── RESERVE BANNER ── */
function ReserveBanner() {
    const navigate = useNavigate()
  const [ref, vis] = useReveal(0.1);
  return (
    <section ref={ref} className={`ea-reserve ${vis ? "ea-fade-up" : "ea-hidden"}`}>
      <p className="ea-eyebrow" style={{ justifyContent: "center" }}>
        Noir Kitchen <span className="ea-orn">✦</span> Reserve
      </p>
      <h2 className="ea-reserve-h2">
        Your Evening <em className="ea-accent">Awaits</em>
      </h2>
      <p className="ea-reserve-sub">
        Tables for two to two hundred. Private rooms available seven days a week.
      </p>
      <div className="ea-reserve-btns">
        <button className="ea-btn-primary" onClick={() => navigate('/reserve')}>Reserve a Table</button>
        <button className="ea-btn-ghost" onClick={() => navigate('/Contact-us/Noir-Kitchen-Team')}>Enquire for Events</button>
      </div>
      <div className="ea-reserve-note">
        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
  <span style={{ color: "#000000", fontSize: "1.1em" }}>Open daily</span>
  <span style={{ color: "#b24313", fontSize: "1.1em" }}>12 pm – 11 pm</span>
</span>
        <span className="ea-divider-dot">·</span>
        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
  <span style={{ color: "#b24313", fontSize: "1.1em" }}>Call Now</span>
  <span style={{ color: "#000000", fontSize: "1.1em" }}>+91 45451 45455</span>
</span>
      </div>
    </section>
  );
}

/* ══ MAIN EXPORT ══ */
export default function ElegantAmbience({ user: propUser, onLogout, cart }) {
  const user = propUser || { name: "Guest", email: "" };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="ea-root">
        <div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker />
        <Navbar
          user={user}
          onLogout={() => onLogout?.()}
          activeNav="Home"
          setActiveNav={() => {}}
          cart={cart}
        />
  </div>

        <Hero />
        <Gallery />
        <Features />
        <QuoteStrip />
        <ReserveBanner />
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ea-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background-image: url('https://i.postimg.cc/VNwdKN0v/menu.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #1A1208;
          overflow-x: hidden;
        }

        /* ── ANIMATIONS ── */
        .ea-hidden { opacity: 0; transform: translateY(22px); }
        .ea-fade-up { animation: eaFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes eaFadeUp { from{opacity:0;transform:translateY(22px);} to{opacity:1;transform:translateY(0);} }
        @keyframes eaFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes eaPulse { 0%,100%{opacity:0.12;} 50%{opacity:0.28;} }

        /* ── TOKENS ── */
        .ea-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 2.5px;
          text-transform: uppercase; color: #D86A1C;
          display: flex; align-items: center; gap: 8px;
          justify-content: center; margin-bottom: 18px;
        }
        .ea-orn { font-size: 12px; opacity: 0.65; }
        .ea-accent { font-style: italic; color: #D86A1C; }
        .ea-hero-line {
          display: flex; align-items: center; gap: 16px;
        }
        .ea-line-seg {
          width: 80px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(216,106,28,0.35), transparent);
        }
        .ea-line-icon { font-size: 18px; opacity: 0.45; }

        /* ── HERO ── */
        .ea-hero {
          position: relative;
          text-align: center;
          padding: 96px 24px 56px;
          overflow: hidden;
        }
        .ea-hero-content { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; }
        .ea-hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(44px, 6.5vw, 88px);
          font-weight: 600;
          line-height: 1.0;
          color: #1A1208;
          margin-bottom: 22px;
          letter-spacing: -0.5px;
        }
        .ea-hero-sub {
          font-size: 15px; color: #6B5B45;
          line-height: 1.85; max-width: 520px;
          margin: 0 auto 36px;
        }

        .ea-hero-deco {
          position: absolute; font-size: 13px; color: #D86A1C;
          pointer-events: none; animation: eaPulse 4s ease-in-out infinite;
        }
        .ea-deco1 { top: 18%; left: 8%; opacity: 0.2; }
        .ea-deco2 { top: 25%; right: 10%; opacity: 0.18; animation-delay: 1.5s; }
        .ea-deco3 { bottom: 20%; left: 15%; opacity: 0.14; animation-delay: 2.8s; }
        .ea-hero-leaf {
          position: absolute; font-size: 26px; opacity: 0.1;
          pointer-events: none; animation: eaFloat 7s ease-in-out infinite;
        }
        .ea-leaf1 { top: 10%; left: 3%; }
        .ea-leaf2 { bottom: 8%; right: 4%; animation-delay: 2s; }

        /* Stats */
        .ea-stats-row {
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 0; margin-top: 52px; position: relative; z-index: 1;
          background: rgba(255,255,255,0.72); backdrop-filter: blur(14px);
          border: 1px solid rgba(216,106,28,0.12);
          border-radius: 20px; max-width: 820px;
          margin-left: auto; margin-right: auto;
          overflow: hidden;
        }
        .ea-stat {
          display: flex; flex-direction: column; align-items: center;
          padding: 28px 36px; flex: 1; min-width: 160px;
          border-right: 1px solid rgba(216,106,28,0.1);
        }
        .ea-stat:last-child { border-right: none; }
        .ea-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 600; color: #D86A1C;
          line-height: 1; margin-bottom: 6px;
        }
        .ea-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
          text-transform: uppercase; color: #9A8570;
        }

        /* ── SECTIONS ── */
        .ea-section {
          max-width: 1320px; margin: 0 auto;
          padding: 64px 48px;
        }
        .ea-section-alt {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(216,106,28,0.1);
          border-bottom: 1px solid rgba(216,106,28,0.1);
          max-width: 100%; padding: 72px 0;
        }
        .ea-section-alt > .ea-section-head,
        .ea-section-alt > .ea-feat-grid {
          max-width: 1320px; margin-left: auto; margin-right: auto;
          padding-left: 48px; padding-right: 48px;
        }
        .ea-section-head { text-align: center; margin-bottom: 52px; }
        .ea-section-h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4.5vw, 58px);
          font-weight: 600; color: #1A1208;
          line-height: 1.1; margin-bottom: 18px; letter-spacing: -0.3px;
        }
        .ea-section-sub {
          font-size: 14.5px; color: #6B5B45;
          line-height: 1.8; max-width: 540px; margin: 0 auto;
        }

        /* ── GALLERY GRID ── */
        .ea-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 280px;
          gap: 20px;
        }
        .ea-gcard {
          border-radius: 18px; overflow: hidden;
          background: #fff;
          border: 1px solid rgba(216,106,28,0.1);
          box-shadow: 0 6px 28px rgba(0,0,0,0.08);
          transition: transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.32s;
          cursor: default;
        }
        .ea-gcard:hover { transform: translateY(-6px); box-shadow: 0 18px 48px rgba(216,106,28,0.18); }
        .ea-gcard-wide { grid-column: span 2; }

        .ea-gcard-img-wrap {
          position: relative;
          height: 180px; overflow: hidden; background: #f0e8df;
        }
        .ea-gcard-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1);
          display: block;
        }
        .ea-img-zoom { transform: scale(1.07); }
        .ea-gcard-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(26,18,8,0.4) 0%, transparent 55%);
          pointer-events: none;
        }
        .ea-gcard-tag {
          position: absolute; bottom: 10px; left: 12px;
          font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; color: #fff;
          background: linear-gradient(135deg, #D86A1C, #F0924A);
          padding: 4px 12px; border-radius: 20px;
          box-shadow: 0 3px 10px rgba(216,106,28,0.4);
        }
        .ea-gcard-body { padding: 16px 18px 18px; }
        .ea-gcard-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 600; color: #1A1208;
          margin-bottom: 6px; line-height: 1.2;
        }
        .ea-gcard-desc { font-size: 12.5px; color: #6B5B45; line-height: 1.65; }

        /* ── FEATURES ── */
        .ea-feat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .ea-feat-card {
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(216,106,28,0.12);
          border-radius: 18px;
          padding: 32px 28px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s;
        }
        .ea-feat-card:hover { transform: translateY(-5px); box-shadow: 0 14px 40px rgba(216,106,28,0.15); }
        .ea-feat-icon { font-size: 28px; display: block; margin-bottom: 16px; }
        .ea-feat-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 600; color: #1A1208;
          margin-bottom: 10px; line-height: 1.2;
        }
        .ea-feat-body { font-size: 13px; color: #6B5B45; line-height: 1.75; }

        /* ── QUOTE STRIP ── */
        .ea-quote-strip {
          text-align: center;
          padding: 80px 48px;
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(216,106,28,0.1);
          border-bottom: 1px solid rgba(216,106,28,0.1);
        }
        .ea-quote-mark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 120px; line-height: 0.6;
          color: rgba(216,106,28,0.18);
          display: block; margin-bottom: 28px;
          font-weight: 600;
        }
        .ea-quote-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(22px, 3.5vw, 38px);
          font-weight: 400; font-style: italic;
          color: #1A1208; line-height: 1.4;
          max-width: 720px; margin: 0 auto 20px;
        }
        .ea-quote-attr {
          font-size: 12px; font-weight: 600; letter-spacing: 1.5px;
          color: #9A8570; text-transform: uppercase;
        }

        /* ── RESERVE BANNER ── */
        .ea-reserve {
          text-align: center;
          padding: 80px 48px 100px;
          max-width: 760px; margin: 0 auto;
        }
        .ea-reserve-h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 600; color: #1A1208;
          line-height: 1.05; margin-bottom: 18px; letter-spacing: -0.3px;
        }
        .ea-reserve-sub {
          font-size: 14.5px; color: #6B5B45;
          line-height: 1.8; margin-bottom: 36px;
        }
        .ea-reserve-btns {
          display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .ea-btn-primary {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          padding: 14px 34px; border-radius: 50px;
          background: linear-gradient(135deg, #D86A1C, #F0924A);
          color: #fff; border: none; cursor: pointer;
          box-shadow: 0 6px 22px rgba(216,106,28,0.38);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ea-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(216,106,28,0.48); }
        .ea-btn-ghost {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          padding: 14px 34px; border-radius: 50px;
          background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
          color: #D86A1C; border: 1.5px solid rgba(216,106,28,0.35);
          cursor: pointer; transition: all 0.2s;
        }
        .ea-btn-ghost:hover { background: #D86A1C; color: #fff; border-color: #D86A1C; }
        .ea-reserve-note {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; flex-wrap: wrap;
          font-size: 12px; color: #9A8570; font-weight: 500;
        }
        .ea-divider-dot { opacity: 0.4; }

        /* ══ RESPONSIVE ══ */
        @media (max-width: 1024px) {
          .ea-gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 260px;
          }
          .ea-gcard-wide { grid-column: span 2; }
          .ea-feat-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .ea-section { padding: 48px 24px; }
          .ea-section-alt > .ea-section-head,
          .ea-section-alt > .ea-feat-grid {
            padding-left: 24px; padding-right: 24px;
          }
          .ea-gallery-grid {
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
          }
          .ea-gcard-wide { grid-column: span 1; }
          .ea-gcard-img-wrap { height: 200px; }
          .ea-feat-grid { grid-template-columns: 1fr; }
          .ea-stats-row { flex-direction: column; }
          .ea-stat { border-right: none; border-bottom: 1px solid rgba(216,106,28,0.1); }
          .ea-stat:last-child { border-bottom: none; }
          .ea-quote-strip { padding: 56px 24px; }
          .ea-reserve { padding: 56px 24px 72px; }
          .ea-hero { padding: 72px 20px 40px; }
        }

        @media (max-width: 480px) {
          .ea-hero { padding: 64px 16px 36px; }
          .ea-section { padding: 40px 16px; }
          .ea-section-alt > .ea-section-head,
          .ea-section-alt > .ea-feat-grid {
            padding-left: 16px; padding-right: 16px;
          }
          .ea-quote-strip { padding: 48px 16px; }
          .ea-reserve { padding: 48px 16px 64px; }
          .ea-reserve-btns { flex-direction: column; align-items: stretch; }
          .ea-btn-primary, .ea-btn-ghost { text-align: center; }
          .ea-stat { padding: 22px 20px; }
          .ea-feat-card { padding: 24px 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ea-fade-up { animation: none; opacity: 1; transform: none; }
          .ea-hero-deco, .ea-hero-leaf { animation: none; }
          .ea-gcard-img, .ea-feat-card, .ea-gcard { transition: none; }
        }
      `}</style>
    </>
  );
}