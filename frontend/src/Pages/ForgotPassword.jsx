// src/Pages/ForgotPassword.jsx
// Noir Kitchen — Forgot Password Page (matches LoginPage theme)

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope, faArrowRight, faArrowLeft,
  faShieldHalved, faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import gsap from "gsap";

export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep]       = useState("request"); // "request" | "sent"
  const [email, setEmail]     = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const wrapRef = useRef(null);
  const cardRef = useRef(null);

  /* ── Entrance animation ─────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "back.out(1.6)", duration: 0.55 } })
        .fromTo(".fp-bg",   { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" })
        .fromTo(".fp-card", { y: 60, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.65 }, "-=0.4")
        .fromTo(".fp-stag", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.4 }, "-=0.3");
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  /* ── Step transition animation ──────────────────────── */
  const animateStepChange = (callback) => {
    gsap.to(cardRef.current, {
      scale: 0.96, opacity: 0, duration: 0.22, ease: "power2.in",
      onComplete: () => {
        callback();
        gsap.to(cardRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
        gsap.fromTo(".fp-stag", { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.38, ease: "back.out(1.6)" });
      },
    });
  };

  /* ── Submit ─────────────────────────────────────────── */
  const handleSubmit = async e => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    animateStepChange(() => setStep("sent"));
  };

  /* ── Mouse tilt ─────────────────────────────────────── */
  const handleMouseMove = e => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    gsap.to(card, { rotateY: x * 5, rotateX: -y * 5, duration: 0.4, ease: "power2.out", transformPerspective: 800 });
  };
  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "elastic.out(1,0.5)" });
  };

  const floatDots = [
    { top: "14%", left: "7%",  size: 9,  color: "#E8763A", delay: "0s"   },
    { top: "30%", left: "3%",  size: 5,  color: "#FFB067", delay: "0.5s" },
    { top: "62%", left: "9%",  size: 7,  color: "#C4510A", delay: "0.9s" },
    { top: "78%", left: "4%",  size: 4,  color: "#E87A3A", delay: "1.4s" },
    { top: "20%", right: "5%", size: 6,  color: "#FFB067", delay: "0.7s" },
    { top: "55%", right: "7%", size: 8,  color: "#C4510A", delay: "1.1s" },
    { top: "82%", right: "3%", size: 4,  color: "#E8763A", delay: "1.8s" },
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div ref={wrapRef} className="fp-root">

        {/* Background */}
        <img
          className="fp-bg"
          src="https://i.postimg.cc/6p7nY0n8/Background.png"
          alt="" aria-hidden
        />

        {/* Floating dots */}
        {floatDots.map((d, i) => (
          <div key={i} className="fp-dot" style={{
            top: d.top, left: d.left, right: d.right,
            width: d.size, height: d.size,
            background: d.color, animationDelay: d.delay,
          }} />
        ))}

        {/* Centered card wrap */}
        <div className="fp-wrap">

          {/* Brand mark above card */}
          <div className="fp-brand fp-stag">
            <img
              src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
              alt="Noir Kitchen"
              className="fp-brand-img"
            />
            <div className="fp-brand-text">
              <span className="fp-brand-noir">NOIR</span>
              <span className="fp-brand-kitchen">KITCHEN</span>
            </div>
          </div>

          {/* Card */}
          <div
            ref={cardRef}
            className="fp-card"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >

            {/* ── Step: Request ── */}
            {step === "request" && (
              <>
                {/* Pill */}
                <div className="fp-pill fp-stag">
                  <FontAwesomeIcon icon={faShieldHalved} className="fp-pill-icon" />
                  <span>Account Recovery</span>
                </div>

                {/* Heading */}
                <h1 className="fp-title fp-stag">Forgot your<br /><em>Password?</em></h1>
                <p className="fp-sub fp-stag">
                  No worries. Enter your email and we'll send you a link to reset your password.
                </p>

                {/* Decorative divider */}
                <div className="fp-divider fp-stag" />

                {/* Form */}
                <form onSubmit={handleSubmit} autoComplete="off" noValidate>

                  <div className={`fp-field fp-stag${focused ? " focused" : ""}${email ? " filled" : ""}`}>
                    <label className="fp-label" htmlFor="fp-email">Email Address</label>
                    <div className="fp-input-wrap">
                      <FontAwesomeIcon icon={faEnvelope} className="fp-input-icon" />
                      <input
                        id="fp-email"
                        type="email"
                        className="fp-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {error && <p className="fp-error fp-stag">{error}</p>}

                  <button
                    type="submit"
                    className={`fp-submit fp-stag${loading ? " loading" : ""}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="fp-spinner" />
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <FontAwesomeIcon icon={faArrowRight} className="fp-arrow" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to login */}
                <button
                  className="fp-back fp-stag"
                  onClick={() => onBackToLogin?.()}
                  type="button"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="fp-back-icon" />
                  Back to Sign In
                </button>
              </>
            )}

            {/* ── Step: Sent ── */}
            {step === "sent" && (
              <>
                <div className="fp-success-icon fp-stag">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>

                <div className="fp-pill fp-stag">
                  <FontAwesomeIcon icon={faStar} className="fp-pill-icon" />
                  <span>Email Sent</span>
                </div>

                <h1 className="fp-title fp-stag">Check your<br /><em>Inbox</em></h1>

                <p className="fp-sub fp-stag">
                  We've sent a password reset link to <strong className="fp-email-highlight">{email}</strong>.
                  It may take a minute to arrive.
                </p>

                <div className="fp-divider fp-stag" />

                <div className="fp-info-box fp-stag">
                  <p>Didn't receive it? Check your spam folder, or</p>
                  <button
                    className="fp-resend"
                    type="button"
                    onClick={() => animateStepChange(() => setStep("request"))}
                  >
                    try a different email address
                  </button>
                </div>

                <button
                  className="fp-submit fp-stag"
                  type="button"
                  onClick={() => onBackToLogin?.()}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="fp-arrow" style={{ transform: "none" }} />
                  <span>Back to Sign In</span>
                </button>
              </>
            )}

          </div>

          {/* Footer */}
          <p className="fp-footer fp-stag">
            © {new Date().getFullYear()} Noir Kitchen. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Root ───────────────────────────────────────── */
        .fp-root {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
        }

        /* ── Background ─────────────────────────────────── */
        .fp-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; z-index: 0;
          opacity: 0; pointer-events: none;
        }

        /* ── Floating dots ───────────────────────────────── */
        .fp-dot {
          position: absolute; border-radius: 50%;
          opacity: 0.6; z-index: 1;
          animation: fpFloat 3.2s ease-in-out infinite;
        }
        @keyframes fpFloat {
          0%,100% { transform: translateY(0); opacity: 0.6; }
          50%      { transform: translateY(-12px); opacity: 1; }
        }

        /* ── Center wrap ────────────────────────────────── */
        .fp-wrap {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
          width: 100%; max-width: 480px;
          padding: 24px 20px;
        }

        /* ── Brand ──────────────────────────────────────── */
        .fp-brand {
          display: flex; align-items: center; gap: 14px;
          opacity: 0;
        }
        .fp-brand-img { height: 52px; width: auto; object-fit: contain; }
        .fp-brand-text { display: flex; flex-direction: column; gap: 1px; }
        .fp-brand-noir {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 900;
          color: #1A1A1A; letter-spacing: 0.06em; line-height: 1;
        }
        .fp-brand-kitchen {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 900;
          color: #C4510A; letter-spacing: 0.06em; line-height: 1;
        }

        /* ── Card ───────────────────────────────────────── */
        .fp-card {
          width: 100%;
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow:
            0 24px 64px rgba(0,0,0,0.12),
            0 4px 16px rgba(196,81,10,0.08),
            inset 0 1px 0 rgba(255,255,255,0.5);
          border-radius: 28px;
          padding: 40px 40px 36px;
          opacity: 0;
          transform-style: preserve-3d;
          will-change: transform;
        }

        /* ── Pill ───────────────────────────────────────── */
        .fp-pill {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(196,81,10,0.08);
          border: 0.5px solid #C4510A;
          border-radius: 50px; padding: 6px 14px;
          margin-bottom: 18px; opacity: 0;
        }
        .fp-pill span {
          font-size: 11px; font-weight: 700;
          color: #C4510A; letter-spacing: 1.2px; text-transform: uppercase;
        }
        .fp-pill-icon { color: #C4510A; font-size: 11px; }

        /* ── Title ──────────────────────────────────────── */
        .fp-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4vw, 46px);
          font-weight: 600; color: #1A1A1A;
          letter-spacing: -0.01em; line-height: 1.1;
          margin-bottom: 12px; opacity: 0;
        }
        .fp-title em { font-style: italic; color: #C4510A; }

        /* ── Subtitle ───────────────────────────────────── */
        .fp-sub {
          font-size: 14px; color: #6B6560;
          line-height: 1.75; margin-bottom: 4px; opacity: 0;
        }

        /* ── Divider ────────────────────────────────────── */
        .fp-divider {
          width: 48px; height: 2px;
          background: linear-gradient(to right, #C4510A, #E8763A);
          border-radius: 2px; margin: 20px 0; opacity: 0;
        }

        /* ── Field ──────────────────────────────────────── */
        .fp-field { margin-bottom: 20px; opacity: 0; }
        .fp-label {
          display: block; font-size: 12px; font-weight: 600;
          color: #5a4f4a; letter-spacing: 0.4px; margin-bottom: 7px;
          transition: color 0.2s;
        }
        .fp-field.focused .fp-label { color: #C4510A; }

        .fp-input-wrap {
          position: relative; display: flex; align-items: center;
          background: rgba(255,255,255,0.18);
          border: 1.5px solid rgba(196,81,10,0.2);
          border-radius: 12px; overflow: hidden;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .fp-field.focused .fp-input-wrap {
          border-color: #C4510A;
          background: rgba(255,255,255,0.28);
          box-shadow: 0 0 0 3px rgba(196,81,10,0.12);
        }
        .fp-field.filled .fp-input-wrap { border-color: rgba(196,81,10,0.45); }

        .fp-input-icon {
          position: absolute; left: 14px;
          color: #C4510A; font-size: 13px; opacity: 0.7;
          pointer-events: none; transition: opacity 0.2s;
        }
        .fp-field.focused .fp-input-icon { opacity: 1; }

        .fp-input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 13px 14px 13px 40px;
          font-size: 14px; font-weight: 400; color: #1A1A1A;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .fp-input::placeholder { color: #c4b8b0; }

        /* ── Error ──────────────────────────────────────── */
        .fp-error {
          font-size: 12px; color: #d94f0a; font-weight: 500;
          background: rgba(217,79,10,0.08);
          border: 1px solid rgba(217,79,10,0.22);
          border-radius: 8px; padding: 8px 14px;
          margin-bottom: 16px; opacity: 0;
        }

        /* ── Submit ─────────────────────────────────────── */
        .fp-submit {
          width: 100%; border: none; cursor: pointer;
          background: linear-gradient(135deg,#C4510A,#E8763A);
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
          padding: 14px 28px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 24px rgba(196,81,10,0.3);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          margin-bottom: 18px; min-height: 50px; opacity: 0;
        }
        .fp-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(196,81,10,0.4);
        }
        .fp-submit:active:not(:disabled) { transform: translateY(0); }
        .fp-submit.loading { opacity: 0.8 !important; cursor: not-allowed; }
        .fp-submit:disabled { cursor: not-allowed; }
        .fp-arrow { transition: transform 0.25s; }
        .fp-submit:hover .fp-arrow { transform: translateX(4px); }

        /* ── Spinner ────────────────────────────────────── */
        .fp-spinner {
          display: inline-block; width: 20px; height: 20px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%;
          animation: fpSpin 0.7s linear infinite;
        }
        @keyframes fpSpin { to { transform: rotate(360deg); } }

        /* ── Back button ────────────────────────────────── */
        .fp-back {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; background: transparent;
          border: 1.5px solid rgba(196,81,10,0.25);
          border-radius: 14px; padding: 12px 28px;
          font-size: 13px; font-weight: 600; color: #5a4f4a;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: border-color 0.25s, color 0.25s, background 0.25s, transform 0.2s;
          opacity: 0;
        }
        .fp-back:hover {
          border-color: #C4510A; color: #C4510A;
          background: rgba(196,81,10,0.05);
          transform: translateY(-1px);
        }
        .fp-back-icon { transition: transform 0.25s; }
        .fp-back:hover .fp-back-icon { transform: translateX(-4px); }

        /* ── Success icon ───────────────────────────────── */
        .fp-success-icon {
          font-size: 52px; color: #C4510A;
          margin-bottom: 20px; opacity: 0;
          animation: fpPulse 2s ease-in-out infinite;
        }
        @keyframes fpPulse {
          0%,100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(196,81,10,0)); }
          50%      { transform: scale(1.06); filter: drop-shadow(0 0 12px rgba(196,81,10,0.4)); }
        }

        /* ── Email highlight ────────────────────────────── */
        .fp-email-highlight {
          color: #C4510A; font-weight: 700; word-break: break-all;
        }

        /* ── Info box ───────────────────────────────────── */
        .fp-info-box {
          background: rgba(196,81,10,0.06);
          border: 1px solid rgba(196,81,10,0.15);
          border-radius: 12px; padding: 14px 18px;
          font-size: 13px; color: #6B6560;
          line-height: 1.6; margin-bottom: 20px;
          opacity: 0;
        }
        .fp-resend {
          background: none; border: none; cursor: pointer;
          color: #C4510A; font-weight: 700; font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          text-decoration: underline; text-underline-offset: 2px;
          transition: opacity 0.2s; padding: 0;
        }
        .fp-resend:hover { opacity: 0.7; }

        /* ── Footer ─────────────────────────────────────── */
        .fp-footer {
          font-size: 11px; color: rgba(90,79,74,0.6);
          text-align: center; opacity: 0;
        }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width: 520px) {
          .fp-card { padding: 32px 24px 28px; border-radius: 22px; }
          .fp-wrap { padding: 20px 16px; }
        }
        @media (max-width: 380px) {
          .fp-card { padding: 26px 18px 24px; border-radius: 18px; }
          .fp-title { font-size: 28px; }
          .fp-brand-img { height: 40px; }
          .fp-brand-noir, .fp-brand-kitchen { font-size: 18px; }
        }
      `}</style>
    </>
  );
}