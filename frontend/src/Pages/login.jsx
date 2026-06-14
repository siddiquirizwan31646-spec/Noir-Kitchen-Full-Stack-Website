// src/Pages/login.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faArrowRight, faLeaf, faLock, faEye, faEyeSlash, faMapMarkerAlt, faCity, faHashtag } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import gsap from "gsap";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Address sub-form ──────────────────────────────────────────────────────────
function AddressFields({ address, setAddress, focusedField, setFocused }) {
  const fields = [
    { key: "houseNo",   label: "House / Flat No.",       placeholder: "e.g. B-204",       icon: faHashtag,      full: false },
    { key: "areaName",  label: "Area / Apartment Name",  placeholder: "e.g. Green Valley Apartments", icon: faMapMarkerAlt, full: true  },
    { key: "areaNo",    label: "Area / Apartment No.",   placeholder: "e.g. Tower 3",     icon: faHashtag,      full: false },
    { key: "city",      label: "City",                   placeholder: "e.g. Jaipur",      icon: faCity,         full: false },
    { key: "pinCode",   label: "PIN Code",               placeholder: "e.g. 302001",      icon: faHashtag,      full: false },
  ];

  return (
    <div className="lp-address-group lp-stag">
      <p className="lp-addr-heading">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="lp-addr-icon" />
        Delivery Address <span className="lp-req">*</span>
      </p>
      <div className="lp-addr-grid">
        {fields.map(f => (
          <div
            key={f.key}
            className={`lp-field${f.full ? " lp-full" : ""}${focusedField === f.key ? " focused" : ""}${address[f.key] ? " filled" : ""}`}
          >
            <label className="lp-label" htmlFor={`lp-${f.key}`}>{f.label} <span className="lp-req">*</span></label>
            <div className="lp-input-wrap">
              <FontAwesomeIcon icon={f.icon} className="lp-input-icon" />
              <input
                id={`lp-${f.key}`}
                type={f.key === "pinCode" ? "number" : "text"}
                className="lp-input"
                placeholder={f.placeholder}
                value={address[f.key]}
                onChange={e => setAddress(prev => ({ ...prev, [f.key]: e.target.value }))}
                onFocus={() => setFocused(f.key)}
                onBlur={() => setFocused("")}
                autoComplete="off"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main login page ───────────────────────────────────────────────────────────
export default function LoginPage({ onLoginSuccess, onSwitchToSignup }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [focused, setFocused]   = useState("");
  const [address, setAddress]   = useState({
    houseNo: "", areaName: "", areaNo: "", city: "", pinCode: ""
  });
  const navigate = useNavigate();
  const wrapRef  = useRef(null);
  const cardRef  = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "back.out(1.6)", duration: 0.55 } })
        .fromTo(".lp-bg",    { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" })
        .fromTo(".lp-panel", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, "-=0.4")
        .fromTo(".lp-card",  { x: 80, opacity: 0, scale: 0.94 }, { x: 0, opacity: 1, scale: 1, duration: 0.65 }, "-=0.45")
        .fromTo(".lp-stag",  { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.4 }, "-=0.25");
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  // ── Validate address ────────────────────────────────────────────────────────
  const validateAddress = () => {
    const { houseNo, areaName, city, pinCode } = address;
    if (!houseNo.trim())   return "House / Flat No. is required.";
    if (!areaName.trim())  return "Area / Apartment Name is required.";
    if (!city.trim())      return "City is required.";
    if (!pinCode.trim())   return "PIN Code is required.";
    if (!/^\d{6}$/.test(pinCode.trim())) return "Enter a valid 6-digit PIN Code.";
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    const addrErr = validateAddress();
    if (addrErr) { setError(addrErr); return; }

    setError(""); setLoading(true);
    try {
      // Save address to session storage — backend will persist after OTP verification
      sessionStorage.setItem("otpEmail",    email);
      sessionStorage.setItem("otpPassword", password);
      sessionStorage.setItem("otpAddress",  JSON.stringify(address));

      const res  = await fetch(`${API}/api/auth/send-otp-with-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        navigate("/verify-otp");
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => { window.location.href = `${API}/api/auth/google`; };

  const handleMouseMove = e => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    gsap.to(card, { rotateY: x * 6, rotateX: -y * 6, duration: 0.4, ease: "power2.out", transformPerspective: 800 });
  };
  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "elastic.out(1,0.5)" });
  };

  const floatDots = [
    { top: "12%", left: "6%", size: 9, color: "#E8763A", delay: "0s" },
    { top: "28%", left: "2%", size: 5, color: "#FFB067", delay: "0.5s" },
    { top: "65%", left: "8%", size: 7, color: "#C4510A", delay: "0.9s" },
    { top: "80%", left: "3%", size: 4, color: "#E87A3A", delay: "1.4s" },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div ref={wrapRef} className="lp-root">
        <img className="lp-bg" src="https://i.postimg.cc/6p7nY0n8/Background.png" alt="" aria-hidden />

        {floatDots.map((d, i) => (
          <div key={i} className="lp-dot" style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: d.color, animationDelay: d.delay }} />
        ))}

        {/* ── Left panel (unchanged) ────────────────────────────────────── */}
        <div className="lp-panel">
          <div className="lp-panel-inner">
            <div className="lp-logo-in lp-stag">
              <img src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png" alt="Noir Kitchen" className="lp-brand-img" />
              <div className="lp-brand-names">
                <span className="lp-brand-noir">NOIR</span>
                <span className="lp-brand-kitchen">KITCHEN</span>
              </div>
            </div>
            <div className="lp-divider lp-stag" />
            <h2 className="lp-panel-headline lp-stag">Welcome<br /><em>Back</em></h2>
            <p className="lp-panel-sub lp-stag">Sign in to explore exclusive menus, manage reservations, and unlock your loyalty rewards.</p>
            <div className="lp-features lp-stag">
              {[
                { icon: faLeaf, text: "Farm-to-table freshness" },
                { icon: faStar, text: "Members-only specials" },
                { icon: faUser, text: "Personalised experience" },
              ].map(({ icon, text }) => (
                <div key={text} className="lp-feature-pill">
                  <FontAwesomeIcon icon={icon} className="lp-feature-icon" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <blockquote className="lp-quote lp-stag">"Every meal is a memory waiting to be made."</blockquote>
          </div>
          <div className="lp-panel-rule" />
        </div>

        {/* ── Right card ───────────────────────────────────────────────── */}
        <div className="lp-card-wrap">
          <div ref={cardRef} className="lp-card" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="lp-card-header lp-stag">
              <div className="lp-pill">
                <FontAwesomeIcon icon={faStar} className="lp-pill-icon" />
                <span>Member Access</span>
              </div>
              <h1 className="lp-card-title">Sign In</h1>
              <p className="lp-card-sub">Enter your details — we'll verify with a one-time code.</p>
            </div>

            <div className="lp-social-row lp-stag">
              <button className="lp-social-btn" type="button" onClick={handleGoogle}>
                <FontAwesomeIcon icon={faGoogle} />
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="lp-or-row lp-stag">
              <div className="lp-or-line" />
              <span className="lp-or-text">or continue with email</span>
              <div className="lp-or-line" />
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              {/* Email */}
              <div className={`lp-field lp-stag${focused === "email" ? " focused" : ""}${email ? " filled" : ""}`}>
                <label className="lp-label" htmlFor="lp-email">Email Address <span className="lp-req">*</span></label>
                <div className="lp-input-wrap">
                  <FontAwesomeIcon icon={faUser} className="lp-input-icon" />
                  <input
                    id="lp-email" type="email" className="lp-input"
                    placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`lp-field lp-stag${focused === "password" ? " focused" : ""}${password ? " filled" : ""}`}>
                <label className="lp-label" htmlFor="lp-password">Password <span className="lp-req">*</span></label>
                <div className="lp-input-wrap">
                  <FontAwesomeIcon icon={faLock} className="lp-input-icon" />
                  <input
                    id="lp-password" type={showPw ? "text" : "password"} className="lp-input"
                    placeholder="Min. 8 characters" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
                    autoComplete="current-password"
                  />
                  <button type="button" className="lp-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Address */}
              <AddressFields
                address={address}
                setAddress={setAddress}
                focusedField={focused}
                setFocused={setFocused}
              />

              {error && <p className="lp-error lp-stag">{error}</p>}

              <button type="submit" className={`lp-submit lp-stag${loading ? " loading" : ""}`} disabled={loading}>
                {loading ? <span className="lp-spinner" /> : (
                  <><span>Send OTP to Verify</span><FontAwesomeIcon icon={faArrowRight} className="lp-arrow" /></>
                )}
              </button>

              <p className="lp-switch lp-stag">
                New to Noir Kitchen?{" "}
                <a href="#" className="lp-switch-link" onClick={e => { e.preventDefault(); onSwitchToSignup?.(); }}>
                  Create an account
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        .lp-root { position:fixed; inset:0; z-index:50; display:flex; align-items:stretch; font-family:'Plus Jakarta Sans',sans-serif; overflow:hidden; }
        .lp-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; opacity:0; pointer-events:none; }
        .lp-dot { position:absolute; border-radius:50%; opacity:0.6; z-index:1; animation:lpFloat 3.2s ease-in-out infinite; }
        @keyframes lpFloat { 0%,100%{transform:translateY(0);opacity:0.6;}50%{transform:translateY(-12px);opacity:1;} }
        .lp-panel { flex:0 0 42%; position:relative; z-index:2; display:flex; align-items:center; padding:48px 0 48px 56px; opacity:0; }
        .lp-panel-inner { display:flex; flex-direction:column; gap:28px; max-width:380px; }
        .lp-panel-rule { position:absolute; right:0; top:10%; bottom:10%; width:1px; background:linear-gradient(to bottom,transparent,rgba(196,81,10,0.3) 30%,rgba(196,81,10,0.5) 50%,rgba(196,81,10,0.3) 70%,transparent); }
        .lp-brand-img { height:60px; width:auto; object-fit:contain; }
        .lp-brand-names { display:flex; flex-direction:column; gap:2px; margin-top:12px; }
        .lp-brand-noir { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:900; color:#1A1A1A; letter-spacing:0.06em; line-height:1; }
        .lp-brand-kitchen { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:900; color:#C4510A; letter-spacing:0.06em; line-height:1; }
        .lp-divider { width:48px; height:2px; background:linear-gradient(to right,#C4510A,#E8763A); border-radius:2px; }
        .lp-panel-headline { font-family:'Cormorant Garamond',serif; font-size:clamp(38px,4vw,58px); font-weight:600; line-height:1.1; color:#1A1A1A; letter-spacing:-0.01em; }
        .lp-panel-headline em { font-style:italic; color:#C4510A; }
        .lp-panel-sub { font-size:14px; color:#6B6560; line-height:1.75; max-width:320px; }
        .lp-features { display:flex; flex-direction:column; gap:10px; }
        .lp-feature-pill { display:inline-flex; align-items:center; gap:10px; background:rgba(255,255,255,0.75); border:1px solid rgba(196,81,10,0.15); border-radius:50px; padding:8px 18px; font-size:13px; font-weight:500; color:#2B2B2B; backdrop-filter:blur(8px); transition:transform 0.2s,box-shadow 0.2s; }
        .lp-feature-pill:hover { transform:translateX(4px); box-shadow:0 4px 16px rgba(196,81,10,0.1); }
        .lp-feature-icon { color:#C4510A; font-size:13px; }
        .lp-quote { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:15px; color:#9a7a68; line-height:1.6; padding-left:16px; border-left:2px solid rgba(196,81,10,0.35); }

        /* ── Card ── */
        .lp-card-wrap { flex:1; z-index:2; display:flex; align-items:center; justify-content:center; padding:32px 40px; overflow:hidden; }
        .lp-card { width:100%; max-width:480px; max-height:calc(100vh - 64px); overflow-y:auto; overflow-x:hidden; background:rgba(255,255,255,0.02); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); border:1px solid rgba(255,255,255,0.6); box-shadow:0 24px 64px rgba(0,0,0,0.1),0 4px 16px rgba(196,81,10,0.06),inset 0 1px 0 rgba(255,255,255,0.8); border-radius:28px; padding:40px 40px 36px; opacity:0; transform-style:preserve-3d; will-change:transform; scrollbar-width:none; }
        .lp-card::-webkit-scrollbar { display:none; }
        .lp-card-header { margin-bottom:20px; }
        .lp-pill { display:inline-flex; align-items:center; gap:7px; background:rgba(196,81,10,0.06); border:0.5px solid #C4510A; border-radius:50px; padding:6px 14px; margin-bottom:16px; }
        .lp-pill span { font-size:11px; font-weight:700; color:#C4510A; letter-spacing:1.2px; text-transform:uppercase; }
        .lp-pill-icon { color:#C4510A; font-size:10px; }
        .lp-card-title { font-family:'Cormorant Garamond',serif; font-size:clamp(30px,3.5vw,42px); font-weight:600; color:#1A1A1A; letter-spacing:-0.01em; line-height:1.1; margin-bottom:8px; }
        .lp-card-sub { font-size:13px; color:#7a716b; line-height:1.6; }
        .lp-social-row { margin-bottom:16px; }
        .lp-social-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:rgba(255,255,255,0.8); border:1.5px solid rgba(196,81,10,0.2); border-radius:12px; padding:12px 16px; font-size:13px; font-weight:600; color:#1A1A1A; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; backdrop-filter:blur(8px); }
        .lp-social-btn:hover { border-color:#C4510A; box-shadow:0 4px 16px rgba(196,81,10,0.15); transform:translateY(-1px); }
        .lp-or-row { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
        .lp-or-line { flex:1; height:1px; background:rgba(196,81,10,0.15); }
        .lp-or-text { font-size:11px; color:#a89890; font-weight:500; letter-spacing:0.5px; white-space:nowrap; }

        /* ── Fields ── */
        .lp-field { margin-bottom:14px; }
        .lp-label { display:block; font-size:12px; font-weight:600; color:#5a4f4a; letter-spacing:0.4px; margin-bottom:7px; transition:color 0.2s; }
        .lp-req { color:#C4510A; }
        .lp-field.focused .lp-label { color:#C4510A; }
        .lp-input-wrap { position:relative; display:flex; align-items:center; background:rgba(255,255,255,0.7); border:1.5px solid rgba(196,81,10,0.18); border-radius:12px; overflow:hidden; transition:border-color 0.25s,box-shadow 0.25s; }
        .lp-field.focused .lp-input-wrap { border-color:#C4510A; box-shadow:0 0 0 3px rgba(196,81,10,0.1); }
        .lp-field.filled .lp-input-wrap { border-color:rgba(196,81,10,0.4); }
        .lp-input-icon { position:absolute; left:14px; color:#C4510A; font-size:13px; opacity:0.7; pointer-events:none; transition:opacity 0.2s; }
        .lp-field.focused .lp-input-icon { opacity:1; }
        .lp-input { flex:1; border:none; outline:none; background:transparent; padding:12px 14px 12px 38px; font-size:13.5px; color:#1A1A1A; font-family:'Plus Jakarta Sans',sans-serif; }
        .lp-input::placeholder { color:#c4b8b0; }
        .lp-input[type=number]::-webkit-inner-spin-button,
        .lp-input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        .lp-pw-toggle { position:absolute; right:12px; background:none; border:none; cursor:pointer; color:#9a7a68; font-size:13px; padding:4px; display:flex; align-items:center; transition:color 0.2s; }
        .lp-pw-toggle:hover { color:#C4510A; }

        /* ── Address group ── */
        .lp-address-group { margin-bottom:14px; }
        .lp-addr-heading { font-size:12px; font-weight:700; color:#5a4f4a; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px; display:flex; align-items:center; gap:7px; }
        .lp-addr-icon { color:#C4510A; font-size:12px; }
        .lp-addr-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .lp-field.lp-full { grid-column:1 / -1; }

        .lp-error { font-size:12px; color:#d94f0a; background:rgba(217,79,10,0.07); border:1px solid rgba(217,79,10,0.2); border-radius:8px; padding:8px 14px; margin-bottom:16px; }
        .lp-submit { width:100%; border:none; cursor:pointer; background:linear-gradient(135deg,#C4510A,#E8763A); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:700; letter-spacing:0.5px; padding:14px 28px; border-radius:14px; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow:0 8px 24px rgba(196,81,10,0.3); transition:transform 0.2s,box-shadow 0.2s,opacity 0.2s; margin-bottom:20px; min-height:50px; }
        .lp-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 32px rgba(196,81,10,0.4); }
        .lp-submit.loading { opacity:0.8; cursor:not-allowed; }
        .lp-arrow { transition:transform 0.25s; }
        .lp-submit:hover .lp-arrow { transform:translateX(4px); }
        .lp-spinner { display:inline-block; width:20px; height:20px; border:2.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:lpSpin 0.7s linear infinite; }
        @keyframes lpSpin { to{transform:rotate(360deg);} }
        .lp-switch { font-size:13px; color:#7a716b; text-align:center; }
        .lp-switch-link { color:#C4510A; font-weight:700; text-decoration:none; }
        .lp-switch-link:hover { opacity:0.75; }

        @media(max-width:768px) { .lp-panel{display:none;} .lp-card-wrap{padding:24px 20px;} .lp-card{padding:32px 28px 28px;border-radius:24px;} }
        @media(max-width:480px) { .lp-card-wrap{padding:16px 14px;} .lp-card{padding:28px 20px 24px;border-radius:20px;} .lp-addr-grid{grid-template-columns:1fr;} .lp-field.lp-full{grid-column:auto;} }
      `}</style>
    </>
  );
}