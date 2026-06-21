import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── helpers ── */
function buildFoodPath(item, user) {
  const encode = (s) => encodeURIComponent(String(s ?? "").trim());
  const addr = user?.address;
  const addrStr = addr
    ? [addr.houseNo, addr.areaName, addr.areaNo, addr.city, addr.pinCode]
        .filter(Boolean)
        .join(", ")
    : "";
  const addressParam =
    addrStr.length > 0
      ? encode(addrStr)
      : `ADDR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  return `/${encode(item.name)}/${encode(item.veg ? "veg" : "non-veg")}/${encode(
    item.price
  )}/${encode(user?.name || "Guest")}/${encode(
    user?.username || user?.email?.split("@")[0] || "guest"
  )}/${addressParam}`;
}

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

function VegBadge({ veg }) {
  return (
    <span className={`sd-veg-badge ${veg ? "sd-veg" : "sd-nonveg"}`}>
      <span className="sd-veg-circle" />
    </span>
  );
}

function SpiceDots({ level }) {
  return (
    <span className="sd-spice-row" title={`Spice level ${level}/4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`sd-spice-dot ${i <= level ? "sd-spice-dot-on" : ""}`}
        />
      ))}
    </span>
  );
}

/* ── CARD ── */
function DishCard({ item, index, user, cart }) {
  const navigate = useNavigate();
  const [ref, vis] = useReveal(0.08);
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (!cart) return;
    const ok = await cart.addToCart({
      menuItemId: item._id,
      name: item.name,
      img: item.img,
      price: item.price,
      variant: "",
      addons: [],
      qty: 1,
      note: "",
    });
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <article
      ref={ref}
      className={`sd-card ${vis ? "sd-fade-up" : "sd-hidden"} ${
        !item.available ? "sd-card-unavail" : ""
      }`}
      style={{ transitionDelay: `${(index % 6) * 70}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => item.available && navigate(buildFoodPath(item, user))}
    >
      {/* Image */}
      <div className="sd-card-img-wrap">
        <img
          src={item.img}
          alt={item.name}
          className={`sd-card-img ${hovered ? "sd-img-zoom" : ""}`}
          loading="lazy"
        />

        {/* Overlay gradient */}
        <div className="sd-img-gradient" />

        {/* Top badges */}
        <div className="sd-card-top-badges">
          <span className="sd-sig-pill">✦ Signature</span>
          <VegBadge veg={item.veg} />
        </div>

        {/* Unavailable overlay */}
        {!item.available && (
          <div className="sd-unavail-overlay">Unavailable</div>
        )}

        {/* Price tag pinned to bottom of image */}
        <div className="sd-price-tag">{item.price}</div>
      </div>

      {/* Body */}
      <div className="sd-card-body">
        <h3 className="sd-card-name">{item.name}</h3>

        {item.desc && <p className="sd-card-desc">{item.desc}</p>}

        <div className="sd-card-meta">
          <SpiceDots level={item.spice} />
          {item.vegan && <span className="sd-vegan-tag">Vegan</span>}
          {item.chef && <span className="sd-chef-tag">⭐ Chef's Pick</span>}
          {item.prepTime && (
            <span className="sd-meta-info">🕐 {item.prepTime} min</span>
          )}
          {item.rating && (
            <span className="sd-meta-info">⭐ {item.rating}</span>
          )}
        </div>

        {item.pairing && (
          <p className="sd-pairing">
            <span className="sd-pairing-label">Pairs with</span> {item.pairing}
          </p>
        )}

        {item.variants?.length > 0 && (
          <select
            className="sd-variant-select"
            onClick={(e) => e.stopPropagation()}
          >
            {item.variants.map((v) => (
              <option key={v.label}>
                {v.label} — {v.price}
              </option>
            ))}
          </select>
        )}

        {item.available && (
          <button
            className={`sd-add-btn ${added ? "sd-add-btn-added" : ""}`}
            onClick={handleAdd}
          >
            {added ? "✓ Added to Cart" : "+ Add to Cart"}
          </button>
        )}
      </div>
    </article>
  );
}

/* ── FILTERS ── */
const FILTERS = ["All", "Veg", "Non-Veg", "Chef's Pick", "Vegan"];

function FilterBar({ active, setActive, count }) {
  return (
    <div className="sd-filter-bar">
      <div className="sd-filter-inner">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`sd-filter-btn ${active === f ? "sd-filter-active" : ""}`}
            onClick={() => setActive(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <span className="sd-count">{count} dishes</span>
    </div>
  );
}

/* ── HERO ── */
function Hero() {
  const [ref, vis] = useReveal(0.05);
  return (
    <section ref={ref} className="sd-hero">
      <div className="sd-hero-deco sd-deco1">✦</div>
      <div className="sd-hero-deco sd-deco2">✦</div>
      <div className="sd-hero-leaf sd-leaf1">🌿</div>
      <div className="sd-hero-leaf sd-leaf2">🍃</div>

      <div className={`sd-hero-content ${vis ? "sd-fade-up" : "sd-hidden"}`}>
        <p className="sd-eyebrow">
          Noir Kitchen <span className="sd-orn">✦</span> The Collection
        </p>
        <h1 className="sd-hero-h1">
          Signature <em className="sd-accent">Masterpieces</em>
        </h1>
        <p className="sd-hero-sub">
          A curated selection of dishes that define Noir Kitchen — each one
          crafted with rare ingredients, precise technique, and years of
          culinary mastery.
        </p>
        <div className="sd-hero-line">
          <span className="sd-line-seg" />
          <span className="sd-line-icon">🍽</span>
          <span className="sd-line-seg" />
        </div>
      </div>
    </section>
  );
}

/* ══ MAIN EXPORT ══ */
export default function SignatureDishes({ user: propUser, onLogout, cart }) {
  const user = propUser || { name: "Guest", email: "" };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function fetchSignature() {
      try {
        const res = await fetch(`${API_BASE}/api/menu`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setItems(json.data.filter((item) => item.signature === true));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSignature();
  }, []);

  const filtered = items.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Veg") return item.veg;
    if (filter === "Non-Veg") return !item.veg;
    if (filter === "Chef's Pick") return item.chef;
    if (filter === "Vegan") return item.vegan;
    return true;
  });

  if (loading)
    return (
      <div className="sd-state-wrap">
        <div className="sd-spinner" />
      </div>
    );

  if (error)
    return (
      <div className="sd-state-wrap" style={{ color: "#D32F2F" }}>
        Failed to load: {error}
      </div>
    );

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="sd-root">
        <div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker /><Navbar
          user={user}
          onLogout={() => onLogout?.()}
          activeNav="Menu"
          setActiveNav={() => {}}
          cart={cart}
        />
  </div>

        <Hero />

        <main className="sd-main">
          <FilterBar
            active={filter}
            setActive={setFilter}
            count={filtered.length}
          />

          {filtered.length === 0 ? (
            <div className="sd-empty">
              <span className="sd-empty-icon">🍽</span>
              <p>No dishes match this filter.</p>
            </div>
          ) : (
            <div className="sd-grid">
              {filtered.map((item, i) => (
                <DishCard
                  key={item._id}
                  item={item}
                  index={i}
                  user={user}
                  cart={cart}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sd-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          background-image: url('https://i.postimg.cc/VNwdKN0v/menu.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #1A1208;
          overflow-x: hidden;
        }

        /* ── STATE ── */
        .sd-state-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
        }
        .sd-spinner {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2.5px solid rgba(216,106,28,0.2);
          border-top-color: #D86A1C;
          animation: sdSpin 0.8s linear infinite;
        }
        @keyframes sdSpin { to { transform: rotate(360deg); } }

        /* ── ANIMATIONS ── */
        .sd-hidden { opacity: 0; transform: translateY(22px); }
        .sd-fade-up { animation: sdFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes sdFadeUp { from{opacity:0;transform:translateY(22px);} to{opacity:1;transform:translateY(0);} }
        @keyframes sdFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes sdPulse { 0%,100%{opacity:0.15;} 50%{opacity:0.3;} }

        /* ── TOKENS ── */
        .sd-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 2.5px;
          text-transform: uppercase; color: #D86A1C;
          display: flex; align-items: center; gap: 8px;
          justify-content: center; margin-bottom: 18px;
        }
        .sd-orn { font-size: 12px; opacity: 0.65; }
        .sd-accent { font-style: italic; color: #D86A1C; }

        /* ── HERO ── */
        .sd-hero {
          position: relative;
          text-align: center;
          padding: 96px 24px 64px;
          overflow: hidden;
        }
        .sd-hero-content { position: relative; z-index: 1; max-width: 660px; margin: 0 auto; }
        .sd-hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 6vw, 84px);
          font-weight: 600;
          line-height: 1.0;
          color: #1A1208;
          margin-bottom: 22px;
          letter-spacing: -0.5px;
        }
        .sd-hero-sub {
          font-size: 15px;
          color: #6B5B45;
          line-height: 1.85;
          max-width: 500px;
          margin: 0 auto 36px;
        }
        .sd-hero-line {
          display: flex; align-items: center; gap: 16px;
          justify-content: center;
        }
        .sd-line-seg {
          width: 80px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(216,106,28,0.35), transparent);
        }
        .sd-line-icon { font-size: 20px; opacity: 0.5; }

        .sd-hero-deco {
          position: absolute; font-size: 13px; color: #D86A1C;
          pointer-events: none; animation: sdPulse 4s ease-in-out infinite;
        }
        .sd-deco1 { top: 18%; left: 8%; opacity: 0.2; }
        .sd-deco2 { top: 25%; right: 10%; opacity: 0.18; animation-delay: 1.5s; }
        .sd-hero-leaf {
          position: absolute; font-size: 26px; opacity: 0.1;
          pointer-events: none; animation: sdFloat 7s ease-in-out infinite;
        }
        .sd-leaf1 { top: 10%; left: 3%; }
        .sd-leaf2 { bottom: 5%; right: 4%; animation-delay: 2s; }

        /* ── FILTER BAR ── */
        .sd-filter-bar {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          margin-bottom: 40px;
        }
        .sd-filter-inner { display: flex; gap: 8px; flex-wrap: wrap; }
        .sd-filter-btn {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          padding: 9px 18px; border-radius: 50px;
          border: 1.5px solid rgba(216,106,28,0.2);
          background: rgba(255,255,255,0.75);
          color: #6B5B45; cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .sd-filter-btn:hover { border-color: #D86A1C; color: #D86A1C; background: rgba(255,255,255,0.9); }
        .sd-filter-active {
          background: linear-gradient(135deg,#D86A1C,#F0924A);
          color: #fff; border-color: transparent;
          box-shadow: 0 4px 16px rgba(216,106,28,0.35);
        }
        .sd-filter-active:hover { color: #fff; }
        .sd-count {
          font-size: 12px; font-weight: 600; color: #9A8570;
          background: rgba(255,255,255,0.7); backdrop-filter: blur(8px);
          border: 1px solid rgba(216,106,28,0.15);
          padding: 7px 14px; border-radius: 50px;
        }

        /* ── MAIN + GRID ── */
        .sd-main {
          max-width: 1320px; margin: 0 auto;
          padding: 0 48px 96px;
        }
        .sd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 28px;
        }

        /* ── CARD ── */
        .sd-card {
          background: #fff;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(216,106,28,0.1);
          box-shadow: 0 6px 28px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.32s;
        }
        .sd-card:hover { transform: translateY(-8px); box-shadow: 0 20px 52px rgba(216,106,28,0.2); }
        .sd-card-unavail { opacity: 0.65; cursor: not-allowed; }

        /* Image */
        .sd-card-img-wrap {
          position: relative;
          height: 230px;
          overflow: hidden;
          background: #f0e8df;
        }
        .sd-card-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.55s cubic-bezier(0.22,1,0.36,1);
          display: block;
        }
        .sd-img-zoom { transform: scale(1.07); }
        .sd-img-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(26,18,8,0.35) 0%, transparent 55%);
          pointer-events: none;
        }
        .sd-card-top-badges {
          position: absolute; top: 12px; left: 12px; right: 12px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .sd-sig-pill {
          font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; color: #fff;
          background: linear-gradient(135deg, #D86A1C, #F0924A);
          padding: 4px 12px; border-radius: 20px;
          box-shadow: 0 3px 10px rgba(216,106,28,0.4);
        }
        .sd-price-tag {
          position: absolute; bottom: 12px; right: 12px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 600;
          color: #fff;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .sd-unavail-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.42);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 1px;
        }

        /* Body */
        .sd-card-body { padding: 20px 20px 22px; }
        .sd-card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 600; color: #1A1208;
          line-height: 1.15; margin-bottom: 8px;
        }
        .sd-card-desc {
          font-size: 13px; color: #6B5B45; line-height: 1.7;
          margin-bottom: 14px;
        }
        .sd-card-meta {
          display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap; margin-bottom: 10px;
        }

        /* Tags */
        .sd-vegan-tag {
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: #2E7D32;
          background: rgba(46,125,50,0.1); border-radius: 12px; padding: 2px 8px;
        }
        .sd-chef-tag {
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: #D86A1C;
          background: rgba(216,106,28,0.1); border-radius: 12px; padding: 2px 8px;
        }
        .sd-meta-info { font-size: 11px; color: #9A8570; }
        .sd-pairing {
          font-size: 11.5px; color: #9A8570; font-style: italic; margin-bottom: 12px;
        }
        .sd-pairing-label { font-style: normal; font-weight: 600; color: #7A6A55; }

        /* Veg badge */
        .sd-veg-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 3px;
          background: #fff; flex-shrink: 0;
        }
        .sd-veg { border: 1.5px solid #4CAF50; }
        .sd-nonveg { border: 1.5px solid #D32F2F; }
        .sd-veg-circle { width: 8px; height: 8px; border-radius: 50%; }
        .sd-veg .sd-veg-circle { background: #4CAF50; }
        .sd-nonveg .sd-veg-circle { background: #D32F2F; }

        /* Spice dots */
        .sd-spice-row { display: inline-flex; gap: 4px; align-items: center; }
        .sd-spice-dot { width: 7px; height: 7px; border-radius: 50%; background: #E8D5C0; }
        .sd-spice-dot-on { background: #D86A1C; }

        /* Variant select */
        .sd-variant-select {
          width: 100%; margin-top: 10px; margin-bottom: 2px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; padding: 7px 10px;
          border-radius: 8px; border: 1px solid rgba(216,106,28,0.25);
          background: #fff; color: #1A1208; cursor: pointer;
        }

        /* Add to cart */
        .sd-add-btn {
          margin-top: 12px; width: 100%; padding: 10px;
          border-radius: 50px; border: 1.5px solid #D86A1C;
          background: transparent; color: #D86A1C;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .sd-add-btn:hover { background: #D86A1C; color: #fff; }
        .sd-add-btn-added {
          background: linear-gradient(135deg,#4CAF50,#66BB6A) !important;
          border-color: #4CAF50 !important; color: #fff !important;
        }

        /* Empty */
        .sd-empty {
          text-align: center; padding: 80px 0; color: #9A8570;
          font-size: 15px; display: flex; flex-direction: column;
          align-items: center; gap: 14px;
        }
        .sd-empty-icon { font-size: 40px; opacity: 0.4; }

        /* ══ RESPONSIVE ══ */
        @media (max-width: 900px) {
          .sd-main { padding: 0 20px 72px; }
          .sd-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        }
        @media (max-width: 600px) {
          .sd-hero { padding: 72px 16px 48px; }
          .sd-main { padding: 0 14px 56px; }
          .sd-grid { grid-template-columns: 1fr; gap: 16px; }
          .sd-hero-h1 { font-size: clamp(36px, 9vw, 54px); }
          .sd-filter-bar { flex-direction: column; align-items: flex-start; }
          .sd-card-img-wrap { height: 200px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sd-fade-up { animation: none; opacity: 1; transform: none; }
          .sd-hero-deco, .sd-hero-leaf { animation: none; }
          .sd-card-img { transition: none; }
        }
      `}</style>
    </>
  );
}