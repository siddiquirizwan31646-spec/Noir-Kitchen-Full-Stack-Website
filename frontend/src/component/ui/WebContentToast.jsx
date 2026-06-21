import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Positions for each box index (matching the wireframe layout)
const BOX_POSITIONS = [
  // box1 — bottom-left
  { bottom: "24px", left: "24px" },
  // box2 — bottom-right
  { bottom: "24px", right: "24px" },
  // box3 — top-right
  { top: "80px", right: "24px" },
  // box4 — top-left
  { top: "80px", left: "24px" },
  // box5 — center-right
  { top: "50%", right: "24px", transform: "translateY(-50%)" },
];

function Toast({ box, position, visible, onDismiss }) {
  const hasImage = !!box.imageUrl;

  return (
    <div
      className={`wct-box ${visible ? "wct-box--in" : "wct-box--out"}`}
      style={{ ...position }}
      onClick={onDismiss}
      title="Click to dismiss"
    >
      {/* image strip */}
      {hasImage && (
        <div className="wct-img-wrap">
          <img src={box.imageUrl} alt={box.label} className="wct-img" />
          <div className="wct-img-overlay" />
          {/* small emoji badge, top-right of image */}
          {box.emoji && <span className="wct-emoji-badge">{box.emoji}</span>}
        </div>
      )}

      <div className="wct-body">
        {/* label eyebrow */}
        <div className="wct-label-row">
          <p className="wct-label">{box.label}</p>
          {box.icon && <i className={`ti ${box.icon} wct-ti-icon`} />}
          {/* if there's no image, still show a small emoji badge inline */}
          {!hasImage && box.emoji && <span className="wct-emoji-inline">{box.emoji}</span>}
        </div>

        {/* text content — fully shown, no clamping */}
        {box.content && (
          <p className="wct-content">{box.content}</p>
        )}
      </div>

      {/* dismiss x */}
      <button className="wct-close" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>✕</button>
    </div>
  );
}

export default function WebContentToast() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  // boxesRef holds the data; boxes state is only used to know "do we have data yet"
  const boxesRef = useRef([]);
  const timerRef = useRef(null);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  const showBox = (idx) => {
    const boxes = boxesRef.current;
    if (!mountedRef.current) return;
    if (idx >= boxes.length) return; // all shown, stop

    setCurrentIdx(idx);
    setRendered(true);

    // fade in
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setVisible(true);
      // after 5s visible, fade out
      timerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setVisible(false);
        // after fade-out transition (600ms), show next
        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setRendered(false);
          timerRef.current = setTimeout(() => showBox(idx + 1), 300);
        }, 650);
      }, 3000);
    }, 50);
  };

  // Single effect: fetch once, then kick off the sequence directly.
  // No dependency on a "boxes" state array, so there's no StrictMode
  // double-effect race that cancels the very first timer.
  useEffect(() => {
    mountedRef.current = true;

    if (!startedRef.current) {
      startedRef.current = true;

      fetch(`${API_BASE}/api/webcontent`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(data => {
          if (!mountedRef.current) return;
          const filled = (data?.boxes || []).filter(b =>
            b.content || b.imageUrl || b.emoji || b.icon
          );
          if (filled.length) {
            boxesRef.current = filled;
            timerRef.current = setTimeout(() => showBox(0), 1200);
          }
        })
        .catch(err => {
          console.error("webcontent fetch failed:", err);
        });
    }

    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setRendered(false);
      timerRef.current = setTimeout(() => showBox(currentIdx + 1), 300);
    }, 650);
  };

  if (!rendered || !boxesRef.current.length) return null;

  const box = boxesRef.current[currentIdx];
  if (!box) return null;
  const position = BOX_POSITIONS[currentIdx % BOX_POSITIONS.length];

  return (
    <>
      <Toast
        box={box}
        position={position}
        visible={visible}
        onDismiss={dismiss}
      />
      <style>{`
        .wct-box {
          position: fixed;
          z-index: 9999;
          width: 290px;
          background: rgb(255, 255, 255);
          border: 1px solid rgba(196, 81, 10, 0.18);
          border-radius: 18px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(196,81,10,0.08);
          overflow: hidden;
          cursor: pointer;
          opacity: 0;
          transform: translateY(14px) scale(0.96);
          transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1),
                      transform 0.55s cubic-bezier(0.22,1,0.36,1);
          font-family: 'Plus Jakarta Sans', sans-serif;
          will-change: opacity, transform;
        }
        .wct-box[style*="translateY(-50%)"] {
          transform: translateY(calc(-50% + 14px)) scale(0.96);
        }
        .wct-box--in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .wct-box--in[style*="translateY(-50%)"] {
          transform: translateY(-50%) scale(1);
        }
        .wct-box--out {
          opacity: 0;
          transform: translateY(-10px) scale(0.97);
        }

        .wct-img-wrap {
          position: relative;
          width: 100%;
          height: 170px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .wct-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 5s ease;
        }
        .wct-box--in .wct-img { transform: scale(1.04); }
        .wct-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 55%, rgba(255,252,248,0.55) 100%);
        }
        .wct-emoji-badge {
          position: absolute;
          top: 10px; right: 10px;
          font-size: 16px;
          line-height: 1;
          background: rgba(255,255,255,0.85);
          border-radius: 50%;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .wct-emoji-inline {
          font-size: 14px;
          line-height: 1;
        }

        .wct-body {
          padding: 14px 16px 16px;
        }
        .wct-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }
        .wct-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: #C4510A;
        }
        .wct-ti-icon {
          font-size: 16px;
          color: #C4510A;
        }
        .wct-content {
          font-size: 12.5px;
          color: #2a1a0a;
          line-height: 1.65;
          font-weight: 500;
          white-space: pre-wrap;
        }

        .wct-close {
          position: absolute;
          top: 8px; right: 10px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(196,81,10,0.15);
          color: #9A8570;
          width: 22px; height: 22px;
          border-radius: 50%;
          font-size: 9px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
          z-index: 2;
        }
        .wct-close:hover { background: #C4510A; color: #fff; border-color: #C4510A; }

        @media (max-width: 480px) {
          .wct-box { width: 250px; }
          .wct-box[style*="right: 24px"] { right: 12px !important; }
          .wct-box[style*="left: 24px"]  { left: 12px !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wct-box { transition: opacity 0.3s ease !important; transform: none !important; }
        }
      `}</style>
    </>
  );
}