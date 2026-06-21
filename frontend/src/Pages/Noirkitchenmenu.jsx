import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
const FA_LINK = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NAV_TABS = [
  "Signature", "Starters", "Street Food", "Vegetarian", "Non-Vegetarian",
  "Tandoor", "Rice & Biryani", "Breads", "Desserts", "Beverages"
];

const SPICE_LEVELS = [
  { label: "Mild",   icon: "fa-solid fa-leaf",              desc: "Gentle warmth, suitable for all palates",     color: "#4CAF50" },
  { label: "Medium", icon: "fa-solid fa-pepper-hot",         desc: "A pleasant heat that builds with each bite",   color: "#FF9800" },
  { label: "Hot",    icon: "fa-solid fa-fire",               desc: "Bold and fiery, recommended for spice lovers", color: "#F44336" },
  { label: "Fiery",  icon: "fa-solid fa-fire-flame-curved",  desc: "Intense heat — a true chilli experience",      color: "#B71C1C" },
];

/* ── hooks ── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

/* ── helpers ── */
function buildFoodPath(item, user) {
  const encode = (s) => encodeURIComponent(String(s ?? "").trim());
  const addr = user?.address;
  const addrStr = addr
    ? [addr.houseNo, addr.areaName, addr.areaNo, addr.city, addr.pinCode].filter(Boolean).join(", ")
    : "";
  const addressParam = addrStr.length > 0
    ? encode(addrStr)
    : `ADDR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  return `/${encode(item.name)}/${encode(item.veg ? "veg" : "non-veg")}/${encode(item.price)}/${encode(user?.name || "Guest")}/${encode(user?.username || user?.email?.split("@")[0] || "guest")}/${addressParam}`;
}

/* ── Search: substring match on name, desc, category, ingredients ── */
function matchesQuery(item, query) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const fields = [
    item.name,
    item.desc,
    item.category,
    item.ingredients,
    item.pairing,
  ].filter(Boolean).map(f => f.toLowerCase());
  return fields.some(f => f.includes(q));
}

/* ── Highlight matching substring ── */
function Highlight({ text = "", query = "" }) {
  if (!query.trim() || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="nkm-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SpiceDots({ level }) {
  return (
    <span className="nkm-spice-row" title={`Spice level ${level}/4`}>
      {[1,2,3,4].map(i => (
        <span key={i} className={`nkm-spice-dot ${i <= level ? "nkm-spice-dot-on" : ""}`} />
      ))}
    </span>
  );
}

function VegBadge({ veg }) {
  return (
    <span className={`nkm-veg-badge ${veg ? "nkm-veg" : "nkm-nonveg"}`}>
      <span className="nkm-veg-circle" />
    </span>
  );
}

/* ══════════════════════════════════════════
   SEARCH BAR COMPONENT
══════════════════════════════════════════ */
function SearchBar({ query, setQuery, resultCount, isSearching }) {
  const inputRef = useRef(null);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") handleClear();
  };

  return (
    <div className="nkm-search-wrap">
      <div className={`nkm-search-box ${query ? "nkm-search-active" : ""}`}>
        <i className="fa-solid fa-magnifying-glass nkm-search-icon"></i>
        <input
          ref={inputRef}
          type="text"
          className="nkm-search-input"
          placeholder="Search dishes, ingredients, categories…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Search menu items"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className="nkm-search-clear" onClick={handleClear} aria-label="Clear search">
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>
      {query && (
        <div className="nkm-search-status">
          {resultCount === 0
            ? <span className="nkm-search-none"><i className="fa-solid fa-triangle-exclamation"></i> No dishes found for "<em>{query}</em>"</span>
            : <span className="nkm-search-count"><i className="fa-solid fa-bowl-food"></i> {resultCount} dish{resultCount !== 1 ? "es" : ""} found</span>
          }
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SEARCH RESULTS PANEL
══════════════════════════════════════════ */
function SearchResults({ items, query, navigate, user, cart }) {
  const [ref, vis] = useReveal(0.05);

  if (!items.length) return (
    <section ref={ref} className="nkm-section nkm-search-empty">
      <div className="nkm-search-empty-inner">
        <div className="nkm-search-empty-icon"><i className="fa-solid fa-bowl-rice"></i></div>
        <h3 className="nkm-search-empty-h">No results for "<em>{query}</em>"</h3>
        <p className="nkm-search-empty-sub">Try a different spelling or search by ingredient, category, or spice level name like "mild" or "vegan".</p>
      </div>
    </section>
  );

  return (
    <section ref={ref} className="nkm-section">
      <div className="nkm-section-hd">
        <p className="nkm-eyebrow">Search Results <span className="nkm-orn"><i className="fa-solid fa-asterisk"></i></span></p>
        <h2 className="nkm-h2">Matching <em className="nkm-accent">"{query}"</em></h2>
        <p className="nkm-section-sub">{items.length} dish{items.length !== 1 ? "es" : ""} found across all categories.</p>
      </div>
      <div className="nkm-items-grid">
        {items.map((item, i) => (
          <SearchResultItem key={item._id} item={item} index={i} navigate={navigate} user={user} cart={cart} query={query} />
        ))}
      </div>
    </section>
  );
}

function SearchResultItem({ item, index, navigate, user, cart, query }) {
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (!cart) return;
    const ok = await cart.addToCart({ menuItemId: item._id, name: item.name, img: item.img, price: item.price, variant: "", addons: [], qty: 1, note: "" });
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
  };

  return (
    <div
      className={`nkm-item nkm-item-search ${!item.available ? "nkm-item-unavail" : ""}`}
      style={{ animationDelay: `${(index % 6) * 50}ms`, cursor: item.available ? "pointer" : "not-allowed" }}
      onClick={() => item.available && navigate(buildFoodPath(item, user))}
    >
      <div className="nkm-item-avatar-wrap">
        <img src={item.img} alt={item.name} className="nkm-item-avatar" loading="lazy" />
        {!item.available && <div className="nkm-item-avatar-unavail"><i className="fa-solid fa-xmark"></i></div>}
      </div>
      <div className="nkm-item-content">
        <div className="nkm-item-left">
          <div className="nkm-item-name-row">
            <VegBadge veg={item.veg} />
            <h4 className="nkm-item-name"><Highlight text={item.name} query={query} /></h4>
            {item.category && <span className="nkm-search-cat-tag">{item.category}</span>}
          </div>
          <div className="nkm-item-tags-row">
            {item.chef       && <span className="nkm-chef-badge"><i className="fa-solid fa-star"></i> Chef's Pick</span>}
            {item.signature  && <span className="nkm-chef-badge" style={{color:"#7B3F00",background:"rgba(123,63,0,0.1)"}}>Signature</span>}
            {item.vegan      && <span className="nkm-vegan-tag">Vegan</span>}
            {!item.available && <span className="nkm-unavail">Unavailable</span>}
          </div>
          <p className="nkm-item-desc"><Highlight text={item.desc} query={query} /></p>
          {item.ingredients && <p className="nkm-item-ing"><span className="nkm-ing-label">Ingredients:</span> <Highlight text={item.ingredients} query={query} /></p>}
          <div className="nkm-item-meta-row">
            <SpiceDots level={item.spice} />
            {item.prepTime && <span className="nkm-prep"><i className="fa-regular fa-clock"></i> {item.prepTime} min</span>}
            {item.rating   && <span className="nkm-rating"><i className="fa-solid fa-star"></i> {item.rating}</span>}
          </div>
          {item.variants?.length > 0 && (
            <select className="nkm-variant-select" onClick={e => e.stopPropagation()}>
              {item.variants.map(v => <option key={v.label}>{v.label} — {v.price}</option>)}
            </select>
          )}
          {item.available && (
            <button className={`nkm-add-btn nkm-add-btn-sm ${added ? "nkm-add-btn-added" : ""}`} onClick={handleAdd}>
              {added ? <><i className="fa-solid fa-check"></i> Added</> : <><i className="fa-solid fa-plus"></i> Add</>}
            </button>
          )}
        </div>
        <div className="nkm-item-price">{item.price}</div>
      </div>
    </div>
  );
}

/* ── HERO ── */
function Hero() {
  const navigate = useNavigate();
  const [ref, vis] = useReveal(0.05);
  return (
    <section ref={ref} className="nkm-hero">
      <div className="nkm-spice-float nkm-sf1"><i className="fa-solid fa-asterisk"></i></div>
      <div className="nkm-spice-float nkm-sf2"><i className="fa-solid fa-asterisk"></i></div>
      <div className="nkm-leaf-float nkm-lf1"><i className="fa-solid fa-leaf"></i></div>
      <div className="nkm-leaf-float nkm-lf2"><i className="fa-solid fa-seedling"></i></div>
      <div className={`nkm-hero-text ${vis ? "nkm-fade-up" : "nkm-hidden"}`}>
        <p className="nkm-eyebrow">OUR MENU <span className="nkm-orn"><i className="fa-solid fa-asterisk"></i></span></p>
        <h1 className="nkm-h1">An <em className="nkm-accent">Ode</em> to<br />Indian <em className="nkm-accent">Gastronomy</em></h1>
        <p className="nkm-hero-sub">A carefully curated collection of timeless Indian classics and modern interpretations crafted with exceptional ingredients and extraordinary attention to detail.</p>
        <div className="nkm-hero-btns">
          <button className="nkm-btn-primary" onClick={() => navigate("/signature-dishes")}>Explore Signature Dishes</button>
          <button className="nkm-btn-outline" onClick={() => navigate("/reserve")}>Reserve a Table</button>
        </div>
        <div className="nkm-hero-stats">
          {[["50+","Curated Dishes"],["18hrs","Dal Slow Cook"],["Daily","Fresh Sourcing"]].map(([n,l]) => (
            <div key={l} className="nkm-stat">
              <span className="nkm-stat-n">{n}</span>
              <span className="nkm-stat-l">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`nkm-hero-collage ${vis ? "nkm-fade-up nkm-delay-2" : "nkm-hidden"}`}>
        <div className="nkm-collage-main">
          <img src="https://images.unsplash.com/photo-1584010063908-c90644cae72a?w=600&auto=format&fit=crop&q=60" alt="Dum Biryani" className="nkm-collage-img-main" />
          <div className="nkm-collage-tag">Dum Biryani</div>
        </div>
        <div className="nkm-collage-side">
          <div className="nkm-collage-sm-wrap">
            <img src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80" alt="Butter Chicken" className="nkm-collage-img-sm" />
            <div className="nkm-collage-tag">Butter Chicken</div>
          </div>
          <div className="nkm-collage-sm-wrap">
            <img src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80" alt="Paneer" className="nkm-collage-img-sm" />
            <div className="nkm-collage-tag">Paneer Tikka</div>
          </div>
        </div>
        <div className="nkm-float-card nkm-fc1"><i className="fa-solid fa-star"></i> Chef's Choice Tonight</div>
        <div className="nkm-float-card nkm-fc2"><i className="fa-solid fa-trophy"></i> Michelin Inspired</div>
      </div>
    </section>
  );
}

/* ── MENU NAV ── */
function MenuNav({ active, setActive, tabs }) {
  const scrollTo = (id) => {
    setActive(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <nav className="nkm-nav">
      <div className="nkm-nav-inner">
        {tabs.map(t => (
          <button key={t} onClick={() => scrollTo(t)} className={`nkm-nav-tab ${active === t ? "nkm-nav-active" : ""}`}>
            {t}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── SIGNATURE CARD ── */
function SignatureCard({ item, index, navigate, user, cart }) {
  const [ref, vis] = useReveal(0.1);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (!cart) return;
    const ok = await cart.addToCart({ menuItemId: item._id, name: item.name, img: item.img, price: item.price, variant: "", addons: [], qty: 1, note: "" });
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
  };

  return (
    <article
      ref={ref}
      className={`nkm-sig-card ${vis ? "nkm-fade-up" : "nkm-hidden"} ${!item.available ? "nkm-card-unavail" : ""}`}
      style={{ transitionDelay: `${index * 80}ms`, cursor: item.available ? "pointer" : "not-allowed" }}
      onClick={() => item.available && navigate(buildFoodPath(item, user))}
    >
      <div className="nkm-sig-img-wrap">
        <img src={item.img} alt={item.name} className="nkm-sig-img" loading="lazy" />
        <div className="nkm-sig-badge">Signature</div>
        <VegBadge veg={item.veg} />
        {!item.available && <div className="nkm-unavail-overlay">Unavailable</div>}
      </div>
      <div className="nkm-sig-body">
        <div className="nkm-sig-top">
          <h3 className="nkm-sig-name">{item.name}</h3>
          <span className="nkm-sig-price">{item.price}</span>
        </div>
        <p className="nkm-sig-desc">{item.desc}</p>
        <div className="nkm-sig-meta">
          <SpiceDots level={item.spice} />
          {item.vegan && <span className="nkm-vegan-tag">Vegan</span>}
          <div className="nkm-sig-row">
            {item.prepTime && <span className="nkm-prep"><i className="fa-regular fa-clock"></i> {item.prepTime} min</span>}
            {item.rating   && <span className="nkm-rating"><i className="fa-solid fa-star"></i> {item.rating}</span>}
          </div>
          {item.pairing && <span className="nkm-sig-pairing">{item.pairing}</span>}
        </div>
        {item.variants?.length > 0 && (
          <select className="nkm-variant-select" onClick={e => e.stopPropagation()}>
            {item.variants.map(v => <option key={v.label}>{v.label} — {v.price}</option>)}
          </select>
        )}
        {item.available && (
          <button className={`nkm-add-btn ${added ? "nkm-add-btn-added" : ""}`} onClick={handleAdd}>
            {added ? <><i className="fa-solid fa-check"></i> Added to Cart</> : <><i className="fa-solid fa-plus"></i> Add to Cart</>}
          </button>
        )}
      </div>
    </article>
  );
}

/* ── MENU ITEM ── */
function MenuItem({ item, index, navigate, user, cart }) {
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (!cart) return;
    const ok = await cart.addToCart({ menuItemId: item._id, name: item.name, img: item.img, price: item.price, variant: "", addons: [], qty: 1, note: "" });
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
  };

  return (
    <div
      className={`nkm-item ${!item.available ? "nkm-item-unavail" : ""}`}
      style={{ animationDelay: `${(index % 6) * 60}ms`, cursor: item.available ? "pointer" : "not-allowed" }}
      onClick={() => item.available && navigate(buildFoodPath(item, user))}
    >
      <div className="nkm-item-avatar-wrap">
        <img src={item.img} alt={item.name} className="nkm-item-avatar" loading="lazy" />
        {!item.available && <div className="nkm-item-avatar-unavail"><i className="fa-solid fa-xmark"></i></div>}
      </div>
      <div className="nkm-item-content">
        <div className="nkm-item-left">
          <div className="nkm-item-name-row">
            <VegBadge veg={item.veg} />
            <h4 className="nkm-item-name">{item.name}</h4>
          </div>
          <div className="nkm-item-tags-row">
            {item.chef       && <span className="nkm-chef-badge"><i className="fa-solid fa-star"></i> Chef's Pick</span>}
            {item.vegan      && <span className="nkm-vegan-tag">Vegan</span>}
            {!item.available && <span className="nkm-unavail">Unavailable</span>}
          </div>
          <p className="nkm-item-desc">{item.desc}</p>
          {item.ingredients && <p className="nkm-item-ing"><span className="nkm-ing-label">Ingredients:</span> {item.ingredients}</p>}
          <div className="nkm-item-meta-row">
            <SpiceDots level={item.spice} />
            {item.prepTime && <span className="nkm-prep"><i className="fa-regular fa-clock"></i> {item.prepTime} min</span>}
            {item.rating   && <span className="nkm-rating"><i className="fa-solid fa-star"></i> {item.rating}</span>}
          </div>
          {item.variants?.length > 0 && (
            <select className="nkm-variant-select" onClick={e => e.stopPropagation()}>
              {item.variants.map(v => <option key={v.label}>{v.label} — {v.price}</option>)}
            </select>
          )}
          {item.available && (
            <button className={`nkm-add-btn nkm-add-btn-sm ${added ? "nkm-add-btn-added" : ""}`} onClick={handleAdd}>
              {added ? <><i className="fa-solid fa-check"></i> Added</> : <><i className="fa-solid fa-plus"></i> Add</>}
            </button>
          )}
        </div>
        <div className="nkm-item-price">{item.price}</div>
      </div>
    </div>
  );
}

/* ── CHEF PICKS ── */
function ChefPicks({ items = [], navigate, user, cart }) {
  const [ref, vis] = useReveal(0.08);
  if (!items.length) return null;
  return (
    <section className="nkm-section nkm-chefpicks" id="section-ChefPicks">
      <div ref={ref} className={`nkm-section-hd ${vis ? "nkm-fade-up" : "nkm-hidden"}`}>
        <p className="nkm-eyebrow">Curated Selections <span className="nkm-orn"><i className="fa-solid fa-asterisk"></i></span></p>
        <h2 className="nkm-h2">Chosen by Our <em className="nkm-accent">Chefs</em></h2>
        <p className="nkm-section-sub">Hand-picked dishes our chefs are proud to serve — available to order right now.</p>
      </div>
      <div className={`nkm-picks-grid ${vis ? "nkm-fade-up nkm-delay-1" : "nkm-hidden"}`}>
        {items.map((p, idx) => (
          <ChefPickCard key={p._id} item={p} index={idx} navigate={navigate} user={user} cart={cart} />
        ))}
      </div>
    </section>
  );
}

function ChefPickCard({ item, index, navigate, user, cart }) {
  const [added, setAdded] = useState(false);
  const handleAdd = async (e) => {
    e.stopPropagation();
    if (!cart) return;
    const ok = await cart.addToCart({ menuItemId: item._id, name: item.name, img: item.img, price: item.price, variant: "", addons: [], qty: 1, note: "" });
    if (ok) { setAdded(true); setTimeout(() => setAdded(false), 2000); }
  };
  return (
    <article
      className={`nkm-pick-card ${!item.available ? "nkm-card-unavail" : ""}`}
      style={{ transitionDelay: `${index * 70}ms`, cursor: item.available ? "pointer" : "not-allowed" }}
      onClick={() => item.available && navigate(buildFoodPath(item, user))}
    >
      <div className="nkm-pick-avatar-wrap">
        <img src={item.img} alt={item.name} className="nkm-pick-avatar" />
        {!item.available && <div className="nkm-pick-avatar-unavail"><i className="fa-solid fa-xmark"></i></div>}
      </div>
      <div className="nkm-pick-body">
        <div className="nkm-pick-top">
          <div>
            <div className="nkm-pick-name-row">
              <VegBadge veg={item.veg} />
              <h4 className="nkm-pick-name">{item.name}</h4>
            </div>
            <span className="nkm-pick-cat">{item.category}</span>
          </div>
          <span className="nkm-pick-price">{item.price}</span>
        </div>
        {item.desc && <p className="nkm-pick-desc">{item.desc}</p>}
        <div className="nkm-pick-footer">
          <SpiceDots level={item.spice} />
          {item.vegan && <span className="nkm-vegan-tag">Vegan</span>}
          {item.prepTime && <span className="nkm-prep"><i className="fa-regular fa-clock"></i> {item.prepTime} min</span>}
          {item.rating  && <span className="nkm-rating"><i className="fa-solid fa-star"></i> {item.rating}</span>}
          {item.pairing && <span className="nkm-pick-pair">Pairs: <em>{item.pairing}</em></span>}
        </div>
        {item.variants?.length > 0 && (
          <select className="nkm-variant-select" onClick={e => e.stopPropagation()}>
            {item.variants.map(v => <option key={v.label}>{v.label} — {v.price}</option>)}
          </select>
        )}
        {item.available && (
          <button className={`nkm-add-btn ${added ? "nkm-add-btn-added" : ""}`} onClick={handleAdd}>
            {added ? <><i className="fa-solid fa-check"></i> Added to Cart</> : <><i className="fa-solid fa-plus"></i> Add to Cart</>}
          </button>
        )}
        {!item.available && <span className="nkm-unavail" style={{ display: "inline-block", marginTop: 10 }}>Currently Unavailable</span>}
      </div>
    </article>
  );
}

/* ── SPICE EXPERIENCE ── */
function SpiceExperience({ menuData, navigate, user }) {
  const [ref, vis] = useReveal(0.1);
  const [sel, setSel] = useState(null);
  const spiceMap = { 0: "Mild", 1: "Mild", 2: "Medium", 3: "Hot", 4: "Fiery" };
  const getItemsForLevel = (label) =>
    Object.values(menuData).flat().filter(item => spiceMap[item.spice] === label && item.available !== false);
  return (
    <section ref={ref} className="nkm-section nkm-spice-section">
      <div className={`nkm-section-hd ${vis ? "nkm-fade-up" : "nkm-hidden"}`}>
        <p className="nkm-eyebrow">Spice Guide <span className="nkm-orn"><i className="fa-solid fa-asterisk"></i></span></p>
        <h2 className="nkm-h2">The <em className="nkm-accent">Spice</em> Experience</h2>
        <p className="nkm-section-sub">We craft every dish to a precise spice profile.</p>
      </div>
      <div className={`nkm-spice-cards ${vis ? "nkm-fade-up" : "nkm-hidden"}`}>
        {SPICE_LEVELS.map((s, i) => (
          <div key={s.label}
            className={`nkm-spice-card ${sel === i ? "nkm-spice-sel" : ""}`}
            onClick={() => setSel(sel === i ? null : i)}
            style={{ "--sp-color": s.color }}>
            <div className="nkm-spice-icon-wrap"><i className={s.icon}></i></div>
            <h4 className="nkm-spice-label">{s.label}</h4>
            <p className="nkm-spice-desc">{s.desc}</p>
            <div className="nkm-spice-chilli-row">
              {[0,1,2,3].map(n => (
                <i key={n} className={`fa-solid fa-pepper-hot nkm-spice-chilli ${n <= i ? "nkm-spice-chilli-on" : ""}`}></i>
              ))}
            </div>
            <div className="nkm-spice-bar">
              <div className="nkm-spice-fill" style={{ width: `${(i+1)*25}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="nkm-spice-footer">
        <i className="fa-solid fa-bowl-food"></i>
        <span>Balanced spices. <em>Authentic taste.</em> Crafted with care.</span>
        <i className="fa-solid fa-leaf"></i>
      </div>
      {sel !== null && (() => {
        const level = SPICE_LEVELS[sel];
        const items = getItemsForLevel(level.label);
        return (
          <div className="nkm-spice-modal-overlay" onClick={() => setSel(null)}>
            <div className="nkm-spice-modal" onClick={e => e.stopPropagation()}>
              <div className="nkm-spice-modal-hd">
                <div className="nkm-spice-modal-hd-left">
                  <span className="nkm-spice-modal-hd-icon"><i className={level.icon}></i></span>
                  <div>
                    <h3 className="nkm-spice-modal-title">{level.label} Dishes</h3>
                    <p className="nkm-spice-modal-subtitle">{level.desc}</p>
                  </div>
                </div>
                <button className="nkm-spice-modal-close" onClick={() => setSel(null)}><i className="fa-solid fa-xmark"></i></button>
                <div className="nkm-spice-modal-hd-deco" aria-hidden><i className="fa-solid fa-leaf"></i></div>
              </div>
              {items.length === 0 ? (
                <p style={{ textAlign:"center", color:"#9A8570", padding:"32px 0" }}>No dishes at this spice level.</p>
              ) : (
                <div className="nkm-spice-modal-list">
                  {items.map(item => (
                    <div key={item._id}
                      className={`nkm-spice-modal-item ${item.chef ? "nkm-spice-modal-item-chef" : ""}`}
                      onClick={() => { setSel(null); navigate(buildFoodPath(item, user)); }}>
                      {item.chef && (
                        <div className="nkm-spice-modal-chef-badge">
                          <i className="fa-solid fa-star"></i><span>Chef's<br/>Pick</span>
                        </div>
                      )}
                      <img src={item.img} alt={item.name} className="nkm-spice-modal-img" />
                      <div className="nkm-spice-modal-info">
                        <span className="nkm-spice-modal-name">{item.name}</span>
                        <span className="nkm-spice-modal-cat">{item.category}</span>
                        <span className="nkm-spice-modal-desc">{item.desc}</span>
                      </div>
                      <div className="nkm-spice-modal-right">
                        <span className="nkm-spice-modal-price">{item.price}</span>
                        <span className="nkm-spice-modal-spicy-tag"><i className="fa-solid fa-pepper-hot"></i> {level.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="nkm-spice-modal-footer">
                <i className="fa-solid fa-bowl-food"></i>
                <span>Freshly prepared. <em>Served hot.</em> Made <em>with love.</em></span>
                <i className="fa-solid fa-leaf"></i>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

/* ── CTA ── */
function CTA() {
  const navigate = useNavigate();
  const [ref, vis] = useReveal(0.1);
  return (
    <section ref={ref} className="nkm-cta">
      <div className="nkm-cta-leaf nkm-cl1"><i className="fa-solid fa-leaf"></i></div>
      <div className="nkm-cta-leaf nkm-cl2"><i className="fa-solid fa-seedling"></i></div>
      <div className="nkm-cta-leaf nkm-cl3"><i className="fa-solid fa-asterisk"></i></div>
      <div className={`nkm-cta-content ${vis ? "nkm-fade-up" : "nkm-hidden"}`}>
        <p className="nkm-eyebrow" style={{ justifyContent:"center", color:"#D86A1C" }}>Noir Kitchen <span className="nkm-orn"><i className="fa-solid fa-asterisk"></i></span></p>
        <h2 className="nkm-cta-h2">Ready for an Unforgettable<br /><em className="nkm-accent">Dining Experience?</em></h2>
        <p className="nkm-cta-sub">Reserve your table and indulge in India's finest culinary traditions.</p>
        <div className="nkm-cta-btns">
          <button className="nkm-btn-primary" onClick={() => navigate("/reserve")}>Reserve a Table</button>
          <button className="nkm-btn-outline nkm-btn-outline-light" onClick={() => navigate("/Contact-us/Noir-Kitchen-Team")}>Contact Us</button>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function NoirKitchenMenu({ user: propUser, onLogout, cart }) {
  const navigate = useNavigate();
  const user     = propUser || { name: "Guest", email: "" };

  const [menuData,  setMenuData]  = useState({});
  const [signature, setSignature] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState("Signature");

  /* ── Search state ── */
  const [searchQuery, setSearchQuery]   = useState("");
  const [debouncedQ,  setDebouncedQ]    = useState("");
  const searchBarRef = useRef(null);

  /* Debounce: wait 200ms after typing stops before filtering */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* Keyboard shortcut: "/" focuses search bar */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchBarRef.current?.querySelector(".nkm-search-input")?.focus();
        searchBarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res  = await fetch(`${API_BASE}/api/menu`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        const grouped = {}, sigs = [];
        json.data.forEach(item => {
          if (item.signature) sigs.push(item);
          const cat = item.category || "Other";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        });
        setSignature(sigs);
        setMenuData(grouped);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetchMenu();
  }, []);

  const extraCategories = Object.keys(menuData).filter(cat => !NAV_TABS.includes(cat));
  const allTabs = [...NAV_TABS, ...extraCategories];

  /* All items flat, for search */
  const allItems = [...signature, ...Object.values(menuData).flat()].reduce((acc, item) => {
    if (!acc.find(i => i._id === item._id)) acc.push(item);
    return acc;
  }, []);

  /* Search results */
  const searchResults = debouncedQ.trim()
    ? allItems.filter(item => matchesQuery(item, debouncedQ))
    : [];

  const isSearching = debouncedQ.trim().length > 0;

  useEffect(() => {
    if (isSearching) return; // don't update active tab while searching
    const onScroll = () => {
      for (const id of [...allTabs].reverse()) {
        const el = document.getElementById(`section-${id}`);
        if (el && window.scrollY >= el.offsetTop - 120) { setActiveTab(id); break; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuData, isSearching]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Plus Jakarta Sans,sans-serif", color:"#D86A1C", fontSize:15, gap:10 }}>
      <i className="fa-solid fa-utensils fa-spin"></i> Loading menu…
    </div>
  );
  if (error) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Plus Jakarta Sans,sans-serif", color:"#D32F2F", fontSize:15, gap:10 }}>
      <i className="fa-solid fa-triangle-exclamation"></i> Failed to load menu: {error}
    </div>
  );

  const chefPicks = Object.values(menuData).flat().filter(i => i.chef);

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <link href={FA_LINK} rel="stylesheet" />
      <div className="nkm-root">
  <div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker />
    <Navbar user={user} onLogout={() => onLogout?.()} activeNav="Menu" setActiveNav={() => {}} cart={cart} />
  </div> 
        <Hero />

        {/* ── SEARCH BAR — sits between hero and nav ── */}
        <div ref={searchBarRef} className="nkm-search-section">
          <SearchBar
            query={searchQuery}
            setQuery={setSearchQuery}
            resultCount={searchResults.length}
            isSearching={isSearching}
          />
        </div>

        <MenuNav active={activeTab} setActive={setActiveTab} tabs={allTabs} />

        <main>
          {isSearching ? (
            /* ── SEARCH MODE: show results only ── */
            <SearchResults
              items={searchResults}
              query={debouncedQ}
              navigate={navigate}
              user={user}
              cart={cart}
            />
          ) : (
            /* ── NORMAL MODE: full menu ── */
            <>
              <section id="section-Signature" className="nkm-section">
                <div className="nkm-section-hd">
                  <p className="nkm-eyebrow">Chef's Collection <span className="nkm-orn"><i className="fa-solid fa-asterisk"></i></span></p>
                  <h2 className="nkm-h2">Signature <em className="nkm-accent">Masterpieces</em></h2>
                  <p className="nkm-section-sub">The dishes that define Noir Kitchen.</p>
                </div>
                <div className="nkm-sig-grid">
                  {signature.map((item, i) => (
                    <SignatureCard key={item._id} item={item} index={i} navigate={navigate} user={user} cart={cart} />
                  ))}
                </div>
              </section>

              <ChefPicks items={chefPicks} navigate={navigate} user={user} cart={cart} />

              {allTabs.filter(t => t !== "Signature").map(tab => (
                menuData[tab]?.length ? (
                  <section key={tab} id={`section-${tab}`} className="nkm-section nkm-section-alt">
                    <div className="nkm-section-hd">
                      <p className="nkm-eyebrow">{tab} <span className="nkm-orn"><i className="fa-solid fa-asterisk"></i></span></p>
                      <h2 className="nkm-h2">{tab}</h2>
                    </div>
                    <div className="nkm-items-grid">
                      {menuData[tab].map((item, i) => (
                        <MenuItem key={item._id} item={item} index={i} navigate={navigate} user={user} cart={cart} />
                      ))}
                    </div>
                  </section>
                ) : null
              ))}

              <SpiceExperience menuData={menuData} navigate={navigate} user={user} />
            </>
          )}

          <CTA />
        </main>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .nkm-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-image: url('https://i.postimg.cc/VNwdKN0v/menu.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: #1A1208;
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* ── ANIMATIONS ── */
        .nkm-hidden { opacity: 0; transform: translateY(24px); }
        .nkm-fade-up { animation: nkmFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        .nkm-delay-1 { animation-delay: 0.15s; }
        .nkm-delay-2 { animation-delay: 0.2s; }
        @keyframes nkmFadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes nkmFloat  { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes nkmPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(216,106,28,0.25);} 50%{box-shadow:0 0 0 6px rgba(216,106,28,0);} }

        /* ── TOKENS ── */
        .nkm-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #D86A1C; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .nkm-orn { font-size: 10px; opacity: 0.7; }
        .nkm-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px,5vw,72px); font-weight: 600; line-height: 1.05; color: #1A1208; margin-bottom: 22px; }
        .nkm-h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px,3.5vw,52px); font-weight: 600; line-height: 1.1; color: #1A1208; margin-bottom: 14px; }
        .nkm-accent { font-style: italic; color: #D86A1C; }
        .nkm-section { max-width: 1320px; margin: 0 auto; padding: 80px 48px; }
        .nkm-section-alt { background: rgba(255,250,244,0.1); }
        .nkm-section-hd { text-align: center; max-width: 600px; margin: 0 auto 56px; }
        .nkm-section-sub { font-size: 15px; color: #6B5B45; line-height: 1.8; }

        /* ── SEARCH BAR ── */
        .nkm-search-section {
          max-width: 1320px;
          margin: 0 auto;
          padding: 24px 48px 8px;
        }
        .nkm-search-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .nkm-search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(216,106,28,0.18);
          border-radius: 50px;
          padding: 0 18px;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .nkm-search-box:focus-within,
        .nkm-search-active {
          border-color: #D86A1C;
          background: rgba(255,255,255,0.96);
          box-shadow: 0 4px 24px rgba(216,106,28,0.18);
        }
        .nkm-search-icon {
          font-size: 15px;
          color: #D86A1C;
          opacity: 0.7;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .nkm-search-box:focus-within .nkm-search-icon { opacity: 1; }
        .nkm-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          color: #1A1208;
          padding: 14px 12px;
          min-width: 0;
        }
        .nkm-search-input::placeholder { color: #B8A090; }
        .nkm-search-clear {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(216,106,28,0.1);
          color: #D86A1C;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .nkm-search-clear:hover { background: rgba(216,106,28,0.2); transform: scale(1.1); }
        .nkm-search-status {
          display: flex;
          align-items: center;
          padding: 0 20px;
          min-height: 24px;
        }
        .nkm-search-count {
          font-size: 12.5px;
          color: #D86A1C;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          animation: nkmFadeUp 0.3s ease forwards;
        }
        .nkm-search-none {
          font-size: 12.5px;
          color: #9A8570;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          animation: nkmFadeUp 0.3s ease forwards;
        }
        .nkm-search-none i { color: #FF9800; }
        .nkm-search-none em { font-style: italic; color: #D86A1C; }

        /* ── HIGHLIGHT ── */
        .nkm-highlight {
          background: rgba(216,106,28,0.18);
          color: #A0440A;
          border-radius: 3px;
          padding: 0 2px;
          font-weight: 700;
        }

        /* ── SEARCH RESULT CATEGORY TAG ── */
        .nkm-search-cat-tag {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #fff;
          background: linear-gradient(135deg,#D86A1C,#F0924A);
          border-radius: 12px;
          padding: 2px 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── SEARCH EMPTY STATE ── */
        .nkm-search-empty { display: flex; align-items: center; justify-content: center; min-height: 320px; }
        .nkm-search-empty-inner { text-align: center; max-width: 400px; }
        .nkm-search-empty-icon { font-size: 48px; color: rgba(216,106,28,0.25); margin-bottom: 16px; }
        .nkm-search-empty-h { font-family: 'Cormorant Garamond',serif; font-size: 26px; font-weight: 600; color: #1A1208; margin-bottom: 10px; }
        .nkm-search-empty-h em { font-style: italic; color: #D86A1C; }
        .nkm-search-empty-sub { font-size: 14px; color: #9A8570; line-height: 1.7; }

        /* ── BUTTONS ── */
        .nkm-btn-primary { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; border: none; padding: 14px 30px; border-radius: 50px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans',sans-serif; box-shadow: 0 8px 24px rgba(216,106,28,0.35); transition: transform 0.2s,box-shadow 0.2s; }
        .nkm-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(216,106,28,0.45); }
        .nkm-btn-outline { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #D86A1C; border: 1.5px solid #D86A1C; padding: 13px 28px; border-radius: 50px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans',sans-serif; transition: all 0.25s; }
        .nkm-btn-outline:hover { background: #D86A1C; color: #fff; transform: translateY(-2px); }
        .nkm-btn-outline-light { color: #F8F1EA; border-color: rgba(248,241,234,0.6); }
        .nkm-btn-outline-light:hover { background: rgba(248,241,234,0.15); color: #F8F1EA; }

        /* ── VEG BADGE ── */
        .nkm-veg-badge { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0; }
        .nkm-veg { border: 1.5px solid #4CAF50; }
        .nkm-nonveg { border: 1.5px solid #D32F2F; }
        .nkm-veg-circle { width: 8px; height: 8px; border-radius: 50%; }
        .nkm-veg .nkm-veg-circle { background: #4CAF50; }
        .nkm-nonveg .nkm-veg-circle { background: #D32F2F; }

        /* ── SPICE DOTS ── */
        .nkm-spice-row { display: inline-flex; gap: 4px; align-items: center; }
        .nkm-spice-dot { width: 7px; height: 7px; border-radius: 50%; background: #E8D5C0; transition: background 0.2s; }
        .nkm-spice-dot-on { background: #D86A1C; }

        /* ── MISC TAGS ── */
        .nkm-unavail-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 1px; }
        .nkm-card-unavail { opacity: 0.7; }
        .nkm-item-unavail { opacity: 0.6; }
        .nkm-unavail { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #fff; background: #D32F2F; border-radius: 12px; padding: 2px 8px; white-space: nowrap; }
        .nkm-vegan-tag { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #2E7D32; background: rgba(46,125,50,0.12); border-radius: 12px; padding: 2px 8px; white-space: nowrap; }
        .nkm-sig-row { display: flex; gap: 12px; align-items: center; }
        .nkm-item-tags-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
        .nkm-item-meta-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
        .nkm-prep { font-size: 11px; color: #9A8570; display: inline-flex; align-items: center; gap: 4px; }
        .nkm-rating { font-size: 11px; color: #9A8570; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
        .nkm-rating i { color: #F0924A; }
        .nkm-chef-badge { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #D86A1C; background: rgba(216,106,28,0.1); border-radius: 12px; padding: 2px 8px; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
        .nkm-variant-select { margin-top: 10px; width: 100%; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 12px; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(216,106,28,0.25); background: #fff; color: #1A1208; cursor: pointer; }
        .nkm-add-btn { margin-top: 12px; width: 100%; padding: 9px; border-radius: 50px; border: 1.5px solid #D86A1C; background: transparent; color: #D86A1C; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
        .nkm-add-btn:hover { background: #D86A1C; color: #fff; }
        .nkm-add-btn-added { background: linear-gradient(135deg,#4CAF50,#66BB6A) !important; border-color: #4CAF50 !important; color: #fff !important; }
        .nkm-add-btn-sm { padding: 7px; font-size: 11px; }

        /* ── HERO ── */
        .nkm-hero { position: relative; display: flex; align-items: center; gap: 56px; padding: 64px 48px 72px; max-width: 1320px; margin: 0 auto; }
        .nkm-hero-text { flex: 0 0 46%; max-width: 540px; }
        .nkm-hero-sub { font-size: 15px; color: #6B5B45; line-height: 1.85; max-width: 440px; margin-bottom: 36px; }
        .nkm-hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }
        .nkm-hero-stats { display: flex; gap: 32px; margin-top: 40px; padding-top: 28px; border-top: 1px solid rgba(216,106,28,0.18); flex-wrap: wrap; }
        .nkm-stat { display: flex; flex-direction: column; gap: 4px; }
        .nkm-stat-n { font-family: 'Cormorant Garamond',serif; font-size: 28px; font-weight: 600; color: #D86A1C; }
        .nkm-stat-l { font-size: 11px; font-weight: 600; color: #6B5B45; letter-spacing: 0.5px; }
        .nkm-hero-collage { flex: 1; position: relative; height: 500px; }
        .nkm-collage-main { position: absolute; top: 0; left: 0; width: 68%; height: 88%; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 64px rgba(0,0,0,0.2); }
        .nkm-collage-img-main { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .nkm-collage-main:hover .nkm-collage-img-main { transform: scale(1.04); }
        .nkm-collage-side { position: absolute; right: 0; top: 16px; width: 33%; display: flex; flex-direction: column; gap: 14px; height: 86%; }
        .nkm-collage-sm-wrap { flex: 1; position: relative; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.16); }
        .nkm-collage-img-sm { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .nkm-collage-sm-wrap:hover .nkm-collage-img-sm { transform: scale(1.05); }
        .nkm-collage-tag { position: absolute; bottom: 10px; left: 10px; background: rgba(248,241,234,0.92); backdrop-filter: blur(8px); font-size: 11px; font-weight: 700; color: #1A1208; padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(216,106,28,0.2); }
        .nkm-float-card { position: absolute; background: rgba(248,241,234,0.94); backdrop-filter: blur(12px); border: 1px solid rgba(216,106,28,0.2); border-radius: 14px; padding: 10px 16px; font-size: 12px; font-weight: 700; color: #1A1208; box-shadow: 0 8px 24px rgba(0,0,0,0.12); animation: nkmFloat 4s ease-in-out infinite; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
        .nkm-float-card i { color: #D86A1C; }
        .nkm-fc1 { bottom: 32px; left: 5%; animation-delay: 0.4s; }
        .nkm-fc2 { top: 8px; right: 0; animation-delay: 1s; }
        .nkm-spice-float { position: absolute; font-size: 14px; color: #D86A1C; opacity: 0.25; animation: nkmFloat 5s ease-in-out infinite; pointer-events: none; }
        .nkm-sf1 { top: 15%; right: 4%; animation-delay: 0.5s; }
        .nkm-sf2 { bottom: 20%; left: 2%; animation-delay: 1.5s; }
        .nkm-leaf-float { position: absolute; font-size: 22px; color: #4CAF50; opacity: 0.15; animation: nkmFloat 6s ease-in-out infinite; pointer-events: none; }
        .nkm-lf1 { top: 8%; left: 3%; animation-delay: 0.8s; }
        .nkm-lf2 { bottom: 10%; right: 3%; animation-delay: 2s; }

        /* ── NAV ── */
        .nkm-nav {
          position: sticky;
          top: 80px;
          z-index: 900;
          background: rgba(248,241,234,0.97);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(216,106,28,0.12);
          padding: 8px 12px;
        }
        .nkm-nav-inner { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
        .nkm-nav-inner::-webkit-scrollbar { display: none; }
        .nkm-nav-tab { flex: 1; min-width: max-content; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.4px; color: #6B5B45; background: rgba(255,255,255,0.7); border: 1px solid rgba(216,106,28,0.12); border-radius: 8px; padding: 10px 14px; cursor: pointer; position: relative; transition: color 0.2s, background 0.2s, border-color 0.2s, transform 0.15s; white-space: nowrap; text-align: center; }
        .nkm-nav-tab:hover { background: rgba(216,106,28,0.07); color: #D86A1C; border-color: rgba(216,106,28,0.25); transform: translateY(-1px); }
        .nkm-nav-active { color: #D86A1C; background: rgba(216,106,28,0.1); border-color: rgba(216,106,28,0.4); box-shadow: 0 2px 8px rgba(216,106,28,0.15); }
        .nkm-nav-active::after { content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%); width: 20px; height: 2px; background: #D86A1C; border-radius: 2px; }

        /* ── SIGNATURE GRID ── */
        .nkm-sig-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 28px; }
        .nkm-sig-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 6px 28px rgba(0,0,0,0.08); border: 1px solid rgba(216,106,28,0.1); transition: transform 0.3s,box-shadow 0.3s; display: flex; flex-direction: column; height: 440px; }
        .nkm-sig-card:hover { transform: translateY(-6px); box-shadow: 0 18px 48px rgba(216,106,28,0.18); }
        .nkm-sig-img-wrap { position: relative; height: 220px; overflow: hidden; flex-shrink: 0; }
        .nkm-sig-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .nkm-sig-card:hover .nkm-sig-img { transform: scale(1.06); }
        .nkm-sig-badge { position: absolute; top: 12px; left: 12px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; }
        .nkm-sig-img-wrap .nkm-veg-badge { position: absolute; top: 12px; right: 12px; background: #fff; }
        .nkm-sig-body { padding: 20px; flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
        .nkm-sig-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .nkm-sig-name { font-family: 'Cormorant Garamond',serif; font-size: 20px; font-weight: 600; color: #1A1208; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .nkm-sig-price { font-family: 'Cormorant Garamond',serif; font-size: 22px; font-weight: 600; color: #D86A1C; white-space: nowrap; flex-shrink: 0; }
        .nkm-sig-desc { font-size: 13px; color: #6B5B45; line-height: 1.7; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .nkm-sig-meta { display: flex; flex-direction: column; gap: 8px; }
        .nkm-sig-pairing { font-size: 11px; color: #9A8570; font-style: italic; }

        /* ── MENU ITEMS ── */
        .nkm-items-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(340px,1fr)); gap: 16px; }
        .nkm-item { display: flex; align-items: flex-start; gap: 14px; background: #fff; border-radius: 16px; padding: 16px; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 3px 14px rgba(0,0,0,0.06); transition: transform 0.25s, box-shadow 0.25s; position: relative; height: 196px; overflow: hidden; }
        .nkm-item:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(216,106,28,0.14); }
        .nkm-item-search { border-color: rgba(216,106,28,0.15); }
        .nkm-item-avatar-wrap { flex-shrink: 0; width: 62px; height: 62px; border-radius: 50%; overflow: hidden; border: 2.5px solid rgba(216,106,28,0.2); box-shadow: 0 3px 10px rgba(0,0,0,0.1); transition: border-color 0.25s, transform 0.25s; margin-top: 2px; position: relative; }
        .nkm-item:hover .nkm-item-avatar-wrap { border-color: #D86A1C; transform: scale(1.05); }
        .nkm-item-avatar { width: 100%; height: 100%; object-fit: cover; display: block; }
        .nkm-item-avatar-unavail { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; }
        .nkm-item-content { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex: 1; min-width: 0; height: 100%; }
        .nkm-item-left { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; }
        .nkm-item-name-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 4px; }
        .nkm-item-name { font-family: 'Cormorant Garamond',serif; font-size: 17px; font-weight: 600; color: #1A1208; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .nkm-item-desc { font-size: 12.5px; color: #6B5B45; line-height: 1.65; margin-bottom: 7px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .nkm-item-ing { font-size: 11px; color: #9A8570; line-height: 1.5; margin-bottom: 7px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .nkm-ing-label { font-weight: 600; color: #7A6A55; }
        .nkm-item-price { font-family: 'Cormorant Garamond',serif; font-size: 20px; font-weight: 600; color: #D86A1C; white-space: nowrap; flex-shrink: 0; padding-top: 2px; }

        /* ── CHEF PICKS ── */
        .nkm-chefpicks { background: rgba(255,250,244,0.17); }
        .nkm-picks-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 20px; }
        .nkm-pick-card { position: relative; background: #fff; border-radius: 20px; border: 1px solid rgba(216,106,28,0.12); box-shadow: 0 4px 18px rgba(0,0,0,0.07); cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; padding: 20px; display: flex; gap: 16px; align-items: flex-start; overflow: hidden; height: 224px; }
        .nkm-pick-card:hover { transform: translateY(-5px); box-shadow: 0 14px 40px rgba(216,106,28,0.18); }
        .nkm-pick-avatar-wrap { flex-shrink: 0; width: 72px; height: 72px; border-radius: 50%; overflow: hidden; border: 3px solid rgba(216,106,28,0.2); box-shadow: 0 4px 14px rgba(0,0,0,0.12); transition: border-color 0.3s, transform 0.3s; position: relative; margin-top: -4px; }
        .nkm-pick-card:hover .nkm-pick-avatar-wrap { border-color: #D86A1C; transform: scale(1.06); }
        .nkm-pick-avatar { width: 100%; height: 100%; object-fit: cover; display: block; }
        .nkm-pick-avatar-unavail { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; }
        .nkm-pick-body { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; }
        .nkm-pick-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
        .nkm-pick-name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px; }
        .nkm-pick-name { font-family: 'Cormorant Garamond',serif; font-size: 18px; font-weight: 600; color: #1A1208; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .nkm-pick-cat { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #B8A090; }
        .nkm-pick-price { font-family: 'Cormorant Garamond',serif; font-size: 20px; font-weight: 600; color: #D86A1C; white-space: nowrap; flex-shrink: 0; }
        .nkm-pick-desc { font-size: 12px; color: #6B5B45; line-height: 1.6; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
        .nkm-pick-footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; margin-top: auto; }
        .nkm-pick-pair { font-size: 11px; color: #9A8570; }
        .nkm-pick-pair em { font-style: italic; color: #D86A1C; }

        /* ── SPICE SECTION ── */
        .nkm-spice-section { background: transparent; }
        .nkm-spice-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        .nkm-spice-card { background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1.5px solid rgba(255,255,255,0.6); border-radius: 24px; padding: 32px 20px 24px; text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8); display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .nkm-spice-card:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); border-color: var(--sp-color); background: rgba(255,255,255,0.92); }
        .nkm-spice-sel { border-color: var(--sp-color); background: rgba(255,255,255,0.95); transform: translateY(-8px); box-shadow: 0 16px 40px rgba(0,0,0,0.14); }
        .nkm-spice-icon-wrap { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 1.5px solid rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.08); transition: transform 0.3s ease; color: var(--sp-color); font-size: 30px; }
        .nkm-spice-card:hover .nkm-spice-icon-wrap { transform: scale(1.1) rotate(-5deg); }
        .nkm-spice-label { font-family: 'Cormorant Garamond',serif; font-size: 22px; font-weight: 600; color: #1A1208; }
        .nkm-spice-desc { font-size: 12px; color: #9A8570; line-height: 1.6; max-width: 160px; }
        .nkm-spice-chilli-row { display: flex; gap: 4px; align-items: center; margin: 4px 0; }
        .nkm-spice-chilli { font-size: 14px; color: #B71C1C; opacity: 0.15; transition: opacity 0.2s, transform 0.2s; }
        .nkm-spice-chilli-on { opacity: 1; }
        .nkm-spice-card:hover .nkm-spice-chilli-on { transform: scale(1.15); }
        .nkm-spice-bar { width: 100%; height: 4px; background: rgba(0,0,0,0.07); border-radius: 4px; overflow: hidden; margin-top: 4px; }
        .nkm-spice-fill { height: 100%; background: var(--sp-color); border-radius: 4px; transition: width 0.4s ease; }
        .nkm-spice-footer { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 32px; font-size: 13px; color: #9A8570; }
        .nkm-spice-footer em { font-style: italic; color: #D86A1C; }
        .nkm-spice-footer i { color: #D86A1C; }

        /* ── SPICE MODAL ── */
        .nkm-spice-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .nkm-spice-modal { background: #FDF8F3; border-radius: 28px; width: 100%; max-width: 620px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 32px 80px rgba(0,0,0,0.22); }
        .nkm-spice-modal-hd { position: relative; display: flex; align-items: flex-start; justify-content: space-between; padding: 28px 28px 20px; background: linear-gradient(135deg,#FDF8F3,#F5EBE0); border-bottom: 1px solid rgba(216,106,28,0.12); overflow: hidden; }
        .nkm-spice-modal-hd-left { display: flex; align-items: center; gap: 14px; }
        .nkm-spice-modal-hd-icon { font-size: 32px; line-height: 1; color: #D86A1C; }
        .nkm-spice-modal-title { font-family: 'Cormorant Garamond',serif; font-size: 30px; font-weight: 600; color: #1A1208; line-height: 1.1; margin-bottom: 4px; }
        .nkm-spice-modal-subtitle { font-size: 13px; color: #9A8570; line-height: 1.5; max-width: 320px; }
        .nkm-spice-modal-close { background: #fff; border: 1.5px solid rgba(216,106,28,0.2); width: 36px; height: 36px; border-radius: 50%; font-size: 14px; cursor: pointer; color: #9A8570; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .nkm-spice-modal-close:hover { background: #D86A1C; color: #fff; border-color: #D86A1C; }
        .nkm-spice-modal-hd-deco { position: absolute; right: 60px; top: -10px; font-size: 70px; opacity: 0.07; pointer-events: none; transform: rotate(20deg); color: #D86A1C; }
        .nkm-spice-modal-list { overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
        .nkm-spice-modal-list::-webkit-scrollbar { width: 4px; }
        .nkm-spice-modal-list::-webkit-scrollbar-thumb { background: rgba(216,106,28,0.2); border-radius: 4px; }
        .nkm-spice-modal-item { position: relative; display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; border: 1.5px solid rgba(216,106,28,0.1); background: #fff; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .nkm-spice-modal-item:hover { background: #FEF6EE; border-color: #D86A1C; transform: translateX(4px); box-shadow: 0 6px 20px rgba(216,106,28,0.12); }
        .nkm-spice-modal-item-chef { border-color: rgba(216,106,28,0.35); background: linear-gradient(135deg,#fff,#FEF6EE); }
        .nkm-spice-modal-chef-badge { position: absolute; left: -2px; top: 50%; transform: translateY(-50%); background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; font-size: 9px; font-weight: 700; padding: 6px 8px; border-radius: 10px 0 0 10px; text-align: center; line-height: 1.3; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 44px; }
        .nkm-spice-modal-img { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .nkm-spice-modal-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .nkm-spice-modal-name { font-family: 'Cormorant Garamond',serif; font-size: 18px; font-weight: 600; color: #1A1208; line-height: 1.2; }
        .nkm-spice-modal-cat { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #B8A090; }
        .nkm-spice-modal-desc { font-size: 12px; color: #9A8570; line-height: 1.5; margin-top: 2px; }
        .nkm-spice-modal-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .nkm-spice-modal-price { font-family: 'Cormorant Garamond',serif; font-size: 20px; font-weight: 600; color: #D86A1C; white-space: nowrap; }
        .nkm-spice-modal-spicy-tag { font-size: 11px; font-weight: 600; color: #D86A1C; background: rgba(216,106,28,0.1); border-radius: 20px; padding: 3px 10px; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
        .nkm-spice-modal-footer { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 24px; background: linear-gradient(135deg,#F5EBE0,#FDF8F3); border-top: 1px solid rgba(216,106,28,0.1); font-size: 13px; color: #9A8570; }
        .nkm-spice-modal-footer em { font-style: italic; color: #D86A1C; }
        .nkm-spice-modal-footer i { color: #D86A1C; }

        /* ── CTA ── */
        .nkm-cta { position: relative; padding: 96px 48px; text-align: center; background: linear-gradient(135deg,#2B1600,#4A2500); overflow: hidden; }
        .nkm-cta-content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
        .nkm-cta-h2 { font-family: 'Cormorant Garamond',serif; font-size: clamp(28px,4vw,54px); font-weight: 600; line-height: 1.1; color: #F8F1EA; margin-bottom: 18px; }
        .nkm-cta-h2 .nkm-accent { color: #F0924A; }
        .nkm-cta-sub { font-size: 15px; color: rgba(248,241,234,0.72); line-height: 1.8; margin-bottom: 36px; }
        .nkm-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .nkm-cta-leaf { position: absolute; font-size: 44px; opacity: 0.06; animation: nkmFloat 6s ease-in-out infinite; pointer-events: none; color: #fff; }
        .nkm-cl1 { top: 10%; left: 5%; }
        .nkm-cl2 { bottom: 10%; right: 5%; animation-delay: 1s; }
        .nkm-cl3 { top: 40%; left: 50%; font-size: 70px; color: #D86A1C; animation-delay: 2s; }

        /* ══════════════════════════════════════════
           RESPONSIVE
        ══════════════════════════════════════════ */
        @media (max-width:1100px) {
          .nkm-spice-cards { grid-template-columns: repeat(2,1fr); }
        }

        @media (max-width:900px) {
          .nkm-hero { flex-direction: column; padding: 40px 24px; gap: 32px; }
          .nkm-hero-text { max-width: 100%; flex: none; }
          .nkm-hero-collage { width: 100%; height: 280px; }
          .nkm-collage-main { width: 65%; height: 100%; }
          .nkm-collage-side { top: 8px; height: 94%; width: 34%; }
          .nkm-fc1,.nkm-fc2 { display: none; }
          .nkm-section { padding: 56px 20px; }
          .nkm-nav { top: 72px; }
          .nkm-search-section { padding: 16px 20px 6px; }
          .nkm-items-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .nkm-sig-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .nkm-picks-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .nkm-sig-card { height: auto; }
          .nkm-sig-img-wrap { height: 100px; }
          .nkm-sig-body { padding: 10px; }
          .nkm-sig-name { font-size: 13px; }
          .nkm-sig-price { font-size: 14px; }
          .nkm-sig-desc { display: none; }
          .nkm-sig-badge { font-size: 7px; padding: 3px 8px; }
          .nkm-add-btn { font-size: 10px; padding: 6px; margin-top: 8px; }
          .nkm-item { flex-direction: column; align-items: center; text-align: center; padding: 10px 8px; gap: 6px; height: auto; }
          .nkm-item-avatar-wrap { width: 56px; height: 56px; margin-top: 0; }
          .nkm-item-content { flex-direction: column; align-items: center; width: 100%; gap: 4px; height: auto; }
          .nkm-item-left { width: 100%; height: auto; }
          .nkm-item-name-row { justify-content: center; }
          .nkm-item-name { font-size: 12.5px; }
          .nkm-item-desc { display: none; }
          .nkm-item-ing { display: none; }
          .nkm-item-meta-row { justify-content: center; }
          .nkm-item-price { font-size: 14px; padding-top: 0; }
          .nkm-item-tags-row { justify-content: center; }
          .nkm-variant-select { font-size: 10px; }
          .nkm-pick-card { flex-direction: column; align-items: center; text-align: center; padding: 14px 10px; gap: 8px; height: auto; }
          .nkm-pick-avatar-wrap { margin-top: 0; }
          .nkm-pick-top { flex-direction: column; align-items: center; gap: 4px; }
          .nkm-pick-name-row { justify-content: center; }
          .nkm-pick-desc { display: none; }
          .nkm-pick-footer { justify-content: center; margin-top: 0; }
          /* search results on mobile: show desc again since it's the main view */
          .nkm-item-search { height: 220px; }
          .nkm-item-search .nkm-item-desc { display: -webkit-box; }
          .nkm-item-search .nkm-item-ing { display: -webkit-box; }
        }

        @media (max-width:768px) {
          .nkm-nav { top: 64px; padding: 6px 8px; }
          .nkm-nav-inner { gap: 4px; }
          .nkm-nav-tab { padding: 9px 10px; font-size: 11px; border-radius: 7px; }
          .nkm-spice-modal { max-height: 92vh; border-radius: 20px; }
          .nkm-spice-modal-hd { padding: 20px 20px 16px; }
          .nkm-spice-modal-title { font-size: 22px; }
          .nkm-search-input { font-size: 13px; }
        }

        @media (max-width:600px) {
          .nkm-hero { padding: 24px 16px 36px; }
          .nkm-hero-collage { height: 220px; }
          .nkm-section { padding: 36px 14px; }
          .nkm-search-section { padding: 12px 14px 4px; }
          .nkm-nav { padding: 5px 8px; }
          .nkm-nav-inner { gap: 4px; }
          .nkm-nav-tab { padding: 8px 9px; font-size: 10.5px; border-radius: 6px; }
          .nkm-spice-cards { grid-template-columns: repeat(2,1fr); gap: 10px; }
          .nkm-cta { padding: 64px 16px; }
          .nkm-cta-btns { flex-direction: column; align-items: center; }
          .nkm-hero-btns { flex-direction: column; }
          .nkm-hero-stats { gap: 20px; }
          .nkm-items-grid { grid-template-columns: repeat(4, 1fr); gap: 7px; }
          .nkm-sig-grid { grid-template-columns: repeat(3, 1fr); gap: 7px; }
          .nkm-picks-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .nkm-item { padding: 8px 4px; gap: 4px; border-radius: 12px; height: auto; }
          .nkm-item-avatar-wrap { width: 44px; height: 44px; }
          .nkm-item-name { font-size: 10.5px; line-height: 1.15; }
          .nkm-item-price { font-size: 12px; }
          .nkm-item-meta-row { gap: 6px; }
          .nkm-item-tags-row { gap: 4px; }
          .nkm-add-btn-sm { font-size: 9px; padding: 5px 4px; }
          .nkm-veg-badge { width: 13px; height: 13px; }
          .nkm-sig-img-wrap { height: 78px; }
          .nkm-sig-body { padding: 7px; }
          .nkm-sig-name { font-size: 11px; }
          .nkm-sig-price { font-size: 12px; }
          .nkm-sig-top { margin-bottom: 4px; }
          .nkm-pick-avatar-wrap { width: 50px; height: 50px; }
          .nkm-pick-name { font-size: 13px; }
          .nkm-pick-price { font-size: 14px; }
          .nkm-spice-modal-overlay { padding: 0; align-items: flex-end; }
          .nkm-spice-modal { border-radius: 20px 20px 0 0; max-height: 90vh; }
          .nkm-section-hd { margin-bottom: 30px; }
          .nkm-search-box { border-radius: 14px; }
          /* search results in mobile: full-width single column */
          .nkm-item-search { flex-direction: row; text-align: left; height: 132px; }
          .nkm-item-search .nkm-item-name-row { justify-content: flex-start; }
          .nkm-item-search .nkm-item-tags-row { justify-content: flex-start; }
          .nkm-item-search .nkm-item-meta-row { justify-content: flex-start; }
          .nkm-item-search .nkm-item-content { flex-direction: row; }
        }

        @media (max-width:400px) {
          .nkm-nav-tab { padding: 7px 7px; font-size: 9.5px; border-radius: 5px; }
          .nkm-spice-cards { grid-template-columns: 1fr 1fr; gap: 8px; }
          .nkm-items-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .nkm-sig-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .nkm-item-avatar-wrap { width: 40px; height: 40px; }
          .nkm-item-name { font-size: 9.5px; }
        }

        @media (prefers-reduced-motion:reduce) {
          .nkm-fade-up { animation: none; opacity: 1; transform: none; }
          .nkm-float-card,.nkm-spice-float,.nkm-leaf-float,.nkm-cta-leaf { animation: none; }
        }
      `}</style>
    </>
  );
}