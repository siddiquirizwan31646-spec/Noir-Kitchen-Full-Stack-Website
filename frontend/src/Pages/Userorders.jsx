// src/pages/UserOrders.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faCheckCircle,
  faClock,
  faMotorcycle,
  faPhoneAlt,
  faHeadset,
  faMapMarkerAlt,
  faReceipt,
  faChevronRight,
  faTag,
  faUtensils,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "../component/ui/Navbar";
import CouponTicker from "../component/ui/CouponTicker";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_STEPS = ["Placed", "Confirmed", "Preparing", "Out for Delivery", "Delivered"];

const STATUS_ICONS = {
  Placed:            faReceipt,
  Confirmed:         faCheckCircle,
  Preparing:         faUtensils,
  "Out for Delivery": faMotorcycle,
  Delivered:         faBoxOpen,
};

function statusIndex(status) {
  const idx = STATUS_STEPS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtPrice(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

export default function UserOrders({ user, onLogout, cart }) {
  const { token, orderId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders]     = useState([]);
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeNav, setActiveNav] = useState("Orders");

  /* ── fetch all orders ── */
  useEffect(() => {
    if (orderId) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.orders || []);
        else setError(data.message || "Failed to load orders");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token, orderId]);

  /* ── fetch single order (backend now enriches with assignorders / cancelledOrder) ── */
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrder(data.order);
        else setError(data.message || "Order not found");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token, orderId]);

  /* ── STATUS BADGE ── */
  const Badge = ({ status }) => {
    const colors = {
      Placed:             "#2563EB",
      Confirmed:          "#7C3AED",
      Preparing:          "#D97706",
      "Out for Delivery": "#059669",
      Delivered:          "#16A34A",
      Cancelled:          "#DC2626",
    };
    return (
      <span style={{
        background: (colors[status] || "#6B7280") + "18",
        color: colors[status] || "#6B7280",
        border: `1px solid ${(colors[status] || "#6B7280")}30`,
        padding: "3px 10px", borderRadius: 20,
        fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
        letterSpacing: "0.04em", whiteSpace: "nowrap",
      }}>{status}</span>
    );
  };

  /* ══════════════════════════════════════════
     ORDER DETAIL VIEW
  ══════════════════════════════════════════ */
  if (orderId) {
    if (loading) return (
      <PageShell token={token} navigate={navigate} user={user} onLogout={onLogout} cart={cart} activeNav={activeNav} setActiveNav={setActiveNav}>
        <Spinner />
      </PageShell>
    );
    if (error) return (
      <PageShell token={token} navigate={navigate} user={user} onLogout={onLogout} cart={cart} activeNav={activeNav} setActiveNav={setActiveNav}>
        <ErrorMsg msg={error} />
      </PageShell>
    );
    if (!order) return null;

    const stepIdx       = statusIndex(order.orderStatus);
    const agent          = order.deliveryPartner; // populated from assignorders by backend
    const isCancelled    = order.orderStatus === "Cancelled";
    const cancelledInfo  = order.cancelledDetails; // populated from cancelledOrder by backend

    return (
      <PageShell token={token} navigate={navigate} back={() => navigate(`/user/${token}`)} user={user} onLogout={onLogout} cart={cart} activeNav={activeNav} setActiveNav={setActiveNav}>
        <style>{CSS}</style>

        {/* ── Header ── */}
        <div className="uo-detail-header">
          <div>
            <div className="uo-detail-id">Order #{order._id?.slice(-6).toUpperCase()}</div>
            <div className="uo-detail-date">{fmtDate(order.orderDateTime)}</div>
          </div>
          <Badge status={order.orderStatus} />
        </div>

        {/* ── Cancelled Info ── */}
        {isCancelled && (
  <div className="uo-card uo-cancel-card">
    <div className="uo-card-title uo-cancel-title">
      <FontAwesomeIcon icon={faTimesCircle} /> Order Cancelled
    </div>
    <div className="uo-cancel-body">
      {(order.cancelledBy || cancelledInfo?.cancelledBy) && (
        <div className="uo-cancel-row">
          <span className="uo-cancel-label">Cancelled By</span>
          <span className="uo-cancel-val">{order.cancelledBy || cancelledInfo?.cancelledBy}</span>
        </div>
      )}
      {(order.cancelReason || cancelledInfo?.reason) && (
        <div className="uo-cancel-row">
          <span className="uo-cancel-label">Reason</span>
          <span className="uo-cancel-val">{order.cancelReason || cancelledInfo?.reason}</span>
        </div>
      )}
      {(order.updatedAt || cancelledInfo?.cancelledAt) && (
        <div className="uo-cancel-row">
          <span className="uo-cancel-label">Cancelled On</span>
          <span className="uo-cancel-val">{fmtDate(order.updatedAt || cancelledInfo?.cancelledAt)}</span>
        </div>
      )}
      {!order.cancelReason && !order.cancelledBy && !cancelledInfo && (
        <p className="uo-cancel-empty">No further details available for this cancellation.</p>
      )}
    </div>
  </div>
)}

        {/* ── Status Timeline ── */}
        {!isCancelled && (
          <div className="uo-card">
            <div className="uo-card-title">
              <FontAwesomeIcon icon={faClock} className="uo-icon-accent" /> Track Order
            </div>
            <div className="uo-timeline">
              {STATUS_STEPS.map((step, i) => {
                const done    = i <= stepIdx;
                const current = i === stepIdx;
                return (
                  <div key={step} className={`uo-step${done ? " done" : ""}${current ? " current" : ""}`}>
                    <div className="uo-step-left">
                      <div className={`uo-step-dot${done ? " done" : ""}${current ? " pulse" : ""}`}>
                        <FontAwesomeIcon icon={STATUS_ICONS[step]} style={{ fontSize: 10 }} />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`uo-step-line${done && i < stepIdx ? " done" : ""}`} />
                      )}
                    </div>
                    <div className="uo-step-right">
                      <div className={`uo-step-label${current ? " current" : ""}`}>{step}</div>
                      {current && (
                        <div className="uo-step-sub">
                          {step === "Out for Delivery" ? order.estimatedDelivery || "On the way" : "In progress…"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
{order.orderStatus === "Delivered" && (
  <div className="uo-card uo-delivered-card">
    <div className="uo-delivered-content">
      <div className="uo-delivered-icon">
        <FontAwesomeIcon icon={faCheckCircle} />
      </div>
      <div>
        <div className="uo-delivered-title">Order Delivered Successfully!</div>
        <div className="uo-delivered-sub">We hope you enjoyed your meal 🍽️</div>
      </div>
    </div>
  </div>
)}

        {/* ── Delivery Agent (from assignorders) ── */}
        {!isCancelled && agent && (
          <div className="uo-card">
            <div className="uo-card-title">
              <FontAwesomeIcon icon={faMotorcycle} className="uo-icon-accent" /> Delivery Agent
            </div>
            <div className="uo-agent-row">
              <div className="uo-agent-avatar">
                {agent.name ? agent.name[0].toUpperCase() : "D"}
              </div>
              <div className="uo-agent-info">
                <div className="uo-agent-name">{agent.name || "Delivery Partner"}</div>
                {(agent.phone || agent.mobile) && (
                  <div className="uo-agent-phone">{agent.phone || agent.mobile}</div>
                )}
                {agent.vehicleType && (
                  <div className="uo-agent-vehicle">
                    {agent.vehicleType}{agent.vehicleNumber ? ` · ${agent.vehicleNumber}` : ""}
                  </div>
                )}
              </div>
              {(agent.phone || agent.mobile) && (
                <a href={`tel:${agent.phone || agent.mobile}`} className="uo-call-btn">
                  <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: 6 }} /> Call
                </a>
              )}
            </div>
            {order.deliveryOtp && (
              <div className="uo-otp-row">
                Delivery OTP: <span className="uo-otp-val">{order.deliveryOtp}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Delivery Address ── */}
        <div className="uo-card">
          <div className="uo-card-title">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="uo-icon-accent" /> Delivery Address
          </div>
          <div className="uo-address">{order.deliveryAddress || "—"}</div>
        </div>

        {/* ── Items ── */}
        <div className="uo-card">
          <div className="uo-card-title">
            <FontAwesomeIcon icon={faReceipt} className="uo-icon-accent" /> Order Summary
          </div>
          <div className="uo-items">
            <div className="uo-item-row uo-item-head">
              <span>Item</span><span>Qty</span><span>Price</span>
            </div>
            {/* single-item order schema */}
            {order.itemName ? (
              <div className="uo-item-row">
                <span>{order.itemName}{order.variant ? ` (${order.variant})` : ""}</span>
                <span>{order.quantity}</span>
                <span>{fmtPrice(order.baseAmount)}</span>
              </div>
            ) : (
              (order.items || []).map((it, i) => (
                <div key={i} className="uo-item-row">
                  <span>{it.name}{it.variant ? ` (${it.variant})` : ""}</span>
                  <span>{it.quantity || it.qty}</span>
                  <span>{fmtPrice((it.price || 0) * (it.quantity || it.qty || 1))}</span>
                </div>
              ))
            )}
          </div>

          <div className="uo-bill">
            <div className="uo-bill-row"><span>Base Amount</span><span>{fmtPrice(order.baseAmount)}</span></div>
            {order.addonTotal > 0 && <div className="uo-bill-row"><span>Add-ons</span><span>{fmtPrice(order.addonTotal)}</span></div>}
            {order.gstAmount > 0  && <div className="uo-bill-row"><span>GST</span><span>{fmtPrice(order.gstAmount)}</span></div>}
            {order.couponCode && order.discountAmount > 0 && (
              <div className="uo-bill-row uo-discount-row">
                <span><FontAwesomeIcon icon={faTag} style={{ marginRight: 5 }} />{order.couponCode}</span>
                <span>−{fmtPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="uo-bill-row uo-total-row">
              <span>Total</span><span>{fmtPrice(order.totalAmount)}</span>
            </div>
            <div className="uo-bill-row uo-payment-row">
              <span>Payment</span><span>{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* ── Help ── */}
        <button className="uo-help-btn" onClick={() => navigate("/Contact-us/Noir-Kitchen-Team")}>
          <FontAwesomeIcon icon={faHeadset} style={{ marginRight: 8 }} /> Need Help with this Order?
        </button>
      </PageShell>
    );
  }

  /* ══════════════════════════════════════════
     ORDER LIST VIEW
  ══════════════════════════════════════════ */
  return (
    <PageShell token={token} navigate={navigate} back={() => navigate(-1)} user={user} onLogout={onLogout} cart={cart} activeNav={activeNav} setActiveNav={setActiveNav}>
      <style>{CSS}</style>
      <div className="uo-list-title">My Orders</div>

      {loading && <Spinner />}
      {error   && <ErrorMsg msg={error} />}

      {!loading && !error && orders.length === 0 && (
        <div className="uo-empty">
          <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: 48, color: "#C4510A40", marginBottom: 12 }} />
          <div className="uo-empty-text">No orders yet</div>
          <button className="uo-order-now-btn" onClick={() => navigate("/NoirKitchen/Menu")}>
            Browse Menu
          </button>
        </div>
      )}

      {orders.map((o) => (
        <div
          key={o._id}
          className="uo-order-card"
          onClick={() => navigate(`/user/${token}/${o._id}`)}
        >
          <div className="uo-order-top">
            <div>
              <div className="uo-order-id">#{o._id?.slice(-6).toUpperCase()}</div>
              <div className="uo-order-date">{fmtDate(o.orderDateTime)}</div>
            </div>
            <Badge status={o.orderStatus} />
          </div>
          <div className="uo-order-item-name">
            {o.itemName || (o.items?.[0]?.name) || "Order"}
            {(o.quantity > 1 || (o.items?.length > 1)) && (
              <span className="uo-order-more"> +{(o.quantity - 1) || (o.items.length - 1)} more</span>
            )}
          </div>
          <div className="uo-order-bottom">
            <span className="uo-order-total">{fmtPrice(o.totalAmount)}</span>
            <span className="uo-order-via">{o.paymentMethod}</span>
            <FontAwesomeIcon icon={faChevronRight} style={{ color: "#C4510A", fontSize: 12, marginLeft: "auto" }} />
          </div>
        </div>
      ))}
    </PageShell>
  );
}

/* ── Shell wrapper ── */
function PageShell({ children, navigate, back, user, onLogout, cart, activeNav, setActiveNav }) {
  return (
    <div className="uo-root">
      <style>{CSS}</style>
      <div style={{ position: "relative", paddingTop: "32px" }}>
  <CouponTicker /><Navbar user={user} onLogout={onLogout} activeNav={activeNav} setActiveNav={setActiveNav} cart={cart} />
</div>
      <div className="uo-content">{children}</div>
    </div>
  );
}

function Spinner() {
  return <div className="uo-spinner"><div className="uo-spin-ring" /></div>;
}

function ErrorMsg({ msg }) {
  return <div className="uo-error">{msg}</div>;
}

/* ══════════════════════════════════════════
   CSS
══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.uo-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #fdf6f0 0%, #fff8f4 60%, #fef3eb 100%);
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ── TOPBAR ── */
.uo-topbar {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(196,81,10,0.1);
  position: sticky; top: 0; z-index: 100;
}
.uo-back-btn {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1.5px solid rgba(196,81,10,0.3);
  background: none; color: #C4510A; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all 0.2s; flex-shrink: 0;
}
.uo-back-btn:hover { background: #C4510A; color: #fff; }
.uo-topbar-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px; font-weight: 700; color: #1A1A1A;
}

/* ── CONTENT ── */
.uo-content { max-width: 640px; margin: 0 auto; padding: 24px 16px 40px; }

/* ── LIST ── */
.uo-list-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px; font-weight: 700; color: #1A1208;
  margin-bottom: 20px;
}
/* ── DELIVERED BANNER ── */
.uo-delivered-card {
  border-color: rgba(22,163,74,0.25);
  background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
}
.uo-delivered-content {
  display: flex; align-items: center; gap: 14px;
}
.uo-delivered-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, #16A34A, #22C55E);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 22px; flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(22,163,74,0.3);
}
.uo-delivered-title {
  font-size: 15px; font-weight: 700; color: #15803D;
}
.uo-delivered-sub {
  font-size: 12px; color: #4ADE80; margin-top: 3px; color: #16A34A; opacity: 0.8;
}
.uo-order-card {
  background: #fff; border: 1px solid rgba(196,81,10,0.12);
  border-radius: 16px; padding: 16px 18px; margin-bottom: 12px;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.uo-order-card:hover {
  border-color: rgba(196,81,10,0.35);
  box-shadow: 0 6px 20px rgba(196,81,10,0.1);
  transform: translateY(-1px);
}
.uo-order-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.uo-order-id  { font-size: 13px; font-weight: 700; color: #1A1208; }
.uo-order-date { font-size: 11px; color: #9A8570; margin-top: 2px; }
.uo-order-item-name { font-size: 14px; color: #4A3728; margin-bottom: 10px; }
.uo-order-more { color: #9A8570; font-size: 12px; }
.uo-order-bottom { display: flex; align-items: center; gap: 10px; }
.uo-order-total { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; color: #C4510A; }
.uo-order-via { font-size: 11px; color: #9A8570; background: #f5f5f5; padding: 2px 8px; border-radius: 20px; }

/* ── DETAIL ── */
.uo-detail-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px;
}
.uo-detail-id   { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: #1A1208; }
.uo-detail-date { font-size: 12px; color: #9A8570; margin-top: 3px; }

/* ── CARDS ── */
.uo-card {
  background: #fff; border: 1px solid rgba(196,81,10,0.1);
  border-radius: 16px; padding: 18px; margin-bottom: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}
.uo-card-title {
  font-size: 13px; font-weight: 700; color: #1A1208;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.uo-icon-accent { color: #C4510A; }

/* ── CANCEL CARD ── */
.uo-cancel-card { border-color: rgba(220,38,38,0.2); background: #FEF2F2; }
.uo-cancel-title { color: #DC2626; }
.uo-cancel-body { display: flex; flex-direction: column; gap: 10px; }
.uo-cancel-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
.uo-cancel-label { color: #9A8570; flex-shrink: 0; }
.uo-cancel-val { color: #4A3728; text-align: right; font-weight: 600; }
.uo-cancel-empty { font-size: 13px; color: #9A8570; }

/* ── TIMELINE ── */
.uo-timeline { display: flex; flex-direction: column; gap: 0; }
.uo-step { display: flex; gap: 12px; }
.uo-step-left { display: flex; flex-direction: column; align-items: center; }
.uo-step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  background: #E5E7EB; color: #9CA3AF;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; flex-shrink: 0; transition: all 0.3s;
}
.uo-step-dot.done { background: #C4510A; color: #fff; }
.uo-step-dot.pulse { animation: uoPulse 1.5s ease-in-out infinite; }
@keyframes uoPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(196,81,10,0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(196,81,10,0); }
}
.uo-step-line {
  width: 2px; flex: 1; min-height: 24px;
  background: #E5E7EB; margin: 2px 0; transition: background 0.3s;
}
.uo-step-line.done { background: #C4510A; }
.uo-step-right { padding-bottom: 20px; padding-top: 4px; }
.uo-step-label { font-size: 13px; font-weight: 600; color: #6B7280; }
.uo-step-label.current { color: #C4510A; }
.uo-step.done .uo-step-label { color: #1A1208; }
.uo-step-sub { font-size: 11px; color: #9A8570; margin-top: 2px; }

/* ── AGENT ── */
.uo-agent-row { display: flex; align-items: center; gap: 12px; }
.uo-agent-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #C4510A, #E8763A);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.uo-agent-info { flex: 1; min-width: 0; }
.uo-agent-name { font-size: 14px; font-weight: 700; color: #1A1208; }
.uo-agent-phone { font-size: 12px; color: #9A8570; margin-top: 2px; }
.uo-agent-vehicle { font-size: 11px; color: #9A8570; margin-top: 2px; }
.uo-call-btn {
  display: flex; align-items: center; padding: 8px 16px;
  background: linear-gradient(135deg, #C4510A, #E8763A);
  color: #fff; border-radius: 50px; font-size: 12px; font-weight: 700;
  text-decoration: none; border: none; cursor: pointer;
  box-shadow: 0 4px 12px rgba(196,81,10,0.3); transition: all 0.2s; flex-shrink: 0;
}
.uo-call-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(196,81,10,0.4); }
.uo-otp-row {
  margin-top: 12px; padding: 10px 14px;
  background: rgba(196,81,10,0.05); border-radius: 10px;
  font-size: 13px; color: #4A3728;
  border: 1px dashed rgba(196,81,10,0.25);
}
.uo-otp-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px; font-weight: 700; color: #C4510A;
  letter-spacing: 0.15em; margin-left: 8px;
}

/* ── ADDRESS ── */
.uo-address { font-size: 13px; color: #4A3728; line-height: 1.6; }

/* ── BILL ── */
.uo-items { margin-bottom: 12px; }
.uo-item-row {
  display: grid; grid-template-columns: 1fr 40px 70px;
  gap: 8px; padding: 8px 0;
  border-bottom: 1px solid rgba(196,81,10,0.06);
  font-size: 13px; color: #4A3728;
}
.uo-item-row:last-child { border-bottom: none; }
.uo-item-head { font-size: 11px; font-weight: 700; color: #9A8570; text-transform: uppercase; letter-spacing: 0.05em; }
.uo-item-row span:nth-child(2),
.uo-item-row span:nth-child(3) { text-align: right; }

.uo-bill { border-top: 1px solid rgba(196,81,10,0.1); padding-top: 12px; }
.uo-bill-row {
  display: flex; justify-content: space-between;
  font-size: 13px; color: #6B7280; padding: 4px 0;
}
.uo-discount-row { color: #16A34A; }
.uo-total-row {
  font-size: 16px; font-weight: 700; color: #1A1208;
  border-top: 1px solid rgba(196,81,10,0.15);
  margin-top: 6px; padding-top: 10px;
}
.uo-total-row span:last-child { color: #C4510A; }
.uo-payment-row { font-size: 11px; color: #9A8570; }

/* ── HELP ── */
.uo-help-btn {
  width: 100%; padding: 14px;
  background: transparent; border: 1.5px solid rgba(196,81,10,0.3);
  border-radius: 14px; color: #C4510A;
  font-size: 13px; font-weight: 700; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: all 0.2s; display: flex; align-items: center; justify-content: center;
  margin-top: 4px;
}
.uo-help-btn:hover { background: rgba(196,81,10,0.06); border-color: #C4510A; }

/* ── EMPTY / SPINNER ── */
.uo-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; text-align: center;
}
.uo-empty-text { font-size: 16px; color: #9A8570; margin-bottom: 16px; }
.uo-order-now-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, #C4510A, #E8763A);
  color: #fff; border: none; border-radius: 50px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 6px 18px rgba(196,81,10,0.3);
}
.uo-spinner { display: flex; justify-content: center; padding: 48px; }
.uo-spin-ring {
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid rgba(196,81,10,0.15);
  border-top-color: #C4510A;
  animation: uoSpin 0.8s linear infinite;
}
@keyframes uoSpin { to { transform: rotate(360deg); } }
.uo-error {
  text-align: center; padding: 40px 20px;
  color: #DC2626; font-size: 14px;
}
`;