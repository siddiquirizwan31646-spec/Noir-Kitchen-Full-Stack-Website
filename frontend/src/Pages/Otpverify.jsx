import { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faArrowRight, faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import gsap from "gsap";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const RESEND_COOLDOWN = 60; // seconds — matches backend

export default function OTPVerify({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [shake, setShake] = useState(false);

  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  /* ── Entrance animation ─────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "back.out(1.6)", duration: 0.55 } })
        .fromTo(".ov-bg", { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out" })
        .fromTo(".ov-card", { y: 60, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.65 }, "-=0.4")
        .fromTo(".ov-stag", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.4 }, "-=0.3")
        .fromTo(".ov-digit", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.06, ease: "back.out(2)", duration: 0.35 }, "-=0.2");
    }, wrapRef);

    // Focus first input after animation
    setTimeout(() => inputRefs.current[0]?.focus(), 700);

    return () => ctx.revert();
  }, []);

  /* ── Resend countdown timer ─────────────────────────── */
  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
  }, [startCountdown]);

  /* ── OTP input handlers ─────────────────────────────── */
  const handleChange = (index, value) => {
    // Allow only single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === 5) {
      const full = [...next].join("");
      if (full.length === 6) submitOTP(full);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) submitOTP(pasted);
  };

  /* ── Shake animation on error ───────────────────────── */
  const triggerShake = () => {
    setShake(true);
    gsap.fromTo(
      ".ov-digits-row",
      { x: -8 },
      { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)", clearProps: "x" }
    );
    setTimeout(() => setShake(false), 600);
  };

  /* ── Submit OTP ─────────────────────────────────────── */
  const submitOTP = async (code) => {
    if (loading) return;
    const otpCode = code || otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const password = sessionStorage.getItem("otpPassword") || "";
      const address = JSON.parse(sessionStorage.getItem("otpAddress") || "{}");

      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: otpCode, password, address }),
      });
      const data = await res.json();

      if (data.success) {
  sessionStorage.removeItem("otpEmail");
  sessionStorage.removeItem("otpPassword");
  sessionStorage.removeItem("otpAddress");
  localStorage.setItem("justLoggedIn", "1"); 
  setSuccess("Verified! Welcome to Noir Kitchen.");
  gsap.to(cardRef.current, {
    scale: 1.04, opacity: 0, y: -30, duration: 0.45, ease: "power2.in",
    onComplete: () => onVerified?.(data),
  });
} else {
        setError(data.message || "Invalid OTP. Please try again.");
        triggerShake();
        // Clear inputs on wrong OTP
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError("Network error. Please check your connection.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ─────────────────────────────────────── */
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError("");
    setSuccess("");
    setOtp(["", "", "", "", "", ""]);

    try {
      const res = await fetch(`${API}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("A new OTP has been sent to your email.");
        startCountdown();
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message || "Failed to resend OTP.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  /* ── Mouse tilt ─────────────────────────────────────── */
  const handleMouseMove = e => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    gsap.to(card, { rotateY: x * 5, rotateX: -y * 5, duration: 0.4, ease: "power2.out", transformPerspective: 800 });
  };
  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "elastic.out(1,0.5)" });
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 5)) + c)
    : "";

  const floatDots = [
    { top: "14%", left: "7%", size: 9, color: "#E8763A", delay: "0s" },
    { top: "30%", left: "3%", size: 5, color: "#FFB067", delay: "0.5s" },
    { top: "62%", left: "9%", size: 7, color: "#C4510A", delay: "0.9s" },
    { top: "78%", left: "4%", size: 4, color: "#E87A3A", delay: "1.4s" },
    { top: "20%", right: "5%", size: 6, color: "#FFB067", delay: "0.7s" },
    { top: "55%", right: "7%", size: 8, color: "#C4510A", delay: "1.1s" },
    { top: "82%", right: "3%", size: 4, color: "#E8763A", delay: "1.8s" },
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div ref={wrapRef} className="ov-root">

        {/* Background */}
        <img
          className="ov-bg"
          src="https://i.postimg.cc/6p7nY0n8/Background.png"
          alt="" aria-hidden
        />

        {/* Floating dots */}
        {floatDots.map((d, i) => (
          <div key={i} className="ov-dot" style={{
            top: d.top, left: d.left, right: d.right,
            width: d.size, height: d.size,
            background: d.color, animationDelay: d.delay,
          }} />
        ))}

        {/* Center wrap */}
        <div className="ov-wrap">

          {/* Brand */}
          <div className="ov-brand ov-stag">
            <img
              src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
              alt="Noir Kitchen"
              className="ov-brand-img"
            />
            <div className="ov-brand-text">
              <span className="ov-brand-noir">NOIR</span>
              <span className="ov-brand-kitchen">KITCHEN</span>
            </div>
          </div>

          {/* Card */}
          <div
            ref={cardRef}
            className="ov-card"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Pill */}
            <div className="ov-pill ov-stag">
              <FontAwesomeIcon icon={faStar} className="ov-pill-icon" />
              <span>Email Verification</span>
            </div>

            {/* Title */}
            <h1 className="ov-title ov-stag">
              Enter your<br /><em>OTP Code</em>
            </h1>

            {/* Subtitle */}
            <p className="ov-sub ov-stag">
              We sent a 6-digit code to{" "}
              <strong className="ov-email-hl">{maskedEmail}</strong>.
              It expires in 10 minutes.
            </p>

            <div className="ov-divider ov-stag" />

            {/* OTP Digits */}
            <div className="ov-digits-row ov-stag" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className={`ov-digit${digit ? " filled" : ""}${shake ? " shake" : ""}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  disabled={loading}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            {/* Error / Success */}
            {error && <p className="ov-error   ov-stag">{error}</p>}
            {success && <p className="ov-success ov-stag">{success}</p>}

            {/* Submit */}
            <button
              className={`ov-submit ov-stag${loading ? " loading" : ""}`}
              disabled={loading || otp.join("").length < 6}
              onClick={() => submitOTP()}
              type="button"
            >
              {loading ? (
                <span className="ov-spinner" />
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ov-arrow" />
                </>
              )}
            </button>

            {/* Resend */}
            <div className="ov-resend-row ov-stag">
              {countdown > 0 ? (
                <p className="ov-resend-info">
                  Resend code in{" "}
                  <strong className="ov-countdown">
                    {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                    {String(countdown % 60).padStart(2, "0")}
                  </strong>
                </p>
              ) : (
                <button
                  className={`ov-resend-btn${resending ? " loading" : ""}`}
                  onClick={handleResend}
                  disabled={resending}
                  type="button"
                >
                  {resending ? (
                    <span className="ov-spinner-sm" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faRotateRight} className="ov-resend-icon" />
                      Resend Code
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Back */}
            <button
              className="ov-back ov-stag"
              onClick={() => onBack?.()}
              type="button"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="ov-back-icon" />
              Back
            </button>
          </div>

          {/* Footer */}
          <p className="ov-footer ov-stag">
            © {new Date().getFullYear()} Noir Kitchen. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Root ───────────────────────────────────────── */
        .ov-root {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
        }

        /* ── Background ─────────────────────────────────── */
        .ov-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; z-index: 0;
          opacity: 0; pointer-events: none;
        }

        /* ── Floating dots ───────────────────────────────── */
        .ov-dot {
          position: absolute; border-radius: 50%;
          opacity: 0.6; z-index: 1;
          animation: ovFloat 3.2s ease-in-out infinite;
        }
        @keyframes ovFloat {
          0%,100% { transform: translateY(0); opacity: 0.6; }
          50%      { transform: translateY(-12px); opacity: 1; }
        }

        /* ── Center wrap ────────────────────────────────── */
        .ov-wrap {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
          width: 100%; max-width: 460px;
          padding: 24px 20px;
        }

        /* ── Brand ──────────────────────────────────────── */
        .ov-brand {
          display: flex; align-items: center; gap: 14px;
          opacity: 0;
        }
        .ov-brand-img { height: 52px; width: auto; object-fit: contain; }
        .ov-brand-text { display: flex; flex-direction: column; gap: 1px; }
        .ov-brand-noir {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 900;
          color: #1A1A1A; letter-spacing: 0.06em; line-height: 1;
        }
        .ov-brand-kitchen {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 900;
          color: #C4510A; letter-spacing: 0.06em; line-height: 1;
        }

        /* ── Card ───────────────────────────────────────── */
        .ov-card {
          width: 100%;
          background: rgba(255,255,255,0.15);
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
        .ov-pill {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(196,81,10,0.08);
          border: 0.5px solid #C4510A;
          border-radius: 50px; padding: 6px 14px;
          margin-bottom: 18px; opacity: 0;
        }
        .ov-pill span {
          font-size: 11px; font-weight: 700;
          color: #C4510A; letter-spacing: 1.2px; text-transform: uppercase;
        }
        .ov-pill-icon { color: #C4510A; font-size: 10px; }

        /* ── Title ──────────────────────────────────────── */
        .ov-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(30px, 4vw, 44px);
          font-weight: 600; color: #1A1A1A;
          letter-spacing: -0.01em; line-height: 1.1;
          margin-bottom: 12px; opacity: 0;
        }
        .ov-title em { font-style: italic; color: #C4510A; }

        /* ── Subtitle ───────────────────────────────────── */
        .ov-sub {
          font-size: 14px; color: #6B6560;
          line-height: 1.75; margin-bottom: 4px; opacity: 0;
        }
        .ov-email-hl { color: #C4510A; font-weight: 700; }

        /* ── Divider ────────────────────────────────────── */
        .ov-divider {
          width: 48px; height: 2px;
          background: linear-gradient(to right, #C4510A, #E8763A);
          border-radius: 2px; margin: 20px 0; opacity: 0;
        }

        /* ── Digits row ─────────────────────────────────── */
        .ov-digits-row {
          display: flex; gap: 10px; justify-content: center;
          margin-bottom: 20px; opacity: 0;
        }

        /* ── Single digit input ─────────────────────────── */
        .ov-digit {
          width: 52px; height: 62px;
          border: 2px solid rgba(196,81,10,0.2);
          border-radius: 14px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 700;
          color: #1A1A1A; text-align: center;
          outline: none; cursor: text;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
          caret-color: #C4510A;
        }
        .ov-digit:focus {
          border-color: #C4510A;
          background: rgba(255,255,255,0.3);
          box-shadow: 0 0 0 3px rgba(196,81,10,0.12);
          transform: translateY(-2px) scale(1.04);
        }
        .ov-digit.filled {
          border-color: rgba(196,81,10,0.5);
          background: rgba(255,255,255,0.28);
        }
        .ov-digit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Error / Success ────────────────────────────── */
        .ov-error {
          font-size: 12px; color: #d94f0a; font-weight: 500;
          background: rgba(217,79,10,0.08);
          border: 1px solid rgba(217,79,10,0.22);
          border-radius: 8px; padding: 8px 14px;
          margin-bottom: 16px; opacity: 0; text-align: center;
        }
        .ov-success {
          font-size: 12px; color: #2a7a2a; font-weight: 600;
          background: rgba(42,122,42,0.07);
          border: 1px solid rgba(42,122,42,0.2);
          border-radius: 8px; padding: 8px 14px;
          margin-bottom: 16px; opacity: 0; text-align: center;
        }

        /* ── Submit ─────────────────────────────────────── */
        .ov-submit {
          width: 100%; border: none; cursor: pointer;
          background: linear-gradient(135deg,#C4510A,#E8763A);
          color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
          padding: 14px 28px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 24px rgba(196,81,10,0.3);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          margin-bottom: 16px; min-height: 50px; opacity: 0;
        }
        .ov-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(196,81,10,0.4);
        }
        .ov-submit:disabled { opacity: 0.5 !important; cursor: not-allowed; transform: none; }
        .ov-submit.loading  { opacity: 0.8 !important; cursor: not-allowed; }
        .ov-arrow { transition: transform 0.25s; }
        .ov-submit:hover:not(:disabled) .ov-arrow { transform: translateX(4px); }

        /* ── Spinners ───────────────────────────────────── */
        .ov-spinner {
          display: inline-block; width: 20px; height: 20px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%;
          animation: ovSpin 0.7s linear infinite;
        }
        .ov-spinner-sm {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(196,81,10,0.3);
          border-top-color: #C4510A; border-radius: 50%;
          animation: ovSpin 0.7s linear infinite;
        }
        @keyframes ovSpin { to { transform: rotate(360deg); } }

        /* ── Resend row ─────────────────────────────────── */
        .ov-resend-row {
          text-align: center; margin-bottom: 14px; opacity: 0;
        }
        .ov-resend-info {
          font-size: 13px; color: #7a716b;
        }
        .ov-countdown { color: #C4510A; font-variant-numeric: tabular-nums; }

        .ov-resend-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: none; border: none; cursor: pointer;
          color: #C4510A; font-size: 13px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 6px 0; transition: opacity 0.2s;
        }
        .ov-resend-btn:hover:not(:disabled) { opacity: 0.75; }
        .ov-resend-btn:disabled { cursor: not-allowed; opacity: 0.5; }
        .ov-resend-icon { font-size: 12px; }

        /* ── Back ───────────────────────────────────────── */
        .ov-back {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; background: transparent;
          border: 1.5px solid rgba(196,81,10,0.22);
          border-radius: 14px; padding: 11px 28px;
          font-size: 13px; font-weight: 600; color: #5a4f4a;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: border-color 0.25s, color 0.25s, background 0.25s, transform 0.2s;
          opacity: 0;
        }
        .ov-back:hover {
          border-color: #C4510A; color: #C4510A;
          background: rgba(196,81,10,0.05);
          transform: translateY(-1px);
        }
        .ov-back-icon { transition: transform 0.25s; }
        .ov-back:hover .ov-back-icon { transform: translateX(-4px); }

        /* ── Footer ─────────────────────────────────────── */
        .ov-footer {
          font-size: 11px; color: rgba(90,79,74,0.6);
          text-align: center; opacity: 0;
        }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width: 500px) {
          .ov-card { padding: 32px 20px 28px; border-radius: 22px; }
          .ov-digit { width: 44px; height: 54px; font-size: 24px; border-radius: 12px; }
          .ov-digits-row { gap: 7px; }
        }
        @media (max-width: 380px) {
          .ov-card { padding: 26px 16px 24px; }
          .ov-digit { width: 38px; height: 48px; font-size: 20px; border-radius: 10px; }
          .ov-digits-row { gap: 5px; }
          .ov-title { font-size: 26px; }
          .ov-brand-img { height: 40px; }
          .ov-brand-noir, .ov-brand-kitchen { font-size: 18px; }
        }
      `}</style>
    </>
  );
}