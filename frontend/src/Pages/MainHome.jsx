// src/Pages/MainHome.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navbar from "../component/ui/Navbar";
import {
  faUtensils,
  faCalendarAlt,
  faLeaf,
  faBowlFood,
  faArrowRight,
  faPhone,
  faClock,
  faLocationDot,
  faMotorcycle,
  faStar,
  faMedal,
  faCrown,
  faChevronLeft,
  faChevronRight,
  faTag,
  faPercent,
} from "@fortawesome/free-solid-svg-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true });
ScrollTrigger.config({ ignoreMobileResize: true });

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */

const STORY_ICONS = [
  { icon: faLeaf, title: "Fresh & Quality\nIngredients", sub: "Locally sourced\nand premium quality" },
  { icon: faCrown, title: "Meet Our\nStaff", sub: "Passionate chefs\nwith creativity" },
  { icon: faMedal, title: "Elegant\nAmbience", sub: "A perfect blend of\ncomfort & style" },
  { icon: faStar, title: "Unforgettable\nExperience", sub: "Moments that stay\nwith you forever" },
];
function buildCouponSlide(coupons) {
  const fallback = {
    bg: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85",
    pill: "Reserve Your Perfect Evening",
    h1: ["An Evening", "Worth", "Remembering"],
    desc: "Book your table and immerse yourself in an atmosphere of elegance, warmth, and unforgettable taste.",
  };
  if (!coupons || coupons.length === 0) return fallback;
  const best = [...coupons].sort((a, b) => {
    const aVal = a.discountType === "Percentage" ? a.discountValue : a.discountValue / 10;
    const bVal = b.discountType === "Percentage" ? b.discountValue : b.discountValue / 10;
    return bVal - aVal;
  })[0];
  const discountStr = best.discountType === "Percentage" ? `${best.discountValue}% OFF` : `₹${best.discountValue} OFF`;
  const minStr = best.minOrderAmount ? ` on orders above ₹${best.minOrderAmount}` : "";
  const maxStr = best.maxDiscount ? ` — up to ₹${best.maxDiscount} savings` : "";
  return {
    bg: "https://i.postimg.cc/XvD25QLc/Chat-GPT-Image-Jun-20-2026-02-10-09-PM.png",
    pill: `USE CODE ${best.code} • ${discountStr}${minStr}`,
    h1: [`Save ${discountStr}`, "on Your Next", "Order Today"],
    desc: `Apply code ${best.code} at checkout and enjoy ${discountStr}${minStr}${maxStr}. Limited time offer — don't miss out!`,
  };
}
function getHeroSlides(coupons) {
  return [
    {
      bg: "https://images.unsplash.com/photo-1781941067134-09ec75de324e?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      pill: "SIGNATURE BIRYANI • AUTHENTIC FLAVORS • PREMIUM EXPERIENCE",
      h1: ["Royal Biryani", "Culinary Luxury", "Like Never Before"],
      desc: "Where every grain tells a story of tradition, flavor, and culinary excellence. A signature masterpiece crafted exclusively for discerning food lovers.",
    },
    {
      bg: "https://images.unsplash.com/photo-1781941539559-2a0ed417df1b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwcm9maWxlLXBhZ2V8MXx8fGVufDB8fHx8fA%3D%3D",
      pill: "AUTHENTIC SOUTH INDIAN • FRESHLY PREPARED • PREMIUM EXPERIENCE",
      h1: ["South Indian", "Delicacies", "Like Never Before"],
      desc: "Discover the perfect blend of tradition and flavor with our signature South Indian creations, crafted fresh and served with timeless elegance.",
    },
    {
      bg: "https://images.unsplash.com/photo-1781941969459-753e9fd4bf81?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      pill: "FRESH VEGETARIAN DELIGHTS • PURE FLAVORS • PREMIUM EXPERIENCE",
      h1: ["Crafted with Passion", "Served with Freshness", "Every Single Day"],
      desc: "We source the finest local produce to bring you honest, soulful cooking that warms the heart.",
    },
    buildCouponSlide(coupons), // ← slide 4 is now dynamic
  ];
}

const FOOTER_ITEMS = [
  { icon: faPhone, title: "Call Us", sub: "+91 45451 45455" },
  { icon: faClock, title: "Open Hours", sub: "Mon - Sun: 11 AM – 11 PM" },
  { icon: faLocationDot, title: "Our Location", sub: "Jaipur, Rajasthan, India" },
  { icon: faMotorcycle, title: "Fast Delivery", sub: "Order at your Doorstep" },
];

const BADGES = [
  { icon: faLeaf, label: "Fresh Ingredients" },
  { icon: faUtensils, label: "Master Chefs" },
  { icon: faBowlFood, label: "Luxury Dining" },
];

/* ═══════════════════════════════════════════════════════════════
   COUPON TICKER — infinite marquee above navbar
═══════════════════════════════════════════════════════════════ */

function CouponTicker({ coupons }) {
  if (!coupons.length) return null;

  // Build ticker items — duplicate for seamless loop
  const items = [...coupons, ...coupons];

  return (
    <div className="cticker-wrap">
      <div className="cticker-track">
        {items.map((c, i) => (
          <span key={i} className="cticker-item">
            <FontAwesomeIcon icon={faTag} className="cticker-icon" />
            <strong>{c.code}</strong>
            &nbsp;—&nbsp;
            {c.discountType === "Percentage"
              ? `${c.discountValue}% OFF`
              : `₹${c.discountValue} OFF`}
            {c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ""}
            {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
            <span className="cticker-sep">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
function GreetingToast({ user }) {
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const shownRef = useRef(false);
  useEffect(() => {

    if (!user || !user.email) return;
    if (shownRef.current) return;

    // Only show right after an actual login action, not on every page visit
    const justLoggedIn = localStorage.getItem("justLoggedIn") === "1";
    if (!justLoggedIn) return;

    shownRef.current = true;
    localStorage.removeItem("justLoggedIn");

    setRendered(true);
    const tIn = setTimeout(() => setVisible(true), 100);
    const tOut = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setRendered(false), 700);
    }, 5000);
    return () => { clearTimeout(tIn); clearTimeout(tOut); };
  }, [user?.email]);
  if (!rendered) return null;

  const name = user?.name || user?.email?.split("@")[0] || "there";
  const email = user?.email || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const emoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙";

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setRendered(false), 700);
  };

  return (
    <div className={`greeting-toast ${visible ? "greeting-toast--in" : "greeting-toast--out"}`}>
      <div className="greeting-inner">
        <div className="greeting-avatar">{name.charAt(0).toUpperCase()}</div>
        <div className="greeting-text">
          <span className="greeting-emoji">{emoji}</span>
          <span className="greeting-line1">{greeting},</span>
          <span className="greeting-name">{name}!</span>
          <span className="greeting-line2">{email}</span>
        </div>
        <button className="greeting-close" onClick={dismiss}>✕</button>
      </div>
    </div>
  );
}
function HeroSlider({ user, onLogout, cart, coupons }) {
  const SLIDES = getHeroSlides(coupons);
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Home");
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef(null);

  const goTo = useCallback((idx) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  }, [animating]);
  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);

  // Auto-slide every 5s
  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [next]);

  // Reset timer when user clicks a dot
  const dotGo = useCallback((idx) => {
    clearInterval(intervalRef.current);
    goTo(idx);
    intervalRef.current = setInterval(next, 5000);
  }, [goTo, next]);

  const slide = SLIDES[current];

  return (
    <div className="hero-slider">
      {/* Coupon ticker — sits above navbar */}
      <CouponTicker coupons={coupons} />
      <GreetingToast user={user} />
      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`hero-slide ${i === current ? "hero-slide--active" : ""}`}
          style={{ backgroundImage: `url('${s.bg}')` }}
          aria-hidden={i !== current}
        />
      ))}

      {/* Dark overlay */}
      <div className="hero-overlay" />

      {/* Navbar — sits below ticker */}
      <div className="hero-navbar-wrap">
        <Navbar user={user} onLogout={onLogout} activeNav={activeNav} setActiveNav={setActiveNav} cart={cart} />
      </div>

      {/* Content */}
      <div className="hero-content" key={current}>
        <div className="hero-pill">
          <FontAwesomeIcon icon={faStar} />
          <span>{slide.pill}</span>
        </div>

        <h1 className="hero-h1">
          <span>{slide.h1[0]}</span>
          <em>{slide.h1[1]}</em>
          <span style={{ fontWeight: 300 }}>{slide.h1[2]}</span>
        </h1>

        <p className="hero-desc">{slide.desc}</p>

        <div className="hero-cta-row">
          <button className="hero-cta-primary" onClick={() => navigate("/NoirKitchen/Menu")}>
            <FontAwesomeIcon icon={faUtensils} /> Explore Menu
          </button>
          <button className="hero-cta-secondary" onClick={() => navigate("/reserve")}>
            <FontAwesomeIcon icon={faCalendarAlt} /> Reserve Table
          </button>
        </div>

        <div className="hero-badges">
          {BADGES.map(({ icon, label }) => (
            <div key={label} className="hero-badge">
              <FontAwesomeIcon icon={icon} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dots only — click to jump to slide */}
      <div className="hero-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? "hero-dot--active" : ""}`}
            onClick={() => dotGo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Bottom fade into page2 */}
      <div className="hero-bottom-fade" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 2 — SCROLL SECTIONS
═══════════════════════════════════════════════════════════════ */

function useST(ref, animFn) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => { animFn(); }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function buildFoodPath(item, user) {
  const encode = (s) => encodeURIComponent(String(s ?? "").trim());
  const foodName = encode(item.name);
  const vegType = encode(item.veg ? "veg" : "non-veg");
  const price = encode(item.price);
  const customerName = encode(user?.name || "Guest");
  const username = encode(user?.username || user?.email?.split("@")[0] || "guest");
  const addr = user?.address;
  const addrStr = addr
    ? [addr.houseNo, addr.areaName, addr.areaNo, addr.city, addr.pinCode].filter(Boolean).join(", ")
    : "";
  const addressParam = addrStr.length > 0
    ? encode(addrStr)
    : `ADDR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  return `/${foodName}/${vegType}/${price}/${customerName}/${username}/${addressParam}`;
}

/* ═══════════════════════════════════════════════════════════════
   DISH CAROUSEL
═══════════════════════════════════════════════════════════════ */

function DishCarousel({ dishes, user, cart }) {
  const navigate = useNavigate();
  const sectionRef = useRef();
  const [offset, setOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [btnState, setBtnState] = useState({});

  useEffect(() => {
    let t;
    const check = () => setIsMobile(window.innerWidth < 640);
    const debounced = () => { clearTimeout(t); t = setTimeout(check, 150); };
    check();
    window.addEventListener("resize", debounced);
    return () => { clearTimeout(t); window.removeEventListener("resize", debounced); };
  }, []);

  const visible = isMobile ? 2 : 4;
  const max = Math.max(0, dishes.length - visible);

  const handleAdd = useCallback(async (e, dish) => {
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    const id = dish._id;
    setBtnState(s => ({ ...s, [id]: "loading" }));
    const ok = await cart.addToCart({
      menuItemId: dish._id,
      name: dish.name,
      img: dish.img,
      price: dish.price,
      variant: dish.variant || "",
      addons: [],
      qty: 1,
    });
    setBtnState(s => ({ ...s, [id]: ok ? "done" : "error" }));
    setTimeout(() => setBtnState(s => ({ ...s, [id]: "idle" })), 1400);
  }, [user, cart, navigate]);

  useST(sectionRef, () => {
    const st = { trigger: sectionRef.current, start: "top 80%" };
    gsap.fromTo(".carousel-title", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "back.out(1.7)", scrollTrigger: st });
    gsap.fromTo(".carousel-heading", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: "back.out(1.5)", delay: 0.12, scrollTrigger: st });
    gsap.fromTo(".carousel-desc", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.24, scrollTrigger: st });
    gsap.fromTo(".carousel-cta", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2)", delay: 0.34, scrollTrigger: st });
    gsap.fromTo(".dish-card", { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.4)", stagger: 0.1, delay: 0.1,
      scrollTrigger: { trigger: ".carousel-track", start: "top 85%" }
    });
  });

  return (
    <section ref={sectionRef} className="h2-carousel-section">
      <img src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=120&q=60" alt="" aria-hidden className="h2-leaf h2-leaf-tl" />
      <img src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=120&q=60" alt="" aria-hidden className="h2-leaf h2-leaf-br" />

      <div className="h2-carousel-left">
        <p className="carousel-title h2-eyebrow">OUR SIGNATURE DISHES <span className="h2-ornament">✦</span></p>
        <h2 className="carousel-heading h2-display">Crafted with <em>Passion,</em><br />Served with <em>Elegance</em></h2>
        <p className="carousel-desc h2-body">From rich flavors to artful presentation,<br />every plate is a masterpiece.</p>
        <button className="carousel-cta h2-btn-primary" onClick={() => navigate("/NoirKitchen/Menu")}>
          View Full Menu <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>

      <div className="h2-carousel-right">
        <button className="h2-arrow-btn" onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <div className="carousel-track h2-track">
          {dishes.slice(offset, offset + visible).map((d, i) => {
            const state = btnState[d._id] || "idle";
            return (
              <div
                key={d._id || i}
                className="dish-card h2-dish-card"
                onClick={() => navigate(buildFoodPath(d, user))}
              >
                {d.signature && <div className="h2-sig-badge">Signature</div>}
                <div className="h2-dish-img-wrap">
                  <img src={d.img} alt={d.name} className="h2-dish-img" />
                </div>
                <div className="h2-dish-info">
                  <div className="h2-dish-info-top">
                    <span className="h2-dish-name">{d.name}</span>
                  </div>
                  <p className="h2-dish-desc">{d.desc}</p>
                  <div className="h2-dish-bottom">
                    <span className="h2-dish-price">{d.price}</span>
                    <button
                      className={`h2-dish-add h2-dish-add--${state}`}
                      onClick={(e) => handleAdd(e, d)}
                      disabled={state === "loading"}
                      title={!user ? "Login to add to cart" : "Add to cart"}
                    >
                      {state === "loading" ? "…" : state === "done" ? "✓" : state === "error" ? "!" : "+"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="h2-arrow-btn" onClick={() => setOffset(o => Math.min(max, o + 1))} disabled={offset >= max}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OUR STORY
═══════════════════════════════════════════════════════════════ */

function OurStory() {
  const navigate = useNavigate();
  const ref = useRef();

  useST(ref, () => {
    const st = { trigger: ref.current, start: "top 78%" };
    gsap.fromTo(".story-img-wrap", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.75, ease: "power3.out", scrollTrigger: st });
    gsap.fromTo(".story-text-col", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.75, ease: "power3.out", delay: 0.12, scrollTrigger: st });
    gsap.fromTo(".story-icon-card", { scale: 0.6, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.8)", stagger: 0.1, delay: 0.3,
      scrollTrigger: { trigger: ".story-icons-row", start: "top 88%" }
    });
  });

  return (
    <section ref={ref} className="h2-story-section">
      <div className="h2-story-top-row">
        <div className="story-img-wrap h2-story-img-wrap">
          <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80" alt="Chef at work" className="h2-story-photo" />
        </div>
        <div className="story-text-col h2-story-text">
          <p className="h2-eyebrow">OUR STORY <span className="h2-ornament">✦</span></p>
          <h2 className="h2-display" style={{ marginBottom: 16 }}>A Journey of <em>Taste</em><br />and <em>Tradition</em></h2>
          <p className="h2-body" style={{ marginBottom: 16 }}>
            At Noir Kitchen, we blend global inspiration with the finest ingredients to create unforgettable dining experiences.
          </p>
          <div className="h2-signature">Noir Kitchen Team</div>
        </div>
      </div>

      <div className="story-icons-row h2-icons-row">
        {STORY_ICONS.map(ic => {
          const navMap = {
            "Unforgettable\nExperience": "/moments",
            "Meet Our\nStaff": "/Noir-Kitchen-StaffMembers",
            "Fresh & Quality\nIngredients": "/NoirKitchenIngredients",
            "Elegant\nAmbience": "/Elegantambience",
          };
          const to = navMap[ic.title];
          return (
            <div
              key={ic.title}
              className="story-icon-card h2-icon-card"
              onClick={to ? () => navigate(to) : undefined}
              style={to ? { cursor: "pointer" } : {}}
            >
              <div className="h2-icon-circle"><FontAwesomeIcon icon={ic.icon} /></div>
              <p className="h2-icon-title">{ic.title}</p>
              <p className="h2-icon-sub">{ic.sub}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOTTOM SPLIT
═══════════════════════════════════════════════════════════════ */

function BottomSplit({ reviews = [] }) {
  const navigate = useNavigate();
  const ref = useRef();

  useST(ref, () => {
    const st = { trigger: ref.current, start: "top 82%" };
    gsap.fromTo(".fav-title", { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)", scrollTrigger: st });
    gsap.fromTo(".fav-cat", { y: 40, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)", stagger: 0.08, delay: 0.15, scrollTrigger: st });
    gsap.fromTo(".special-panel", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.2, scrollTrigger: st });
  });

  return (
    <section ref={ref} className="h2-bottom-split">
      <div className="h2-favs-panel">
        <p className="fav-title h2-eyebrow" style={{ marginBottom: 24 }}>WHAT OUR GUESTS SAY <span className="h2-ornament">✦</span></p>
        {reviews.length === 0 ? (
          <p className="h2-body" style={{ color: "#9CA3AF", fontStyle: "italic" }}>No reviews yet. Be the first to share your experience!</p>
        ) : (
          <div className="h2-reviews-scroll">
            {reviews.map((r, idx) => {
              const name = r.user?.name || r.userName || r.name || "Guest";
              const initial = name.charAt(0).toUpperCase();
              const rating = r.rating || 5;
              // Generate a consistent warm color per initial
              const colors = ["#C4510A", "#E8763A", "#8B4A2F", "#D4812A", "#A0522D", "#CD853F"];
              const bg = colors[initial.charCodeAt(0) % colors.length];
              return (
                <div key={r._id || idx} className="fav-cat h2-review-card">
                  <div className="h2-review-header">
                    <div className="h2-review-avatar" style={{ background: bg }}>
                      {initial}
                    </div>
                    <div className="h2-review-meta">
                      <span className="h2-review-name">{name}</span>
                      <div className="h2-review-stars">
                        {"★".repeat(rating)}{"☆".repeat(5 - rating)}
                      </div>
                    </div>
                  </div>
                  <p className="h2-review-text">"{r.message || r.text || r.review || r.comment}"</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="special-panel h2-special-panel">
        <div className="h2-special-overlay" />
        <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80" alt="Dining ambience" className="h2-special-bg" />
        <div className="h2-special-content">
          <h3 className="h2-special-heading">Make Every Meal<br />A <em>Special Occasion</em></h3>
          <div className="h2-ornament-line">✦</div>
          <p className="h2-special-sub">Book your table now and indulge in a luxurious dining experience.</p>
          <button className="h2-btn-outline" onClick={() => navigate("/reserve")}>
            Reserve Your Table <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER BAR — no OTP, direct email subscribe
═══════════════════════════════════════════════════════════════ */

function FooterBar({ user }) {
  const ref = useRef();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error | invalid

  useST(ref, () => {
    gsap.fromTo(".footer-item", { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.55, ease: "back.out(1.5)", stagger: 0.1,
      scrollTrigger: { trigger: ref.current, start: "top 90%" }
    });
    gsap.fromTo(".footer-subscribe", { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.6, delay: 0.4,
      scrollTrigger: { trigger: ref.current, start: "top 90%" }
    });
  });

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed || status === "loading") return;

    // Validate proper email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setStatus("invalid");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user?.name || "Guest", email: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <footer ref={ref} className="h2-footer">
      <div className="h2-footer-grid">
        {FOOTER_ITEMS.map(f => (
          <div key={f.title} className="footer-item h2-footer-item">
            <div className="h2-footer-icon-wrap"><FontAwesomeIcon icon={f.icon} className="h2-footer-icon" /></div>
            <div>
              <p className="h2-footer-title">{f.title}</p>
              <p className="h2-footer-sub">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="footer-subscribe h2-subscribe">
        <p className="h2-footer-title">Stay Connected</p>
        <p className="h2-footer-sub" style={{ marginBottom: 10 }}>Get updates on new menu &amp; offers</p>

        {status === "success" ? (
          <p className="h2-subscribe-msg h2-subscribe-msg--success">🎉 Thanks for subscribing! We'll keep you posted.</p>
        ) : (
          <div className="h2-email-row">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (status === "invalid") setStatus("idle"); }}
              onKeyDown={e => { if (e.key === "Enter") handleSubscribe(); }}
              className="h2-email-input"
              disabled={status === "loading"}
            />
            <button
              className="h2-email-btn"
              onClick={handleSubscribe}
              disabled={status === "loading"}
              title="Subscribe"
            >
              {status === "loading" ? "…" : <FontAwesomeIcon icon={faArrowRight} />}
            </button>
          </div>
        )}

        {status === "error" && (
          <p className="h2-subscribe-msg h2-subscribe-msg--error">Something went wrong. Please try again.</p>
        )}
        {status === "invalid" && (
          <p className="h2-subscribe-msg h2-subscribe-msg--error">Please enter a valid email address.</p>
        )}
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */

export default function MainHome({ user, onLogout, cart }) {
  const [dishes, setDishes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await fetch(`${API_BASE}/api/coupons`);
        const json = await res.json();
        const all = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.coupons)
              ? json.coupons
              : [];
        // Only show truly valid coupons:
        // 1. isActive must be true
        // 2. expiryDate must be in the future (or not set)
        // 3. usedCount must be less than usageLimit (or usageLimit not set)
        const now = new Date();
        const validCoupons = all.filter(c => {
          if (!c.isActive) return false;
          if (c.expiryDate && new Date(c.expiryDate) <= now) return false;
          if (c.usageLimit != null && c.usedCount >= c.usageLimit) return false;
          return true;
        });
        setCoupons(validCoupons);
      } catch { /* silent */ }
    }
    fetchCoupons();
  }, []);

  useEffect(() => {
    async function fetchDishes() {
      try {
        const res = await fetch(`${API_BASE}/api/menu`);
        const json = await res.json();
        if (!json.success) return;
        const all = json.data.filter(i => i.available !== false);
        const shuffled = all.sort(() => Math.random() - 0.5);
        const count = 6 + Math.floor(Math.random() * 4);
        setDishes(shuffled.slice(0, count));
      } catch { /* silent */ }
    }
    fetchDishes();
  }, []);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`${API_BASE}/api/reviews`);
        const json = await res.json();
        // Handle both {success, data} and plain array responses
        const all = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.reviews)
              ? json.reviews
              : [];
        const highRated = all.filter(r => (r.rating || 0) >= 4);
        setReviews(highRated);
      } catch { /* silent */ }
    }
    fetchReviews();
  }, []);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── HERO SLIDER ── */}
      <HeroSlider user={user} onLogout={onLogout} cart={cart} coupons={coupons} />

      {/* ── PAGE 2 ── */}
      <div
        id="mp-page2"
        style={{
          position: "relative",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          backgroundImage: "url('https://i.postimg.cc/02ZVxvx3/Chat-GPT-Image-Jun-11-2026-02-01-52-PM.png')",
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
          backgroundRepeat: "repeat-y",
          overflowX: "hidden",
          width: "100%",
        }}
      >
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "160px",
          zIndex: 0, pointerEvents: "none",
          background: "linear-gradient(to bottom, rgb(245,230,215) 0%, rgba(245,230,215,0.6) 40%, transparent 100%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "200px",
          zIndex: 0, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent, rgba(245,230,215,0.85) 60%, rgb(245,230,215) 100%)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <DishCarousel dishes={dishes} user={user} cart={cart} />
          <OurStory />
          <BottomSplit reviews={reviews} />
          <FooterBar user={user} />
        </div>
      </div>

      <style>{`
        html, body { overflow-x: hidden; max-width: 100%; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ══════════════════════════════
           HERO SLIDER
        ══════════════════════════════ */
        .hero-slider {
          position: relative;
          width: 100%;
          height: 100dvh;
          
          min-height: 560px;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .hero-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transform: scale(1.06) translateZ(0);
  transition: opacity 0.85s cubic-bezier(0.4,0,0.2,1), transform 6s ease;
  will-change: opacity, transform;
  backface-visibility: hidden;
}
.hero-slide--active {
  opacity: 1;
  transform: scale(1) translateZ(0);
  z-index: 1;
}

        /* Dark overlay */
        .hero-overlay {
         position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            135deg,
            rgba(10,5,2,0.72) 0%,
            rgba(26,15,5,0.55) 45%,
            rgba(196,81,10,0.18) 100%
          );
        }
        .greeting-toast {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) scale(0.88);
          z-index: 30;
          width: 55%; min-height: 22vh;
          display: flex; align-items: center; justify-content: center;
          background: rgba(15, 8, 2, 0.62);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 28px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
          opacity: 0; pointer-events: none;
          transition: opacity 0.55s ease, transform 0.55s cubic-bezier(0.34,1.56,0.64,1);
        }
        .greeting-toast--in {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          pointer-events: auto;
        }
        .greeting-toast--out {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.93);
          pointer-events: none;
        }
        .greeting-inner {
          width: 100%; padding: 40px 48px;
          display: flex; align-items: center; gap: 28px;
          position: relative;
        }
        .greeting-avatar {
          width: 80px; height: 80px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #C4510A, #E8763A);
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 700; color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 8px 24px rgba(196,81,10,0.45);
        }
        .greeting-text {
          display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0;
        }
        .greeting-emoji { font-size: 28px; line-height: 1; margin-bottom: 4px; }
        .greeting-line1 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(14px, 1.6vw, 18px); font-weight: 500;
          color: rgba(255,255,255,0.75);
        }
        .greeting-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 4vw, 52px); font-weight: 600; font-style: italic;
          color: #FFB067; line-height: 1.1;
        }
        .greeting-line2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(11px, 1.1vw, 13px); color: rgba(255,255,255,0.45);
          margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .greeting-close {
          position: absolute; top: 16px; right: 20px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.6); width: 30px; height: 30px;
          border-radius: 50%; cursor: pointer; font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .greeting-close:hover { background: rgba(196,81,10,0.4); color: #fff; }
        @media (max-width: 768px) {
          .greeting-toast { width: 88%; min-height: 20vh; }
          .greeting-inner { padding: 28px 24px; gap: 18px; }
          .greeting-avatar { width: 60px; height: 60px; font-size: 24px; }
        }
        @media (max-width: 480px) {
          .greeting-toast { width: 92%; min-height: 18vh; }
          .greeting-inner { padding: 22px 18px; gap: 14px; }
          .greeting-avatar { width: 50px; height: 50px; font-size: 20px; }
        }
        /* Coupon ticker */
        .cticker-wrap {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 20;
          height: 32px;
          background: linear-gradient(90deg, #1a0a02, #2d1205, #1a0a02);
          border-bottom: 1px solid rgba(196,81,10,0.35);
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .cticker-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: cticker-scroll 28s linear infinite;
          will-change: transform;
        }
        @keyframes cticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .cticker-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 32px;
          font-size: 11.5px;
          font-weight: 600;
          color: #FFD4A0;
          letter-spacing: 0.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .cticker-item strong {
          color: #FFB067;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .cticker-icon {
          color: #C4510A;
          font-size: 10px;
        }
        .cticker-sep {
          color: rgba(196,81,10,0.5);
          font-size: 9px;
          margin-left: 8px;
        }

        /* Navbar layer — sits below ticker */
        .hero-navbar-wrap {
          position: absolute;
          top: 32px; left: 0; right: 0;
          z-index: 10;
        }

        /* Main content */
        .hero-content {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 130px 60px 80px;
          max-width: 700px;
          animation: heroFadeUp 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(196,81,10,0.15);
          border: 0.5px solid rgba(196,81,10,0.6);
          border-radius: 25px;
          padding: 8px 16px;
          margin-bottom: 22px;
          width: fit-content;
          color: #FFB067;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 5.5vw, 80px);
          font-weight: 600;
          line-height: 1.06;
          color: #fff;
          margin-bottom: 20px;
          letter-spacing: -0.01em;
        }
        .hero-h1 span { display: block; }
        .hero-h1 em {
          display: block;
          font-style: italic;
          color: #FFB067;
        }

        .hero-desc {
          font-size: clamp(13px, 1.4vw, 16px);
          color: rgba(255,255,255,0.78);
          line-height: 1.75;
          max-width: 420px;
          margin-bottom: 32px;
        }

        .hero-cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 36px;
        }
        .hero-cta-primary {
          background: linear-gradient(135deg, #C4510A, #E8763A);
          color: #fff; border: none;
          padding: 13px 28px; border-radius: 50px;
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(196,81,10,0.4);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center; gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
          @media (max-width: 768px) {
  .hero-slider { min-height: 480px; }

  /* The 6s Ken-Burns zoom is the main cause of mobile jank — it forces
     continuous repaint of a large background image. Drop it on mobile
     and keep just a fast crossfade. */
  .hero-slide {
    transform: scale(1.0) translateZ(0) !important;
    transition: opacity 0.6s ease !important;
  }
  .hero-slide--active {
    transform: scale(1.0) translateZ(0) !important;
  }
}

@media (max-width: 480px) {
  .hero-slider { min-height: 420px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-slide {
    transition: opacity 0.4s ease !important;
    transform: none !important;
  }
}
        .hero-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(196,81,10,0.55); }
        .hero-cta-secondary {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.5);
          padding: 13px 28px; border-radius: 50px;
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(8px);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center; gap: 8px;
          transition: transform 0.2s, background 0.2s, border-color 0.2s;
        }
        .hero-cta-secondary:hover { transform: translateY(-2px); background: rgba(255,255,255,0.22); border-color: #FFB067; }

        .hero-badges {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        .hero-badge {
          display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px; padding: 12px 16px;
          color: #fff; min-width: 90px;
          backdrop-filter: blur(6px);
          transition: background 0.2s, transform 0.2s;
        }
        .hero-badge:hover { background: rgba(255,255,255,0.16); transform: translateY(-2px); }
        .hero-badge svg { font-size: 18px; color: #FFB067; }
        .hero-badge span { font-size: 11px; font-weight: 600; }

        /* Dots */
        .hero-dots {
          position: absolute;
          bottom: 36px; left: 50%; transform: translateX(-50%);
          z-index: 8;
          display: flex; gap: 10px; align-items: center;
        }
        .hero-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.4); border: none; cursor: pointer;
          padding: 0; transition: background 0.3s, transform 0.3s, width 0.35s;
        }
        .hero-dot--active {
          background: #FFB067;
          width: 28px; border-radius: 4px;
          transform: none;
        }

        /* Bottom fade */
        .hero-bottom-fade {
          position: absolute;
          bottom: 0; left: 0; right: 0; height: 200px;
          z-index: 6; pointer-events: none;
          background: linear-gradient(to bottom, transparent, rgba(245,230,215,0.85) 65%, rgb(245,230,215) 100%);
        }

        /* ══════════════════════════════
           PAGE 2 SHARED TOKENS
        ══════════════════════════════ */
        .h2-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: #C4510A; margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .h2-ornament { font-size: 13px; }
        .h2-ornament-line { font-size: 16px; color: #C4510A; margin: 10px 0; }
        .h2-display {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 3.5vw, 52px);
          font-weight: 600; line-height: 1.1; color: #1A1A1A;
        }
        .h2-display em { font-style: italic; color: #C4510A; }
        .h2-body { font-size: 14px; color: #6B6560; line-height: 1.75; }
        .h2-signature {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-style: italic; color: #C4510A; margin-bottom: 28px;
        }
        .h2-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #C4510A, #E8763A);
          color: #fff; border: none; padding: 12px 28px;
          border-radius: 50px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 8px 24px rgba(196,81,10,0.28);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .h2-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(196,81,10,0.4); }
        .h2-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.7); padding: 11px 26px;
          border-radius: 50px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.25s, border-color 0.25s, transform 0.2s;
        }
        .h2-btn-outline:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
        .h2-arrow-btn {
          background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
          border: 1.5px solid rgba(196,81,10,0.25);
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #C4510A; font-size: 14px; flex-shrink: 0;
          transition: background 0.2s, transform 0.2s; align-self: center;
        }
        .h2-arrow-btn:hover:not(:disabled) { background: #C4510A; color: #fff; transform: scale(1.08); }
        .h2-arrow-btn:disabled { opacity: 0.35; cursor: default; }
        .h2-leaf {
          position: absolute; width: 90px; height: 90px;
          object-fit: cover; border-radius: 50%; opacity: 0.1;
          pointer-events: none; z-index: 0;
          filter: saturate(0.4) brightness(0.6);
        }
        .h2-leaf-tl { top: 16px; left: 16px; transform: rotate(-30deg); }
        .h2-leaf-br { bottom: 16px; right: 16px; transform: rotate(150deg); }

        .carousel-title,.carousel-heading,.carousel-desc,.carousel-cta,
        .dish-card,.story-img-wrap,.story-text-col,.story-icon-card,
        .fav-title,.fav-cat,.special-panel,.footer-item,.footer-subscribe {
          will-change: transform, opacity;
        }

        /* ══════════════════════════════
           CAROUSEL SECTION
        ══════════════════════════════ */
        .h2-carousel-section {
          position: relative; display: flex; align-items: center;
          gap: 32px; padding: 56px 48px 56px 60px;
          background: transparent; overflow: hidden;
          width: 100%; max-width: 100%;
        }
        .h2-carousel-left {
          flex: 0 0 300px; min-width: 260px;
          display: flex; flex-direction: column; gap: 0;
        }
        .h2-carousel-right {
          flex: 1; display: flex; align-items: center;
          gap: 16px; min-width: 0; overflow: hidden;
        }
        .h2-track {
          flex: 1; display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px; min-width: 0; overflow: hidden;
        }

        /* ══════════════════════════════
           DISH CARDS
        ══════════════════════════════ */
        .h2-dish-card {
          position: relative; border-radius: 20px; overflow: hidden;
          cursor: pointer; height: 280px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
          background: #1a1008; width: 100%; min-width: 0;
        }
        .h2-dish-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 44px rgba(196,81,10,0.25); }
        .h2-dish-img-wrap { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
        .h2-dish-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94); }
        .h2-dish-card:hover .h2-dish-img { transform: scale(1.08); }
        .h2-dish-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 48px 14px 14px;
          background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.82) 38%, rgba(10,5,2,0.97) 100%);
        }
        .h2-dish-info-top { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
        .h2-dish-name { font-size: 14px; font-weight: 700; color: #fff; line-height: 1.2; }
        .h2-dish-desc {
          font-size: 10.5px; color: rgba(255,255,255,0.58);
          margin-bottom: 10px; line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .h2-dish-bottom { display: flex; align-items: center; justify-content: space-between; }
        .h2-dish-price { font-size: 18px; font-weight: 500; color: #E8763A; font-family: 'Cormorant Garamond', serif; }
        .h2-dish-add {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #C4510A, #E8763A);
          border: none; color: #fff; font-size: 20px; font-weight: 300;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          line-height: 1; flex-shrink: 0;
        }
        .h2-dish-add:hover:not(:disabled) { transform: scale(1.15); box-shadow: 0 4px 14px rgba(196,81,10,0.5); }
        .h2-dish-add:disabled { cursor: not-allowed; }
        .h2-dish-add--loading { background: linear-gradient(135deg, #999, #bbb) !important; cursor: wait !important; }
        .h2-dish-add--done    { background: linear-gradient(135deg, #2e7d32, #43a047) !important; transform: scale(1.18) !important; }
        .h2-dish-add--error   { background: linear-gradient(135deg, #c62828, #e53935) !important; }
        .h2-sig-badge {
          position: absolute; top: 10px; left: 10px; z-index: 2;
          background: linear-gradient(135deg, #C4510A, #E8763A);
          color: #fff; font-size: 9px; font-weight: 700;
          border-radius: 50%; width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          text-align: center; line-height: 1.2; letter-spacing: 0.3px;
        }

        /* ══════════════════════════════
           OUR STORY
        ══════════════════════════════ */
        .h2-story-section {
          padding: 40px 60px;
          background: rgba(255,252,248,0);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border-top: 1px solid rgba(196,81,10,0.08);
          border-bottom: 1px solid rgba(196,81,10,0.08);
          width: 100%; overflow: hidden;
        }
        .h2-story-top-row { display: flex; align-items: center; gap: 32px; margin-bottom: 32px; }
        .h2-story-img-wrap {
          flex: 0 0 200px; height: 340px; border-radius: 16px;
          overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.18); flex-shrink: 0;
        }
        .h2-story-photo { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .h2-story-img-wrap:hover .h2-story-photo { transform: scale(1.04); }
        .h2-story-text { flex: 1; padding: 0; min-width: 0; }
        .story-icons-row.h2-icons-row {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; width: 100%;
        }
        .h2-icon-card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.35);
          border-top: 1px solid rgba(255,255,255,0.55);
          border-left: 1px solid rgba(255,255,255,0.45);
          border-radius: 18px; padding: 20px 14px; text-align: center;
          box-shadow: 0 8px 32px rgba(196,81,10,0.08), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, background 0.3s ease, border-color 0.3s ease;
        }
        .h2-icon-card:hover {
          transform: translateY(-6px) scale(1.03);
          background: rgba(255,255,255,0.22); border-color: rgba(196,81,10,0.3);
          box-shadow: 0 16px 40px rgba(196,81,10,0.15), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7);
          cursor: pointer;
        }
        .h2-icon-circle {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(196,81,10,0.09);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: #C4510A; margin: 0 auto 12px;
          transition: background 0.2s, transform 0.2s;
        }
        .h2-icon-card:hover .h2-icon-circle { background: rgba(196,81,10,0.16); transform: scale(1.1); }
        .h2-icon-title { font-size: 12px; font-weight: 700; color: #1A1A1A; white-space: pre-line; line-height: 1.4; margin-bottom: 6px; }
        .h2-icon-sub   { font-size: 11px; color: #9CA3AF; white-space: pre-line; line-height: 1.5; }

        /* ══════════════════════════════
           BOTTOM SPLIT
        ══════════════════════════════ */
        .h2-bottom-split {
          display: grid; grid-template-columns: 1fr 1fr;
          min-height: 320px; border-top: 1px solid rgba(196,81,10,0.1);
          background: transparent; width: 100%; overflow: hidden;
        }
        .h2-favs-panel {
          background: rgba(255,252,248,0.78);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          padding: 52px 52px 52px 60px;
          min-width: 0; overflow: hidden;
        }
        .h2-reviews-scroll {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 10px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          cursor: grab;
        }
        .h2-reviews-scroll:active { cursor: grabbing; }
        .h2-reviews-scroll::-webkit-scrollbar { height: 4px; }
        .h2-reviews-scroll::-webkit-scrollbar-track { background: rgba(196,81,10,0.06); border-radius: 2px; }
        .h2-reviews-scroll::-webkit-scrollbar-thumb { background: rgba(196,81,10,0.3); border-radius: 2px; }
        .h2-reviews-scroll::-webkit-scrollbar-thumb:hover { background: rgba(196,81,10,0.55); }
        .h2-review-card {
          flex: 0 0 240px;
          scroll-snap-align: start;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(196,81,10,0.12);
          border-radius: 16px;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .h2-review-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(196,81,10,0.13);
        }
        .h2-review-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .h2-review-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          letter-spacing: 0;
        }
        .h2-review-meta {
          display: flex; flex-direction: column; gap: 2px; min-width: 0;
        }
        .h2-review-name {
          font-size: 13px; font-weight: 700; color: #1A1A1A;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .h2-review-stars { color: #C4510A; font-size: 11px; letter-spacing: 1.5px; }
        .h2-review-text {
          font-size: 12.5px; color: #4A4540;
          line-height: 1.6; font-style: italic;
          display: -webkit-box; -webkit-line-clamp: 4;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .h2-special-panel {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; min-height: 300px;
          min-width: 0;
        }
        .h2-special-bg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; z-index: 0; transition: transform 0.6s ease;
        }
        .h2-special-panel:hover .h2-special-bg { transform: scale(1.04); }
        .h2-special-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(135deg, rgba(26,15,5,0.72), rgba(196,81,10,0.35)); }
        .h2-special-content { position: relative; z-index: 2; padding: 40px; text-align: center; }
        .h2-special-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(26px, 2.8vw, 42px);
          font-weight: 600; color: #fff; line-height: 1.15; margin-bottom: 6px;
        }
        .h2-special-heading em { font-style: italic; color: #FFB067; }
        .h2-special-sub {
          font-size: 13px; color: rgba(255,255,255,0.82); line-height: 1.6;
          margin-bottom: 22px; max-width: 280px; margin-left: auto; margin-right: auto;
        }

        /* ══════════════════════════════
           FOOTER
        ══════════════════════════════ */
        .h2-footer {
          background: rgba(255,252,248,0.85);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(196,81,10,0.12);
          padding: 28px 40px; position: relative; overflow: hidden; width: 100%;
        }
        .h2-footer-grid { display: flex; align-items: center; gap: 0; flex-wrap: wrap; margin-bottom: 0; }
        .h2-footer-item {
          display: flex; align-items: center; gap: 14px;
          flex: 1; min-width: 160px; padding: 12px 20px;
          border-right: 1px solid rgba(196,81,10,0.1);
        }
        .h2-footer-item:last-of-type { border-right: none; }
        .h2-footer-icon-wrap {
          width: 42px; height: 42px; border-radius: 50%;
          background: rgba(196,81,10,0.08);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background 0.2s, transform 0.2s;
        }
        .h2-footer-item:hover .h2-footer-icon-wrap { background: rgba(196,81,10,0.15); transform: scale(1.08); }
        .h2-footer-icon  { color: #C4510A; font-size: 16px; }
        .h2-footer-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 3px; }
        .h2-footer-sub   { font-size: 12px; color: #6B6560; }
        .h2-subscribe { padding: 20px 0 0 0; border-top: 1px solid rgba(196,81,10,0.1); margin-top: 16px; }
        .h2-email-row { display: flex; gap: 6px; max-width: 380px; }
        .h2-email-input {
          flex: 1; border: 1.5px solid rgba(196,81,10,0.25); border-radius: 10px;
          padding: 8px 12px; font-size: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif; outline: none;
          background: rgba(255,252,248,0.9); color: #1A1A1A;
          transition: border-color 0.2s, box-shadow 0.2s; min-width: 0;
        }
        .h2-email-input:focus { border-color: #C4510A; box-shadow: 0 0 0 3px rgba(196,81,10,0.08); }
        .h2-email-input:disabled { opacity: 0.6; }
        .h2-email-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #C4510A, #E8763A);
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0; transition: transform 0.2s, box-shadow 0.2s;
        }
        .h2-email-btn:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 6px 16px rgba(196,81,10,0.4); }
        .h2-email-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .h2-subscribe-msg { font-size: 12px; margin-top: 8px; }
        .h2-subscribe-msg--success { color: #2e7d32; }
        .h2-subscribe-msg--error   { color: #c62828; }

        /* ══════════════════════════════
           TABLET ≤1100px
        ══════════════════════════════ */
        @media (max-width: 1100px) {
          .h2-track { grid-template-columns: repeat(2, 1fr); }
          .story-icons-row.h2-icons-row { grid-template-columns: repeat(2, 1fr); }
        }

        /* ══════════════════════════════
           TABLET ≤1024px
        ══════════════════════════════ */
        @media (max-width: 1024px) {
          .hero-content { padding: 90px 40px 60px; }
          .h2-carousel-section { padding: 48px 32px; }
          .h2-favs-panel { padding: 40px 32px; }
          .h2-story-section { padding: 40px 32px; }
        }

        /* ══════════════════════════════
           MOBILE ≤768px
        ══════════════════════════════ */
        @media (max-width: 768px) {
          .h2-icon-card, .h2-story-section, .h2-favs-panel, .h2-footer {
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
          }
          /* Hero */
          .hero-content { padding: 110px 20px 60px; max-width: 100%; }
          .hero-navbar-wrap { top: 32px; }
          .hero-dots { bottom: 24px; }

          /* Carousel stacks */
          .h2-carousel-section { flex-direction: column; padding: 40px 16px 36px; gap: 24px; align-items: stretch; }
          .h2-carousel-left { flex: none; width: 100%; min-width: 0; text-align: center; align-items: center; }
          .h2-carousel-right { width: 100%; gap: 8px; overflow: hidden; }
          .h2-track { grid-template-columns: repeat(2, 1fr); gap: 10px; min-width: 0; }
          .h2-arrow-btn { width: 32px; height: 32px; font-size: 12px; flex-shrink: 0; }

          /* Story */
          .h2-story-section { padding: 36px 16px; }
          .h2-story-top-row { flex-direction: column; gap: 20px; }
          .h2-story-img-wrap { flex: none; width: 100%; height: 240px; }
          .h2-story-text { padding: 0; text-align: center; }
          .story-icons-row.h2-icons-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }

          /* Bottom split */
          .h2-bottom-split { grid-template-columns: 1fr; }
          .h2-favs-panel { padding: 36px 16px; }
          .h2-special-panel { min-height: 280px; }
          .h2-special-content { padding: 32px 24px; }

          /* Footer */
          .h2-footer { padding: 24px 16px; }
          .h2-footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .h2-footer-item { flex: none; min-width: 0; padding: 14px 10px; border-right: none; border-bottom: 1px solid rgba(196,81,10,0.08); }
          .h2-footer-item:nth-child(odd) { border-right: 1px solid rgba(196,81,10,0.08); }
          .h2-subscribe { margin-top: 20px; padding-top: 20px; }
          .h2-email-row { max-width: 100%; }
        }

        /* ══════════════════════════════
           MOBILE ≤480px
        ══════════════════════════════ */
        @media (max-width: 480px) {
          .hero-content { padding: 100px 16px 50px; }
          .hero-h1 { font-size: clamp(32px, 9vw, 48px); }
          .hero-cta-row { flex-direction: column; align-items: stretch; gap: 10px; }
          .hero-cta-primary, .hero-cta-secondary { justify-content: center; padding: 12px 20px; }
          .hero-badges { gap: 8px; }
          .hero-badge { min-width: 80px; padding: 10px 12px; }

          .h2-carousel-section { padding: 28px 12px 24px; }
          .h2-track { gap: 8px; }
          .h2-dish-card { height: 220px; }
          .h2-dish-name { font-size: 12px; }
          .h2-dish-price { font-size: 15px; }
          .h2-dish-add { width: 28px; height: 28px; font-size: 17px; }

          .h2-story-section { padding: 28px 12px; }
          .h2-story-img-wrap { height: 200px; }
          .h2-icon-card { padding: 16px 8px; }
          .h2-icon-circle { width: 44px; height: 44px; font-size: 16px; }
          .h2-icon-title { font-size: 11px; }
          .h2-icon-sub { font-size: 10px; }

          .h2-favs-panel { padding: 28px 12px; }
          .h2-special-content { padding: 24px 16px; }
          .h2-special-heading { font-size: clamp(22px, 6vw, 32px); }

          .h2-footer { padding: 20px 12px; }
          .h2-footer-item { padding: 12px 8px; gap: 8px; }
          .h2-footer-icon-wrap { width: 36px; height: 36px; flex-shrink: 0; }
          .h2-footer-title { font-size: 12px; }
          .h2-footer-sub { font-size: 11px; }
        }

        /* ══════════════════════════════
           MOBILE ≤360px
        ══════════════════════════════ */
        @media (max-width: 360px) {
          .hero-content { padding: 96px 12px 44px; }
          .h2-carousel-section { padding: 24px 10px; }
          .h2-track { gap: 6px; }
          .h2-dish-card { height: 190px; }
          .story-icons-row.h2-icons-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .h2-footer-grid { grid-template-columns: 1fr; }
          .h2-footer-item { border-right: none !important; border-bottom: 1px solid rgba(196,81,10,0.08); }
        }
      `}</style>
    </>
  );
}