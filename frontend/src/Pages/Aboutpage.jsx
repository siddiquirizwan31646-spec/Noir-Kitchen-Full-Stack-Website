// src/Pages/AboutPage.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";
import {
  faUtensils, faLeaf, faStar, faMedal, faUser, faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF, faInstagram, faTwitter, faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CHEFS = [
  {
    name: "Chef Marco Laurent",
    role: "Executive Chef & Founder",
    tagline: '"Every dish is a story waiting to be tasted."',
    story: "With over 15 years crafting Michelin-starred experiences across Paris and Mumbai, Marco brings the soul of French classical technique to Noir Kitchen.",
    img: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=85",
    badge: "https://i.postimg.cc/jS9S94QM/Chat-GPT-Image-Jun-11-2026-06-31-54-PM.png",
  },
  {
    name: "Chef Priya Nair",
    role: "Head of Pastry & Desserts",
    tagline: '"Sweetness is an art form, not an afterthought."',
    story: "Trained at Le Cordon Bleu and deeply rooted in South Indian spice traditions, Priya's desserts blur the line between memory and imagination.",
    img: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=600&q=85",
    badge: "https://i.postimg.cc/6p7nY0n8/Background.png",
  },
  {
    name: "Chef Arjun Mehta",
    role: "Chef de Cuisine",
    tagline: '"Fire, spice, and the courage to experiment."',
    story: "Arjun spent a decade in Tokyo mastering umami, then returned to India to fuse that precision with bold Rajasthani flavors.",
    img: "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=600&q=85",
    badge: "https://i.postimg.cc/vZXW6kyg/Chat-GPT-Image-Jun-11-2026-06-29-31-PM.png",
  },
];

const TIMELINE = [
  { year: "2010", title: "The Beginning",     sub: "A small kitchen with big dreams."                      },
  { year: "2014", title: "Growing Together",  sub: "Loved by locals, recommended by hearts."              },
  { year: "2017", title: "Expanding Flavors", sub: "New dishes, new experiences, same soul."              },
  { year: "2021", title: "A Family of Food",  sub: "More than a restaurant, it became a family."         },
  { year: "Today","title": "Still Cooking",   sub: "Still passionate. Still yours."                       },
];

export default function MainHome({ user, onLogout, cart }) {
  const navigate = useNavigate();
  const rootRef  = useRef();

  const handleLogout = () => {
    localStorage.removeItem("token");
    onLogout?.();
    navigate("/");
  };

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      const st = (trigger, start = "top 82%") => ({ trigger, start });
      gsap.fromTo(".ab-story-left",  { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: st(".ab-story-grid") });
      gsap.fromTo(".ab-story-right", { x:  50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: st(".ab-story-grid") });
      gsap.fromTo(".ab-tl-item",     { y:  30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, scrollTrigger: st(".ab-timeline") });
      gsap.fromTo(".ab-philosophy",  { y:  40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, scrollTrigger: st(".ab-philosophy") });
      gsap.fromTo(".ab-chef-card",   { y:  50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.14, ease: "back.out(1.4)", scrollTrigger: st(".ab-chefs-grid") });
      gsap.fromTo(".ab-unity",       { y:  40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, scrollTrigger: st(".ab-unity") });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div ref={rootRef} className="ab-root">
        <div style={{ position: "relative", paddingTop: "32px" }}>
    <CouponTicker />
        <Navbar user={user} onLogout={handleLogout} activeNav="About" cart={cart} setActiveNav={() => {}} />
  </div>
    

        {/* ══ SECTION 1 — OUR STORY ══ */}
        <section className="ab-section ab-story-section">
          <div className="ab-story-grid">

            <div className="ab-story-left">
              <p className="ab-eyebrow">OUR STORY <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 10 }} /></p>
              <h2 className="ab-display">
                A Story<br />Seasoned with<br /><em>Passion</em>
              </h2>
              <p className="ab-body-sm">
                Noir Kitchen was born from a simple belief — that great food brings people together.
              </p>
              <p className="ab-body-sm" style={{ marginTop: 10 }}>
                From a humble beginning to a place where memories are made over meals, our journey has been filled with passion, people, and the pursuit of perfection.
              </p>
              <div className="ab-signature">Rizwan Siddiqui</div>
              <p className="ab-sig-role">Founder, Noir Kitchen</p>
            </div>

            <div className="ab-story-right">
              <div className="ab-story-imgs">
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=85"
                  alt="Restaurant interior"
                  className="ab-story-img-main"
                />
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=85"
                  alt="Restaurant entrance"
                  className="ab-story-img-sm"
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="ab-timeline">
            <p className="ab-eyebrow" style={{ justifyContent: "center", marginBottom: 28 }}>
              OUR JOURNEY <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 10 }} />
            </p>
            <div className="ab-tl-track">
              {TIMELINE.map((t, i) => (
                <div key={t.year} className="ab-tl-item">
                  <div className="ab-tl-icon">
                    <FontAwesomeIcon icon={[faUtensils, faLeaf, faStar, faUser, faMedal][i]} />
                  </div>
                  <div className="ab-tl-dot" />
                  <div className="ab-tl-year">{t.year}</div>
                  <div className="ab-tl-title">{t.title}</div>
                  <div className="ab-tl-sub">{t.sub}</div>
                </div>
              ))}
              <div className="ab-tl-line" />
            </div>
          </div>
        </section>

        {/* ══ SECTION 2 — PHILOSOPHY ══ */}
        <section className="ab-philosophy">
          <div className="ab-philosophy-inner">
            <div className="ab-philosophy-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=700&q=85"
                alt="Chef cooking"
                className="ab-philosophy-img"
              />
            </div>
            <div className="ab-philosophy-text">
              <p className="ab-eyebrow">OUR PHILOSOPHY <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 10 }} /></p>
              <h2 className="ab-display" style={{ fontSize: "clamp(26px,3.5vw,50px)" }}>
                Food is not just<br />what we do, it's<br /><em>who we are.</em>
              </h2>
              <p className="ab-body-sm" style={{ marginTop: 18 }}>
                We believe in honest ingredients, authentic techniques, and creating experiences that stay with you long after the last bite.
              </p>
            </div>
          </div>
        </section>

        {/* ══ SECTION 3 — CHEFS ══ */}
        <section className="ab-section ab-chefs-section">
          <div className="ab-chefs-header">
            <p className="ab-eyebrow" style={{ justifyContent: "center" }}>
              OUR CHEFS <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 10 }} />
            </p>
            <h2 className="ab-display" style={{ textAlign: "center" }}>
              Crafted by Experts,<br />Perfected with <em>Passion</em>
            </h2>
            <p className="ab-body-sm" style={{ textAlign: "center", maxWidth: 480, margin: "14px auto 0" }}>
              Behind every dish is a chef with a story, a journey, and a love for ingredients that speak for themselves.
            </p>
          </div>

          <div className="ab-chefs-grid">
            {CHEFS.map((chef) => (
              <div key={chef.name} className="ab-chef-card">
                <div className="ab-chef-img-wrap">
                  <img src={chef.img} alt={chef.name} className="ab-chef-img" />
                  <div className="ab-chef-badge">
                    <img src={chef.badge} alt="" className="ab-chef-badge-img" />
                  </div>
                </div>
                <div className="ab-chef-body">
                  <p className="ab-chef-role">{chef.role}</p>
                  <h3 className="ab-chef-name">{chef.name}</h3>
                  <p className="ab-chef-tagline">{chef.tagline}</p>
                  <p className="ab-chef-story">{chef.story}</p>
                  <div className="ab-chef-socials">
                    {[faFacebookF, faInstagram, faTwitter, faLinkedinIn].map((ic, i) => (
                      <span key={i} className="ab-social-btn">
                        <FontAwesomeIcon icon={ic} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Unity block */}
          <div className="ab-unity">
            <div className="ab-unity-img-wrap">
              <img
                src="https://media.istockphoto.com/id/1081422898/photo/pan-fried-duck.webp?a=1&b=1&s=612x612&w=0&k=20&c=ipUn8CsB5lf5QOZGG-58mRrdJukObnnnNRVINnxR_BY="
                alt="Kitchen team"
                className="ab-unity-img"
              />
            </div>
            <div className="ab-unity-text">
              <p className="ab-eyebrow">
                ONE KITCHEN. ONE TEAM. <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 10 }} />
              </p>
              <h2 className="ab-display" style={{ fontSize: "clamp(24px,3vw,44px)" }}>
                Three Chefs.<br />One Shared <em>Passion.</em>
              </h2>
              <p className="ab-body-sm" style={{ marginTop: 14 }}>
                Different journeys. Different strengths.<br />
                United by a single goal — to create unforgettable dining experiences for you.
              </p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── ROOT ── */
        .ab-root {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-image: url('https://i.postimg.cc/3wJnkf8q/Chat-GPT-Image-Jun-12-2026-03-13-33-PM.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          overflow-x: hidden;
        }

        /* ── TOKENS ── */
        .ab-eyebrow {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
          text-transform: uppercase; color: #C4510A; margin-bottom: 16px;
        }
        .ab-display {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 3.8vw, 54px);
          font-weight: 600; line-height: 1.1; color: #1C1714;
        }
        .ab-display em { font-style: italic; color: #C4510A; }
        .ab-body-sm { font-size: 13px; color: #6B5F58; line-height: 1.8; }

        /* ── SECTIONS ── */
        .ab-section { padding: 60px 64px; }

        /* ══ STORY ══ */
        .ab-story-section {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .ab-story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: start;
          margin-bottom: 56px;
        }
        .ab-story-left { padding-right: 20px; }
        .ab-signature {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-style: italic; color: #1C1714;
          margin-top: 28px; margin-bottom: 2px;
        }
        .ab-sig-role { font-size: 11px; color: #9A8880; font-weight: 500; letter-spacing: 0.03em; }

        .ab-story-imgs { position: relative; }
        .ab-story-img-main {
          width: 100%; height: 360px;
          object-fit: cover; border-radius: 20px; display: block;
        }
        .ab-story-img-sm {
          position: absolute;
          bottom: -28px; right: -20px;
          width: 160px; height: 140px;
          object-fit: cover; border-radius: 16px;
          border: 4px solid #FAF7F2;
          box-shadow: 0 8px 28px rgba(0,0,0,0.14);
        }

        /* ══ TIMELINE ══ */
        .ab-timeline {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px 32px 36px;
          margin-top: 48px;
        }
        .ab-tl-track {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
        }
        .ab-tl-line {
          position: absolute; top: 22px; left: 0; right: 0;
          height: 1px; background: #E0D5CE; z-index: 0;
        }
        .ab-tl-item {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          flex: 1; position: relative; z-index: 1; padding: 0 8px;
        }
        .ab-tl-icon {
          width: 44px; height: 44px; border-radius: 50%;
          background: #FAF7F2; border: 1.5px solid #E0D5CE;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #C4510A; margin-bottom: 10px;
        }
        .ab-tl-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #C4510A; margin-bottom: 12px;
        }
        .ab-tl-year {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 600; color: #1C1714; margin-bottom: 4px;
        }
        .ab-tl-title { font-size: 12px; font-weight: 700; color: #3A2F2A; margin-bottom: 4px; }
        .ab-tl-sub   { font-size: 11px; color: #9A8880; line-height: 1.5; max-width: 110px; }

        /* ══ PHILOSOPHY ══ */
        .ab-philosophy {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .ab-philosophy-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 380px;
        }
        .ab-philosophy-img-wrap { overflow: hidden; }
        .ab-philosophy-img {
          width: 100%; height: 100%; min-height: 340px;
          object-fit: cover; display: block;
          transition: transform 0.5s ease;
        }
        .ab-philosophy-img-wrap:hover .ab-philosophy-img { transform: scale(1.04); }
        .ab-philosophy-text {
          padding: 56px 60px;
          display: flex; flex-direction: column; justify-content: center;
        }

        /* ══ CHEFS ══ */
        .ab-chefs-section {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .ab-chefs-header { text-align: center; margin-bottom: 48px; }
        .ab-chefs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          margin-bottom: 56px;
        }
        .ab-chef-card {
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .ab-chef-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(196,81,10,0.1);
        }
        .ab-chef-img-wrap { position: relative; overflow: hidden; }
        .ab-chef-img {
          width: 100%; height: 260px;
          object-fit: cover; display: block;
          transition: transform 0.45s ease;
        }
        .ab-chef-card:hover .ab-chef-img { transform: scale(1.04); }
        .ab-chef-badge {
          position: absolute; bottom: -20px; right: 16px;
          width: 52px; height: 52px;
          border: 3px solid #fff; border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .ab-chef-badge-img { width: 100%; height: 100%; object-fit: cover; }
        .ab-chef-body { padding: 32px 20px 20px; }
        .ab-chef-role {
          font-size: 9.5px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: #C4510A; margin-bottom: 6px;
        }
        .ab-chef-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 600; color: #1C1714;
          margin-bottom: 10px; line-height: 1.2;
        }
        .ab-chef-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px; font-style: italic; color: #C4510A;
          line-height: 1.6; margin-bottom: 12px;
        }
        .ab-chef-story {
          font-size: 12.5px; color: #6B5F58; line-height: 1.75; margin-bottom: 18px;
        }
        .ab-chef-socials { display: flex; gap: 10px; flex-wrap: wrap; }
        .ab-social-btn {
          width: 30px; height: 30px; border-radius: 50%;
          border: 1px solid #E0D5CE;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: #9A8880; cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .ab-social-btn:hover { background: #C4510A; color: #fff; border-color: #C4510A; }

        /* ══ UNITY ══ */
        .ab-unity {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          align-items: center;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 24px;
          overflow: hidden;
        }
        .ab-unity-img-wrap { overflow: hidden; }
        .ab-unity-img {
          width: 100%; height: 340px;
          object-fit: cover; display: block;
          transition: transform 0.5s ease;
        }
        .ab-unity-img-wrap:hover .ab-unity-img { transform: scale(1.04); }
        .ab-unity-text { padding: 40px 48px; }

        /* ══════════════════════════
           RESPONSIVE BREAKPOINTS
        ══════════════════════════ */

        /* ── 1100px — tighten desktop ── */
        @media (max-width: 1100px) {
          .ab-section { padding: 52px 40px; }
          .ab-story-grid { gap: 40px; }
          .ab-philosophy-text { padding: 40px 40px; }
          .ab-unity-text { padding: 32px 36px; }
        }

        /* ── 900px — tablet landscape ── */
        @media (max-width: 900px) {
          .ab-section { padding: 40px 28px; }

          /* story */
          .ab-story-grid {
            grid-template-columns: 1fr;
            gap: 36px;
            margin-bottom: 40px;
          }
          .ab-story-left { padding-right: 0; }
          .ab-story-img-main { height: 280px; }
          .ab-story-img-sm {
            width: 120px; height: 110px;
            bottom: -18px; right: -10px;
          }

          /* timeline */
          .ab-timeline { padding: 32px 20px 28px; margin-top: 36px; }
          .ab-tl-track { flex-wrap: wrap; gap: 24px 16px; justify-content: center; }
          .ab-tl-line { display: none; }
          .ab-tl-item { flex: 0 0 calc(33.33% - 12px); min-width: 120px; }

          /* philosophy */
          .ab-philosophy-inner { grid-template-columns: 1fr; }
          .ab-philosophy-img { min-height: 240px; height: 240px; }
          .ab-philosophy-text { padding: 36px 28px; }

          /* chefs */
          .ab-chefs-grid { grid-template-columns: 1fr 1fr; gap: 18px; }

          /* unity */
          .ab-unity { grid-template-columns: 1fr; }
          .ab-unity-img { height: 240px; }
          .ab-unity-text { padding: 28px 28px 36px; }
        }

        /* ── 680px — tablet portrait ── */
        @media (max-width: 680px) {
          .ab-section { padding: 32px 18px; }

          /* story */
          .ab-story-grid { gap: 28px; margin-bottom: 32px; }
          .ab-story-img-main { height: 220px; }
          .ab-story-img-sm { display: none; }
          .ab-signature { font-size: 22px; }

          /* timeline — 2 columns */
          .ab-tl-track { gap: 20px 12px; }
          .ab-tl-item { flex: 0 0 calc(50% - 8px); }
          .ab-tl-icon { width: 38px; height: 38px; font-size: 14px; }
          .ab-tl-year { font-size: 18px; }

          /* chefs — single column */
          .ab-chefs-grid { grid-template-columns: 1fr; gap: 20px; }
          .ab-chef-img { height: 240px; }

          /* unity */
          .ab-unity-img { height: 200px; }
          .ab-unity-text { padding: 24px 20px 28px; }

          /* philosophy */
          .ab-philosophy-text { padding: 28px 20px; }
        }

        /* ── 480px — mobile ── */
        @media (max-width: 480px) {
          .ab-section { padding: 28px 14px; }

          .ab-display { font-size: clamp(24px, 7.5vw, 36px); }
          .ab-body-sm { font-size: 12.5px; }

          /* story */
          .ab-story-img-main { height: 190px; border-radius: 14px; }
          .ab-signature { font-size: 20px; margin-top: 20px; }

          /* timeline — single column */
          .ab-timeline { padding: 24px 14px 22px; border-radius: 14px; }
          .ab-tl-item { flex: 0 0 100%; flex-direction: row; text-align: left; gap: 14px; padding: 0; align-items: flex-start; }
          .ab-tl-dot { display: none; }
          .ab-tl-icon { flex-shrink: 0; margin-bottom: 0; }
          .ab-tl-sub { max-width: none; }

          /* philosophy */
          .ab-philosophy-img { min-height: 180px; height: 180px; }
          .ab-philosophy-text { padding: 22px 16px; }

          /* chefs */
          .ab-chefs-header { margin-bottom: 32px; }
          .ab-chef-img { height: 200px; }
          .ab-chef-body { padding: 28px 16px 18px; }
          .ab-chef-name { font-size: 19px; }
          .ab-chefs-grid { gap: 16px; margin-bottom: 36px; }

          /* unity */
          .ab-unity { border-radius: 16px; }
          .ab-unity-img { height: 180px; }
          .ab-unity-text { padding: 20px 16px 24px; }
        }

        /* ── 360px — small phones ── */
        @media (max-width: 360px) {
          .ab-section { padding: 22px 12px; }
          .ab-display { font-size: clamp(22px, 8vw, 30px); }
          .ab-chef-img { height: 180px; }
          .ab-unity-img { height: 160px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ab-philosophy-img,
          .ab-unity-img,
          .ab-chef-img { transition: none; }
        }
      `}</style>
    </>
  );
}