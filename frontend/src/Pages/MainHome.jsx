// src/Pages/MainHome.jsx
import { useEffect, useRef, useState, Suspense, Component, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
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
} from "@fortawesome/free-solid-svg-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true });
ScrollTrigger.config({ ignoreMobileResize: true });
function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */

const STORY_ICONS = [
  { icon: faLeaf, title: "Fresh & Quality\nIngredients", sub: "Locally sourced\nand premium quality" },
  { icon: faCrown, title: "Meet Our\nStaff", sub: "Passionate chefs\nwith creativity" },
  { icon: faMedal, title: "Elegant\nAmbience", sub: "A perfect blend of\ncomfort & style" },
  { icon: faStar, title: "Unforgettable\nExperience", sub: "Moments that stay\nwith you forever" },
];

const CATEGORIES = [
  { label: "Starters", img: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=200&q=80" },
  { label: "Main Course", img: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=200&q=80" },
  { label: "Pastas", img: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200&q=80" },
  { label: "Desserts", img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=200&q=80" },
  { label: "Beverages", img: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&q=80" },
];

const FOOTER_ITEMS = [
  { icon: faPhone, title: "Call Us", sub: "+91 45451 45455" },
  { icon: faClock, title: "Open Hours", sub: "Mon - Sun: 11 AM – 11 PM" },
  { icon: faLocationDot, title: "Our Location", sub: "Jaipur, Rajasthan, India" },
  { icon: faMotorcycle, title: "Fast Delivery", sub: "Order at your Doorstep" },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE 1 — HERO (Three.js bowl)
═══════════════════════════════════════════════════════════════ */

class CanvasErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  // Replace your CanvasErrorBoundary render with a nicer fallback:
  render() {
    if (this.state.error) return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <img
          src="/Home/Bowl-preview.webp"
          alt="Noir Kitchen Bowl"
          style={{
            width: "80%", maxWidth: 400,
            animation: "floatDot 3s ease-in-out infinite",
            filter: "drop-shadow(0 20px 40px rgba(196,81,10,0.3))"
          }}
        />
      </div>
    );
    return this.props.children;
  }
}

function Bowl1() {
  const gltf = useLoader(GLTFLoader, "/Home/Bowl.glb");
  const ref = useRef();

  useEffect(() => {
    gltf.scene.traverse(c => {
      if (c.isMesh && c.material) {
        c.material.metalness = 0.05;
        c.material.roughness = 0.6;
        c.material.envMapIntensity = 1.0;
        c.material.needsUpdate = true;
      }
    });
  }, [gltf]);

  useFrame(s => {
    if (ref.current) ref.current.position.y = -0.4 + Math.sin(s.clock.elapsedTime * 0.7) * 0.06;
  });

  return <primitive ref={ref} object={gltf.scene} scale={2.1} position={[0.2, -0.4, -0.8]} />;
}

const P1_ELS = [
  ".p1-bg", ".p1-navbar", ".p1-logo", ".p1-navlink", ".p1-auth",
  ".p1-pill", ".p1-h1", ".p1-desc", ".p1-cta", ".p1-badge",
];

function bounceIn(els, dir = "down") {
  const yFrom = dir === "down" ? -30 : 30;
  return gsap.timeline({ defaults: { ease: "back.out(1.7)", duration: 0.55 } })
    .fromTo(els[0], { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" })
    .fromTo(els[1], { y: yFrom * 2, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.35")
    .fromTo(els[2], { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42 }, "-=0.28")
    .fromTo(els[3], { y: yFrom, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.38 }, "-=0.22")
    .fromTo(els[4], { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.08, duration: 0.38 }, "-=0.18")
    .fromTo(els[5], { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.38 }, "-=0.28")
    .fromTo(els[6], { y: yFrom, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.09, duration: 0.45 }, "-=0.28")
    .fromTo(els[7], { y: yFrom * 0.6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38 }, "-=0.22")
    .fromTo(els[8], { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.09, ease: "back.out(2)", duration: 0.45 }, "-=0.18")
    .fromTo(els[9], { y: yFrom, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, stagger: 0.07, duration: 0.45 }, "-=0.18");
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
        <div className="h2-reviews-row">
          {reviews.map(r => (
            <div key={r._id} className="fav-cat h2-review-item">
              <div className="h2-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <p className="h2-review-text">"{r.message}"</p>
              <span className="h2-review-name">{r.user?.name || "Guest"}</span>
            </div>
          ))}
        </div>
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

function FooterBar({ user }) {
  const ref = useRef();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("input");
  const [status, setStatus] = useState("idle");

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

  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json();
      setStatus("idle");
      if (json.success) setStage("otp");
      else { setStatus("error"); setTimeout(() => setStatus("idle"), 2500); }
    } catch {
      setStatus("error"); setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || status === "loading") return;
    setStatus("loading");
    try {
      const verifyRes = await fetch(`${API_BASE}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: trimmedOtp }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) { setStatus("error"); setTimeout(() => setStatus("idle"), 2500); return; }

      const res = await fetch(`${API_BASE}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user?.name || "Guest", email: email.trim() }),
      });
      const json = await res.json();
      setStatus("idle");
      if (json.success) { setStage("success"); setEmail(""); setOtp(""); }
      else { setStatus("error"); setTimeout(() => setStatus("idle"), 2500); }
    } catch {
      setStatus("error"); setTimeout(() => setStatus("idle"), 2500);
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

        {stage === "input" && (
          <div className="h2-email-row">
            <input type="email" placeholder="Enter your email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSendOtp(); }}
              className="h2-email-input" />
            <button className="h2-email-btn" onClick={handleSendOtp} disabled={status === "loading"} title="Send OTP">
              {status === "loading" ? "…" : <FontAwesomeIcon icon={faArrowRight} />}
            </button>
          </div>
        )}

        {stage === "otp" && (
          <div className="h2-email-row">
            <input type="text" placeholder="Enter OTP" value={otp}
              onChange={e => setOtp(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleVerifyOtp(); }}
              className="h2-email-input" />
            <button className="h2-email-btn" onClick={handleVerifyOtp} disabled={status === "loading"} title="Verify OTP">
              {status === "loading" ? "…" : "✓"}
            </button>
          </div>
        )}

        {stage === "success" && <p style={{ fontSize: 11, color: "#2e7d32", marginTop: 6 }}>Thanks for subscribing!</p>}
        {status === "error" && <p style={{ fontSize: 11, color: "#c62828", marginTop: 6 }}>Something went wrong. Please try again.</p>}
      </div>
    </footer>
  );
}
const FLOAT_DOTS = [
  { top: "20%", right: "8%", size: 10, color: "#E8763A", delay: "0s" },
  { top: "35%", right: "4%", size: 6, color: "#FFB067", delay: "0.4s" },
  { top: "60%", right: "12%", size: 8, color: "#C4510A", delay: "0.8s" },
  { top: "75%", right: "6%", size: 5, color: "#E87A3A", delay: "1.2s" },
];

const BADGES = [
  { icon: faLeaf, label: "Fresh Ingredients" },
  { icon: faUtensils, label: "Master Chefs" },
  { icon: faBowlFood, label: "Luxury Dining" },
];

export default function MainHome({ user, onLogout, cart }) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Home");
  const [bowl1Mounted, setBowl1Mounted] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [webGLOk, setWebGLOk] = useState(false);

  useEffect(() => {
    setWebGLOk(isWebGLAvailable());
  }, []);
  const page1Visible = useRef(false);
  const animating = useRef(false);
  const activeTimeline = useRef(null);

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
    useEffect(() => {
      async function fetchReviews() {
        try {
          const res = await fetch(`${API_BASE}/api/reviews`);
          const json = await res.json();
          if (!json.success) return;
          setReviews(json.data.slice(0, 4));
        } catch { /* silent */ }
      }
      fetchReviews();
    }, []);
    fetchDishes();
  }, []);

  const releaseAnimating = useCallback(() => {
    animating.current = false;
    activeTimeline.current = null;
  }, []);

  const showPage1 = useCallback((dir = "down") => {
    if (page1Visible.current) return;
    if (activeTimeline.current) { activeTimeline.current.kill(); releaseAnimating(); }
    animating.current = true;
    setBowl1Mounted(true);
    const w = document.getElementById("mp-page1");
    if (w) { w.style.opacity = "1"; w.style.pointerEvents = "auto"; }
    gsap.killTweensOf(P1_ELS);
    const tl = bounceIn(P1_ELS, dir);
    activeTimeline.current = tl;
    tl.then(() => { page1Visible.current = true; releaseAnimating(); });
  }, [releaseAnimating]);

  useEffect(() => {
    showPage1("down");
    const onReady = () => showPage1("down");
    window.addEventListener("homeAnimationComplete", onReady);
    return () => window.removeEventListener("homeAnimationComplete", onReady);
  }, [showPage1]);



  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── PAGE 1: HERO ── */}
      <div
        id="mp-page1"
        style={{
          position: "relative", width: "100%", minHeight: "100vh", zIndex: 30,
          opacity: 0, pointerEvents: "none",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          overflow: "hidden",
        }}
      >
        <img
          className="p1-bg"
          src="https://i.postimg.cc/6p7nY0n8/Background.png"
          alt="" aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, pointerEvents: "none", opacity: 0 }}
        />

        <Navbar
          user={user}
          onLogout={onLogout}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          cart={cart}
        />

        <div className="noir-hero-body">
          <div className="noir-hero-text">
            <div className="p1-pill" style={{ marginBottom: 24, opacity: 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#c4510a0a", border: "0.5px solid #C4510A", borderRadius: 25, padding: "8px 16px" }}>
                <FontAwesomeIcon icon={faStar} style={{ color: "#C4510A", fontSize: "0.85em" }} />
                <span className="noir-pill-text">Elevated Taste, Timeless Experience</span>
              </div>
            </div>
            <h1 className="noir-h1">
              <span className="p1-h1" style={{ display: "block", opacity: 0 }}>Experience</span>
              <span className="p1-h1" style={{ display: "block", fontStyle: "italic", color: "#C4510A", opacity: 0 }}>Culinary Luxury</span>
              <span className="p1-h1" style={{ display: "block", fontWeight: 300, opacity: 0 }}>Like Never Before</span>
            </h1>
            <p className="p1-desc noir-desc" style={{ opacity: 0 }}>Where timeless flavor meets modern elegance. Every dish tells a story of passion.</p>
            <div className="noir-cta-row">
              <button className="p1-cta noir-cta-primary" style={{ opacity: 0 }} onClick={() => navigate("/NoirKitchen/Menu")}>
                <FontAwesomeIcon icon={faUtensils} /> Explore Menu
              </button>
              <button className="p1-cta noir-cta-secondary" style={{ opacity: 0 }} onClick={() => navigate("/reserve")}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ color: "#C4510A" }} /> Reserve Table
              </button>
            </div>
            <div className="noir-badges">
              {badges.map(({ icon, label }) => (
                <div key={label} className="p1-badge noir-badge" style={{ opacity: 0 }}>
                  <FontAwesomeIcon icon={icon} style={{ fontSize: 20, color: "#C4510A" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#2B2B2B" }}>{label}</span>
                  <div style={{ width: 24, height: 2, background: "#C4510A", borderRadius: 2 }} />
                </div>
              ))}
            </div>
          </div>

          <div className="noir-bowl-wrap">
            {bowl1Mounted && (
              webGLOk ? (
                <CanvasErrorBoundary>
                  <Canvas
                    camera={{ position: [0, 0.8, 3.5], fov: 40 }}
                    style={{ width: "100%", height: "100%" }}
                    gl={{ alpha: true, antialias: true, powerPreference: "low-power", failIfMajorPerformanceCaveat: false }}
                    dpr={[1, 1.5]}
                  >
                    <ambientLight intensity={1.2} color="#FFFFFF" />
                    <directionalLight position={[3, 6, 4]} intensity={2.0} color="#FFFFFF" castShadow />
                    <directionalLight position={[-3, 2, 2]} intensity={1.0} color="#FFFFFF" />
                    <directionalLight position={[0, -2, 3]} intensity={0.5} color="#FFFFFF" />
                    <pointLight position={[2, 3, 2]} intensity={1.2} color="#FFFFFF" />
                    <Suspense fallback={<mesh><sphereGeometry args={[0.6, 32, 32]} /><meshStandardMaterial color="#EDE0CC" /></mesh>}>
                      <Bowl1 />
                      <Environment preset="studio" />
                    </Suspense>
                    <OrbitControls enableZoom={false} enablePan={false} autoRotate={false}
                      maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 3.5} />
                  </Canvas>
                </CanvasErrorBoundary>
              ) : (
                // ✅ CSS fallback — shows when WebGL is blocked
                <div style={{
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: "min(380px, 80%)",
                    animation: "floatDot 3.2s ease-in-out infinite",
                    filter: "drop-shadow(0 24px 48px rgba(196,81,10,0.35))",
                  }}>
                    <svg viewBox="0 0 380 320" xmlns="http://www.w3.org/2000/svg" width="100%">
                      {/* Bowl body */}
                      <ellipse cx="190" cy="165" rx="155" ry="46" fill="#d4b896" />
                      <path d="M35 165 Q40 268 190 285 Q340 268 345 165 Z" fill="#ede0cc" />
                      <path d="M48 170 Q52 255 190 272 Q328 255 332 170 Z" fill="#e8d5bc" />
                      <ellipse cx="190" cy="165" rx="155" ry="46" fill="none" stroke="#c9a87c" strokeWidth="3" />
                      <ellipse cx="190" cy="162" rx="152" ry="42" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                      {/* Food - noodles */}
                      <path d="M90 172 Q115 182 145 176 Q165 171 190 178 Q215 185 240 176 Q265 167 290 174" fill="none" stroke="#c4510a" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                      <path d="M100 182 Q130 192 158 186 Q178 181 196 188 Q220 195 248 184" fill="none" stroke="#e8763a" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                      <path d="M108 192 Q138 200 165 196 Q185 192 205 198 Q230 204 255 194" fill="none" stroke="#c4510a" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
                      {/* Avocado */}
                      <ellipse cx="190" cy="168" rx="28" ry="22" fill="#5a8a3c" opacity="0.9" />
                      <ellipse cx="190" cy="168" rx="14" ry="11" fill="#8B4513" />
                      <ellipse cx="190" cy="168" rx="8" ry="6" fill="#5a3010" />
                      {/* Tomato slices */}
                      <circle cx="130" cy="178" r="14" fill="#d94040" opacity="0.85" />
                      <circle cx="130" cy="178" r="10" fill="#e85555" opacity="0.7" />
                      <circle cx="255" cy="175" r="12" fill="#d94040" opacity="0.8" />
                      {/* Greens */}
                      <ellipse cx="155" cy="158" rx="22" ry="10" fill="#3d7a28" opacity="0.7" transform="rotate(-20 155 158)" />
                      <ellipse cx="220" cy="155" rx="20" ry="9" fill="#4a8a30" opacity="0.65" transform="rotate(15 220 155)" />
                      {/* Broth shimmer */}
                      <ellipse cx="190" cy="178" rx="100" ry="22" fill="rgba(196,120,60,0.15)" />
                      {/* Rim shine */}
                      <path d="M70 152 Q130 140 190 143 Q250 146 310 156" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Bowl base */}
                      <ellipse cx="190" cy="285" rx="72" ry="15" fill="#c9a87c" />
                      <ellipse cx="190" cy="282" rx="68" ry="11" fill="#d4b896" />
                    </svg>
                  </div>
                </div>
              )
            )}
            {floatDots.map((d, i) => (
              <div key={i} style={{
                position: "absolute", top: d.top, right: d.right,
                width: d.size, height: d.size, borderRadius: "50%",
                background: d.color, opacity: 0.65,
                animation: `floatDot 3s ease-in-out ${d.delay} infinite`,
              }} />
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "200px",
          zIndex: 5, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent, rgba(245,230,215,0.85) 60%, rgb(245,230,215) 100%)",
        }} />
      </div>

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
          /* KEY FIX: prevent any child from bleeding outside the page width */
          overflowX: "hidden",
          width: "100%",
        }}
      >
        {/* Top fade */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "160px",
          zIndex: 0, pointerEvents: "none",
          background: "linear-gradient(to bottom, rgb(245,230,215) 0%, rgba(245,230,215,0.6) 40%, transparent 100%)",
        }} />
        {/* Bottom fade */}
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
        /* ── GLOBAL OVERFLOW FIX ── */
        html, body {
          overflow-x: hidden;
          max-width: 100%;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes floatDot { 0%,100%{transform:translateY(0);opacity:0.65;}50%{transform:translateY(-10px);opacity:1;} }

        /* ══════════════════════════════
           HERO — desktop
        ══════════════════════════════ */
        .noir-hero-body {
          position: relative; z-index: 10;
          display: flex; align-items: center;
          min-height: calc(100vh - 80px);
          /* Prevent hero children from bleeding on mobile */
          width: 100%; overflow: hidden;
        }
        .noir-hero-text {
          flex: 0 0 48%; max-width: 520px;
          padding: 40px 0 40px 60px;
          z-index: 10; position: relative;
        }
        .noir-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(38px, 4.8vw, 72px);
          font-weight: 600; line-height: 1.08;
          color: #1A1A1A; margin: 0 0 18px; letter-spacing: -0.01em;
        }
        .noir-desc {
          font-size: clamp(13px, 1.2vw, 16px); font-weight: 400;
          color: #6B6560; line-height: 1.75;
          max-width: 380px; margin-bottom: 32px;
        }
        .noir-pill-text {
          font-size: 11px; font-weight: 700;
          color: #C4510A; letter-spacing: 1.5px; text-transform: uppercase;
        }
        .noir-cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
        .noir-cta-primary {
          background: linear-gradient(135deg, #C4510A, #E8763A);
          color: #fff; border: none; padding: 13px 28px;
          border-radius: 50px; font-size: 13px; font-weight: 600;
          cursor: pointer; box-shadow: 0 8px 24px rgba(196,81,10,0.3);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center; gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .noir-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(196,81,10,0.4); }
        .noir-cta-secondary {
          background: rgba(255,255,255,0.75); color: #1A1A1A;
          border: 1.5px solid rgba(196,81,10,0.25); padding: 13px 28px;
          border-radius: 50px; font-size: 13px; font-weight: 600;
          cursor: pointer; backdrop-filter: blur(8px);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center; gap: 8px;
          transition: transform 0.2s, border-color 0.2s;
        }
        .noir-cta-secondary:hover { transform: translateY(-2px); border-color: #C4510A; }
        .noir-badges { display: flex; gap: 10px; flex-wrap: wrap; }
        .noir-badge {
          display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
          background: rgba(255,255,255,0.7); border: 1px solid rgba(196,81,10,0.12);
          border-radius: 14px; padding: 14px 18px;
          backdrop-filter: blur(8px); min-width: 100px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .noir-badge:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(196,81,10,0.12); }
        .noir-bowl-wrap {
          flex: 1; height: calc(100vh - 80px);
          min-height: 400px; position: relative; z-index: 10;
          /* Clamp canvas inside its flex cell */
          min-width: 0; overflow: hidden;
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

        /* will-change */
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
          /* Clamp to viewport width */
          width: 100%; max-width: 100%;
        }
        .h2-carousel-left {
          flex: 0 0 300px; min-width: 260px;
          display: flex; flex-direction: column; gap: 0;
        }
        .h2-carousel-right {
          flex: 1; display: flex; align-items: center;
          gap: 16px;
          /* Prevent right side from growing past available space */
          min-width: 0; overflow: hidden;
        }
        .h2-track {
          flex: 1; display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          /* Grid must not escape its container */
          min-width: 0; overflow: hidden;
        }

        /* ══════════════════════════════
           DISH CARDS
        ══════════════════════════════ */
        .h2-dish-card {
          position: relative; border-radius: 20px; overflow: hidden;
          cursor: pointer; height: 280px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
          background: #1a1008;
          /* Ensure card never exceeds column width */
          width: 100%; min-width: 0;
        }
        .h2-dish-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 44px rgba(196,81,10,0.25); }
        .h2-dish-img-wrap {
          position: absolute; inset: 0; width: 100%; height: 100%;
          overflow: hidden;
        }
        .h2-dish-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
        }
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
          padding: 40px 60px; background: rgba(255,252,248,0);
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
        .h2-story-photo {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.5s ease;
        }
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
          background: transparent;
          /* Clamp to viewport */
          width: 100%; overflow: hidden;
        }
        .h2-favs-panel {
          background: rgba(255,252,248,0.78);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          padding: 52px 52px 52px 60px;
          /* Prevent panel from overflowing grid cell */
          min-width: 0; overflow: hidden;
        }
        .h2-cats-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .h2-cat-item { display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; }
        .h2-cat-circle {
          width: 90px; height: 90px; border-radius: 50%; overflow: hidden;
          border: 3px solid rgba(196,81,10,0.15);
          transition: border-color 0.3s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .h2-cat-item:hover .h2-cat-circle { border-color: #C4510A; transform: scale(1.08); box-shadow: 0 8px 24px rgba(196,81,10,0.2); }
        .h2-cat-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
        .h2-cat-item:hover .h2-cat-img { transform: scale(1.1); }
        .h2-cat-label { font-size: 12px; font-weight: 600; color: #1A1A1A; border-bottom: 1.5px solid #C4510A; padding-bottom: 2px; }
        .h2-reviews-row { display: flex; flex-direction: column; gap: 16px; }
.h2-review-item {
  background: rgba(255,255,255,0.55); border: 1px solid rgba(196,81,10,0.1);
  border-radius: 14px; padding: 16px 18px;
}
.h2-review-stars { color: #C4510A; font-size: 13px; margin-bottom: 6px; letter-spacing: 2px; }
.h2-review-text { font-size: 13px; color: #4A4540; line-height: 1.6; font-style: italic; margin-bottom: 8px; }
.h2-review-name { font-size: 12px; font-weight: 700; color: #1A1A1A; }
        .h2-special-panel {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; min-height: 300px;
          /* Keep within grid */
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
          padding: 28px 40px; position: relative; overflow: hidden;
          width: 100%;
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
          transition: border-color 0.2s, box-shadow 0.2s;
          /* Prevent input from stretching past container */
          min-width: 0;
        }
        .h2-email-input:focus { border-color: #C4510A; box-shadow: 0 0 0 3px rgba(196,81,10,0.08); }
        .h2-email-btn {
          width: 36px; height: 36px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #C4510A, #E8763A);
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0; transition: transform 0.2s, box-shadow 0.2s;
        }
        .h2-email-btn:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(196,81,10,0.4); }

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
          .noir-hero-text { flex: 0 0 50%; padding: 40px 0 40px 32px; }
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
          .noir-navlinks-desktop { display: none; }
          .noir-user-wrap.p1-auth { display: none; }
          .noir-hamburger { display: flex; align-items: center; justify-content: center; }

          /* Hero stacks vertically */
          .noir-hero-body {
            flex-direction: column;
            min-height: 100vh;
            padding-bottom: 0;
            align-items: stretch;
          }
          .noir-hero-text {
            flex: none; width: 100%; max-width: 100%;
            padding: 24px 20px 0;
            text-align: center; order: 1;
          }
          .noir-hero-text .p1-pill { display: flex; justify-content: center; }
          .noir-desc { max-width: 100%; margin-left: auto; margin-right: auto; }
          .noir-cta-row { justify-content: center; }
          .noir-badges { justify-content: center; }
          .noir-bowl-wrap {
            flex: none; width: 100%;
            height: 52vw; min-height: 240px; max-height: 340px;
            order: 2;
            /* Contain Three.js canvas so it never overflows */
            overflow: hidden;
          }

          /* Carousel stacks */
          .h2-carousel-section {
            flex-direction: column;
            padding: 40px 16px 36px;
            gap: 24px;
            align-items: stretch;
          }
          .h2-carousel-left {
            flex: none; width: 100%; min-width: 0;
            text-align: center; align-items: center;
          }
          .h2-carousel-right {
            width: 100%; gap: 8px;
            /* Arrows + track must not exceed screen width */
            overflow: hidden;
          }
          .h2-track {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            /* Each column is half the available right-side width */
            min-width: 0;
          }
          .h2-arrow-btn { width: 32px; height: 32px; font-size: 12px; flex-shrink: 0; }

          /* Story section */
          .h2-story-section { padding: 36px 16px; }
          .h2-story-top-row { flex-direction: column; gap: 20px; }
          .h2-story-img-wrap { flex: none; width: 100%; height: 240px; }
          .h2-story-text { padding: 0; text-align: center; }
          .story-icons-row.h2-icons-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }

          /* Bottom split stacks */
          .h2-bottom-split { grid-template-columns: 1fr; }
          .h2-favs-panel { padding: 36px 16px; }
          .h2-cats-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px; justify-items: center;
          }
          .h2-cat-circle { width: 76px; height: 76px; }
          .h2-special-panel { min-height: 280px; }
          .h2-special-content { padding: 32px 24px; }

          /* Footer */
          .h2-footer { padding: 24px 16px; }
          .h2-footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
          }
          .h2-footer-item {
            flex: none; min-width: 0;
            padding: 14px 10px;
            border-right: none;
            border-bottom: 1px solid rgba(196,81,10,0.08);
          }
          .h2-footer-item:nth-child(odd) { border-right: 1px solid rgba(196,81,10,0.08); }
          .h2-subscribe { margin-top: 20px; padding-top: 20px; }
          .h2-email-row { max-width: 100%; }
        }

        /* ══════════════════════════════
           MOBILE ≤480px
        ══════════════════════════════ */
        @media (max-width: 480px) {
          .noir-hero-text { padding: 20px 16px 0; }
          .noir-h1 { font-size: clamp(30px, 8.5vw, 44px); }
          .noir-pill-text { font-size: 9px; letter-spacing: 1px; }
          .noir-cta-row { flex-direction: column; align-items: center; gap: 10px; }
          .noir-cta-primary, .noir-cta-secondary {
            width: 100%; max-width: 280px;
            justify-content: center; padding: 12px 20px;
          }
          .noir-badge { min-width: 84px; padding: 10px 12px; gap: 6px; }
          .noir-bowl-wrap { height: 60vw; min-height: 210px; max-height: 280px; }

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
          .h2-cats-row { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .h2-cat-circle { width: 64px; height: 64px; }
          .h2-cat-label { font-size: 10px; }

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
          .noir-hero-text { padding: 14px 12px 0; }
          .noir-badge { min-width: 74px; padding: 8px 10px; }
          .noir-cta-primary, .noir-cta-secondary { font-size: 12px; padding: 11px 16px; }

          .h2-carousel-section { padding: 24px 10px; }
          .h2-track { gap: 6px; }
          .h2-dish-card { height: 190px; }

          .h2-cats-row { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .h2-cat-circle { width: 56px; height: 56px; }
          .h2-cat-label { font-size: 9px; }

          .story-icons-row.h2-icons-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }

          .h2-footer-grid { grid-template-columns: 1fr; }
          .h2-footer-item { border-right: none !important; border-bottom: 1px solid rgba(196,81,10,0.08); }
        }
      `}</style>
    </>
  );
}