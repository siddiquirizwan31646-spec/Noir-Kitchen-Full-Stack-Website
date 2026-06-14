// src/pages/CartCheckout.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../component/ui/Navbar";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GST_RATE = 0.18;
const ESTIMATED_DELIVERY = "30–45 minutes";

function InputField({ label, name, value, onChange, placeholder, required, type = "text", error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="cc-field-wrap">
      <label className="cc-label">{label}{required && <span className="cc-req">*</span>}</label>
      <div className={`cc-input-wrap${focused ? " cc-input-focus" : ""}${error ? " cc-input-err" : ""}`}>
        <input
          type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} className="cc-input"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          autoComplete="off"
        />
      </div>
      {error && <span className="cc-err-msg">{error}</span>}
    </div>
  );
}

function ReadonlyField({ label, value, icon }) {
  return (
    <div className="cc-field-wrap">
      <label className="cc-label">{label}</label>
      <div className="cc-readonly">
        {icon && <span className="cc-readonly-icon">{icon}</span>}
        <span className="cc-readonly-val">{value || "—"}</span>
        <span className="cc-lock">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </span>
      </div>
    </div>
  );
}

export default function CartCheckout({ user: propUser, onLogout, cart }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems = [], totalPrice = 0 } = location.state || {};

  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderIds, setOrderIds]     = useState([]);
  const [errors, setErrors]         = useState({});
  const [activeNav, setActiveNav]   = useState("Menu");

  const user = propUser || {};

  const [form, setForm] = useState({
    fullName: user?.name || "",
    mobile:   user?.phone || "",
    houseNo: "", areaName: "", areaNo: "", city: "", pinCode: "",
  });

  useEffect(() => {
    if (user?.address) {
      setForm(f => ({
        ...f,
        houseNo:  user.address.houseNo  || "",
        areaName: user.address.areaName || "",
        areaNo:   user.address.areaNo   || "",
        city:     user.address.city     || "",
        pinCode:  user.address.pinCode  || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!cartItems.length) navigate("/NoirKitchen/Menu");
  }, []);

  const subTotal    = cartItems.reduce((sum, item) => sum + parseInt(String(item.price || "0").replace(/[^\d]/g, "")) * item.qty, 0);
  const gstAmount   = Math.round(subTotal * GST_RATE);
  const finalAmount = subTotal + gstAmount;

  const now = new Date();
  const orderDateTime = now.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.mobile.trim()) e.mobile = "Mobile number is required";
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = "Enter a valid 10-digit mobile number";
    if (!form.houseNo.trim()) e.houseNo = "House / Flat No. is required";
    if (!form.areaName.trim()) e.areaName = "Area name is required";
    if (!form.areaNo.trim()) e.areaNo = "Area / Sector No. is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.pinCode.trim()) e.pinCode = "PIN Code is required";
    else if (!/^\d{6}$/.test(form.pinCode.trim())) e.pinCode = "Enter a valid 6-digit PIN code";
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const deliveryAddress = [form.houseNo, form.areaName, form.areaNo, form.city, form.pinCode].join(", ");
      const submitTime = new Date();

      const results = await Promise.all(cartItems.map(async (item) => {
        const itemPrice = parseInt(String(item.price || "0").replace(/[^\d]/g, ""));
        const itemGst   = Math.round(itemPrice * item.qty * GST_RATE);
        const payload = {
          email:               user?.email || "",
          foodId:              item.menuItemId || null,
          itemName:            item.name,
          variant:             item.variant || "Standard",
          addons:              (item.addons || []).map(a => `${a.label} (${a.price})`).join(", "),
          quantity:            item.qty,
          specialInstructions: item.note || "",
          orderDateTime:       submitTime.toISOString(),
          paymentMethod:       "Cash",
          baseAmount:          itemPrice,
          addonTotal:          0,
          gstAmount:           itemGst,
          totalAmount:         itemPrice * item.qty + itemGst,
          discountApplied:     "None",
          estimatedDelivery:   ESTIMATED_DELIVERY,
          customerId:          user?._id || user?.id || null,
          fullName:            form.fullName.trim(),
          mobile:              form.mobile.trim(),
          deliveryAddress,
          houseNo:             form.houseNo.trim(),
          areaName:            form.areaName.trim(),
          areaNo:              form.areaNo.trim(),
          city:                form.city.trim(),
          pinCode:             form.pinCode.trim(),
          orderStatus:         "Placed",
          deliveryPartner:     null,
        };

        const res = await fetch(`${API_BASE}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        return res.json();
      }));

      const allSuccess = results.every(r => r.success || r.orderId || r._id);
      if (allSuccess) {
        setOrderIds(results.map(r => r.orderId || r._id));
        setSubmitted(true);
        await cart?.clearCart?.();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error("One or more orders failed");
      }
    } catch (err) {
      alert("Something went wrong: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="cc-root">
        <Navbar user={user} onLogout={onLogout} activeNav={activeNav} setActiveNav={setActiveNav} cart={cart} />
        <div className="cc-success-wrap">
          <div className="cc-success-card">
            <div className="cc-success-icon">✓</div>
            <h2 className="cc-success-title">Orders Placed!</h2>
            <p className="cc-success-sub">All {cartItems.length} item{cartItems.length > 1 ? "s" : ""} ordered. We'll start preparing right away.</p>
            <div className="cc-success-items">
              {cartItems.map((item, i) => (
                <div key={i} className="cc-success-item-row">
                  <img src={item.img} alt={item.name} className="cc-success-item-img" />
                  <div>
                    <div className="cc-success-item-name">{item.name}</div>
                    {item.variant && <div className="cc-success-item-variant">{item.variant}</div>}
                  </div>
                  <div className="cc-success-item-id">#{String(orderIds[i] || "").slice(-6).toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div className="cc-success-details">
              <div className="cc-suc-row"><span>Total Paid</span><strong>₹{finalAmount.toLocaleString("en-IN")}</strong></div>
              <div className="cc-suc-row"><span>Payment</span><strong>Cash on Delivery</strong></div>
              <div className="cc-suc-row"><span>Delivery to</span><strong>{form.city}</strong></div>
              <div className="cc-suc-row"><span>Estimated Time</span><strong>{ESTIMATED_DELIVERY}</strong></div>
              <div className="cc-suc-row"><span>Status</span><strong className="cc-status-placed">● Placed</strong></div>
            </div>
            <div className="cc-success-btns">
              <button className="cc-btn-primary" onClick={() => navigate("/dashboard")}>Back to Home</button>
              <button className="cc-btn-outline" onClick={() => navigate("/NoirKitchen/Menu")}>Order More</button>
            </div>
          </div>
        </div>
      </div>
      <style>{STYLES}</style>
    </>
  );

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="cc-root">
        <Navbar user={user} onLogout={onLogout} activeNav={activeNav} setActiveNav={setActiveNav} cart={cart} />

        <div className="cc-hero">
          <div className="cc-hero-inner">
            <p className="cc-eyebrow">Noir Kitchen <span style={{ opacity: 0.6 }}>✦</span> Checkout</p>
            <h1 className="cc-hero-h1">Almost There — <em className="cc-accent">Confirm Your Order</em></h1>
            <p className="cc-hero-sub">Review your cart and fill in delivery details below.</p>
          </div>
        </div>

        <form className="cc-form-wrap" onSubmit={handleSubmit} noValidate>
          <div className="cc-layout">
            <div className="cc-left">
              <div className="cc-section">
                <div className="cc-section-hd">
                  <span className="cc-section-icon">🛒</span>
                  <div>
                    <h3 className="cc-section-title">Your Items</h3>
                    <p className="cc-section-sub">{cartItems.length} item{cartItems.length > 1 ? "s" : ""} in cart</p>
                  </div>
                </div>
                <div className="cc-cart-list">
                  {cartItems.map((item, i) => (
                    <div key={i} className="cc-cart-row">
                      <img src={item.img} alt={item.name} className="cc-cart-img" />
                      <div className="cc-cart-info">
                        <div className="cc-cart-name">{item.name}</div>
                        {item.variant && <div className="cc-cart-variant">{item.variant}</div>}
                        {item.note && <div className="cc-cart-note">📝 {item.note}</div>}
                      </div>
                      <div className="cc-cart-right">
                        <span className="cc-cart-qty">×{item.qty}</span>
                        <span className="cc-cart-price">
                          ₹{(parseInt(String(item.price || "0").replace(/[^\d]/g, "")) * item.qty).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cc-section">
                <div className="cc-section-hd">
                  <span className="cc-section-icon">🔒</span>
                  <div>
                    <h3 className="cc-section-title">Order Details</h3>
                    <p className="cc-section-sub">Auto-filled from your selection</p>
                  </div>
                </div>
                <div className="cc-fields-grid">
                  <ReadonlyField label="Items in Order" value={`${cartItems.length} item${cartItems.length > 1 ? "s" : ""}`} icon="🛒" />
                  <ReadonlyField label="Payment Method" value="Cash on Delivery" icon="💵" />
                  <ReadonlyField label="Order Date & Time" value={orderDateTime} icon="🕐" />
                  <ReadonlyField label="Estimated Delivery" value={ESTIMATED_DELIVERY} icon="🛵" />
                </div>
              </div>

              <div className="cc-section">
                <div className="cc-section-hd">
                  <span className="cc-section-icon">💰</span>
                  <div>
                    <h3 className="cc-section-title">Price Breakdown</h3>
                    <p className="cc-section-sub">Including GST</p>
                  </div>
                </div>
                <div className="cc-price-list">
                  <div className="cc-price-row"><span>Subtotal</span><span>₹{subTotal.toLocaleString("en-IN")}</span></div>
                  <div className="cc-price-row"><span>GST (18%)</span><span>+ ₹{gstAmount.toLocaleString("en-IN")}</span></div>
                  <div className="cc-price-divider" />
                  <div className="cc-price-row cc-price-total"><span>Total</span><span>₹{finalAmount.toLocaleString("en-IN")}</span></div>
                </div>
              </div>
            </div>

            <div className="cc-right">
              <div className="cc-section">
                <div className="cc-section-hd">
                  <span className="cc-section-icon">👤</span>
                  <div>
                    <h3 className="cc-section-title">Your Details</h3>
                    <p className="cc-section-sub">Contact information</p>
                  </div>
                </div>
                <div className="cc-fields-col">
                  <InputField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" required error={errors.fullName} />
                  <InputField label="Mobile Number" name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile number" type="tel" required error={errors.mobile} />
                </div>
              </div>

              <div className="cc-section">
                <div className="cc-section-hd">
                  <span className="cc-section-icon">📍</span>
                  <div>
                    <h3 className="cc-section-title">Delivery Address</h3>
                    <p className="cc-section-sub">Where should we deliver?</p>
                  </div>
                </div>
                <div className="cc-fields-col">
                  <InputField label="House / Flat No." name="houseNo" value={form.houseNo} onChange={handleChange} placeholder="e.g. B-204, Tower 3" required error={errors.houseNo} />
                  <InputField label="Area / Apartment Name" name="areaName" value={form.areaName} onChange={handleChange} placeholder="e.g. Green Valley Apartments" required error={errors.areaName} />
                  <InputField label="Area / Sector No." name="areaNo" value={form.areaNo} onChange={handleChange} placeholder="e.g. Sector 14" required error={errors.areaNo} />
                  <div className="cc-row-2">
                    <InputField label="City" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Jaipur" required error={errors.city} />
                    <InputField label="PIN Code" name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="6-digit PIN" required error={errors.pinCode} />
                  </div>
                </div>
              </div>

              <div className="cc-sticky-summary">
                <div className="cc-summary-row"><span className="cc-summary-label">Items</span><span className="cc-summary-val">{cartItems.length} item{cartItems.length > 1 ? "s" : ""}</span></div>
                <div className="cc-summary-row"><span className="cc-summary-label">Total</span><span className="cc-summary-total">₹{finalAmount.toLocaleString("en-IN")}</span></div>
                <div className="cc-summary-row"><span className="cc-summary-label">Payment</span><span className="cc-summary-val">Cash on Delivery</span></div>
                <button type="submit" className={`cc-btn-primary${submitting ? " cc-btn-loading" : ""}`} disabled={submitting}>
                  {submitting
                    ? <><span className="cc-btn-spinner" /> Placing Orders…</>
                    : <>Place {cartItems.length > 1 ? `${cartItems.length} Orders` : "Order"} →</>
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <style>{STYLES}</style>
    </>
  );
}

const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.cc-root { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; background: #F8F1EA; color: #1A1208; }

.cc-hero { background: linear-gradient(135deg,#2B1600,#4A2500); padding: 52px 48px 48px; text-align: center; }
.cc-hero-inner { max-width: 680px; margin: 0 auto; }
.cc-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #F0924A; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.cc-hero-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px,4vw,52px); font-weight: 600; line-height: 1.1; color: #F8F1EA; margin-bottom: 14px; }
.cc-accent { font-style: italic; color: #F0924A; }
.cc-hero-sub { font-size: 14px; color: rgba(248,241,234,0.6); line-height: 1.7; }

.cc-form-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 40px 80px; }
.cc-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }

.cc-section { background: #fff; border-radius: 20px; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 24px; margin-bottom: 20px; }
.cc-section-hd { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 18px; margin-bottom: 20px; border-bottom: 1px solid rgba(216,106,28,0.1); }
.cc-section-icon { font-size: 22px; line-height: 1; flex-shrink: 0; margin-top: 2px; }
.cc-section-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208; margin-bottom: 3px; }
.cc-section-sub { font-size: 12px; color: #9A8570; }

.cc-cart-list { display: flex; flex-direction: column; gap: 12px; }
.cc-cart-row { display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(248,241,234,0.5); border-radius: 12px; }
.cc-cart-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.cc-cart-info { flex: 1; min-width: 0; }
.cc-cart-name { font-size: 13px; font-weight: 700; color: #1A1208; }
.cc-cart-variant { font-size: 11px; color: #9A8570; margin-top: 2px; }
.cc-cart-note { font-size: 11px; color: #9A8570; margin-top: 2px; }
.cc-cart-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.cc-cart-qty { font-size: 12px; color: #9A8570; font-weight: 600; }
.cc-cart-price { font-size: 14px; font-weight: 700; color: #D86A1C; }

.cc-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cc-readonly { display: flex; align-items: center; gap: 10px; background: rgba(248,241,234,0.6); border: 1.5px solid rgba(216,106,28,0.12); border-radius: 12px; padding: 11px 14px; }
.cc-readonly-icon { font-size: 14px; flex-shrink: 0; }
.cc-readonly-val { font-size: 13px; color: #1A1208; font-weight: 500; flex: 1; }
.cc-lock { margin-left: auto; color: #C4B09A; flex-shrink: 0; }

.cc-price-list { display: flex; flex-direction: column; gap: 10px; }
.cc-price-row { display: flex; justify-content: space-between; font-size: 13px; color: #6B5B45; }
.cc-price-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(216,106,28,0.2), transparent); margin: 4px 0; }
.cc-price-total { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208; }

.cc-fields-col { display: flex; flex-direction: column; gap: 14px; }
.cc-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cc-field-wrap { display: flex; flex-direction: column; gap: 6px; }
.cc-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8570; }
.cc-req { color: #D86A1C; margin-left: 3px; }
.cc-input-wrap { display: flex; align-items: center; background: #fff; border: 1.5px solid rgba(216,106,28,0.2); border-radius: 12px; padding: 0 14px; transition: border-color 0.2s, box-shadow 0.2s; }
.cc-input-focus { border-color: #D86A1C; box-shadow: 0 0 0 3px rgba(216,106,28,0.1); }
.cc-input-err { border-color: #D32F2F; }
.cc-input { flex: 1; border: none; background: transparent; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1A1208; padding: 12px 0; }
.cc-input::placeholder { color: #C4B09A; }
.cc-err-msg { font-size: 11px; color: #D32F2F; font-weight: 500; }

.cc-sticky-summary { position: sticky; top: 100px; background: #fff; border-radius: 20px; border: 1px solid rgba(216,106,28,0.15); box-shadow: 0 8px 32px rgba(216,106,28,0.12); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.cc-summary-row { display: flex; justify-content: space-between; align-items: center; }
.cc-summary-label { font-size: 11px; font-weight: 600; color: #9A8570; text-transform: uppercase; letter-spacing: 1px; }
.cc-summary-val { font-size: 13px; font-weight: 600; color: #1A1208; }
.cc-summary-total { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #D86A1C; }

.cc-btn-primary { width: 100%; padding: 15px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; border: none; border-radius: 50px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(216,106,28,0.35); transition: all 0.25s; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; }
.cc-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(216,106,28,0.45); }
.cc-btn-primary:disabled { opacity: 0.75; cursor: not-allowed; }
.cc-btn-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: ccSpin 0.7s linear infinite; }
@keyframes ccSpin { to { transform: rotate(360deg); } }
.cc-btn-outline { padding: 14px 28px; background: transparent; color: #D86A1C; border: 1.5px solid #D86A1C; border-radius: 50px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.25s; width: 100%; }
.cc-btn-outline:hover { background: #D86A1C; color: #fff; }

.cc-success-wrap { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
.cc-success-card { background: #fff; border-radius: 28px; border: 1px solid rgba(216,106,28,0.12); box-shadow: 0 20px 60px rgba(0,0,0,0.1); padding: 48px 40px; max-width: 560px; width: 100%; text-align: center; animation: ccScale 0.5s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes ccScale { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
.cc-success-icon { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#4CAF50,#66BB6A); color: #fff; font-size: 32px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 8px 28px rgba(76,175,80,0.35); }
.cc-success-title { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 600; color: #1A1208; margin-bottom: 10px; }
.cc-success-sub { font-size: 14px; color: #6B5B45; line-height: 1.7; margin-bottom: 24px; }
.cc-success-items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.cc-success-item-row { display: flex; align-items: center; gap: 10px; background: #F8F1EA; border-radius: 12px; padding: 10px 14px; text-align: left; }
.cc-success-item-img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.cc-success-item-name { font-size: 13px; font-weight: 700; color: #1A1208; }
.cc-success-item-variant { font-size: 11px; color: #9A8570; }
.cc-success-item-id { margin-left: auto; font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 600; color: #D86A1C; flex-shrink: 0; }
.cc-success-details { background: #F8F1EA; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px; text-align: left; }
.cc-suc-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.cc-suc-row span { color: #9A8570; }
.cc-suc-row strong { color: #1A1208; font-weight: 600; }
.cc-status-placed { color: #D86A1C !important; }
.cc-success-btns { display: flex; flex-direction: column; gap: 10px; }

@media (max-width: 900px) {
  .cc-layout { grid-template-columns: 1fr; }
  .cc-sticky-summary { position: static; }
  .cc-form-wrap { padding: 28px 20px 60px; }
  .cc-hero { padding: 40px 20px 36px; }
  .cc-fields-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .cc-row-2 { grid-template-columns: 1fr; }
  .cc-success-card { padding: 32px 20px; }
  .cc-form-wrap { padding: 20px 14px 48px; }
}
`;