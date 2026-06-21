// src/component/ui/CouponTicker.jsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag } from "@fortawesome/free-solid-svg-icons";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CouponTicker() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await fetch(`${API_BASE}/api/coupons`);
        const json = await res.json();
        const all = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.coupons)
              ? json.coupons
              : [];
        const now = new Date();
        const valid = all.filter(c => {
          if (!c.isActive) return false;
          if (c.expiryDate && new Date(c.expiryDate) <= now) return false;
          if (c.usageLimit != null && c.usedCount >= c.usageLimit) return false;
          return true;
        });
        setCoupons(valid);
      } catch { /* silent */ }
    }
    fetchCoupons();
  }, []);

  if (!coupons.length) return null;

  // Duplicate for seamless infinite loop
  const items = [...coupons, ...coupons];

  return (
    <>
      <div className="cticker-wrap">
        <div className="cticker-track">
          {items.map((c, i) => (
            <span key={i} className="cticker-item">
              <FontAwesomeIcon icon={faTag} className="cticker-icon" />
              <strong>{c.code}</strong>
              &nbsp;—&nbsp;
              {c.discountType === "Percentage"
                ? `${c.discountValue}% OFF`
                : `₹${c.discountValue} OFF`}
              {c.minOrderAmount ? ` on orders above ₹${c.minOrderAmount}` : ""}
              {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
              <span className="cticker-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .cticker-wrap {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 20;
          height: 32px;
          background: linear-gradient(90deg, #1a0a02, #2d1205, #1a0a02);
          border-bottom: 1px solid rgba(196,81,10,0.35);
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .cticker-track {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: cticker-scroll 28s linear infinite;
          will-change: transform;
        }
        @keyframes cticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .cticker-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 32px;
          font-size: 11.5px;
          font-weight: 600;
          color: #FFD4A0;
          letter-spacing: 0.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .cticker-item strong {
          color: #FFB067;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .cticker-icon {
          color: #C4510A;
          font-size: 10px;
        }
        .cticker-sep {
          color: rgba(196,81,10,0.5);
          font-size: 9px;
          margin-left: 8px;
        }
      `}</style>
    </>
  );
}