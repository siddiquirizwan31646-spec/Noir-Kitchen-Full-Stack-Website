import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserPlus,
  faBars,
  faTimes,
  faStar,
  faUtensils,
  faLocationDot,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

/* ────────────────────────────────────────────────────────────────────────
   CONFIG
   ──────────────────────────────────────────────────────────────────────── */

const FRAME_COUNT = 178;
const PRIORITY_FRAMES = 24;   // loaded immediately, full priority
const BATCH_SIZE = 16;        // remaining frames load in idle-time chunks
const MAX_DPR = 2;            // clamp device pixel ratio — 3x on some phones
                               // means 9x the pixels to redraw every frame

// [start, end] scroll-progress window each panel is visible for
const PANEL_RANGES = [
  [0.01, 0.28],
  [0.30, 0.52],
  [0.54, 0.72],
  [0.74, 0.88],
];

function getImagePath(index) {
  const num = String(index).padStart(3, "0");
  return `/Home/ezgif-frame-${num}.jpg`;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function scheduleIdle(fn) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    return window.requestIdleCallback(fn, { timeout: 600 });
  }
  return setTimeout(fn, 60);
}

function panelOpacity(progress, start, end) {
  if (progress < start || progress > end) return 0;
  if (progress <= start + 0.05) return (progress - start) / 0.05;
  if (progress >= end - 0.05) return (end - progress) / 0.05;
  return 1;
}

function revealOpacity(progress, start, span = 0.08) {
  return clamp01((progress - start) / span);
}

/* ────────────────────────────────────────────────────────────────────────
   SCROLL-DRIVEN ANIMATION
   Everything below is applied with direct DOM mutation (refs), never
   React state. That's the main fix for the lag: the original version
   called setProgress() on every native scroll event, which re-rendered
   the whole component (and recomputed a dozen inline style/gradient
   objects) dozens of times per second. Scroll-linked values now bypass
   React entirely and only touch style.opacity / style.transform, which
   the browser can animate on the compositor thread without layout or
   full-tree re-render.
   ──────────────────────────────────────────────────────────────────────── */

function useHeroScrollAnimation({ canvasRef, sectionRef, panelRefs, whiteBgRef, www2Ref, finalRef, finalInnerRef }) {
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return undefined;

    const ctx = canvas.getContext("2d", { alpha: false });
    const images = Array.from({ length: FRAME_COUNT }, () => new Image());

    let currentFrame = -1;
    let drawRaf = null;
    let scrollRaf = null;
    let resizeRaf = null;
    let firstFrameReady = false;
    let animationFired = false;
    let onWhite = false;
    let www2Fired = false;
    let www2Timer = null;

    /* ── sizing ───────────────────────────────────────────────────── */
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const displayW = window.innerWidth;
      const displayH = window.innerHeight;

      canvas.width = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (currentFrame >= 0) drawFrame(currentFrame);
    }

    function scaleImage(img) {
      const displayW = window.innerWidth;
      const displayH = window.innerHeight;
      const ratio = Math.max(displayW / img.width, displayH / img.height);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const cx = (displayW - drawW) / 2;
      const cy = (displayH - drawH) / 2;
      // No clearRect: "cover" fit always paints every pixel of the
      // canvas, so clearing first was pure wasted work every frame.
      ctx.drawImage(img, cx, cy, drawW, drawH);
    }

    function drawFrame(index) {
      const img = images[Math.max(0, Math.min(index, FRAME_COUNT - 1))];
      if (img.complete && img.naturalWidth > 0) scaleImage(img);
    }

    function requestDraw(index) {
      if (drawRaf) cancelAnimationFrame(drawRaf);
      drawRaf = requestAnimationFrame(() => drawFrame(index));
    }

    /* ── progressive, prioritized frame loading ──────────────────────
       Instead of firing all 178 requests in one synchronous burst
       (which floods bandwidth and queues decode work for frames the
       user won't see for seconds), load the first ~24 frames at full
       priority, then trickle the rest in during browser idle time. */
    images.forEach((img, i) => {
      img.decoding = "async";
      img.onload = () => {
        if (!firstFrameReady && i === 0) {
          firstFrameReady = true;
          resize();
        } else if (i === currentFrame) {
          requestDraw(currentFrame);
        }
      };
    });

    for (let i = 0; i < Math.min(PRIORITY_FRAMES, FRAME_COUNT); i++) {
      if ("fetchPriority" in images[i]) {
        images[i].fetchPriority = i === 0 ? "high" : "auto";
      }
      images[i].src = getImagePath(i + 1);
    }

    let nextBatch = PRIORITY_FRAMES;
    function loadNextBatch() {
      const end = Math.min(nextBatch + BATCH_SIZE, FRAME_COUNT);
      for (let i = nextBatch; i < end; i++) images[i].src = getImagePath(i + 1);
      nextBatch = end;
      if (nextBatch < FRAME_COUNT) scheduleIdle(loadNextBatch);
    }
    scheduleIdle(loadNextBatch);

    /* ── theme (dark hero → light "reveal" section) ──────────────────
       Toggled at most twice per scroll pass via a data attribute, so
       every panel's color just inherits a CSS variable instead of
       Claude/React recomputing ten hex strings on every pixel of
       scroll. */
    function applyTheme(next) {
      if (next === onWhite) return;
      onWhite = next;
      section.dataset.theme = onWhite ? "light" : "dark";
    }

    /* ── main scroll-driven update, throttled to one pass per frame ── */
    function update() {
      scrollRaf = null;
      const rect = section.getBoundingClientRect();
      const maxScroll = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = clamp01(maxScroll > 0 ? scrolled / maxScroll : 0);

      if (progress >= 0.98 && !animationFired) {
        animationFired = true;
        window.dispatchEvent(new CustomEvent("homeAnimationComplete"));
      }

      const frame = Math.round(progress * (FRAME_COUNT - 1));
      if (frame !== currentFrame) {
        currentFrame = frame;
        requestDraw(frame);
      }

      for (let i = 0; i < panelRefs.length; i++) {
        const el = panelRefs[i].current;
        if (!el) continue;
        const [start, end] = PANEL_RANGES[i];
        const op = panelOpacity(progress, start, end);
        el.style.opacity = op;
        el.style.transform = `translateY(${(1 - op) * 30}px)`;
      }

      const whiteOp = revealOpacity(progress, 0.87, 0.08);
      if (whiteBgRef.current) whiteBgRef.current.style.opacity = whiteOp;

      const finalOp = revealOpacity(progress, 0.91, 0.07);
      if (finalRef.current) finalRef.current.style.opacity = finalOp;
      if (finalInnerRef.current) {
        finalInnerRef.current.style.transform = `translateY(${(1 - finalOp) * 40}px)`;
      }

      applyTheme(whiteOp > 0.5);

      if (whiteOp >= 0.98 && !www2Fired) {
        www2Fired = true;
        clearTimeout(www2Timer);
        www2Timer = setTimeout(() => {
          if (www2Ref.current) www2Ref.current.style.opacity = 1;
        }, 500);
      } else if (whiteOp < 0.5 && www2Fired) {
        www2Fired = false;
        clearTimeout(www2Timer);
        if (www2Ref.current) www2Ref.current.style.opacity = 0;
      }
    }

    function onScroll() {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(update);
    }

    function onResize() {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    }

    resize();
    update();

    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    const onOrientation = () => setTimeout(resize, 120);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("orientationchange", onOrientation);
      ro.disconnect();
      if (drawRaf) cancelAnimationFrame(drawRaf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      clearTimeout(www2Timer);
      images.forEach((img) => { img.onload = null; });
    };
    // Intentionally empty — this effect wires up imperative DOM/canvas
    // logic once and never needs to re-run from a prop/state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const FINAL_BADGES = [
  { icon: faStar, label: "4.9 Guest Rating" },
  { icon: faUtensils, label: "50+ Signature Dishes" },
  { icon: faLocationDot, label: "Jaipur, Rajasthan" },
  { icon: faClock, label: "Open 11 AM – 11 PM" },
];

export default function Home({ onLoginClick, onSignupClick }) {
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const panel1Ref = useRef(null);
  const panel2Ref = useRef(null);
  const panel3Ref = useRef(null);
  const panel4Ref = useRef(null);
  const whiteBgRef = useRef(null);
  const www2Ref = useRef(null);
  const finalRef = useRef(null);
  const finalInnerRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);

  useHeroScrollAnimation({
    canvasRef,
    sectionRef,
    panelRefs: [panel1Ref, panel2Ref, panel3Ref, panel4Ref],
    whiteBgRef,
    www2Ref,
    finalRef,
    finalInnerRef,
  });

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <section ref={sectionRef} className="home-hero-section" data-theme="dark" style={{ position: "relative", height: "700vh", background: "#0D0D0D" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>

          {/* Canvas fills the viewport via CSS; physical buffer size is set in JS, clamped to 2x DPR */}
          <canvas
            ref={canvasRef}
            className="home-canvas"
            style={{ display: "block", position: "absolute", inset: 0 }}
          />

          {/* Overlays */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(13,13,13,0.55) 100%)", pointerEvents: "none", zIndex: 2 }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to top, rgba(13,13,13,0.7) 0%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />

          {/* End-of-scroll white reveal background */}
          <div
            ref={whiteBgRef}
            className="home-fade-layer"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 15, opacity: 0, pointerEvents: "none", overflow: "hidden" }}
          >
            <img
              src="/Home/www.jpg"
              alt=""
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }}
            />
          </div>

          {/* ── TOP BAR: Logo + Auth ── */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
                alt="Noir Kitchen"
                style={{ height: 46, width: "auto", objectFit: "contain" }}
              />
              <div className="home-logo-divider" />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="home-logo-word" style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 900, fontSize: 20, letterSpacing: "0.03em", lineHeight: 1 }}>NOIR</span>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 900, fontSize: 20, color: "#E65C00", letterSpacing: "0.03em", lineHeight: 1 }}>KITCHEN</span>
                </div>
                <span className="home-tagline">Elevated Taste, Timeless Experience</span>
              </div>
            </div>

            <div className="home-auth-desktop" style={{ display: "flex", gap: 10 }}>
              <button className="home-login-btn" onClick={onLoginClick}>
                <FontAwesomeIcon icon={faUser} style={{ marginRight: 7 }} />
                <span>Login</span>
              </button>
              <button className="home-signup-btn" onClick={onSignupClick}>
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 7 }} />
                <span>Sign Up</span>
              </button>
            </div>

            <button
              className="home-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{ display: "none", background: "transparent", borderRadius: 10, width: 40, height: 40, alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>

          {/* ── MOBILE FULLSCREEN MENU OVERLAY ── */}
          <div
            className="home-mobile-menu"
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(13,8,2,0.97)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 20,
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "all" : "none",
              transition: "opacity 0.25s",
            }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "1.5px solid rgba(230,92,0,0.5)", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F5F5F5", fontSize: 18 }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: "#F5F5F5", margin: 0 }}>
                NOIR <span style={{ color: "#E65C00" }}>KITCHEN</span>
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: "#FFB067", margin: "4px 0 0", letterSpacing: "0.1em" }}>Elevated Taste, Timeless Experience</p>
            </div>

            <button className="home-login-btn" style={{ width: 220, justifyContent: "center", padding: "12px 0", fontSize: 15 }} onClick={() => { setMenuOpen(false); onLoginClick?.(); }}>
              <FontAwesomeIcon icon={faUser} style={{ marginRight: 10 }} />
              Login
            </button>
            <button className="home-signup-btn" style={{ width: 220, justifyContent: "center", padding: "12px 0", fontSize: 15 }} onClick={() => { setMenuOpen(false); onSignupClick?.(); }}>
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 10 }} />
              Sign Up
            </button>
          </div>

          {/* ── PANEL 1 — top-left ── */}
          <div ref={panel1Ref} className="home-panel home-panel-1" style={{ position: "absolute", top: "22%", left: "6%", zIndex: 10, pointerEvents: "none", opacity: 0, maxWidth: 540 }}>
            <div className="home-panel-card">
              <p className="home-panel-eyebrow">NoirKitchen / Ingredients</p>
              <h2 className="home-panel-heading">Crafted with<br /><em style={{ color: "#F97316" }}>care &amp; passion</em></h2>
              <p className="home-panel-body">Farm-to-table ingredients selected daily for maximum freshness and flavor. Every element on the plate begins with purpose.</p>
              <div className="home-panel-divider" />
              <div className="home-tag-row">
                <span className="home-panel-tag">Fresh Ingredients</span>
                <span className="home-panel-tag">Seasonal</span>
                <span className="home-panel-tag">Farm-to-Table</span>
              </div>
            </div>
          </div>

          {/* ── PANEL 2 — top-right ── */}
          <div ref={panel2Ref} className="home-panel home-panel-2" style={{ position: "absolute", top: "25%", right: "6%", zIndex: 10, pointerEvents: "none", opacity: 0, maxWidth: 480, textAlign: "right" }}>
            <div className="home-panel-card">
              <p className="home-panel-eyebrow" style={{ justifyContent: "flex-end", display: "flex" }}>NoirKitchen / Process</p>
              <h2 className="home-panel-heading" style={{ textAlign: "right" }}>Every dish tells<br /><em style={{ color: "#F97316" }}>a story</em></h2>
              <p className="home-panel-body" style={{ textAlign: "right", marginLeft: "auto" }}>Crafted by passionate culinary experts with years of fine dining experience. Bold flavors born from timeless technique.</p>
              <div className="home-panel-divider" style={{ marginLeft: "auto" }} />
              <div className="home-tag-row" style={{ justifyContent: "flex-end" }}>
                <span className="home-panel-tag">Master Chefs</span>
                <span className="home-panel-tag">Signature Recipes</span>
              </div>
            </div>
          </div>

          {/* ── PANEL 3 — bottom-right ── */}
          <div ref={panel3Ref} className="home-panel home-panel-3" style={{ position: "absolute", bottom: "16%", right: "6%", zIndex: 10, pointerEvents: "none", opacity: 0, maxWidth: 520, textAlign: "right" }}>
            <div className="home-panel-card">
              <p className="home-panel-eyebrow" style={{ justifyContent: "flex-end", display: "flex" }}>NoirKitchen / Ambiance</p>
              <h2 className="home-panel-heading" style={{ textAlign: "right" }}>Luxury on every<br /><em style={{ color: "#F97316" }}>plate</em></h2>
              <p className="home-panel-body" style={{ textAlign: "right", marginLeft: "auto" }}>A premium atmosphere designed for unforgettable experiences. Where elegance meets flavor in every moment.</p>
              <div className="home-panel-divider" style={{ marginLeft: "auto" }} />
              <div className="home-tag-row" style={{ justifyContent: "flex-end" }}>
                <span className="home-panel-tag">Luxury Dining</span>
                <span className="home-panel-tag">Premium</span>
                <span className="home-panel-tag">Refined</span>
              </div>
            </div>
          </div>

          {/* ── PANEL 4 — bottom-left ── */}
          <div ref={panel4Ref} className="home-panel home-panel-4" style={{ position: "absolute", bottom: "14%", left: "6%", zIndex: 10, pointerEvents: "none", opacity: 0, maxWidth: 500 }}>
            <div className="home-panel-card">
              <p className="home-panel-eyebrow">NoirKitchen / Culinary</p>
              <h2 className="home-panel-heading">Culinary perfection<br /><em style={{ color: "#F97316" }}>redefined</em></h2>
              <p className="home-panel-body">Balanced meals that combine nutrition with irresistible taste. Healthy &amp; delicious — never a compromise.</p>
              <div className="home-panel-divider" />
              <div className="home-tag-row">
                <span className="home-panel-tag">Healthy &amp; Delicious</span>
                <span className="home-panel-tag">Artistry</span>
                <span className="home-panel-tag">Indulgence</span>
              </div>
            </div>
          </div>

          {/* ── www2/www3 dissolve layer ── */}
          <div ref={www2Ref} className="home-fade-layer" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 16, opacity: 0, pointerEvents: "none", overflow: "hidden" }}>
            <img src="/Home/www2.png" alt="" className="home-bg-desktop" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            <img src="/Home/www3.png" alt="" className="home-bg-mobile" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "none" }} />
          </div>

          {/* ── FINAL REVEAL ── */}
          <div ref={finalRef} style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0 }}>
            <div ref={finalInnerRef} className="home-final-inner" style={{ textAlign: "center", padding: "0 clamp(16px,5vw,40px)", maxWidth: 800, width: "100%" }}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 }}>
                <svg width="32" height="14" viewBox="0 0 32 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 13 C6 8, 12 2, 20 4 C26 6, 30 8, 31 7" stroke="#C4510A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M14 10 C16 6, 20 3, 24 5" stroke="#C4510A" strokeWidth="1" fill="none" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: "clamp(10px,1.1vw,13px)", fontWeight: 700, color: "#C4510A", letterSpacing: "0.28em", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>NOIR KITCHEN</span>
                <svg width="32" height="14" viewBox="0 0 32 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "scaleX(-1)" }}>
                  <path d="M1 13 C6 8, 12 2, 20 4 C26 6, 30 8, 31 7" stroke="#C4510A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M14 10 C16 6, 20 3, 24 5" stroke="#C4510A" strokeWidth="1" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ flex: 1, maxWidth: 80, height: "0.5px", background: "#C4510A", opacity: 0.5 }} />
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#C4510A", opacity: 0.7 }} />
                <div style={{ flex: 1, maxWidth: 80, height: "0.5px", background: "#C4510A", opacity: 0.5 }} />
              </div>

              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,7vw,90px)", fontWeight: 300, lineHeight: 1.08, color: "#1A1208", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
                Elevated Taste,
              </h1>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,7vw,90px)", fontWeight: 600, fontStyle: "italic", lineHeight: 1.08, margin: "0 0 28px", letterSpacing: "-0.01em", background: "linear-gradient(90deg,#C4510A,#F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Timeless Experience
              </h1>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, maxWidth: 100, height: "0.5px", background: "#C4510A", opacity: 0.45 }} />
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L10 5L5 10L0 5Z" fill="#C4510A" opacity="0.7" /></svg>
                <div style={{ flex: 1, maxWidth: 100, height: "0.5px", background: "#C4510A", opacity: 0.45 }} />
              </div>

              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(13px,1.35vw,18px)", fontWeight: 400, color: "#6B5B45", maxWidth: 480, margin: "0 auto 14px", lineHeight: 1.7, letterSpacing: "0.01em" }}>
                Fresh ingredients, artistic presentation, and unforgettable flavors crafted for modern food lovers.
              </p>

              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(15px,1.7vw,22px)", color: "#C4510A", letterSpacing: "0.03em", marginBottom: 32 }}>
                "Where Flavor Meets Luxury"
              </p>

              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", pointerEvents: "all", marginBottom: 36 }}>
                <button className="home-btn-primary-new" onClick={() => navigate("/NoirKitchen/Menu")}>
                  <FontAwesomeIcon icon={faUtensils} style={{ marginRight: 10, fontSize: 14 }} />
                  EXPLORE MENU
                </button>
                <button className="home-btn-outline-new" onClick={() => navigate("/reserve")}>
                  <FontAwesomeIcon icon={faClock} style={{ marginRight: 10, fontSize: 14 }} />
                  RESERVE A TABLE
                </button>
              </div>

              <div className="home-final-badges" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", pointerEvents: "all" }}>
                {FINAL_BADGES.map(({ icon, label }) => (
                  <div key={label} className="home-final-badge">
                    <FontAwesomeIcon icon={icon} style={{ color: "#E65C00", fontSize: 13 }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── theme tokens: swapped once via [data-theme], not per-render ── */
        .home-hero-section {
          --panel-heading-color: #F5F5F5;
          --panel-body-color: rgba(245,245,245,0.62);
          --panel-eyebrow-color: #E65C00;
          --panel-tag-color: rgba(255,176,103,0.85);
          --panel-tag-border: rgba(230,92,0,0.35);
          --panel-tag-bg: rgba(230,92,0,0.08);
          --panel-card-bg: linear-gradient(135deg, rgba(13,13,13,0.8), rgba(42,21,6,0.68));
          --panel-card-border: rgba(230,92,0,0.22);
          --divider-color: #E65C00;
          --nav-logo-word-color: #F5F5F5;
          --nav-tagline-color: #FFB067;
          --nav-divider-color: rgba(255,255,255,0.25);
          --nav-hamburger-color: #F5F5F5;
          --nav-hamburger-border: rgba(230,92,0,0.6);
          --nav-login-color: #F5F5F5;
        }
        .home-hero-section[data-theme="light"] {
          --panel-heading-color: #1A1208;
          --panel-body-color: #5C4A30;
          --panel-eyebrow-color: #C4510A;
          --panel-tag-color: rgba(160,80,10,0.9);
          --panel-tag-border: rgba(200,80,10,0.45);
          --panel-tag-bg: rgba(200,80,10,0.1);
          --panel-card-bg: linear-gradient(135deg, rgba(255,248,240,0.92), rgba(255,235,210,0.85));
          --panel-card-border: rgba(200,80,10,0.28);
          --divider-color: #C4510A;
          --nav-logo-word-color: #1A1208;
          --nav-tagline-color: #C4510A;
          --nav-divider-color: rgba(26,18,8,0.25);
          --nav-hamburger-color: #1A1208;
          --nav-hamburger-border: rgba(196,81,10,0.5);
          --nav-login-color: #1A1208;
        }

        /* ── canvas: GPU layer, crisp on hi-dpi without over-rendering ── */
        .home-canvas {
          will-change: auto;
          transform: translateZ(0);
        }

        /* ── scroll-linked layers: opacity/transform only → compositor-only animation ── */
        .home-panel, .home-fade-layer, [style*="z-index: 20"] {
          will-change: opacity, transform;
        }
        .home-panel {
          transition: opacity 0.08s linear, transform 0.08s linear;
        }
        .home-fade-layer {
          transition: opacity 0.9s ease-in-out;
        }

        @keyframes homeFloatDot {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50%      { transform: translateY(-12px); opacity: 1; }
        }

        .home-logo-divider {
          width: 1px;
          height: 40px;
          background: var(--nav-divider-color);
          transition: background 0.3s;
        }
        .home-logo-word {
          color: var(--nav-logo-word-color);
          transition: color 0.3s;
        }
        .home-tagline {
          font-size: 0.68em;
          color: var(--nav-tagline-color);
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: color 0.3s;
        }
        .home-hamburger {
          color: var(--nav-hamburger-color);
          border: 1.5px solid var(--nav-hamburger-border);
          transition: color 0.3s, border-color 0.3s;
        }

        .home-login-btn {
          background: transparent;
          border: 1.5px solid #E65C00;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--nav-login-color);
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.3s, color 0.3s, transform 0.3s;
          white-space: nowrap;
          display: flex;
          align-items: center;
        }
        .home-login-btn:hover {
          background: linear-gradient(135deg, #E65C00, #F97316);
          color: #fff;
          transform: scale(1.05);
        }
        .home-signup-btn {
          background: linear-gradient(135deg, #E65C00, #F97316);
          border: 1.5px solid transparent;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.3s, color 0.3s, border-color 0.3s, transform 0.3s;
          white-space: nowrap;
          display: flex;
          align-items: center;
        }
        .home-signup-btn:hover {
          background: transparent;
          color: #E65C00;
          border-color: #E65C00;
          transform: scale(1.05);
        }

        /* ── panel content, theme-aware via CSS vars ── */
        .home-panel-card {
          background: var(--panel-card-bg);
          border: 1px solid var(--panel-card-border);
          border-radius: 18px;
          padding: 26px 30px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
          transition: background 0.3s, border-color 0.3s;
        }
        .home-panel-eyebrow {
          font-size: 11px;
          font-weight: 600;
          color: var(--panel-eyebrow-color);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: color 0.3s;
        }
        .home-panel-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(24px, 4vw, 56px);
          font-weight: 300;
          line-height: 1.15;
          color: var(--panel-heading-color);
          margin: 0 0 14px;
          letter-spacing: -0.01em;
          transition: color 0.3s;
        }
        .home-panel-body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(13px, 1.2vw, 16px);
          font-weight: 300;
          color: var(--panel-body-color);
          line-height: 1.7;
          margin: 0 0 16px;
          max-width: 420px;
          transition: color 0.3s;
        }
        .home-panel-divider {
          width: 60px;
          height: 1px;
          background: linear-gradient(90deg, var(--divider-color), transparent);
          margin-bottom: 14px;
          transition: background 0.3s;
        }
        .home-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .home-panel-tag {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--panel-tag-color);
          border: 1px solid var(--panel-tag-border);
          border-radius: 3px;
          padding: 4px 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: var(--panel-tag-bg);
          transition: color 0.3s, border-color 0.3s, background 0.3s;
        }

        .home-final-badge {
          display: flex; align-items: center; gap: 8px;
          background: rgba(216,106,28,0.06);
          border: 1px solid rgba(216,106,28,0.25);
          border-radius: 30px;
          padding: 10px 18px;
          font-size: 12px; font-weight: 600; color: #1A1208;
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          letter-spacing: 0.02em;
          white-space: nowrap;
          transition: transform 0.25s, border-color 0.25s, background 0.25s;
        }
        .home-final-badge:hover {
          transform: translateY(-3px);
          border-color: rgba(230,92,0,0.55);
          background: rgba(230,92,0,0.12);
        }

        .home-btn-primary-new {
          display: inline-flex; align-items: center;
          background: linear-gradient(135deg, #C4510A, #E8621A);
          color: #fff; border: none;
          padding: 15px clamp(22px,3vw,40px);
          border-radius: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(12px, 1.1vw, 14px);
          font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer;
          transition: transform 0.25s, box-shadow 0.25s;
          box-shadow: 0 4px 20px rgba(196,81,10,0.35);
        }
        .home-btn-primary-new:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(196,81,10,0.5);
        }

        .home-btn-outline-new {
          display: inline-flex; align-items: center;
          background: transparent;
          color: #3D2B1A;
          border: 1.5px solid rgba(60,40,20,0.4);
          padding: 14px clamp(22px,3vw,40px);
          border-radius: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(12px, 1.1vw, 14px);
          font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer;
          transition: border-color 0.25s, background 0.25s, transform 0.25s;
        }
        .home-btn-outline-new:hover {
          border-color: #C4510A;
          background: rgba(196,81,10,0.06);
          transform: translateY(-2px);
        }

        /* ── BG IMAGE SWAP ── */
        @media (max-width: 768px) {
          .home-bg-desktop { display: none !important; }
          .home-bg-mobile  { display: block !important; }
        }

        /* ── MOBILE NAV TOGGLE ── */
        @media (max-width: 640px) {
          .home-auth-desktop { display: none !important; }
          .home-hamburger    { display: flex !important; }
          .home-tagline      { display: none; }
          .home-logo-divider { display: none; }
        }

        /* ── PANEL RESPONSIVE ── */
        @media (max-width: 900px) {
          .home-panel-card { padding: 18px 20px !important; border-radius: 16px !important; }
        }

        @media (max-width: 768px) {
          .home-panel {
            left: 4% !important;
            right: 4% !important;
            max-width: none !important;
            text-align: left !important;
          }
          .home-panel-1 { top: 12% !important; bottom: auto !important; }
          .home-panel-2 { top: 38% !important; bottom: auto !important; }
          .home-panel-3 { top: 60% !important; bottom: auto !important; }
          .home-panel-4 { bottom: 6% !important; top: auto !important; }

          .home-panel-2 .home-panel-card > *,
          .home-panel-3 .home-panel-card > * {
            text-align: left !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          .home-panel-2 h2,
          .home-panel-3 h2 { text-align: left !important; }

          .home-panel-2 .home-panel-card > div[style*="marginLeft"],
          .home-panel-3 .home-panel-card > div[style*="marginLeft"] {
            margin-left: 0 !important;
            margin-right: auto !important;
          }

          .home-panel-2 .home-panel-card > div[style*="justifyContent"],
          .home-panel-3 .home-panel-card > div[style*="justifyContent"] {
            justify-content: flex-start !important;
          }
        }

        @media (max-width: 480px) {
          .home-panel-card { padding: 14px 16px !important; border-radius: 12px !important; }
          .home-panel-1 { top: 10% !important; }
          .home-panel-2 { top: 33% !important; }
          .home-panel-3 { top: 55% !important; }
          .home-panel-4 { bottom: 4% !important; }
        }

        /* Final badges */
        @media (max-width: 640px) {
          .home-final-badge  { font-size: 11px !important; padding: 8px 12px !important; }
          .home-final-badges { gap: 8px !important; }
        }

        @media (max-width: 380px) {
          .home-final-badges { flex-direction: column; align-items: center; }
          .home-final-badge  { width: 100%; max-width: 220px; justify-content: center; }
          .home-final-inner  { padding: 0 14px !important; }
        }

        /* Respect reduced-motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .home-panel, .home-fade-layer, .home-final-badge,
          .home-login-btn, .home-signup-btn,
          .home-btn-primary-new, .home-btn-outline-new {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}