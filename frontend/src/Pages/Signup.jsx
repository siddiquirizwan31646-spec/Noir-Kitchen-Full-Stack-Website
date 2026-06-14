// src/Pages/Signup.jsx
// Noir Kitchen — Signup Page (name, email, phone only — no password)

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faArrowRight, faLeaf, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import gsap from "gsap";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Signup({ onSignup, onSwitchToLogin }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapRef = useRef(null);
  const cardRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "back.out(1.6)", duration: 0.55 } })
        .fromTo(".sp-bg",    { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" })
        .fromTo(".sp-panel", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, "-=0.4")
        .fromTo(".sp-card",  { x: 80, opacity: 0, scale: 0.94 }, { x: 0, opacity: 1, scale: 1, duration: 0.65 }, "-=0.45")
        .fromTo(".sp-stag",  { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.4 }, "-=0.3");
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Name and email are required."); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError("Enter a valid email address."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("otpEmail", form.email);
        onSignup?.(form.email);
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${API}/api/auth/google`;
  };

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
    { top: "10%", left: "5%",  size: 9, color: "#E8763A", delay: "0s"   },
    { top: "30%", left: "2%",  size: 5, color: "#FFB067", delay: "0.5s" },
    { top: "62%", left: "7%",  size: 7, color: "#C4510A", delay: "0.9s" },
    { top: "82%", left: "3%",  size: 4, color: "#E87A3A", delay: "1.4s" },
  ];

  const fields = [
    { key: "name",  label: "Full Name",   icon: faUser,     placeholder: "Your full name",     type: "text"  },
    { key: "email", label: "Email Address", icon: faEnvelope, placeholder: "you@example.com",   type: "email" },
    { key: "phone", label: "Phone",        icon: faPhone,    placeholder: "+91 00000 00000",    type: "tel", optional: true },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div ref={wrapRef} className="sp-root">
        <img className="sp-bg" src="https://i.postimg.cc/6p7nY0n8/Background.png" alt="" aria-hidden />

        {floatDots.map((d, i) => (
          <div key={i} className="sp-dot" style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: d.color, animationDelay: d.delay }} />
        ))}

        {/* Left panel */}
        <div className="sp-panel">
          <div className="sp-panel-inner">
            <div className="sp-stag">
              <img src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png" alt="Noir Kitchen" className="sp-brand-img" />
              <div className="sp-brand-names">
                <span className="sp-brand-noir">NOIR</span>
                <span className="sp-brand-kitchen">KITCHEN</span>
              </div>
            </div>
            <div className="sp-divider sp-stag" />
            <h2 className="sp-panel-headline sp-stag">Join the<br /><em>Experience</em></h2>
            <p className="sp-panel-sub sp-stag">Become a member and unlock a world of culinary luxury, exclusive menus, and personalised dining.</p>
            <div className="sp-features sp-stag">
              {[
                { icon: faLeaf,     text: "Priority table reservations" },
                { icon: faStar,     text: "Members-only tasting events" },
                { icon: faEnvelope, text: "Exclusive chef's newsletters" },
              ].map(({ icon, text }) => (
                <div key={text} className="sp-feature-pill">
                  <FontAwesomeIcon icon={icon} className="sp-feature-icon" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <blockquote className="sp-quote sp-stag">"A table reserved for those who truly appreciate the art of fine dining."</blockquote>
          </div>
          <div className="sp-panel-rule" />
        </div>

        {/* Right card */}
        <div className="sp-card-wrap">
          <div ref={cardRef} className="sp-card" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="sp-card-header sp-stag">
              <div className="sp-pill">
                <FontAwesomeIcon icon={faStar} className="sp-pill-icon" />
                <span>New Member</span>
              </div>
              <h1 className="sp-card-title">Create Account</h1>
              <p className="sp-card-sub">Fill in your details — we'll send a verification code to your email.</p>
            </div>

            {/* Google */}
            <div className="sp-social-row sp-stag">
              <button className="sp-social-btn" type="button" onClick={handleGoogle}>
                <FontAwesomeIcon icon={faGoogle} /><span>Continue with Google</span>
              </button>
            </div>
            <div className="sp-or-row sp-stag">
              <div className="sp-or-line" />
              <span className="sp-or-text">or sign up with email</span>
              <div className="sp-or-line" />
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              {fields.map(({ key, label, icon, placeholder, type, optional }) => (
                <div key={key} className={`sp-field sp-stag${focused === key ? " focused" : ""}${form[key] ? " filled" : ""}`}>
                  <label className="sp-label" htmlFor={`sp-${key}`}>
                    {label}{optional && <span style={{ fontWeight: 400, color: "#b0a09a" }}> (optional)</span>}
                  </label>
                  <div className="sp-input-wrap">
                    <FontAwesomeIcon icon={icon} className="sp-input-icon" />
                    <input
                      id={`sp-${key}`}
                      type={type}
                      className="sp-input"
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => set(key, e.target.value)}
                      onFocus={() => setFocused(key)}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                </div>
              ))}

              {error && <p className="sp-error sp-stag">{error}</p>}

              <button type="submit" className={`sp-submit sp-stag${loading ? " loading" : ""}`} disabled={loading}>
                {loading ? <span className="sp-spinner" /> : (
                  <><span>Create Account & Send OTP</span><FontAwesomeIcon icon={faArrowRight} className="sp-arrow" /></>
                )}
              </button>

              <p className="sp-switch sp-stag">
                Already a member?{" "}
                <a href="#" className="sp-switch-link" onClick={e => { e.preventDefault(); onSwitchToLogin?.(); }}>Sign in</a>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        .sp-root{position:fixed;inset:0;z-index:50;display:flex;align-items:stretch;font-family:'Plus Jakarta Sans',sans-serif;overflow:hidden;}
        .sp-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:0;pointer-events:none;}
        .sp-dot{position:absolute;border-radius:50%;opacity:0.6;z-index:1;animation:spFloat 3.2s ease-in-out infinite;}
        @keyframes spFloat{0%,100%{transform:translateY(0);opacity:0.6;}50%{transform:translateY(-12px);opacity:1;}}
        .sp-panel{flex:0 0 42%;position:relative;z-index:2;display:flex;align-items:center;padding:48px 0 48px 56px;opacity:0;}
        .sp-panel-inner{display:flex;flex-direction:column;gap:24px;max-width:380px;}
        .sp-panel-rule{position:absolute;right:0;top:10%;bottom:10%;width:1px;background:linear-gradient(to bottom,transparent,rgba(196,81,10,0.3) 30%,rgba(196,81,10,0.5) 50%,rgba(196,81,10,0.3) 70%,transparent);}
        .sp-brand-img{height:60px;width:auto;object-fit:contain;}
        .sp-brand-names{display:flex;flex-direction:column;gap:2px;margin-top:12px;}
        .sp-brand-noir{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:900;color:#1A1A1A;letter-spacing:0.06em;line-height:1;}
        .sp-brand-kitchen{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:900;color:#C4510A;letter-spacing:0.06em;line-height:1;}
        .sp-divider{width:48px;height:2px;background:linear-gradient(to right,#C4510A,#E8763A);border-radius:2px;}
        .sp-panel-headline{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,4vw,54px);font-weight:600;line-height:1.1;color:#1A1A1A;letter-spacing:-0.01em;}
        .sp-panel-headline em{font-style:italic;color:#C4510A;}
        .sp-panel-sub{font-size:14px;color:#6B6560;line-height:1.75;max-width:320px;}
        .sp-features{display:flex;flex-direction:column;gap:10px;}
        .sp-feature-pill{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.55);border:1px solid rgba(196,81,10,0.15);border-radius:50px;padding:8px 18px;font-size:13px;font-weight:500;color:#2B2B2B;backdrop-filter:blur(8px);transition:transform 0.2s,box-shadow 0.2s;}
        .sp-feature-pill:hover{transform:translateX(4px);box-shadow:0 4px 16px rgba(196,81,10,0.1);}
        .sp-feature-icon{color:#C4510A;font-size:13px;}
        .sp-quote{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:#9a7a68;line-height:1.6;padding-left:16px;border-left:2px solid rgba(196,81,10,0.35);}
        .sp-card-wrap{flex:1;z-index:2;display:flex;align-items:center;justify-content:center;padding:32px 40px;overflow-y:auto;}
        .sp-card{width:100%;max-width:460px;background:rgba(255,255,255,0.05);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,0.6);box-shadow:0 24px 64px rgba(0,0,0,0.1),0 4px 16px rgba(196,81,10,0.06),inset 0 1px 0 rgba(255,255,255,0.8);border-radius:28px;padding:36px 40px 32px;opacity:0;transform-style:preserve-3d;will-change:transform;}
        .sp-card-header{margin-bottom:20px;}
        .sp-pill{display:inline-flex;align-items:center;gap:7px;background:rgba(196,81,10,0.06);border:0.5px solid #C4510A;border-radius:50px;padding:6px 14px;margin-bottom:14px;}
        .sp-pill span{font-size:11px;font-weight:700;color:#C4510A;letter-spacing:1.2px;text-transform:uppercase;}
        .sp-pill-icon{color:#C4510A;font-size:10px;}
        .sp-card-title{font-family:'Cormorant Garamond',serif;font-size:clamp(28px,3.5vw,40px);font-weight:600;color:#1A1A1A;letter-spacing:-0.01em;line-height:1.1;margin-bottom:6px;}
        .sp-card-sub{font-size:13px;color:#7a716b;line-height:1.6;}
        .sp-social-row{margin-bottom:16px;}
        .sp-social-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(255,255,255,0.8);border:1.5px solid rgba(196,81,10,0.2);border-radius:12px;padding:12px 16px;font-size:13px;font-weight:600;color:#1A1A1A;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.25s;backdrop-filter:blur(8px);}
        .sp-social-btn:hover{border-color:#C4510A;box-shadow:0 4px 16px rgba(196,81,10,0.15);transform:translateY(-1px);}
        .sp-or-row{display:flex;align-items:center;gap:12px;margin-bottom:18px;}
        .sp-or-line{flex:1;height:1px;background:rgba(196,81,10,0.15);}
        .sp-or-text{font-size:11px;color:#a89890;font-weight:500;letter-spacing:0.5px;white-space:nowrap;}
        .sp-field{margin-bottom:16px;}
        .sp-label{display:block;font-size:12px;font-weight:600;color:#5a4f4a;letter-spacing:0.4px;margin-bottom:6px;transition:color 0.2s;}
        .sp-field.focused .sp-label{color:#C4510A;}
        .sp-input-wrap{position:relative;display:flex;align-items:center;background:rgba(255,255,255,0.7);border:1.5px solid rgba(196,81,10,0.18);border-radius:12px;overflow:hidden;transition:border-color 0.25s,box-shadow 0.25s;}
        .sp-field.focused .sp-input-wrap{border-color:#C4510A;box-shadow:0 0 0 3px rgba(196,81,10,0.1);}
        .sp-field.filled .sp-input-wrap{border-color:rgba(196,81,10,0.4);}
        .sp-input-icon{position:absolute;left:14px;color:#C4510A;font-size:13px;opacity:0.7;pointer-events:none;transition:opacity 0.2s;}
        .sp-field.focused .sp-input-icon{opacity:1;}
        .sp-input{flex:1;border:none;outline:none;background:transparent;padding:12px 14px 12px 38px;font-size:14px;color:#1A1A1A;font-family:'Plus Jakarta Sans',sans-serif;}
        .sp-input::placeholder{color:#c4b8b0;}
        .sp-error{font-size:12px;color:#d94f0a;background:rgba(217,79,10,0.07);border:1px solid rgba(217,79,10,0.2);border-radius:8px;padding:8px 14px;margin-bottom:14px;}
        .sp-submit{width:100%;border:none;cursor:pointer;background:linear-gradient(135deg,#C4510A,#E8763A);color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;padding:13px 28px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 24px rgba(196,81,10,0.3);transition:transform 0.2s,box-shadow 0.2s,opacity 0.2s;margin-bottom:16px;min-height:48px;}
        .sp-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 32px rgba(196,81,10,0.4);}
        .sp-submit.loading{opacity:0.8;cursor:not-allowed;}
        .sp-arrow{transition:transform 0.25s;}
        .sp-submit:hover .sp-arrow{transform:translateX(4px);}
        .sp-spinner{display:inline-block;width:20px;height:20px;border:2.5px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spSpin 0.7s linear infinite;}
        @keyframes spSpin{to{transform:rotate(360deg);}}
        .sp-switch{font-size:13px;color:#7a716b;text-align:center;margin-top:4px;}
        .sp-switch-link{color:#C4510A;font-weight:700;text-decoration:none;}
        .sp-switch-link:hover{opacity:0.75;}
        @media(max-width:768px){.sp-panel{display:none;}.sp-card-wrap{padding:20px 16px;}.sp-card{padding:28px 24px 24px;}}
        @media(max-width:480px){.sp-card-wrap{padding:14px 12px;}.sp-card{padding:24px 18px 20px;border-radius:20px;}}
      `}</style>
    </>
  );
}