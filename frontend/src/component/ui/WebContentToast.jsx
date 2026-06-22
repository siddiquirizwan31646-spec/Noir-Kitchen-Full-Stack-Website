import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Desktop positions (5 boxes cycling)
const DESKTOP_POSITIONS = [
  { bottom: "24px", left: "24px" },
  { bottom: "24px", right: "24px" },
  { top: "80px", right: "24px" },
  { top: "80px", left: "24px" },
  { top: "50%", right: "24px", transform: "translateY(-50%)" },
];

// Mobile: alternate right, left, right, left, right...
function getMobilePosition(idx) {
  return idx % 2 === 0
    ? { bottom: "24px", right: "12px" }
    : { bottom: "24px", left: "12px" };
}

function getPosition(idx, isMobile) {
  if (isMobile) return getMobilePosition(idx);
  return DESKTOP_POSITIONS[idx % DESKTOP_POSITIONS.length];
}

// Exit direction: move toward the side it appeared on
function getExitTransform(position, isMobile) {
  if (isMobile) {
    const isRight = "right" in position;
    return isRight ? "translateX(110%)" : "translateX(-110%)";
  }
  // Desktop: slide up
  return "translateY(-18px) scale(0.97)";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function Toast({ box, position, state, isMobile, onDismiss }) {
  // state: "hidden" | "in" | "out-up" | "out-side"
  const hasImage = !!box.imageUrl;

  let transform, opacity, transition;

  if (state === "in") {
    // fully visible
    const isCenter = position.transform === "translateY(-50%)";
    transform = isCenter ? "translateY(-50%) scale(1)" : "translateY(0) scale(1)";
    opacity = 1;
    transition = "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)";
  } else if (state === "out-up") {
    // exit upward (desktop default or mobile upward before side exit)
    transform = "translateY(-18px) scale(0.97)";
    opacity = 0;
    transition = "opacity 0.5s ease, transform 0.5s ease";
  } else if (state === "out-side") {
    // exit to the side it appeared from (mobile)
    transform = getExitTransform(position, isMobile);
    opacity = 0;
    transition = "opacity 0.45s ease, transform 0.45s cubic-bezier(0.4,0,1,1)";
  } else {
    // "hidden" — entry state (slide up from below)
    const isCenter = position.transform === "translateY(-50%)";
    transform = isCenter ? "translateY(calc(-50% + 14px)) scale(0.96)" : "translateY(14px) scale(0.96)";
    opacity = 0;
    transition = "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)";
  }

  return (
    <div
      className="wct-box"
      style={{ ...position, opacity, transform, transition }}
      onClick={onDismiss}
      title="Click to dismiss"
    >
      {hasImage && (
        <div className="wct-img-wrap">
          <img src={box.imageUrl} alt={box.label} className={`wct-img${state === "in" ? " wct-img--zoom" : ""}`} />
          <div className="wct-img-overlay" />
          {box.emoji && <span className="wct-emoji-badge">{box.emoji}</span>}
        </div>
      )}

      <div className="wct-body">
        <div className="wct-label-row">
          <p className="wct-label">{box.label}</p>
          {box.icon && <i className={`ti ${box.icon} wct-ti-icon`} />}
          {!hasImage && box.emoji && <span className="wct-emoji-inline">{box.emoji}</span>}
        </div>
        {box.content && <p className="wct-content">{box.content}</p>}
      </div>

      <button className="wct-close" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>✕</button>
    </div>
  );
}

export default function WebContentToast() {
  const [currentIdx, setCurrentIdx] = useState(0);
  // "idle" | "hidden" | "in" | "out-up" | "out-side"
  const [toastState, setToastState] = useState("idle");

  const boxesRef    = useRef([]);
  const timerRef    = useRef(null);
  const startedRef  = useRef(false);
  const mountedRef  = useRef(true);
  const isMobile    = useIsMobile();

  const clear = () => clearTimeout(timerRef.current);
  const after = (ms, fn) => { timerRef.current = setTimeout(() => { if (mountedRef.current) fn(); }, ms); };

  const showBox = (idx) => {
    const boxes = boxesRef.current;
    if (!mountedRef.current || idx >= boxes.length) return;
    setCurrentIdx(idx);
    setToastState("hidden");
    after(50,  () => setToastState("in"));
    // after 4s visible → exit upward first, then slide to side (mobile)
    after(50 + 4000, () => {
      setToastState("out-up");
      if (isMobile) {
        // brief upward nudge, then slide to side
        after(200, () => setToastState("out-side"));
      }
      // after exit completes → next
      after(700, () => {
        setToastState("idle");
        after(350, () => showBox(idx + 1));
      });
    });
  };

  useEffect(() => {
    mountedRef.current = true;
    if (!startedRef.current) {
      startedRef.current = true;
      fetch(`${API_BASE}/api/webcontent`)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => {
          if (!mountedRef.current) return;
          const filled = (data?.boxes || []).filter(b => b.content || b.imageUrl || b.emoji || b.icon);
          if (filled.length) {
            boxesRef.current = filled;
            after(1200, () => showBox(0));
          }
        })
        .catch(err => console.error("webcontent fetch failed:", err));
    }
    return () => { mountedRef.current = false; clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    clear();
    setToastState("out-up");
    if (isMobile) after(200, () => setToastState("out-side"));
    after(700, () => {
      setToastState("idle");
      after(350, () => showBox(currentIdx + 1));
    });
  };

  if (toastState === "idle" || !boxesRef.current.length) return null;
  const box = boxesRef.current[currentIdx];
  if (!box) return null;
  const position = getPosition(currentIdx, isMobile);

  return (
    <>
      <Toast
        box={box}
        position={position}
        state={toastState}
        isMobile={isMobile}
        onDismiss={dismiss}
      />
      <style>{`
        .wct-box {
          position: fixed;
          z-index: 9999;
          width: 290px;
          background: rgb(255,255,255);
          border: 1px solid rgba(196,81,10,0.18);
          border-radius: 18px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(196,81,10,0.08);
          overflow: hidden;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          will-change: opacity, transform;
        }

        .wct-img-wrap {
          position: relative;
          width: 100%;
          overflow: hidden;
          flex-shrink: 0;
          /* 5:1 width-to-height ratio */
          aspect-ratio: 5 / 1;
        }
        .wct-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 5s ease;
        }
        .wct-img--zoom { transform: scale(1.04); }
        .wct-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 55%, rgba(255,252,248,0.55) 100%);
        }
        .wct-emoji-badge {
          position: absolute;
          top: 6px; right: 8px;
          font-size: 14px;
          line-height: 1;
          background: rgba(255,255,255,0.85);
          border-radius: 50%;
          width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .wct-emoji-inline { font-size: 14px; line-height: 1; }

        .wct-body { padding: 12px 14px 14px; }
        .wct-label-row {
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 8px; margin-bottom: 6px;
        }
        .wct-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 1.8px; text-transform: uppercase; color: #C4510A;
          margin: 0;
        }
        .wct-ti-icon { font-size: 15px; color: #C4510A; }
        .wct-content {
          font-size: 12px; color: #2a1a0a;
          line-height: 1.6; font-weight: 500;
          white-space: pre-wrap; margin: 0;
        }

        .wct-close {
          position: absolute; top: 7px; right: 8px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(196,81,10,0.15);
          color: #9A8570;
          width: 20px; height: 20px;
          border-radius: 50%; font-size: 8px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s; z-index: 2;
        }
        .wct-close:hover { background: #C4510A; color: #fff; border-color: #C4510A; }

        /* ── MOBILE ── */
        @media (max-width: 600px) {
          .wct-box {
            /* 50% of screen width */
            width: calc(50vw - 16px);
            border-radius: 14px;
          }
          .wct-img-wrap {
            /* 5x wide as tall → aspect-ratio 5/1 already handles it */
            aspect-ratio: 5 / 1;
          }
          .wct-body { padding: 10px 12px 12px; }
          .wct-content { font-size: 11px; }
          .wct-label { font-size: 8px; letter-spacing: 1.4px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wct-box { transition: opacity 0.3s ease !important; }
        }
      `}</style>
    </>
  );
}