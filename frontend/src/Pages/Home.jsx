import { useEffect, useRef, useState, useCallback } from "react";
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

const FRAME_COUNT = 178;

function getImagePath(index) {
  const num = String(index).padStart(3, "0");
  return `/Home/ezgif-frame-${num}.jpg`;
}

function useCanvasAnimation(canvasRef, sectionRef, onProgress) {
  const firedRef = useRef(false);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx    = canvas.getContext("2d");
    const images = [];
    let   currentFrame = 0;
    let   rafId        = null;

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src   = getImagePath(i);
      images.push(img);
    }

    // ── KEY FIX: use device pixel ratio for sharp rendering on mobile ──
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const displayW = window.innerWidth;
      const displayH = window.innerHeight;

      // Physical pixel dimensions — prevents blurry frames on HiDPI/Retina screens
      canvas.width  = displayW * dpr;
      canvas.height = displayH * dpr;

      // CSS size stays at 100vw × 100vh
      canvas.style.width  = displayW + "px";
      canvas.style.height = displayH + "px";

      // Scale all draw calls to match the DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawFrame(currentFrame);
    }

    // ── KEY FIX: scaleImage now uses CSS display size, not canvas.width ──
    // canvas.width is the physical pixel buffer; CSS logical size is window.innerWidth/Height
    function scaleImage(img) {
      const displayW = window.innerWidth;
      const displayH = window.innerHeight;

      // "cover" behaviour: fill the viewport, crop edges if needed
      const hRatio = displayW / img.width;
      const vRatio = displayH / img.height;
      const ratio  = Math.max(hRatio, vRatio);   // cover (was Math.max — keep cover)

      const drawW = img.width  * ratio;
      const drawH = img.height * ratio;
      const cx    = (displayW - drawW) / 2;       // centre horizontally
      const cy    = (displayH - drawH) / 2;       // centre vertically

      ctx.clearRect(0, 0, displayW, displayH);
      ctx.drawImage(img, 0, 0, img.width, img.height, cx, cy, drawW, drawH);
    }

    function drawFrame(index) {
      const img = images[Math.max(0, Math.min(index, FRAME_COUNT - 1))];
      if (img?.complete && img.naturalWidth > 0) scaleImage(img);
    }

    function onScroll() {
      const rect      = section.getBoundingClientRect();
      const maxScroll = section.offsetHeight - window.innerHeight;
      const scrolled  = -rect.top;
      const progress  = Math.max(0, Math.min(1, scrolled / maxScroll));

      onProgress(progress);

      if (progress >= 0.98 && !firedRef.current) {
        firedRef.current = true;
        window.dispatchEvent(new CustomEvent("homeAnimationComplete"));
      }

      const frame = Math.round(progress * (FRAME_COUNT - 1));

      if (frame !== currentFrame) {
        currentFrame = frame;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => drawFrame(currentFrame));
      }
    }

    // Redraw when first image loads (ensures first frame appears immediately)
    images[0].onload = () => {
      resize();
      drawFrame(0);
    };

    // Also redraw any frame that loads while the user is already mid-scroll
    images.forEach((img, i) => {
      if (i === 0) return; // handled above
      img.onload = () => {
        if (i === currentFrame) drawFrame(currentFrame);
      };
    });

    resize();

    // ── KEY FIX: use ResizeObserver for reliable mobile resize detection ──
    // window resize misses orientation-change edge-cases on some Android browsers
    const ro = new ResizeObserver(() => resize());
    ro.observe(document.documentElement);

    window.addEventListener("resize",       resize,   { passive: true });
    window.addEventListener("scroll",       onScroll, { passive: true });
    window.addEventListener("orientationchange", () => {
      // small delay lets the browser finish the orientation flip
      setTimeout(resize, 120);
    });

    return () => {
      window.removeEventListener("resize",            resize);
      window.removeEventListener("scroll",            onScroll);
      window.removeEventListener("orientationchange", resize);
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [canvasRef, sectionRef, onProgress]);
}

function usePanel(progress, start, end) {
  const visible  = progress >= start && progress <= end;
  const entering = progress >= start && progress <= start + 0.05;
  const leaving  = progress >= end - 0.05 && progress <= end;
  const opacity  = visible
    ? entering ? (progress - start) / 0.05
    : leaving  ? (end - progress)   / 0.05
    : 1
    : 0;
  return { visible, opacity };
}

function useEndReveal(progress, start, span = 0.08) {
  const opacity = Math.max(0, Math.min(1, (progress - start) / span));
  return { opacity, visible: opacity > 0 };
}

const FINAL_BADGES = [
  { icon: faStar,        label: "4.9 Guest Rating" },
  { icon: faUtensils,    label: "50+ Signature Dishes" },
  { icon: faLocationDot, label: "Jaipur, Rajasthan" },
  { icon: faClock,       label: "Open 11 AM – 11 PM" },
];

const FINAL_DOTS = [
  { top:"14%", left:"10%",  size:8,  delay:"0s"   },
  { top:"72%", left:"16%",  size:5,  delay:"0.5s" },
  { top:"20%", right:"12%", size:6,  delay:"1s"   },
  { top:"76%", right:"9%",  size:10, delay:"1.5s" },
  { top:"45%", left:"4%",   size:4,  delay:"0.8s" },
  { top:"50%", right:"4%",  size:4,  delay:"1.2s" },
];

export default function Home({ onLoginClick, onSignupClick }) {
  const navigate     = useNavigate();
  const canvasRef    = useRef(null);
  const sectionRef   = useRef(null);
  const [progress, setProgress]       = useState(0);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [www2Opacity, setWww2Opacity] = useState(0);
  const www2TimerRef = useRef(null);

  useCanvasAnimation(canvasRef, sectionRef, setProgress);

  const whiteBgRef = useRef(0);
  useEffect(() => {
    whiteBgRef.current = 0;
  }, []);

  useEffect(() => {
    const wb = Math.max(0, Math.min(1, (progress - 0.87) / 0.08));
    if (wb >= 0.98 && whiteBgRef.current < 0.98) {
      whiteBgRef.current = 1;
      clearTimeout(www2TimerRef.current);
      www2TimerRef.current = setTimeout(() => {
        setWww2Opacity(1);
      }, 500);
    }
    if (wb < 0.5 && whiteBgRef.current >= 0.98) {
      whiteBgRef.current = 0;
      clearTimeout(www2TimerRef.current);
      setWww2Opacity(0);
    }
  }, [progress]);

  const panel1 = usePanel(progress, 0.01, 0.28);
  const panel2 = usePanel(progress, 0.30, 0.52);
  const panel3 = usePanel(progress, 0.54, 0.72);
  const panel4 = usePanel(progress, 0.74, 0.88);

  const whiteBg = useEndReveal(progress, 0.87, 0.08);
  const final   = useEndReveal(progress, 0.91, 0.07);

  const onWhite = whiteBg.opacity > 0.5;

  const finalTranslate = `translateY(${(1 - final.opacity) * 40}px)`;

  const panelHeadingColor  = onWhite ? "#1A1208" : "#F5F5F5";
  const panelBodyColor     = onWhite ? "#5C4A30" : "rgba(245,245,245,0.62)";
  const panelEyebrowColor  = onWhite ? "#C4510A" : "#E65C00";
  const panelTagColor      = onWhite ? "rgba(160,80,10,0.9)"  : "rgba(255,176,103,0.85)";
  const panelTagBorder     = onWhite ? "rgba(200,80,10,0.45)" : "rgba(230,92,0,0.35)";
  const panelTagBg         = onWhite ? "rgba(200,80,10,0.1)"  : "rgba(230,92,0,0.08)";
  const panelCardBg        = onWhite
    ? "linear-gradient(135deg, rgba(255,248,240,0.92), rgba(255,235,210,0.85))"
    : "linear-gradient(135deg, rgba(13,13,13,0.8), rgba(42,21,6,0.68))";
  const panelCardBorder    = onWhite ? "rgba(200,80,10,0.28)" : "rgba(230,92,0,0.22)";
  const dividerGradient    = onWhite
    ? "linear-gradient(90deg, #C4510A, transparent)"
    : "linear-gradient(90deg, #E65C00, transparent)";

  const navLogoWordColor  = onWhite ? "#1A1208" : "#F5F5F5";
  const navTaglineColor   = onWhite ? "#C4510A" : "#FFB067";
  const navDividerColor   = onWhite ? "rgba(26,18,8,0.25)" : "rgba(255,255,255,0.25)";
  const navHamburgerColor = onWhite ? "#1A1208" : "#F5F5F5";
  const navHamburgerBorder= onWhite ? "rgba(196,81,10,0.5)" : "rgba(230,92,0,0.6)";
  const navLoginColor     = onWhite ? "#1A1208" : "#F5F5F5";

  const panelStyles = {
    card: {
      ...styles.panelCard,
      background: panelCardBg,
      borderColor: panelCardBorder,
    },
    eyebrow:  { ...styles.eyebrow,  color: panelEyebrowColor },
    heading:  { ...styles.heading,  color: panelHeadingColor },
    body:     { ...styles.body,     color: panelBodyColor    },
    divider:  { ...styles.divider,  background: dividerGradient },
    tag:      { ...styles.tag,      color: panelTagColor, borderColor: panelTagBorder, background: panelTagBg },
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <section ref={sectionRef} style={{ position:"relative", height:"700vh", background:"#0D0D0D" }}>
        <div style={{ position:"sticky", top:0, height:"100vh", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>

          {/* ── KEY FIX: canvas fills the full viewport via CSS, physical size set in JS ── */}
          <canvas
            ref={canvasRef}
            style={{
              display: "block",
              position: "absolute",
              inset: 0,
              // width/height are set by JS to window.innerWidth/Height
              // so the canvas always matches the visible screen on mobile
            }}
          />

          {/* Overlays */}
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, transparent 40%, rgba(13,13,13,0.55) 100%)", pointerEvents:"none", zIndex:2 }} />
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"35%", background:"linear-gradient(to top, rgba(13,13,13,0.7) 0%, transparent 100%)", pointerEvents:"none", zIndex:2 }} />

          {/* ── END-OF-SCROLL WHITE REVEAL BACKGROUND ── */}
          <div
            style={{
              position:"absolute", top:0, left:0,
              width:"100%", height:"100%",
              zIndex:15,
              opacity: whiteBg.opacity,
              transition:"opacity 0.2s ease-out",
              pointerEvents:"none",
              overflow:"hidden",
            }}
          >
            <img
              src="/Home/www.jpg"
              alt=""
              style={{
                position:"absolute", top:0, left:0,
                width:"100%", height:"100%",
                objectFit:"cover",
                objectPosition:"center center",
                display:"block",
              }}
            />
          </div>

          {/* ── TOP BAR: Logo + Auth ── */}
          <div style={{
            position:"absolute", top:0, left:0, right:0, zIndex:30,
            padding:"16px 20px 0",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            {/* Logo */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img
                src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
                alt="Noir Kitchen"
                style={{ height:46, width:"auto", objectFit:"contain" }}
              />
              <div className="home-logo-divider" style={{ width:1, height:40, background:navDividerColor, transition:"background 0.3s" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:900, fontSize:20, color:navLogoWordColor, letterSpacing:"0.03em", lineHeight:1, transition:"color 0.3s" }}>NOIR</span>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:900, fontSize:20, color:"#E65C00", letterSpacing:"0.03em", lineHeight:1 }}>KITCHEN</span>
                </div>
                <span className="home-tagline" style={{ fontSize:"0.68em", color:navTaglineColor, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"color 0.3s" }}>Elevated Taste, Timeless Experience</span>
              </div>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="home-auth-desktop" style={{ display:"flex", gap:10 }}>
              <button className="home-login-btn" onClick={onLoginClick} style={{ color: navLoginColor, transition:"color 0.3s" }}>
                <FontAwesomeIcon icon={faUser} style={{ marginRight:7 }} />
                <span>Login</span>
              </button>
              <button className="home-signup-btn" onClick={onSignupClick}>
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight:7 }} />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="home-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{
                display:"none",
                background:"transparent",
                border:`1.5px solid ${navHamburgerBorder}`,
                borderRadius:10,
                width:40, height:40,
                alignItems:"center", justifyContent:"center",
                cursor:"pointer", color:navHamburgerColor, fontSize:18,
                transition:"color 0.3s, border-color 0.3s",
              }}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>

          {/* ── MOBILE FULLSCREEN MENU OVERLAY ── */}
          <div
            className="home-mobile-menu"
            style={{
              position:"fixed", inset:0, zIndex:100,
              background:"rgba(13,8,2,0.97)",
              backdropFilter:"blur(16px)",
              WebkitBackdropFilter:"blur(16px)",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:20,
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? "all" : "none",
              transition:"opacity 0.25s",
            }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{
                position:"absolute", top:20, right:20,
                background:"transparent", border:"1.5px solid rgba(230,92,0,0.5)",
                borderRadius:10, width:40, height:40,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", color:"#F5F5F5", fontSize:18,
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <div style={{ textAlign:"center", marginBottom:20 }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:"#F5F5F5", margin:0 }}>
                NOIR <span style={{ color:"#E65C00" }}>KITCHEN</span>
              </p>
              <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, color:"#FFB067", margin:"4px 0 0", letterSpacing:"0.1em" }}>Elevated Taste, Timeless Experience</p>
            </div>

            <button
              className="home-login-btn"
              style={{ width:220, justifyContent:"center", padding:"12px 0", fontSize:15 }}
              onClick={() => { setMenuOpen(false); onLoginClick?.(); }}
            >
              <FontAwesomeIcon icon={faUser} style={{ marginRight:10 }} />
              Login
            </button>
            <button
              className="home-signup-btn"
              style={{ width:220, justifyContent:"center", padding:"12px 0", fontSize:15 }}
              onClick={() => { setMenuOpen(false); onSignupClick?.(); }}
            >
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight:10 }} />
              Sign Up
            </button>
          </div>

          {/* ── PANEL 1 — top-left ── */}
          <div
            className="home-panel home-panel-1"
            style={{
              position:"absolute", top:"22%", left:"6%", zIndex:10,
              pointerEvents:"none",
              opacity:panel1.opacity,
              transform:`translateY(${(1-panel1.opacity)*30}px)`,
              transition:"opacity 0.1s, transform 0.1s",
              maxWidth:540,
            }}
          >
            <div className="home-panel-card" style={panelStyles.card}>
              <p style={panelStyles.eyebrow}>NoirKitchen / Ingredients</p>
              <h2 style={panelStyles.heading}>Crafted with<br /><em style={{ color:"#F97316" }}>care &amp; passion</em></h2>
              <p style={panelStyles.body}>Farm-to-table ingredients selected daily for maximum freshness and flavor. Every element on the plate begins with purpose.</p>
              <div style={panelStyles.divider} />
              <div style={styles.tagRow}>
                <span style={panelStyles.tag}>Fresh Ingredients</span>
                <span style={panelStyles.tag}>Seasonal</span>
                <span style={panelStyles.tag}>Farm-to-Table</span>
              </div>
            </div>
          </div>

          {/* ── PANEL 2 — top-right ── */}
          <div
            className="home-panel home-panel-2"
            style={{
              position:"absolute", top:"25%", right:"6%", zIndex:10,
              pointerEvents:"none",
              opacity:panel2.opacity,
              transform:`translateY(${(1-panel2.opacity)*30}px)`,
              transition:"opacity 0.1s, transform 0.1s",
              maxWidth:480,
              textAlign:"right",
            }}
          >
            <div className="home-panel-card" style={panelStyles.card}>
              <p style={{ ...panelStyles.eyebrow, justifyContent:"flex-end", display:"flex" }}>NoirKitchen / Process</p>
              <h2 style={{ ...panelStyles.heading, textAlign:"right" }}>Every dish tells<br /><em style={{ color:"#F97316" }}>a story</em></h2>
              <p style={{ ...panelStyles.body, textAlign:"right", marginLeft:"auto" }}>Crafted by passionate culinary experts with years of fine dining experience. Bold flavors born from timeless technique.</p>
              <div style={{ ...panelStyles.divider, marginLeft:"auto" }} />
              <div style={{ ...styles.tagRow, justifyContent:"flex-end" }}>
                <span style={panelStyles.tag}>Master Chefs</span>
                <span style={panelStyles.tag}>Signature Recipes</span>
              </div>
            </div>
          </div>

          {/* ── PANEL 3 — bottom-right ── */}
          <div
            className="home-panel home-panel-3"
            style={{
              position:"absolute", bottom:"16%", right:"6%", zIndex:10,
              pointerEvents:"none",
              opacity:panel3.opacity,
              transform:`translateY(${(1-panel3.opacity)*30}px)`,
              transition:"opacity 0.1s, transform 0.1s",
              maxWidth:520,
              textAlign:"right",
            }}
          >
            <div className="home-panel-card" style={panelStyles.card}>
              <p style={{ ...panelStyles.eyebrow, justifyContent:"flex-end", display:"flex" }}>NoirKitchen / Ambiance</p>
              <h2 style={{ ...panelStyles.heading, textAlign:"right" }}>Luxury on every<br /><em style={{ color:"#F97316" }}>plate</em></h2>
              <p style={{ ...panelStyles.body, textAlign:"right", marginLeft:"auto" }}>A premium atmosphere designed for unforgettable experiences. Where elegance meets flavor in every moment.</p>
              <div style={{ ...panelStyles.divider, marginLeft:"auto" }} />
              <div style={{ ...styles.tagRow, justifyContent:"flex-end" }}>
                <span style={panelStyles.tag}>Luxury Dining</span>
                <span style={panelStyles.tag}>Premium</span>
                <span style={panelStyles.tag}>Refined</span>
              </div>
            </div>
          </div>

          {/* ── PANEL 4 — bottom-left ── */}
          <div
            className="home-panel home-panel-4"
            style={{
              position:"absolute", bottom:"14%", left:"6%", zIndex:10,
              pointerEvents:"none",
              opacity:panel4.opacity,
              transform:`translateY(${(1-panel4.opacity)*30}px)`,
              transition:"opacity 0.1s, transform 0.1s",
              maxWidth:500,
            }}
          >
            <div className="home-panel-card" style={panelStyles.card}>
              <p style={panelStyles.eyebrow}>NoirKitchen / Culinary</p>
              <h2 style={panelStyles.heading}>Culinary perfection<br /><em style={{ color:"#F97316" }}>redefined</em></h2>
              <p style={panelStyles.body}>Balanced meals that combine nutrition with irresistible taste. Healthy &amp; delicious — never a compromise.</p>
              <div style={panelStyles.divider} />
              <div style={styles.tagRow}>
                <span style={panelStyles.tag}>Healthy &amp; Delicious</span>
                <span style={panelStyles.tag}>Artistry</span>
                <span style={panelStyles.tag}>Indulgence</span>
              </div>
            </div>
          </div>

          {/* ── www2/www3 dissolve layer ── */}
          <div
            style={{
              position:"absolute", top:0, left:0,
              width:"100%", height:"100%",
              zIndex:16,
              opacity: www2Opacity,
              transition:"opacity 0.9s ease-in-out",
              pointerEvents:"none",
              overflow:"hidden",
            }}
          >
            <img
              src="/Home/www2.png"
              alt=""
              className="home-bg-desktop"
              style={{
                position:"absolute", top:0, left:0,
                width:"100%", height:"100%",
                objectFit:"cover", objectPosition:"center center",
                display:"block",
              }}
            />
            <img
              src="/Home/www3.png"
              alt=""
              className="home-bg-mobile"
              style={{
                position:"absolute", top:0, left:0,
                width:"100%", height:"100%",
                objectFit:"cover", objectPosition:"center center",
                display:"none",
              }}
            />
          </div>

          {/* ── FINAL REVEAL ── */}
          <div style={{
            position:"absolute", inset:0, zIndex:20, pointerEvents:"none",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            opacity:final.opacity, transition:"opacity 0.2s",
          }}>
            <div className="home-final-inner" style={{ transform:finalTranslate, transition:"transform 0.2s", textAlign:"center", padding:"0 clamp(16px,5vw,40px)", maxWidth:800, width:"100%" }}>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:10 }}>
                <svg width="32" height="14" viewBox="0 0 32 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 13 C6 8, 12 2, 20 4 C26 6, 30 8, 31 7" stroke="#C4510A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <path d="M14 10 C16 6, 20 3, 24 5" stroke="#C4510A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize:"clamp(10px,1.1vw,13px)", fontWeight:700, color:"#C4510A", letterSpacing:"0.28em", textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>NOIR KITCHEN</span>
                <svg width="32" height="14" viewBox="0 0 32 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform:"scaleX(-1)" }}>
                  <path d="M1 13 C6 8, 12 2, 20 4 C26 6, 30 8, 31 7" stroke="#C4510A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <path d="M14 10 C16 6, 20 3, 24 5" stroke="#C4510A" strokeWidth="1" fill="none" strokeLinecap="round"/>
                </svg>
              </div>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:18 }}>
                <div style={{ flex:1, maxWidth:80, height:"0.5px", background:"#C4510A", opacity:0.5 }} />
                <div style={{ width:4, height:4, borderRadius:"50%", background:"#C4510A", opacity:0.7 }} />
                <div style={{ flex:1, maxWidth:80, height:"0.5px", background:"#C4510A", opacity:0.5 }} />
              </div>

              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(34px,7vw,90px)", fontWeight:300, lineHeight:1.08, color:"#1A1208", margin:"0 0 16px", letterSpacing:"-0.01em" }}>
                Elevated Taste,
              </h1>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(34px,7vw,90px)", fontWeight:600, fontStyle:"italic", lineHeight:1.08, margin:"0 0 28px", letterSpacing:"-0.01em", background:"linear-gradient(90deg,#C4510A,#F97316)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Timeless Experience
              </h1>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }}>
                <div style={{ flex:1, maxWidth:100, height:"0.5px", background:"#C4510A", opacity:0.45 }} />
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L10 5L5 10L0 5Z" fill="#C4510A" opacity="0.7"/></svg>
                <div style={{ flex:1, maxWidth:100, height:"0.5px", background:"#C4510A", opacity:0.45 }} />
              </div>

              <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"clamp(13px,1.35vw,18px)", fontWeight:400, color:"#6B5B45", maxWidth:480, margin:"0 auto 14px", lineHeight:1.7, letterSpacing:"0.01em" }}>
                Fresh ingredients, artistic presentation, and unforgettable flavors crafted for modern food lovers.
              </p>

              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:"clamp(15px,1.7vw,22px)", color:"#C4510A", letterSpacing:"0.03em", marginBottom:32 }}>
                "Where Flavor Meets Luxury"
              </p>

              <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap", pointerEvents:"all", marginBottom:36 }}>
                <button className="home-btn-primary-new" onClick={() => navigate("/NoirKitchen/Menu")}>
                  <FontAwesomeIcon icon={faUtensils} style={{ marginRight:10, fontSize:14 }} />
                  EXPLORE MENU
                </button>
                <button className="home-btn-outline-new" onClick={() => navigate("/reserve")}>
                  <FontAwesomeIcon icon={faClock} style={{ marginRight:10, fontSize:14 }} />
                  RESERVE A TABLE
                </button>
              </div>

              <div className="home-final-badges" style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", pointerEvents:"all" }}>
                {FINAL_BADGES.map(({ icon, label }) => (
                  <div key={label} className="home-final-badge" style={styles.finalBadge}>
                    <FontAwesomeIcon icon={icon} style={{ color:"#E65C00", fontSize:13 }} />
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

        @keyframes homeFloatDot {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50%      { transform: translateY(-12px); opacity: 1; }
        }

        .home-login-btn {
          background: transparent;
          border: 1.5px solid #E65C00;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #F5F5F5;
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

        .home-final-badge {
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
          .home-final-words  { gap: 8px !important; margin-bottom: 14px !important; }
        }

        @media (max-width: 380px) {
          .home-final-badges { flex-direction: column; align-items: center; }
          .home-final-badge  { width: 100%; max-width: 220px; justify-content: center; }
          .home-final-inner  { padding: 0 14px !important; }
        }
      `}</style>
    </>
  );
}

const styles = {
  panelCard: {
    background: "linear-gradient(135deg, rgba(13,13,13,0.8), rgba(42,21,6,0.68))",
    border: "1px solid rgba(230,92,0,0.22)",
    borderRadius: 18,
    padding: "26px 30px",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
  },
  finalBadge: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(216,106,28,0.06)",
    border: "1px solid rgba(216,106,28,0.25)",
    borderRadius: 30,
    padding: "10px 18px",
    fontSize: 12, fontWeight: 600, color: "#1A1208",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },
  eyebrow:  { fontSize:11, fontWeight:600, color:"#E65C00", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:12, fontFamily:"'Plus Jakarta Sans', sans-serif" },
  heading:  { fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(24px, 4vw, 56px)", fontWeight:300, lineHeight:1.15, color:"#F5F5F5", margin:"0 0 14px", letterSpacing:"-0.01em" },
  body:     { fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:"clamp(13px, 1.2vw, 16px)", fontWeight:300, color:"rgba(245,245,245,0.62)", lineHeight:1.7, margin:"0 0 16px", maxWidth:420 },
  divider:  { width:60, height:1, background:"linear-gradient(90deg, #E65C00, transparent)", marginBottom:14 },
  tagRow:   { display:"flex", flexWrap:"wrap", gap:8 },
  tag:      { fontSize:10, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,176,103,0.85)", border:"1px solid rgba(230,92,0,0.35)", borderRadius:3, padding:"4px 10px", fontFamily:"'Plus Jakarta Sans', sans-serif", background:"rgba(230,92,0,0.08)" },
  btnPrimary: { background:"linear-gradient(135deg, #E65C00, #F97316)", color:"#fff", border:"none", padding:"14px 32px", borderRadius:4, fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:13, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" },
  btnOutline: { background:"transparent", color:"#1A1208", border:"1px solid rgba(26,18,8,0.35)", padding:"14px 32px", borderRadius:4, fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:13, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" },
};