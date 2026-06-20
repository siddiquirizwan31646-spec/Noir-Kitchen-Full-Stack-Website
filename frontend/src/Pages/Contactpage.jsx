// src/Pages/ContactPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navbar from "../component/ui/Navbar";
import {
  faPhone,
  faLocationDot,
  faClock,
  faEnvelope,
  faArrowRight,
  faCheckCircle,
  faExclamationCircle,
  faSpinner,
  faMotorcycle,
  faUtensils,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram as faInstagramBrand,
  faFacebook as faFacebookBrand,
  faXTwitter,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const INFO_CARDS = [
  {
    icon: faPhone,
    title: "Call Us",
    lines: ["+91 45451 45455", "+91 89841 15454"],
    sub: "Mon – Sun, 11 AM – 11 PM",
  },
  {
    icon: faEnvelope,
    title: "Email Us",
    lines: ["hello@noirkitchen.in", "reservations@noirkitchen.in"],
    sub: "We reply within 2 hours",
  },
  {
    icon: faLocationDot,
    title: "Find Us",
    lines: ["12, Amber Fort Road", "Jaipur, Rajasthan 302001"],
    sub: "Open for dine-in & delivery",
  },
  {
    icon: faClock,
    title: "Hours",
    lines: ["Mon – Thu: 11 AM – 10 PM", "Fri – Sun: 11 AM – 11 PM"],
    sub: "Last order 30 min before close",
  },
];

const SOCIAL_LINKS = [
  { icon: faInstagramBrand, label: "Instagram", href: "https://www.instagram.com/", color: "#E1306C" },
  { icon: faFacebookBrand,  label: "Facebook",  href: "https://www.facebook.com/", color: "#1877F2" },
  { icon: faXTwitter,       label: "X / Twitter", href: "https://x.com/home", color: "#1A1A1A" },
  { icon: faWhatsapp,       label: "WhatsApp",  href: "https://web.whatsapp.com/", color: "#25D366" },
];

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function ContactPage({ user, onLogout, cart }) {
  const navigate  = useNavigate();
  const pageRef   = useRef(null);

  /* form state */
  const [form, setForm]           = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus]       = useState(null); // {type, msg}

  const userName = user?.name || user?.email?.split("@")[0] || "";

  /* pre-fill name/email from user */
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name:  user.name  || user.email?.split("@")[0] || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  /* ── GSAP entrance + scroll animations ── */
  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {

      /* Hero */
      gsap.fromTo(".ct-hero-pill",
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", delay: 0.15 });
      gsap.fromTo(".ct-hero-h1 span",
        { y: -40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)", stagger: 0.1, delay: 0.25 });
      gsap.fromTo(".ct-hero-sub",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 0.55 });

      /* Info cards */
      gsap.fromTo(".ct-info-card",
        { y: 50, opacity: 0, scale: 0.93 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.55, ease: "back.out(1.5)", stagger: 0.1,
          scrollTrigger: { trigger: ".ct-info-row", start: "top 85%" },
        });

      /* Form card */
      gsap.fromTo(".ct-form-card",
        { x: -50, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: ".ct-split", start: "top 82%" },
        });

      /* Map card */
      gsap.fromTo(".ct-map-card",
        { x: 50, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.1,
          scrollTrigger: { trigger: ".ct-split", start: "top 82%" },
        });

      /* Social strip */
      gsap.fromTo(".ct-social-item",
        { scale: 0.6, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)", stagger: 0.08,
          scrollTrigger: { trigger: ".ct-social-strip", start: "top 90%" },
        });

      /* Footer tagline */
      gsap.fromTo(".ct-footer-line",
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5,
          scrollTrigger: { trigger: ".ct-footer-bar", start: "top 95%" },
        });

    }, pageRef);
    return () => ctx.revert();
  }, []);

  /* ── form submit (mock — wire to your API) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())    { setStatus({ type: "error", msg: "Please enter your name." }); return; }
    if (!form.email.trim())   { setStatus({ type: "error", msg: "Please enter your email." }); return; }
    if (!form.message.trim() || form.message.trim().length < 10) {
      setStatus({ type: "error", msg: "Message must be at least 10 characters." }); return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      /* Replace with your real API call */
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const res = await fetch(`${API}/api/contact`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name:    form.name,
    email:   form.email,
    subject: form.subject,
    message: form.message,
  }),
});
const data = await res.json();
if (!data.success) throw new Error(data.error);
      setStatus({ type: "success", msg: "Message sent! We'll get back to you soon." });
      setForm(f => ({ ...f, subject: "", message: "" }));
    } catch {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div ref={pageRef} className="ct-root">

        {/* ── Full-page background ── */}
        <img
          src="https://i.postimg.cc/Mpctm9rd/Chat-GPT-Image-Jun-11-2026-05-25-34-PM.png"
          alt="" aria-hidden
          style={{
            position: "fixed", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", zIndex: 0, pointerEvents: "none",
          }}
        />

        {/* ── Navbar ── */}
        <Navbar
          user={user}
          onLogout={onLogout || (() => { localStorage.removeItem("token"); navigate("/"); })}
          activeNav="Contact"
          setActiveNav={() => {}}
          cart={cart}
        />

        {/* ══════════ HERO ══════════ */}
        <section className="ct-hero">
          <div className="ct-hero-content">
            <div className="ct-hero-pill">
              <FontAwesomeIcon icon={faUtensils} style={{ color: "#C4510A", fontSize: 11 }} />
              <span>We'd Love to Hear From You</span>
            </div>
            <h1 className="ct-hero-h1">
              <span>Let's Start a</span>
              <span style={{ fontStyle: "italic", color: "#C4510A" }}>Conversation</span>
            </h1>
            <p className="ct-hero-sub">
              Reservations, feedback, or just a hello — we're always at the table.
            </p>
          </div>
        </section>

        {/* ══════════ INFO CARDS ══════════ */}
        <section className="ct-info-section">
          <div className="ct-info-row">
            {INFO_CARDS.map((card) => (
              <div key={card.title} className="ct-info-card">
                <div className="ct-info-icon-wrap">
                  <FontAwesomeIcon icon={card.icon} className="ct-info-icon" />
                </div>
                <p className="ct-info-title">{card.title}</p>
                {card.lines.map(l => (
                  <p key={l} className="ct-info-line">{l}</p>
                ))}
                <p className="ct-info-sub">{card.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ FORM + MAP SPLIT ══════════ */}
        <section className="ct-split">

          {/* Form */}
          <div className="ct-form-card">
            <div className="ct-form-top">
              <p className="ct-eyebrow">SEND A MESSAGE <span className="ct-ornament">✦</span></p>
              <h2 className="ct-form-title">
                Drop Us a <em>Note</em>
              </h2>
              {userName && (
                <p className="ct-form-subtitle">
                  Sending as <strong>{userName}</strong>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="ct-field-row">
                <div className="ct-field">
                  <label className="ct-label">Name <span className="ct-req">*</span></label>
                  <input
                    className="ct-input"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={set("name")}
                  />
                </div>
                <div className="ct-field">
                  <label className="ct-label">Email <span className="ct-req">*</span></label>
                  <input
                    className="ct-input"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={set("email")}
                  />
                </div>
              </div>

              <div className="ct-field">
                <label className="ct-label">Subject</label>
                <input
                  className="ct-input"
                  type="text"
                  placeholder="Table reservation, feedback…"
                  value={form.subject}
                  onChange={set("subject")}
                />
              </div>

              <div className="ct-field">
                <label className="ct-label" style={{ justifyContent: "space-between" }}>
                  <span>Message <span className="ct-req">*</span></span>
                  <span className="ct-char">{form.message.length}/800</span>
                </label>
                <textarea
                  className="ct-textarea"
                  rows={5}
                  placeholder="Tell us anything — we're listening…"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value.slice(0, 800) }))}
                />
              </div>

              {status && (
                <div className={`ct-status ct-status-${status.type}`}>
                  <FontAwesomeIcon icon={status.type === "success" ? faCheckCircle : faExclamationCircle} />
                  <span>{status.msg}</span>
                </div>
              )}

              <button type="submit" className="ct-submit" disabled={submitting}>
                {submitting
                  ? <><FontAwesomeIcon icon={faSpinner} spin /> Sending…</>
                  : <><FontAwesomeIcon icon={faPaperPlane} /> Send Message</>
                }
              </button>
            </form>
          </div>

          {/* Map + hours */}
          <div className="ct-map-card">
            <div className="ct-map-embed">
  <iframe
    title="Noir Kitchen Location"
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4070.8412060573346!2d75.78047081140839!3d26.942316958719456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db3bf8c2e248f%3A0x3f49c0fe7433cb3c!2sBlock%20B%2C%20Sanjay%20Colony%2C%20Nehru%20Nagar%2C%20Jaipur%2C%20Rajasthan%20302016!5e1!3m2!1sen!2sin!4v1781953014951!5m2!1sen!2sin"
    width="100%"
    height="100%"
    style={{ border: 0, display: "block" }}
    allowFullScreen=""
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  />
</div>
<a
href="https://www.google.com/maps/dir/?api=1&destination=26.943000808500063, 75.782729231218"
  target="_blank"
  rel="noopener noreferrer"
  className="ct-directions-btn"
  style={{color:"#0812da", fontWeight:"bolder", textDecoration:"none"}}
>
  <FontAwesomeIcon icon={faLocationDot} style={{color:"#af5519"}}/> Get Directions
</a>

            <div className="ct-map-info">
              <div className="ct-map-info-item">
                <FontAwesomeIcon icon={faLocationDot} className="ct-map-info-icon" />
                <div>
                  <p className="ct-map-info-title">12, Amber Fort Road</p>
                  <p className="ct-map-info-sub">Jaipur, Rajasthan 302001, India</p>
                </div>
              </div>
              <div className="ct-map-info-item">
                <FontAwesomeIcon icon={faMotorcycle} className="ct-map-info-icon" />
                <div>
                  <p className="ct-map-info-title">Fast Delivery Available</p>
                  <p className="ct-map-info-sub">Order online — delivered to your doorstep</p>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ══════════ SOCIAL STRIP ══════════ */}
        <section className="ct-social-strip">
          <p className="ct-eyebrow" style={{ justifyContent: "center", marginBottom: 20 }}>
            FOLLOW OUR JOURNEY <span className="ct-ornament">✦</span>
          </p>
          <div className="ct-social-row">
            {SOCIAL_LINKS.map(s => (
              <a key={s.label} href={s.href} className="ct-social-item" aria-label={s.label}>
                <div className="ct-social-icon-wrap" style={{ "--social-color": s.color }}>
                  <FontAwesomeIcon icon={s.icon} className="ct-social-icon" />
                </div>
                <span className="ct-social-label">{s.label}</span>
              </a>
            ))}
          </div>
        </section>

        {/* ══════════ FOOTER BAR ══════════ */}
        <footer className="ct-footer-bar">
          <p className="ct-footer-line">
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "#C4510A" }}>
              Noir Kitchen
            </span>
            &nbsp;·&nbsp; 12, Amber Fort Road, Jaipur &nbsp;·&nbsp; +91 99885 44548
            &nbsp;·&nbsp; hello@noirkitchen.in
          </p>
          <p className="ct-footer-line" style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
            © {new Date().getFullYear()} Noir Kitchen. All rights reserved.
          </p>
        </footer>

      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── ROOT ── */
        .ct-root {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
        }

        /* ── HERO ── */
        .ct-hero {
          position: relative;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .ct-hero-content {
          text-align: center;
          padding: 0 24px;
          position: relative;
          z-index: 2;
        }
        .ct-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(196,81,10,0.3);
          border-radius: 50px;
          padding: 6px 18px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #C4510A;
          margin-bottom: 20px;
        }
        .ct-hero-h1 {
          display: flex;
          flex-direction: column;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(38px, 5vw, 64px);
          font-weight: 600;
          line-height: 1.08;
          color: #1A1A1A;
          letter-spacing: -0.01em;
          gap: 2px;
        }
        .ct-hero-sub {
          margin-top: 14px;
          font-size: 14px;
          color: #6B6560;
          line-height: 1.65;
        }

        /* ── SHARED ── */
        .ct-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #C4510A;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ct-ornament { font-size: 13px; }
        .ct-req      { color: #C4510A; }
        .ct-char     { font-size: 11px; font-weight: 400; color: #9CA3AF; text-transform: none; letter-spacing: 0; }

        /* ── INFO CARDS ── */
        .ct-info-section {
          position: relative;
          z-index: 1;
          padding: 0 48px 48px;
        }
        .ct-info-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .ct-info-card {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.4);
          border-top: 1px solid rgba(255,255,255,0.6);
          border-left: 1px solid rgba(255,255,255,0.45);
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow:
            0 8px 32px rgba(196,81,10,0.07),
            0 2px 8px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.65);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .ct-info-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow:
            0 16px 40px rgba(196,81,10,0.14),
            inset 0 1px 0 rgba(255,255,255,0.7);
        }
        .ct-info-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(196,81,10,0.09);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
          transition: background 0.2s, transform 0.2s;
        }
        .ct-info-card:hover .ct-info-icon-wrap {
          background: rgba(196,81,10,0.18);
          transform: scale(1.1);
        }
        .ct-info-icon  { color: #C4510A; font-size: 18px; }
        .ct-info-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
        .ct-info-line  { font-size: 13px; color: #3D3530; font-weight: 500; line-height: 1.6; }
        .ct-info-sub   { font-size: 11px; color: #9CA3AF; margin-top: 8px; line-height: 1.5; }

        /* ── SPLIT: FORM + MAP ── */
        .ct-split {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 48px 56px;
        }

        /* ── FORM CARD ── */
        .ct-form-card {
          background: rgba(255,255,255,0.16);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.45);
          border-top: 1px solid rgba(255,255,255,0.65);
          border-left: 1px solid rgba(255,255,255,0.5);
          border-radius: 24px;
          padding: 36px 40px;
          box-shadow:
            0 12px 48px rgba(196,81,10,0.1),
            0 4px 16px rgba(0,0,0,0.06),
            inset 0 1px 0 rgba(255,255,255,0.7);
        }
        .ct-form-top    { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid rgba(196,81,10,0.1); }
        .ct-form-title  { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 600; color: #1A1A1A; }
        .ct-form-title em { font-style: italic; color: #C4510A; }
        .ct-form-subtitle { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
        .ct-form-subtitle strong { color: #C4510A; font-weight: 600; }

        .ct-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ct-field     { margin-bottom: 18px; }
        .ct-label     {
          display: flex; align-items: center;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #6B6560; margin-bottom: 8px;
        }
        .ct-input, .ct-textarea {
          width: 100%;
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1.5px solid rgba(196,81,10,0.2);
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .ct-textarea { resize: vertical; min-height: 120px; line-height: 1.65; }
        .ct-input::placeholder, .ct-textarea::placeholder { color: #C5B8B0; }
        .ct-input:focus, .ct-textarea:focus {
          border-color: #C4510A;
          background: rgba(255,255,255,0.65);
          box-shadow: 0 0 0 3px rgba(196,81,10,0.08);
        }
        .ct-status {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 600; margin-bottom: 18px;
        }
        .ct-status-success { background: rgba(5,150,105,0.1); border: 1px solid rgba(5,150,105,0.25); color: #065F46; }
        .ct-status-error   { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2);  color: #991B1B; }
        .ct-submit {
          width: 100%;
          background: linear-gradient(135deg, #C4510A, #E8763A);
          color: #fff; border: none;
          padding: 14px 28px; border-radius: 50px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 24px rgba(196,81,10,0.3);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          letter-spacing: 0.03em;
        }
        .ct-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(196,81,10,0.42); }
        .ct-submit:disabled             { opacity: 0.65; cursor: not-allowed; transform: none; }

        /* ── MAP CARD ── */
        .ct-map-card {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(22px) saturate(160%);
          -webkit-backdrop-filter: blur(22px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.4);
          border-top: 1px solid rgba(255,255,255,0.6);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 12px 40px rgba(196,81,10,0.08),
            inset 0 1px 0 rgba(255,255,255,0.6);
          display: flex; flex-direction: column;
        }
        .ct-map-embed {
          flex: 1;
          min-height: 280px;
          border-bottom: 1px solid rgba(196,81,10,0.1);
          overflow: hidden;
        }
        .ct-map-embed iframe { width: 100%; height: 100%; min-height: 280px; display: block; }
        .ct-map-info { padding: 24px 28px; display: flex; flex-direction: column; gap: 14px; }
        .ct-map-info-item {
          display: flex; align-items: flex-start; gap: 14px;
        }
        .ct-map-info-icon  { color: #C4510A; font-size: 16px; margin-top: 2px; flex-shrink: 0; }
        .ct-map-info-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 2px; }
        .ct-map-info-sub   { font-size: 12px; color: #6B6560; line-height: 1.5; }

        /* ── SOCIAL STRIP ── */
        .ct-social-strip {
          position: relative; z-index: 1;
          padding: 40px 48px 48px;
          text-align: center;
          border-top: 1px solid rgba(196,81,10,0.08);
        }
        .ct-social-row {
          display: flex; align-items: center; justify-content: center;
          gap: 20px; flex-wrap: wrap;
        }
        .ct-social-item {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          text-decoration: none; cursor: pointer;
        }
        .ct-social-icon-wrap {
          width: 56px; height: 56px; border-radius: 18px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.45);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; color: var(--social-color, #1A1A1A);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, background 0.2s;
        }
        .ct-social-item:hover .ct-social-icon-wrap {
          transform: translateY(-4px) scale(1.1);
          background: rgba(255,255,255,0.3);
          box-shadow: 0 10px 28px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
        }
        .ct-social-label { font-size: 11px; font-weight: 600; color: #6B6560; letter-spacing: 0.05em; text-transform: uppercase; }

        /* ── FOOTER BAR ── */
        .ct-footer-bar {
          position: relative; z-index: 1;
          background: rgba(255,252,248,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(196,81,10,0.12);
          padding: 24px 48px;
          text-align: center;
        }
        .ct-footer-line { font-size: 13px; color: #6B6560; line-height: 1.7; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .ct-info-row  { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 900px) {
          .ct-split     { grid-template-columns: 1fr; padding: 0 24px 48px; }
          .ct-info-section { padding: 0 24px 40px; }
          .ct-social-strip { padding: 36px 24px 40px; }
          .ct-footer-bar   { padding: 20px 24px; }
        }
        @media (max-width: 640px) {
          .ct-hero      { height: 240px; }
          .ct-hero-h1   { font-size: 34px; }
          .ct-info-row  { grid-template-columns: 1fr 1fr; gap: 12px; }
          .ct-info-section { padding: 0 16px 32px; }
          .ct-form-card { padding: 24px 18px; border-radius: 18px; }
          .ct-field-row { grid-template-columns: 1fr; }
          .ct-split     { padding: 0 16px 40px; }
        }
        @media (max-width: 420px) {
          .ct-info-row  { grid-template-columns: 1fr; }
          .ct-hero-h1   { font-size: 28px; }
          .ct-social-row { gap: 14px; }
        }
      `}</style>
    </>
  );
}