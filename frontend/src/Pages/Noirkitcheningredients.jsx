import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faStar, faArrowRight, faLeaf, faDrumstickBite, faFish,
    faEgg, faWheatAwn, faSeedling, faCarrot, faPepperHot,
    faAppleWhole, faSnowflake, faThermometerHalf,
    faShieldAlt, faRecycle, faMagnifyingGlass, faHandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";
import { useNavigate } from "react-router-dom";
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

function useReveal(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
}
const INGREDIENT_DETAILS = {
  "Fresh Vegetables": [
    { name: "Lettuce & Spinach", benefit: "Rich in iron and folate · Supports digestion and immune function" },
    { name: "Tomatoes", benefit: "High in lycopene · Antioxidant-rich · Promotes heart health" },
    { name: "Bell Peppers", benefit: "Excellent source of Vitamin C · Boosts collagen and immunity" },
    { name: "Mushrooms", benefit: "Natural umami depth · Rich in B vitamins and selenium" },
    { name: "Broccoli", benefit: "Packed with Vitamin K and fiber · Anti-inflammatory properties" },
  ],
  "Herbs & Greens": [
    { name: "Basil", benefit: "Anti-inflammatory · Rich in antioxidants · Enhances digestion" },
    { name: "Mint", benefit: "Soothes digestion · Natural breath freshener · Cooling effect" },
    { name: "Rosemary", benefit: "Improves memory and focus · High in antioxidants" },
    { name: "Thyme", benefit: "Natural antibacterial · Rich in Vitamin C and iron" },
    { name: "Parsley", benefit: "High in Vitamin K · Detoxifying · Rich in flavonoids" },
  ],
  "Aromatics": [
    { name: "Garlic", benefit: "Powerful immune booster · Reduces blood pressure · Antiviral" },
    { name: "Ginger", benefit: "Anti-nausea · Anti-inflammatory · Aids digestion" },
    { name: "Onions", benefit: "Rich in quercetin · Supports gut health · Antioxidant-rich" },
    { name: "Shallots", benefit: "Milder than onion · High in flavonoids · Supports heart health" },
  ],
  "Premium Meats": [
    { name: "Chicken", benefit: "Lean protein · Rich in niacin and selenium · Supports muscle health" },
    { name: "Lamb", benefit: "High in zinc and B12 · Supports immunity and energy metabolism" },
    { name: "Beef", benefit: "Rich in iron and creatine · Promotes muscle growth and strength" },
    { name: "Duck", benefit: "High in iron · Rich in B vitamins · Flavorful healthy fat profile" },
  ],
  "Sustainable Seafood": [
    { name: "Salmon", benefit: "Omega-3 rich · Supports brain and heart health · High protein" },
    { name: "Prawns", benefit: "Low calorie · High in iodine · Supports thyroid function" },
    { name: "Tuna", benefit: "Lean protein source · Rich in Vitamin D and selenium" },
    { name: "Crab", benefit: "High in zinc · Low fat · Supports immune system" },
  ],
  "Dairy & Eggs": [
    { name: "Milk & Cream", benefit: "High in calcium and Vitamin D · Supports bone density" },
    { name: "Butter", benefit: "Source of fat-soluble vitamins A, D, E, K · Adds rich flavor" },
    { name: "Cheese", benefit: "High in protein and calcium · Supports muscle and bone health" },
    { name: "Eggs", benefit: "Complete protein source · Rich in choline · Supports brain health" },
  ],
  "Grains & Cereals": [
    { name: "Rice", benefit: "Easy to digest · Good energy source · Gluten-free" },
    { name: "Pasta", benefit: "Sustained energy release · Source of complex carbohydrates" },
    { name: "Quinoa", benefit: "Complete protein · High in fiber · Rich in magnesium" },
    { name: "Couscous", benefit: "Quick-cooking · Source of selenium · Light and versatile" },
  ],
  "Spices & Seasonings": [
    { name: "Cardamom", benefit: "Digestive aid · Anti-inflammatory · Rich in antioxidants" },
    { name: "Cinnamon", benefit: "Regulates blood sugar · Anti-microbial · Warming spice" },
    { name: "Turmeric", benefit: "Powerful anti-inflammatory · Supports joint and brain health" },
    { name: "Paprika", benefit: "Rich in Vitamin A · Antioxidant-rich · Promotes eye health" },
    { name: "Pepper", benefit: "Enhances nutrient absorption · Antioxidant · Digestive aid" },
  ],
  "Fruits & Nuts": [
    { name: "Berries", benefit: "High in antioxidants · Supports brain health · Low glycemic" },
    { name: "Citrus", benefit: "Vitamin C powerhouse · Immune support · Collagen production" },
    { name: "Almonds", benefit: "Heart-healthy fats · Rich in Vitamin E · Supports satiety" },
    { name: "Pistachios", benefit: "High in protein and fiber · Eye health · Rich in B6" },
  ],
};
const CATEGORIES = [
    { icon: faCarrot, title: "Fresh Vegetables", items: "Lettuce · Spinach · Tomatoes · Bell Peppers · Mushrooms · Broccoli", badge: "Daily Sourced", color: "#4CAF50" },
    { icon: faLeaf, title: "Herbs & Greens", items: "Basil · Mint · Rosemary · Thyme · Parsley", badge: "Garden Fresh", color: "#66BB6A" },
    { icon: faSeedling, title: "Aromatics", items: "Garlic · Ginger · Onions · Shallots", badge: "Hand Inspected", color: "#8D6E63" },
    { icon: faDrumstickBite, title: "Premium Meats", items: "Chicken · Lamb · Beef · Duck", badge: "Hormone-Free", color: "#EF5350" },
    { icon: faFish, title: "Sustainable Seafood", items: "Salmon · Prawns · Tuna · Crab", badge: "Ocean Certified", color: "#42A5F5" },
    { icon: faEgg, title: "Dairy & Eggs", items: "Milk · Butter · Cream · Cheese · Eggs", badge: "Free-Range", color: "#FFA726" },
    { icon: faWheatAwn, title: "Grains & Cereals", items: "Rice · Pasta · Quinoa · Couscous", badge: "Premium Grade", color: "#FFCA28" },
    { icon: faPepperHot, title: "Spices & Seasonings", items: "Cardamom · Cinnamon · Pepper · Turmeric · Paprika", badge: "Small Batch", color: "#C4510A" },
    { icon: faAppleWhole, title: "Fruits & Nuts", items: "Berries · Citrus · Almonds · Pistachios", badge: "Seasonal Pick", color: "#EC407A" },
];

const COMMITMENTS = [
    { icon: faLeaf, title: "Farm-to-Table Freshness", desc: "Direct relationships with trusted local farms for seasonal, premium sourcing." },
    { icon: faMagnifyingGlass, title: "Daily Quality Checks", desc: "Visual inspections and freshness verification before every kitchen session." },
    { icon: faHandSparkles, title: "Hygienic Handling", desc: "Strict sanitation protocols and rigorous food safety standards at every step." },
    { icon: faShieldAlt, title: "Premium Sourcing", desc: "Ethically raised meats, sustainable seafood, and authentic artisan ingredients." },
    { icon: faRecycle, title: "Responsible Practices", desc: "Sustainability-first philosophy with a commitment to reducing food waste." },
];

const STORAGE = [
    { label: "Fresh Vegetables", temp: "2–8°C", icon: faCarrot, color: "#4CAF50" },
    { label: "Meat & Poultry", temp: "0–4°C", icon: faDrumstickBite, color: "#E57373" },
    { label: "Seafood", temp: "0–2°C", icon: faFish, color: "#42A5F5" },
    { label: "Dairy Products", temp: "1–4°C", icon: faEgg, color: "#FFF176" },
    { label: "Frozen Items", temp: "Below -18°C", icon: faSnowflake, color: "#80DEEA" },
    { label: "Dry Goods & Spices", temp: "Cool & Dry", icon: faPepperHot, color: "#FFCC80" },
];

const JOURNEY = [
    { step: "01", title: "Local Farms", desc: "Partnering with regional growers who share our standards." },
    { step: "02", title: "Careful Selection", desc: "Every ingredient personally chosen at peak quality." },
    { step: "03", title: "Daily Inspection", desc: "Rigorous freshness checks on arrival each morning." },
    { step: "04", title: "Expert Preparation", desc: "Handled by trained chefs with precision and care." },
    { step: "05", title: "Beautiful Presentation", desc: "Plated with artistry that honors the ingredient." },
    { step: "06", title: "Unforgettable Dining", desc: "An experience that begins long before the first bite." },
];

/* ── Hero ── */
function Hero() {
    const [ref, vis] = useReveal(0.05);
    return (
        <section ref={ref} className="nki-hero">
            <div className={`nki-hero-text ${vis ? "nki-fade-up" : "nki-hidden"}`}>
                <p className="nki-eyebrow">OUR INGREDIENTS <span className="nki-ornament">✦</span></p>
                <h1 className="nki-h1">
                    <em className="nki-accent-italic">Fresh</em> Ingredients.<br />
                    <em className="nki-accent-italic">Exceptional</em> Taste.
                </h1>
                <p className="nki-hero-sub">Every unforgettable dish begins with ingredients chosen with care, sourced responsibly, and prepared with uncompromising standards.</p>
                <button className="nki-btn-primary">Our Quality Promise <FontAwesomeIcon icon={faArrowRight} /></button>
                <div className="nki-hero-stats">
                    {[["50+", "Local Suppliers"], ["100%", "Hormone-Free Meats"], ["Daily", "Fresh Deliveries"]].map(([n, l]) => (
                        <div key={l} className="nki-stat">
                            <span className="nki-stat-num">{n}</span>
                            <span className="nki-stat-label">{l}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`nki-hero-collage ${vis ? "nki-fade-up nki-delay-2" : "nki-hidden"}`}>
                <div className="nki-collage-main">
                    <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80" alt="Fresh ingredients" className="nki-collage-img-main" />
                </div>
                <div className="nki-collage-side">
                    <img src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&q=80" alt="Herbs" className="nki-collage-img-sm" />
                    <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80" alt="Spices" className="nki-collage-img-sm" />
                </div>
                <div className="nki-float-card nki-float-card-1">
                    <FontAwesomeIcon icon={faLeaf} className="nki-float-icon" />
                    <span>100% Organic Herbs</span>
                </div>
                <div className="nki-float-card nki-float-card-2">
                    <FontAwesomeIcon icon={faStar} className="nki-float-icon" />
                    <span>Chef Approved Quality</span>
                </div>
            </div>
            {[{ t: "18%", r: "5%", s: 10, d: "0s" }, { t: "40%", r: "2%", s: 6, d: "0.5s" }, { t: "65%", r: "9%", s: 8, d: "1s" }].map((d, i) => (
                <div key={i} className="nki-dot" style={{ top: d.t, right: d.r, width: d.s, height: d.s, animationDelay: d.d }} />
            ))}
        </section>
    );
}
function IngredientModal({ cat, onClose }) {
  const details = INGREDIENT_DETAILS[cat.title] || [];
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="nki-modal-overlay" onClick={onClose}>
      <div className="nki-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nki-modal-header">
          <div className="nki-modal-icon" style={{ background: `${cat.color}18`, color: cat.color }}>
            <FontAwesomeIcon icon={cat.icon} />
          </div>
          <div className="nki-modal-title-group">
            <div className="nki-modal-eyebrow">Ingredient Profile</div>
            <div className="nki-modal-title">{cat.title}</div>
          </div>
          <button className="nki-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="nki-modal-body">
          <div className="nki-modal-badge">{cat.badge}</div>
          <div className="nki-ingredient-list">
            {details.map((item) => (
              <div key={item.name} className="nki-ingredient-item">
                <div className="nki-item-dot" style={{ background: cat.color }} />
                <div>
                  <div className="nki-item-name">{item.name}</div>
                  <div className="nki-item-benefit">{item.benefit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ── Bubble Categories ── */
function BubbleCategory({ cat, index }) {
  const [open, setOpen] = useState(false);
  const delay = (index % 9) * 55;

  return (
    <>
      <div
        className="nki-bubble-wrap nki-fade-up"
        style={{ animationDelay: `${delay}ms` }}
        onClick={() => setOpen(true)}
      >
        <div className="nki-bubble" style={{ "--bubble-color": cat.color }}>
          <div className="nki-bubble-inner">
            <div className="nki-bubble-icon"><FontAwesomeIcon icon={cat.icon} /></div>
            <span className="nki-bubble-title">{cat.title}</span>
          </div>
          <div className="nki-bubble-ring" />
          <div className="nki-bubble-ring nki-bubble-ring-2" />
        </div>
      </div>
      {open && <IngredientModal cat={cat} onClose={() => setOpen(false)} />}
    </>
  );
}

function Categories() {
    const [ref, vis] = useReveal(0.08);
    return (
        <section className="nki-section nki-section-alt" id="ingredients">
            <div ref={ref} className={`nki-section-header ${vis ? "nki-fade-up" : "nki-hidden"}`}>
                <p className="nki-eyebrow">INGREDIENTS <span className="nki-ornament">✦</span></p>
                <h2 className="nki-h2">Selected With <em className="nki-accent-italic">Purpose</em></h2>
                <p className="nki-section-sub">Tap any ingredient bubble to explore what makes it exceptional.</p>
            </div>
            <div className={`nki-bubble-field ${vis ? "" : "nki-hidden"}`}>
                {CATEGORIES.map((cat, i) => <BubbleCategory key={cat.title} cat={cat} index={i} />)}
            </div>
        </section>
    );
}

/* ── Commitment ── */
function Commitment() {
    const [ref, vis] = useReveal(0.1);
    return (
        <section ref={ref} className="nki-section nki-commitment">
            <div className={`nki-commit-img-wrap ${vis ? "nki-slide-left" : "nki-hidden"}`}>
                <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=700&q=80" alt="Chef preparing ingredients" className="nki-commit-img" />
                <div className="nki-commit-img-badge">
                    <FontAwesomeIcon icon={faStar} style={{ color: "#C4510A", marginRight: 8 }} />
                    Excellence Since Day One
                </div>
            </div>
            <div className={`nki-commit-text ${vis ? "nki-slide-right" : "nki-hidden"}`}>
                <p className="nki-eyebrow">QUALITY COMMITMENT <span className="nki-ornament">✦</span></p>
                <h2 className="nki-h2" style={{ marginBottom: 32 }}>Our Commitment<br />to <em className="nki-accent-italic">Quality</em></h2>
                <div className="nki-timeline">
                    {COMMITMENTS.map((c, i) => (
                        <div key={c.title} className="nki-timeline-item" style={{ transitionDelay: `${i * 80}ms` }}>
                            <div className="nki-timeline-icon"><FontAwesomeIcon icon={c.icon} /></div>
                            <div className="nki-timeline-connector" />
                            <div className="nki-timeline-content">
                                <h4 className="nki-timeline-title">{c.title}</h4>
                                <p className="nki-timeline-desc">{c.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ── Storage ── */
function Storage() {
    const [ref, vis] = useReveal(0.1);
    return (
        <section className="nki-section nki-section-alt">
            <div ref={ref} className={`nki-section-header ${vis ? "nki-fade-up" : "nki-hidden"}`}>
                <p className="nki-eyebrow">SAFETY STANDARDS <span className="nki-ornament">✦</span></p>
                <h2 className="nki-h2">Protected at <em className="nki-accent-italic">Every Step</em></h2>
                <p className="nki-section-sub">Precise temperature control ensures every ingredient arrives at your table in perfect condition.</p>
            </div>
            <div className="nki-storage-grid">
                {STORAGE.map((s, i) => (
                    <div key={s.label} className={`nki-storage-card ${vis ? "nki-fade-up" : "nki-hidden"}`} style={{ transitionDelay: `${i * 80}ms` }}>
                        <div className="nki-storage-icon-wrap" style={{ background: `${s.color}22` }}>
                            <FontAwesomeIcon icon={s.icon} style={{ color: s.color, fontSize: 22 }} />
                        </div>
                        <div className="nki-storage-body">
                            <p className="nki-storage-label">{s.label}</p>
                            <div className="nki-storage-temp-row">
                                <FontAwesomeIcon icon={faThermometerHalf} style={{ color: "#C4510A", fontSize: 12, marginRight: 6 }} />
                                <span className="nki-storage-temp">{s.temp}</span>
                            </div>
                        </div>
                        <div className="nki-storage-bar">
                            <div className="nki-storage-bar-fill" style={{ background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ── Journey ── */
function Journey() {
    const [ref, vis] = useReveal(0.1);
    return (
        <section ref={ref} className="nki-section nki-journey-section">
            <div className={`nki-section-header ${vis ? "nki-fade-up" : "nki-hidden"}`}>
                <p className="nki-eyebrow">FARM TO TABLE <span className="nki-ornament">✦</span></p>
                <h2 className="nki-h2">The <em className="nki-accent-italic">Journey</em> to Your Plate</h2>
            </div>
            <div className="nki-journey-track">
                {JOURNEY.map((j, i) => (
                    <div key={j.step} className={`nki-journey-item ${vis ? "nki-fade-up" : "nki-hidden"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                        <div className="nki-journey-step">{j.step}</div>
                        {i < JOURNEY.length - 1 && <div className="nki-journey-line" />}
                        <div className="nki-journey-dot" />
                        <h4 className="nki-journey-title">{j.title}</h4>
                        <p className="nki-journey-desc">{j.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ── Philosophy ── */
function Philosophy() {
    const [ref, vis] = useReveal(0.1);
    return (
        <section ref={ref} className="nki-philosophy">
            <div className={`nki-philosophy-content ${vis ? "nki-fade-up" : "nki-hidden"}`}>
                <p className="nki-eyebrow" style={{ color: "#C4510A" }}>OUR PHILOSOPHY <span className="nki-ornament">✦</span></p>
                <h2 className="nki-philosophy-h2">
                    "Great Cuisine Begins Long<br />Before the <em className="nki-accent-italic">First Bite.</em>"
                </h2>
                <p className="nki-philosophy-quote">We believe extraordinary dining experiences begin with extraordinary ingredients.</p>
                <div className="nki-philosophy-sig">Noir Kitchen</div>
            </div>
            <div className={`nki-philosophy-img-wrap ${vis ? "nki-fade-up nki-delay-2" : "nki-hidden"}`}>
                <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80" alt="Chef at work" className="nki-philosophy-img" />
            </div>
        </section>
    );
}

/* ── CTA ── */
function CTA() {
    const [ref, vis] = useReveal(0.1);
    return (
        <section ref={ref} className="nki-cta-section">
            <div className={`nki-cta-content ${vis ? "nki-fade-up" : "nki-hidden"}`}>
                <p className="nki-eyebrow" style={{ justifyContent: "center" }}>NOIR KITCHEN <span className="nki-ornament">✦</span></p>
                <h2 className="nki-h2" style={{ textAlign: "center", marginBottom: 12 }}>
                    Experience Ingredients<br />at Their <em className="nki-accent-italic">Finest</em>
                </h2>
                <p className="nki-section-sub" style={{ textAlign: "center", marginBottom: 36 }}>Because every remarkable dish starts with a remarkable choice.</p>
                <div className="nki-cta-btns">
                    <button className="nki-btn-primary">Explore Our Menu <FontAwesomeIcon icon={faArrowRight} /></button>
                    <button className="nki-btn-outline">Reserve a Table <FontAwesomeIcon icon={faArrowRight} /></button>
                </div>
            </div>
            {[{ t: "15%", l: "8%" }, { t: "70%", l: "5%" }, { t: "25%", r: "6%" }, { t: "75%", r: "10%" }].map((d, i) => (
                <div key={i} className="nki-herb-float" style={{ top: d.t, left: d.l, right: d.r, animationDelay: `${i * 0.6}s` }}>
                    <FontAwesomeIcon icon={faLeaf} />
                </div>
            ))}
        </section>
    );
}
/* ── MAIN ── */
export default function NoirKitchenIngredients({ user, onLogout, cart }) {
    const navigate = useNavigate();

    return (
        <>
            <link href={FONT_LINK} rel="stylesheet" />
            <div className="nki-root">
              <div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker />
                <Navbar
                    user={user}
                    onLogout={onLogout || (() => { localStorage.removeItem("token"); navigate("/"); })}
                    activeNav="Home"
                    setActiveNav={() => { }}
                    cart={cart}
                />
  </div>
                <div className="nki-page-offset">
                    <Hero />
                    <Categories />
                    <Commitment />
                    <Storage />
                    <Journey />
                    <Philosophy />
                    <CTA />
                </div>
            </div>

            <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .nki-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #F5E6D7;
          color: #1A1A1A;
          overflow-x: hidden;
        }
        .nki-page-offset { padding-top: 68px; }

        /* ── ANIMATIONS ── */
        .nki-hidden { opacity: 0; transform: translateY(28px); }
        .nki-fade-up { animation: nkiFadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }
        .nki-slide-left { animation: nkiSlideLeft 0.75s cubic-bezier(0.22,1,0.36,1) forwards; }
        .nki-slide-right { animation: nkiSlideRight 0.75s cubic-bezier(0.22,1,0.36,1) forwards; }
        .nki-delay-2 { animation-delay: 0.18s; }
        @keyframes nkiFadeUp    { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }
        @keyframes nkiSlideLeft { from{opacity:0;transform:translateX(-48px);} to{opacity:1;transform:translateX(0);} }
        @keyframes nkiSlideRight{ from{opacity:0;transform:translateX(48px);}  to{opacity:1;transform:translateX(0);} }
        @keyframes nkiFloat     { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes nkiFloatHerb { 0%,100%{transform:translateY(0) rotate(0deg);opacity:0.2;} 50%{transform:translateY(-14px) rotate(8deg);opacity:0.35;} }

        /* ── POP BUBBLE ── */
        @keyframes nkiBubblePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.18); }
          65%  { transform: scale(0.93); }
          85%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes nkiBubbleCollapse {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.88); }
          70%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes nkiRingExpand {
          0%   { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes nkiTooltipIn {
          from { opacity:0; transform: translateY(8px) scale(0.95); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .nki-bubble-pop    { animation: nkiBubblePop 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .nki-bubble-collapse { animation: nkiBubbleCollapse 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }

        .nki-bubble-field {
          display: flex; flex-wrap: wrap;
          justify-content: center; gap: 24px;
          max-width: 900px; margin: 0 auto;
          padding: 0 16px 16px;
        }
        .nki-bubble-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  cursor: pointer; position: relative; z-index: 1;
}
.nki-bubble-wrap:has(.nki-bubble-tooltip) { z-index: 50; }
        .nki-bubble {
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0.08));
          border: 2px solid color-mix(in srgb, var(--bubble-color) 40%, transparent);
          box-shadow:
            0 8px 28px color-mix(in srgb, var(--bubble-color) 25%, transparent),
            inset 0 2px 6px rgba(255,255,255,0.4),
            inset 0 -4px 8px color-mix(in srgb, var(--bubble-color) 15%, transparent);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: visible;
          transition: box-shadow 0.3s;
          backdrop-filter: blur(4px);
          background-color: color-mix(in srgb, var(--bubble-color) 14%, rgba(255,252,248,0.9));
        }
        .nki-bubble:hover {
          box-shadow:
            0 12px 40px color-mix(in srgb, var(--bubble-color) 38%, transparent),
            inset 0 2px 6px rgba(255,255,255,0.5);
        }
        .nki-bubble-active {
          box-shadow:
            0 16px 48px color-mix(in srgb, var(--bubble-color) 45%, transparent),
            inset 0 3px 8px rgba(255,255,255,0.6);
        }
        .nki-bubble-inner {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          z-index: 1; padding: 0 8px; text-align: center;
        }
        .nki-bubble-icon {
          font-size: 26px;
          color: var(--bubble-color);
          filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--bubble-color) 40%, transparent));
        }
        .nki-bubble-title {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.3px;
          color: #1A1A1A; line-height: 1.3; text-align: center;
        }
        .nki-bubble-ring {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid var(--bubble-color);
          opacity: 0; pointer-events: none;
        }
        .nki-bubble-active .nki-bubble-ring {
          animation: nkiRingExpand 0.6s ease-out forwards;
        }
        .nki-bubble-active .nki-bubble-ring-2 {
          animation: nkiRingExpand 0.6s 0.12s ease-out forwards;
        }
        .nki-bubble-tooltip {
          position: absolute; top: calc(100% + 14px); left: 50%;
          transform: translateX(-50%);
          background: rgba(255,252,248,0.96);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(196,81,10,0.15);
          border-radius: 14px;
          padding: 12px 14px;
          width: 180px;
          box-shadow: 0 10px 32px rgba(0,0,0,0.12);
          z-index: 20;
          animation: nkiTooltipIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .nki-bubble-tooltip::before {
          content: ''; position: absolute; top: -6px; left: 50%;
          transform: translateX(-50%);
          width: 10px; height: 10px;
          background: rgba(255,252,248,0.96);
          border-top: 1px solid rgba(196,81,10,0.15);
          border-left: 1px solid rgba(196,81,10,0.15);
          rotate: 45deg;
        }
        .nki-bubble-tooltip-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: #C4510A;
          background: rgba(196,81,10,0.1); border-radius: 20px;
          padding: 3px 8px; display: inline-block; margin-bottom: 6px;
        }
        .nki-bubble-tooltip-items {
          font-size: 11px; color: #6B6560; line-height: 1.65;
        }

        /* ── SHARED TOKENS ── */
        .nki-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #C4510A; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .nki-ornament { font-size: 13px; }
        .nki-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(34px, 4.5vw, 68px); font-weight: 600; line-height: 1.08; color: #1A1A1A; margin-bottom: 20px; }
        .nki-h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(26px, 3.2vw, 50px); font-weight: 600; line-height: 1.1; color: #1A1A1A; margin-bottom: 14px; }
        .nki-accent-italic { font-style: italic; color: #C4510A; }
        .nki-section { max-width: 1440px; margin: 0 auto; padding: 72px 60px; }
        .nki-section-alt { background: rgba(255,252,248,0.5); position: relative; z-index: 1; }
        .nki-section-header { text-align: center; max-width: 560px; margin: 0 auto 48px; }
        .nki-section-sub { font-size: 15px; color: #6B6560; line-height: 1.75; }
        .nki-dot { position: absolute; border-radius: 50%; background: #C4510A; opacity: 0.5; animation: nkiFloat 3s ease-in-out infinite; }
        .nki-btn-primary { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff; border: none; padding: 13px 28px; border-radius: 50px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans',sans-serif; box-shadow: 0 8px 24px rgba(196,81,10,0.3); transition: transform 0.2s, box-shadow 0.2s; }
        .nki-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(196,81,10,0.42); }
        .nki-btn-outline { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #C4510A; border: 1.5px solid #C4510A; padding: 12px 26px; border-radius: 50px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans',sans-serif; transition: background 0.25s, color 0.25s, transform 0.2s; }
        .nki-btn-outline:hover { background: #C4510A; color: #fff; transform: translateY(-2px); }

        /* ── HERO ── */
        .nki-hero { position: relative; z-index: 1; display: flex; align-items: center; gap: 48px; padding: 72px 60px 64px; max-width: 1440px; margin: 0 auto; overflow: visible; }
        .nki-hero-text { flex: 0 0 46%; max-width: 520px; }
        .nki-hero-sub { font-size: 15px; color: #6B6560; line-height: 1.8; max-width: 420px; margin-bottom: 32px; }
        .nki-hero-stats { display: flex; gap: 28px; margin-top: 36px; padding-top: 28px; border-top: 1px solid rgba(196,81,10,0.15); flex-wrap: wrap; }
        .nki-stat { display: flex; flex-direction: column; gap: 4px; }
        .nki-stat-num { font-family: 'Cormorant Garamond',serif; font-size: 28px; font-weight: 600; color: #C4510A; }
        .nki-stat-label { font-size: 11px; font-weight: 600; color: #6B6560; letter-spacing: 0.5px; }
        .nki-collage-img-main { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .nki-collage-main:hover .nki-collage-img-main { transform: scale(1.04); }
        .nki-collage-img-sm:hover { transform: scale(1.03); }
        .nki-float-card { position: absolute; background: rgba(255,252,248,0.92); backdrop-filter: blur(12px); border: 1px solid rgba(196,81,10,0.2); border-radius: 14px; padding: 10px 16px; font-size: 12px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); animation: nkiFloat 3.5s ease-in-out infinite; white-space: nowrap; }
        .nki-float-icon { color: #C4510A; }
        .nki-float-card-1 { bottom: 36px; left: 8%; animation-delay: 0.3s; }
        .nki-float-card-2 { top: 10px; right: 2%; animation-delay: 0.9s; }
        .nki-hero-collage { flex: 1; position: relative; height: 480px; }
        .nki-collage-main { position: absolute; top: 0; left: 0; width: 70%; height: 90%; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
        .nki-collage-side { position: absolute; right: 0; top: 20px; width: 32%; display: flex; flex-direction: column; gap: 12px; height: 88%; }
        .nki-collage-img-sm { width: 100%; flex: 1; object-fit: cover; border-radius: 16px; box-shadow: 0 12px 30px rgba(0,0,0,0.14); transition: transform 0.4s; min-height: 0; }

        
        
        
        /* ── COMMITMENT ── */
        .nki-commitment { display: flex; align-items: center; gap: 56px; }
        .nki-commit-img-wrap { flex: 0 0 400px; position: relative; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 56px rgba(0,0,0,0.16); }
        .nki-commit-img { width: 100%; height: 500px; object-fit: cover; display: block; transition: transform 0.5s; }
        .nki-commit-img-wrap:hover .nki-commit-img { transform: scale(1.03); }
        .nki-commit-img-badge { position: absolute; bottom: 20px; left: 20px; background: rgba(255,252,248,0.92); backdrop-filter: blur(10px); border: 1px solid rgba(196,81,10,0.2); border-radius: 12px; padding: 10px 16px; font-size: 12px; font-weight: 700; color: #1A1A1A; }
        .nki-commit-text { flex: 1; }
        .nki-timeline { display: flex; flex-direction: column; }
        .nki-timeline-item { display: flex; align-items: flex-start; gap: 16px; position: relative; padding-bottom: 24px; }
        .nki-timeline-item:last-child { padding-bottom: 0; }
        .nki-timeline-icon { width: 44px; height: 44px; border-radius: 50%; background: rgba(196,81,10,0.1); display: flex; align-items: center; justify-content: center; color: #C4510A; font-size: 17px; flex-shrink: 0; z-index: 1; }
        .nki-timeline-connector { position: absolute; left: 22px; top: 44px; bottom: 0; width: 1px; background: rgba(196,81,10,0.2); }
        .nki-timeline-item:last-child .nki-timeline-connector { display: none; }
        .nki-timeline-content { padding-top: 8px; }
        .nki-timeline-title { font-size: 15px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px; }
        .nki-timeline-desc { font-size: 13px; color: #6B6560; line-height: 1.65; }

        /* ── STORAGE ── */
        .nki-storage-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 1440px; padding: 0 60px 72px; margin: 0 auto; }
        .nki-storage-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); border-radius: 18px; padding: 22px 20px; box-shadow: 0 6px 24px rgba(0,0,0,0.07); display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
        .nki-storage-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(196,81,10,0.15); }
        .nki-storage-icon-wrap { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nki-storage-body { flex: 1; }
        .nki-storage-label { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 6px; }
        .nki-storage-temp-row { display: flex; align-items: center; }
        .nki-storage-temp { font-family: 'Cormorant Garamond',serif; font-size: 17px; font-weight: 600; color: #C4510A; }
        .nki-storage-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(196,81,10,0.08); border-radius: 0 0 18px 18px; overflow: hidden; }
        .nki-storage-bar-fill { width: 70%; height: 100%; border-radius: 3px; }

        /* ── JOURNEY ── */
        .nki-journey-section { background: rgba(255,252,248,0.6); }
        .nki-journey-track { display: flex; align-items: flex-start; gap: 0; padding: 0 20px; position: relative; flex-wrap: wrap; }
        .nki-journey-item { flex: 1; min-width: 140px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; padding: 0 12px 20px; }
        .nki-journey-step { font-family: 'Cormorant Garamond',serif; font-size: 34px; font-weight: 300; color: rgba(196,81,10,0.2); line-height: 1; margin-bottom: 10px; }
        .nki-journey-dot { width: 14px; height: 14px; border-radius: 50%; background: #C4510A; margin-bottom: 14px; box-shadow: 0 0 0 4px rgba(196,81,10,0.15); }
        .nki-journey-line { position: absolute; top: 80px; left: 50%; right: -50%; height: 1px; background: linear-gradient(90deg, #C4510A, rgba(196,81,10,0.2)); z-index: 0; }
        .nki-journey-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 5px; }
        .nki-journey-desc { font-size: 12px; color: #6B6560; line-height: 1.6; }

        /* ── PHILOSOPHY ── */
        .nki-philosophy { position: relative; display: flex; align-items: center; justify-content: center; padding: 72px 60px; background: rgba(255,252,248,0.85); overflow: hidden; gap: 48px; max-width: 1440px; margin: 0 auto; }
        .nki-philosophy-content { flex: 0 0 55%; max-width: 600px; }
        .nki-philosophy-h2 { font-family: 'Cormorant Garamond',serif; font-size: clamp(24px,3vw,46px); font-weight: 600; line-height: 1.2; color: #1A1A1A; margin-bottom: 20px; }
        .nki-philosophy-quote { font-size: 15px; color: #6B6560; line-height: 1.8; max-width: 460px; margin-bottom: 24px; font-style: italic; }
        .nki-philosophy-sig { font-family: 'Cormorant Garamond',serif; font-size: 28px; font-style: italic; color: #C4510A; }
        .nki-philosophy-img-wrap { flex: 0 0 320px; height: 400px; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.18); }
        .nki-philosophy-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .nki-philosophy-img-wrap:hover .nki-philosophy-img { transform: scale(1.04); }

        /* ── CTA ── */
        .nki-cta-section { position: relative; padding: 80px 60px; text-align: center; overflow: hidden; background: linear-gradient(135deg, rgba(255,252,248,0.9), rgba(245,230,215,0.95)); }
        .nki-cta-content { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
        .nki-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .nki-herb-float { position: absolute; font-size: 28px; color: #C4510A; opacity: 0.18; animation: nkiFloatHerb 4s ease-in-out infinite; z-index: 0; }

        /* ── RESPONSIVE ── */
        @media(max-width:1100px) {
          .nki-storage-grid { grid-template-columns: repeat(2,1fr); }
        }

       @media(max-width:900px) {
  .nki-hero { flex-direction: column; padding: 36px 24px 40px; gap: 28px; }
  .nki-hero-text { max-width: 100%; flex: none; }

  /* Grid-based collage — no more absolute positioning on mobile */
  .nki-hero-collage { width: 100%; height: auto !important; display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: 200px; gap: 10px; }
  .nki-collage-main { position: static; width: 100%; height: 100%; border-radius: 18px; }
  .nki-collage-side { position: static; width: 100%; height: 100%; gap: 10px; }
  .nki-collage-img-sm { flex: 1; min-height: 0; border-radius: 14px; }

  .nki-float-card { font-size: 11px; padding: 8px 12px; }
  .nki-float-card-2 { top: 8px; right: 1%; }

  .nki-section { padding: 48px 24px; }
  .nki-section-header { margin-bottom: 36px; }

  .nki-bubble-field { gap: 16px; }
  .nki-bubble { width: 100px; height: 100px; }
  .nki-bubble-icon { font-size: 22px; }
  .nki-bubble-title { font-size: 9.5px; }
  .nki-bubble-tooltip { width: 160px; }

  .nki-commitment { flex-direction: column; padding: 48px 24px; gap: 32px; }
  .nki-commit-img-wrap { flex: none; width: 100%; }
  .nki-commit-img { height: 280px; }

  .nki-storage-grid { grid-template-columns: repeat(2,1fr); padding: 0 24px 48px; gap: 12px; }

  .nki-journey-track { flex-wrap: wrap; }
  .nki-journey-item { flex: 0 0 calc(50% - 12px); min-width: 0; }
  .nki-journey-line { display: none; }

  .nki-philosophy { flex-direction: column; padding: 48px 24px; gap: 28px; }
  .nki-philosophy-content { flex: none; max-width: 100%; }
  .nki-philosophy-img-wrap { flex: none; width: 100%; height: 240px; }

  .nki-cta-section { padding: 60px 24px; }
}

        @media(max-width:600px) {
          .nki-page-offset { padding-top: 60px; }

          /* Hero */
          .nki-hero { padding: 28px 16px 36px; gap: 24px; }
          .nki-hero-collage { grid-template-rows: 160px; gap: 8px; }
          .nki-hero-stats { gap: 16px; }
          .nki-float-card-1, .nki-float-card-2 { display: none; }
          .nki-hero-sub { font-size: 14px; }

          /* Bubbles */
          .nki-bubble-field { gap: 12px; padding: 0 8px 8px; }
          .nki-bubble { width: 88px; height: 88px; }
          .nki-bubble-icon { font-size: 20px; }
          .nki-bubble-title { font-size: 9px; }
          /* Tooltip: clamp to viewport on mobile */
          .nki-bubble-tooltip {
    width: min(160px, 80vw);
    left: 50%;
    transform: translateX(-50%);
    position: fixed;
    top: auto;
    bottom: 24px;
  }

          /* Sections */
          .nki-section { padding: 36px 16px; }
          .nki-section-header { margin-bottom: 28px; }
          .nki-section-sub { font-size: 14px; }

          /* Commitment */
          .nki-commitment { padding: 36px 16px; gap: 24px; }
          .nki-commit-img { height: 220px; }

          /* Storage */
          .nki-storage-grid { grid-template-columns: 1fr; padding: 0 16px 36px; gap: 10px; }
          .nki-storage-card { padding: 16px; }

          /* Journey */
          .nki-journey-item { flex: 0 0 100%; padding: 0 0 20px; }
          .nki-journey-step { font-size: 28px; }

          /* Philosophy */
          .nki-philosophy { padding: 36px 16px; }
          .nki-philosophy-img-wrap { height: 200px; }

          /* CTA */
          .nki-cta-section { padding: 48px 16px; }
          .nki-cta-btns { flex-direction: column; align-items: center; gap: 10px; }
          .nki-btn-primary, .nki-btn-outline { width: 100%; max-width: 280px; justify-content: center; }
        }

        @media(max-width:400px) {
          .nki-bubble { width: 76px; height: 76px; }
          .nki-hero-collage { grid-template-rows: 140px; }
          .nki-bubble-icon { font-size: 18px; }
          .nki-bubble-title { font-size: 8.5px; }
          .nki-bubble-field { gap: 10px; }
          .nki-h1 { font-size: 30px; }
          .nki-h2 { font-size: 24px; }
          .nki-hero-stats { gap: 12px; }
          .nki-stat-num { font-size: 22px; }
        }
            .nki-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
  animation: nkiFadeUp 0.2s ease forwards;
}
.nki-modal {
  background: rgba(255,252,248,0.98);
  border-radius: 20px;
  width: min(480px, 90vw);
  max-height: 70vh;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.22);
  border: 1px solid rgba(196,81,10,0.12);
  animation: nkiFadeUp 0.25s cubic-bezier(0.22,1,0.36,1) forwards;
}
.nki-modal-header {
  padding: 20px 22px 16px;
  border-bottom: 1px solid rgba(196,81,10,0.1);
  display: flex; align-items: center; gap: 14px;
  flex-shrink: 0;
}
.nki-modal-icon {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.nki-modal-title-group { flex: 1; }
.nki-modal-eyebrow {
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: #C4510A; margin-bottom: 3px;
}
.nki-modal-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 600; color: #1A1A1A; line-height: 1.15;
}
.nki-modal-close {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid rgba(196,81,10,0.2);
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; color: #6B6560;
  transition: background 0.2s; font-family: inherit;
}
.nki-modal-close:hover { background: rgba(196,81,10,0.08); }
.nki-modal-body { padding: 18px 22px 22px; overflow-y: auto; }
.nki-modal-badge {
  display: inline-block; font-size: 9px; font-weight: 700;
  letter-spacing: 1px; text-transform: uppercase;
  color: #C4510A; background: rgba(196,81,10,0.1);
  border-radius: 20px; padding: 4px 10px; margin-bottom: 14px;
}
.nki-ingredient-list { display: flex; flex-direction: column; gap: 10px; }
.nki-ingredient-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.7);
  border-radius: 12px; border: 1px solid rgba(196,81,10,0.08);
}
.nki-item-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 5px;
}
.nki-item-name { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 3px; }
.nki-item-benefit { font-size: 12px; color: #6B6560; line-height: 1.55; }
        /* Respect reduced motion */
        @media(prefers-reduced-motion: reduce) {
          .nki-fade-up, .nki-slide-left, .nki-slide-right { animation: none; opacity: 1; transform: none; }
          .nki-float-card, .nki-dot, .nki-herb-float { animation: none; }
        }
      `}</style>
        </>
    );
}