import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../component/ui/Navbar";

const FONT_LINK =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GST_RATE = 0.18;
const ESTIMATED_DELIVERY = "30–45 minutes";
const LOC_KEY  = "nk_delivery_coords";
const ADDR_KEY = "nk_delivery_address";

// ── Helpers ────────────────────────────────────────────────────────────────
function ReadonlyField({ label, value, icon }) {
    return (
        <div className="off-field-wrap">
            <label className="off-label">{label}</label>
            <div className="off-readonly">
                {icon && <span className="off-readonly-icon">{icon}</span>}
                <span className="off-readonly-val">{value || "—"}</span>
                <span className="off-lock">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </span>
            </div>
        </div>
    );
}

function InputField({ label, name, value, onChange, placeholder, required, type = "text", error, disabled }) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="off-field-wrap">
            <label className="off-label">{label}{required && <span className="off-req">*</span>}</label>
            <div className={`off-input-wrap ${focused ? "off-input-focus" : ""} ${error ? "off-input-err" : ""} ${disabled ? "off-input-disabled" : ""}`}>
                <input
                    type={type} name={name} value={value} onChange={onChange}
                    placeholder={placeholder} onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)} className="off-input"
                    autoComplete="off" disabled={disabled}
                />
            </div>
            {error && <span className="off-err-msg">{error}</span>}
        </div>
    );
}

// ── Coupon Section (inline on order form) ─────────────────────────────────
function CouponSection({ subtotal, appliedCoupon, onApply, onRemove }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleApply = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) { setError("Please enter a coupon code."); return; }
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/coupons/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: trimmed, orderAmount: subtotal }),
            });
            const data = await res.json();
            if (!res.ok || !data.valid) {
                setError(data.message || "Invalid or expired coupon.");
            } else {
                onApply(data.coupon);
                setCode("");
            }
        } catch {
            setError("Could not validate coupon. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        onRemove();
        setCode("");
        setError("");
    };

    if (appliedCoupon) {
        const saved = appliedCoupon.discountType === "Percentage"
            ? Math.min(
                Math.round(subtotal * appliedCoupon.discountValue / 100),
                appliedCoupon.maxDiscount > 0 ? appliedCoupon.maxDiscount : Infinity
              )
            : appliedCoupon.discountValue;

        return (
            <div className="off-coupon-applied">
                <div className="off-coupon-icon">🎟</div>
                <div className="off-coupon-info">
                    <span className="off-coupon-code">{appliedCoupon.code}</span>
                    <span className="off-coupon-desc">
                        {appliedCoupon.discountType === "Percentage"
                            ? `${appliedCoupon.discountValue}% off${appliedCoupon.maxDiscount > 0 ? ` · max ₹${appliedCoupon.maxDiscount}` : ""}`
                            : `Flat ₹${appliedCoupon.discountValue} off`}
                    </span>
                </div>
                <span className="off-coupon-savings">−₹{saved.toLocaleString("en-IN")}</span>
                <button className="off-coupon-remove" onClick={handleRemove} title="Remove coupon">✕</button>
            </div>
        );
    }

    return (
        <div className="off-coupon-wrap">
            <div className="off-coupon-row">
                <div className="off-coupon-input-wrap">
                    <span className="off-coupon-icon-sm">🎟</span>
                    <input
                        className="off-coupon-input"
                        placeholder="Enter coupon code"
                        value={code}
                        onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApply()}
                        maxLength={30}
                    />
                </div>
                <button className="off-coupon-btn" onClick={handleApply} disabled={loading}>
                    {loading ? <span className="off-coupon-spinner" /> : "Apply"}
                </button>
            </div>
            {error && <p className="off-coupon-error">⚠ {error}</p>}
        </div>
    );
}

// ── Location Section ───────────────────────────────────────────────────────
function LocationSection({ coords, resolvedAddress, locating, locError, onRequestLocation, onReset }) {
    if (locError) {
        return (
            <div className="off-loc-error-card">
                <div className="off-loc-err-icon">⚠️</div>
                <p className="off-loc-err-title">Location Access Denied</p>
                <p className="off-loc-err-msg">{locError}</p>
                <button className="off-loc-btn" onClick={onRequestLocation}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                    Try Again
                </button>
            </div>
        );
    }
    if (locating) {
        return (
            <div className="off-loc-detecting">
                <div className="off-loc-pulse" />
                <div>
                    <p className="off-loc-det-title">Detecting your location…</p>
                    <p className="off-loc-det-sub">Please allow location access in your browser</p>
                </div>
            </div>
        );
    }
    if (!coords) {
        return (
            <div className="off-loc-prompt">
                <div className="off-loc-prompt-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="1.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
                <h4 className="off-loc-prompt-title">Enable Location for Delivery</h4>
                <p className="off-loc-prompt-sub">We need your GPS location to deliver your order accurately.</p>
                <button className="off-loc-btn off-loc-btn-main" onClick={onRequestLocation}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                    Use My Current Location
                </button>
            </div>
        );
    }
    return (
        <div className="off-loc-map-wrap">
            <div className="off-loc-map-frame">
                <iframe
                    title="Delivery location"
                    src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="off-loc-map-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#D86A1C"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    GPS Located
                </div>
            </div>
            <div className="off-loc-addr-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="2" style={{flexShrink:0,marginTop:2}}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="off-loc-addr-text">{resolvedAddress || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}</span>
                <button className="off-loc-update-btn" onClick={onReset} title="Update location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Update
                </button>
            </div>
            <p className="off-loc-coords-pill">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</p>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function OrderFoodForm({ user: propUser, onLogout, cart }) {
    const { foodName, vegType, price, customerName, username, addressStr } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const orderState = location.state || {};

    const qty             = orderState.qty || 1;
    const note            = orderState.note || "";
    const selectedVariant = orderState.selectedVariant || null;
    const selectedAddons  = orderState.selectedAddons || [];
    const itemImg         = orderState.itemImg || "";
    const user            = propUser || { name: customerName || "Guest", email: "" };
    const decodedFood     = decodeURIComponent(foodName || "");
    const decodedPrice    = decodeURIComponent(price || "0");
    const [deliveryOtp, setDeliveryOtp] = useState(null);
    const [item, setItem]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted]   = useState(false);
    const [orderId, setOrderId]       = useState(null);
    const [errors, setErrors]         = useState({});
    const [activeNav, setActiveNav]   = useState("Menu");

    // ── Coupon state — initialise from router state (passed by FoodOrder) ──
    const [appliedCoupon, setAppliedCoupon] = useState(orderState.appliedCoupon || null);

    // ── GPS state ──────────────────────────────────────────────────────────
    const [coords, setCoords] = useState(() => {
        if (orderState.latitude && orderState.longitude)
            return { lat: orderState.latitude, lng: orderState.longitude };
        const raw = decodeURIComponent(addressStr || "");
        const [la, lo] = raw.split(",").map(Number);
        if (!isNaN(la) && !isNaN(lo) && la !== 0) return { lat: la, lng: lo };
        try {
            const saved = JSON.parse(localStorage.getItem(LOC_KEY) || "null");
            if (saved?.lat) return saved;
        } catch {}
        return null;
    });
    const [resolvedAddress, setResolvedAddress] = useState(
        () => orderState.deliveryAddress || localStorage.getItem(ADDR_KEY) || ""
    );
    const [locating, setLocating] = useState(false);
    const [locError, setLocError] = useState("");

    const [form, setForm] = useState({
        fullName: user?.name || "",
        mobile:   user?.phone || "",
    });

    useEffect(() => { if (!coords) requestLocation(); }, []);

    const reverseGeocode = useCallback(async (lat, lng) => {
        try {
            const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
    }, []);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) { setLocError("Geolocation is not supported by your browser."); return; }
        setLocating(true);
        setLocError("");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const c   = { lat, lng };
                setCoords(c);
                localStorage.setItem(LOC_KEY, JSON.stringify(c));
                const addr = await reverseGeocode(lat, lng);
                setResolvedAddress(addr);
                localStorage.setItem(ADDR_KEY, addr);
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                if (err.code === 1) setLocError("Location permission denied. Please enable it in your browser settings.");
                else if (err.code === 2) setLocError("Location unavailable right now. Please try again.");
                else setLocError("Location request timed out. Please try again.");
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }, [reverseGeocode]);

    const resetLocation = () => {
        setCoords(null);
        setResolvedAddress("");
        localStorage.removeItem(LOC_KEY);
        localStorage.removeItem(ADDR_KEY);
        requestLocation();
    };

    useEffect(() => {
        async function fetchItem() {
            try {
                const res  = await fetch(`${API_BASE}/api/menu`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const found = json.data.find(d => d.name.toLowerCase().trim() === decodedFood.toLowerCase().trim());
                    setItem(found || null);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchItem();
    }, [decodedFood]);

    const now           = new Date();
    const orderDateTime = now.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });

    const rawPrice = (() => {
        const src = selectedVariant?.price || decodedPrice;
        return parseInt(String(src).replace(/[^\d]/g, "")) || 0;
    })();

    const addonTotal = selectedAddons.reduce((s, a) => s + (parseInt(String(a.price || "0").replace(/[^\d]/g, "")) || 0), 0);
    const subtotalBeforeGst = (rawPrice + addonTotal) * qty;

    // ── Coupon discount ────────────────────────────────────────────────────
    const couponDiscount = (() => {
        if (!appliedCoupon) return orderState.couponDiscount || 0;
        if (appliedCoupon.discountType === "Flat") return Math.min(appliedCoupon.discountValue, subtotalBeforeGst);
        const pct = Math.round(subtotalBeforeGst * appliedCoupon.discountValue / 100);
        return appliedCoupon.maxDiscount > 0 ? Math.min(pct, appliedCoupon.maxDiscount) : pct;
    })();

    const subtotalAfterCoupon = subtotalBeforeGst - couponDiscount;
    const gstAmount           = Math.round(subtotalAfterCoupon * GST_RATE);
    const totalAmount         = subtotalAfterCoupon + gstAmount;

    // Legacy item-level discount (kept for backward compat)
    const itemDiscount       = orderState.discount || item?.discount || null;
    const itemDiscountAmount = itemDiscount ? Math.round(totalAmount * (parseInt(itemDiscount) / 100)) : 0;
    const finalAmount        = totalAmount - itemDiscountAmount;

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        if (errors[name]) setErrors(er => ({ ...er, [name]: "" }));
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Full name is required";
        if (!form.mobile.trim())   e.mobile   = "Mobile number is required";
        else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = "Enter a valid 10-digit Indian mobile number";
        if (!coords) e.location = "Please enable location access to place your order";
        return e;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            if (errs.location) requestLocation();
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                email:               user?.email || "",
                foodId:              orderState.itemId || item?._id || null,
                itemName:            decodedFood,
                variant:             selectedVariant?.label || "Standard",
                addons:              selectedAddons.map(a => `${a.label} (${a.price})`).join(", "),
                quantity:            qty,
                specialInstructions: note,
                orderDateTime:       now.toISOString(),
                paymentMethod:       "Cash",
                baseAmount:          rawPrice,
                addonTotal,
                couponCode:          appliedCoupon?.code || null,
                discountAmount:      couponDiscount,
                couponDiscount,
                gstAmount,
                totalAmount:         finalAmount,
                discountApplied:     appliedCoupon
                    ? `${appliedCoupon.code} (${appliedCoupon.discountType === "Percentage" ? appliedCoupon.discountValue + "%" : "₹" + appliedCoupon.discountValue} off)`
                    : itemDiscount ? `${itemDiscount}% off` : "None",
                estimatedDelivery:   ESTIMATED_DELIVERY,
                customerId:          user?._id || user?.id || null,
                fullName:            form.fullName.trim(),
                mobile:              form.mobile.trim(),
                deliveryAddress:     resolvedAddress,
                latitude:            coords.lat,
                longitude:           coords.lng,
                orderStatus:         "Placed",
                deliveryPartner:     null,
            };

            const res  = await fetch(`${API_BASE}/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success || json.orderId || json._id) {
    setDeliveryOtp(json.deliveryOtp);
    setOrderId(json.orderId || json._id || "NK" + Date.now());
    setSubmitted(true);
                if (appliedCoupon?.code) {
    fetch(`${API_BASE}/api/coupons/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code: appliedCoupon.code,
            customerId: user?._id || user?.id || null,
            
        }),
    }).catch(() => {});
}
                window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                throw new Error(json.message || "Order failed");
            }
        } catch (err) {
            alert("Something went wrong: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F1EA" }}>
            <div className="off-spinner" />
            <style>{STYLES}</style>
        </div>
    );

    if (submitted) return (
        <>
            <link href={FONT_LINK} rel="stylesheet" />
            <div className="off-root">
                <Navbar user={user} onLogout={onLogout} activeNav={activeNav} setActiveNav={setActiveNav} cart={cart} />
                <div className="off-success-wrap">
                    <div className="off-success-card">
                        <div className="off-success-icon">✓</div>
                        <h2 className="off-success-title">Order Placed!</h2>
                        <p className="off-success-sub">Your order has been received. We'll start preparing it right away.</p>
                        {orderId && (
    <div className="off-order-id-wrap">
        <span className="off-order-id-label">Order ID</span>
        <span className="off-order-id-val">#{String(orderId).slice(-8).toUpperCase()}</span>
    </div>
)}
{deliveryOtp && (
    <div className="off-otp-wrap">
        <span className="off-otp-label">Delivery OTP</span>
        <span className="off-otp-val">{deliveryOtp}</span>
        <p className="off-otp-hint">Share this with the delivery agent on arrival</p>
    </div>
)}
<div className="off-success-details">
                            <div className="off-suc-row"><span>Item</span><strong>{decodedFood}</strong></div>
                            {couponDiscount > 0 && (
                                <div className="off-suc-row">
                                    <span>Coupon ({appliedCoupon?.code})</span>
                                    <strong style={{ color: "#2E7D32" }}>−₹{couponDiscount.toLocaleString("en-IN")}</strong>
                                </div>
                            )}
                            <div className="off-suc-row"><span>Total Paid</span><strong>₹{finalAmount.toLocaleString("en-IN")}</strong></div>
                            <div className="off-suc-row"><span>Payment</span><strong>Cash on Delivery</strong></div>
                            <div className="off-suc-row"><span>Delivery to</span><strong style={{maxWidth:220,textAlign:"right",fontSize:12}}>{resolvedAddress.split(",").slice(0,3).join(", ")}</strong></div>
                            <div className="off-suc-row"><span>Estimated Time</span><strong>{ESTIMATED_DELIVERY}</strong></div>
                            <div className="off-suc-row"><span>Status</span><strong className="off-status-placed">● Placed</strong></div>
                        </div>
                        {couponDiscount > 0 && (
                            <div className="off-success-savings">
                                🎉 You saved ₹{couponDiscount.toLocaleString("en-IN")} on this order!
                            </div>
                        )}
                        <div className="off-success-btns">
                            <button className="off-btn-primary" onClick={() => navigate("/dashboard")}>Back to Home</button>
                            <button className="off-btn-outline" onClick={() => navigate("/NoirKitchen/Menu")}>Order More</button>
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
            <div className="off-root">
                <Navbar user={user} onLogout={onLogout} activeNav={activeNav} setActiveNav={setActiveNav} cart={cart} />

                <div className="off-hero">
                    <div className="off-hero-inner">
                        <p className="off-eyebrow">Noir Kitchen <span className="off-orn">✦</span> Place Your Order</p>
                        <h1 className="off-hero-h1">Almost There — <em className="off-accent">Confirm Your Order</em></h1>
                        <p className="off-hero-sub">Review your order details and confirm your GPS delivery location below.</p>
                    </div>
                </div>

                <form className="off-form-wrap" onSubmit={handleSubmit} noValidate>
                    <div className="off-layout">

                        {/* ── LEFT ── */}
                        <div className="off-left">
                            <div className="off-item-card">
                                {(itemImg || item?.img) && (
                                    <img src={itemImg || item?.img} alt={decodedFood} className="off-item-img" />
                                )}
                                <div className="off-item-info">
                                    <span className={`off-veg-dot ${item?.veg ? "off-veg" : "off-nonveg"}`}>
                                        <span className="off-veg-circle" />
                                    </span>
                                    <div>
                                        <h3 className="off-item-name">{decodedFood}</h3>
                                        <span className="off-item-cat">{item?.category || "Signature"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="off-section">
                                <div className="off-section-hd">
                                    <span className="off-section-icon">🔒</span>
                                    <div>
                                        <h3 className="off-section-title">Order Details</h3>
                                        <p className="off-section-sub">Auto-filled from your account &amp; selection</p>
                                    </div>
                                </div>
                                <div className="off-fields-grid">
                                    <ReadonlyField label="Ordered Item" value={decodedFood} icon="🍽" />
                                    <ReadonlyField label="Variant" value={selectedVariant?.label || "Standard"} icon="📋" />
                                    <ReadonlyField label="Quantity" value={String(qty)} icon="📦" />
                                    <ReadonlyField label="Add-ons" value={selectedAddons.length ? selectedAddons.map(a => a.label).join(", ") : "None"} icon="➕" />
                                    <ReadonlyField label="Special Note" value={note || "None"} icon="📝" />
                                    <ReadonlyField label="Payment Method" value="Cash on Delivery" icon="💵" />
                                    <ReadonlyField label="Order Date & Time" value={orderDateTime} icon="🕐" />
                                    <ReadonlyField label="Estimated Delivery" value={ESTIMATED_DELIVERY} icon="🛵" />
                                </div>
                            </div>

                            {/* ── PRICE BREAKDOWN ── */}
                            <div className="off-section">
                                <div className="off-section-hd">
                                    <span className="off-section-icon">💰</span>
                                    <div>
                                        <h3 className="off-section-title">Price Breakdown</h3>
                                        <p className="off-section-sub">Including GST &amp; applicable offers</p>
                                    </div>
                                </div>
                                <div className="off-price-breakdown">
                                    <div className="off-price-row"><span>Item Price × {qty}</span><span>₹{(rawPrice * qty).toLocaleString("en-IN")}</span></div>
                                    {addonTotal > 0 && <div className="off-price-row"><span>Add-ons</span><span>+ ₹{(addonTotal * qty).toLocaleString("en-IN")}</span></div>}
                                    {couponDiscount > 0 && (
                                        <div className="off-price-row off-price-coupon">
                                            <span>
                                                🎟 Coupon ({appliedCoupon?.code || "Applied"})
                                            </span>
                                            <span>− ₹{couponDiscount.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    <div className="off-price-row"><span>GST (18%)</span><span>+ ₹{gstAmount.toLocaleString("en-IN")}</span></div>
                                    {itemDiscountAmount > 0 && (
                                        <div className="off-price-row off-price-discount"><span>Discount ({itemDiscount}% off)</span><span>− ₹{itemDiscountAmount.toLocaleString("en-IN")}</span></div>
                                    )}
                                    <div className="off-price-divider" />
                                    <div className="off-price-row off-price-total"><span>Total Amount</span><span>₹{finalAmount.toLocaleString("en-IN")}</span></div>
                                    {couponDiscount > 0 && (
                                        <p className="off-price-savings-msg">
                                            ✓ Coupon saves you ₹{couponDiscount.toLocaleString("en-IN")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT ── */}
                        <div className="off-right">
                            <div className="off-section">
                                <div className="off-section-hd">
                                    <span className="off-section-icon">👤</span>
                                    <div>
                                        <h3 className="off-section-title">Your Details</h3>
                                        <p className="off-section-sub">Enter your contact information</p>
                                    </div>
                                </div>
                                <div className="off-fields-col">
                                    <InputField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" required error={errors.fullName} />
                                    <InputField label="Mobile Number" name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile number" type="tel" required error={errors.mobile} />
                                </div>
                            </div>

                            {/* ── COUPON SECTION (on order form too) ── */}
                            <div className="off-section">
                                <div className="off-section-hd">
                                    <span className="off-section-icon">🎟</span>
                                    <div>
                                        <h3 className="off-section-title">Coupon Code</h3>
                                        <p className="off-section-sub">
                                            {appliedCoupon ? "Coupon applied — discount reflected in total" : "Have a coupon? Apply it here"}
                                        </p>
                                    </div>
                                </div>
                                <CouponSection
                                    subtotal={subtotalBeforeGst}
                                    appliedCoupon={appliedCoupon}
                                    onApply={setAppliedCoupon}
                                    onRemove={() => setAppliedCoupon(null)}
                                />
                            </div>

                            {/* ── GPS / MAP SECTION ── */}
                            <div className="off-section">
                                <div className="off-section-hd">
                                    <span className="off-section-icon">📍</span>
                                    <div>
                                        <h3 className="off-section-title">Delivery Location</h3>
                                        <p className="off-section-sub">
                                            {coords ? "Your GPS location is confirmed for delivery" : "We need your live location to deliver accurately"}
                                        </p>
                                    </div>
                                </div>
                                <LocationSection
                                    coords={coords}
                                    resolvedAddress={resolvedAddress}
                                    locating={locating}
                                    locError={locError}
                                    onRequestLocation={requestLocation}
                                    onReset={resetLocation}
                                />
                                {errors.location && <p className="off-err-msg" style={{marginTop:10}}>{errors.location}</p>}
                            </div>

                            {/* ── STICKY SUMMARY ── */}
                            <div className="off-sticky-summary">
                                <div className="off-summary-item">
                                    <span className="off-summary-label">Item</span>
                                    <span className="off-summary-val">{decodedFood}</span>
                                </div>
                                {couponDiscount > 0 && (
                                    <div className="off-summary-item">
                                        <span className="off-summary-label">Coupon Savings</span>
                                        <span className="off-summary-coupon-val">−₹{couponDiscount.toLocaleString("en-IN")}</span>
                                    </div>
                                )}
                                <div className="off-summary-item">
                                    <span className="off-summary-label">Total</span>
                                    <span className="off-summary-total">₹{finalAmount.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="off-summary-item">
                                    <span className="off-summary-label">Payment</span>
                                    <span className="off-summary-val">Cash on Delivery</span>
                                </div>

                                <div className={`off-loc-status-pill ${coords ? "off-loc-ok" : "off-loc-pending"}`}>
                                    {coords ? (
                                        <><span className="off-loc-dot" />GPS Location Confirmed</>
                                    ) : (
                                        <><span className="off-loc-dot" />Waiting for Location…</>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className={`off-btn-primary off-submit-btn ${submitting ? "off-btn-loading" : ""} ${!coords ? "off-btn-disabled-loc" : ""}`}
                                    disabled={submitting || !coords}
                                >
                                    {submitting ? (
                                        <><span className="off-btn-spinner" /> Placing Order…</>
                                    ) : !coords ? (
                                        <>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:8}}>
                                                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                                            </svg>
                                            Enable Location to Continue
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:8}}>
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                            Place Order
                                        </>
                                    )}
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
.off-root { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; background: #F8F1EA; color: #1A1208; overflow-x: hidden; }
.off-spinner { width: 38px; height: 38px; border-radius: 50%; border: 3px solid rgba(216,106,28,0.15); border-top-color: #D86A1C; animation: offSpin 0.8s linear infinite; }
@keyframes offSpin { to { transform: rotate(360deg); } }
.off-otp-wrap { background: rgba(216,106,28,0.06); border: 1.5px dashed rgba(216,106,28,0.35); border-radius: 14px; padding: 16px 24px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.off-otp-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #9A8570; }
.off-otp-val { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 600; color: #D86A1C; letter-spacing: 8px; }
.off-otp-hint { font-size: 11px; color: #9A8570; margin-top: 2px; }
.off-hero { background: linear-gradient(135deg,#2B1600,#4A2500); padding: 52px 48px 48px; text-align: center; }
.off-hero-inner { max-width: 680px; margin: 0 auto; }
.off-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #F0924A; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px; }
.off-orn { opacity: 0.6; }
.off-hero-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px,4vw,52px); font-weight: 600; line-height: 1.1; color: #F8F1EA; margin-bottom: 14px; }
.off-accent { font-style: italic; color: #F0924A; }
.off-hero-sub { font-size: 14px; color: rgba(248,241,234,0.6); line-height: 1.7; }

.off-form-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 40px 80px; }
.off-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }

.off-item-card { display: flex; align-items: center; gap: 16px; background: #fff; border-radius: 16px; padding: 16px 20px; border: 1px solid rgba(216,106,28,0.12); box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 20px; }
.off-item-img { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.off-item-info { display: flex; align-items: center; gap: 12px; flex: 1; }
.off-item-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208; line-height: 1.2; }
.off-item-cat { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #D86A1C; background: rgba(216,106,28,0.08); border-radius: 20px; padding: 3px 10px; display: block; margin-top: 4px; }
.off-veg-dot { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0; }
.off-veg { border: 1.5px solid #4CAF50; } .off-nonveg { border: 1.5px solid #D32F2F; }
.off-veg-circle { width: 9px; height: 9px; border-radius: 50%; }
.off-veg .off-veg-circle { background: #4CAF50; } .off-nonveg .off-veg-circle { background: #D32F2F; }

.off-section { background: #fff; border-radius: 20px; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 24px; margin-bottom: 20px; }
.off-section-hd { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 18px; margin-bottom: 20px; border-bottom: 1px solid rgba(216,106,28,0.1); }
.off-section-icon { font-size: 22px; line-height: 1; flex-shrink: 0; margin-top: 2px; }
.off-section-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208; margin-bottom: 3px; }
.off-section-sub { font-size: 12px; color: #9A8570; }

.off-field-wrap { display: flex; flex-direction: column; gap: 6px; }
.off-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8570; }
.off-req { color: #D86A1C; margin-left: 3px; }
.off-readonly { display: flex; align-items: center; gap: 10px; background: rgba(248,241,234,0.6); border: 1.5px solid rgba(216,106,28,0.12); border-radius: 12px; padding: 11px 14px; }
.off-readonly-icon { font-size: 14px; flex-shrink: 0; }
.off-readonly-val { font-size: 13px; color: #1A1208; font-weight: 500; flex: 1; }
.off-lock { margin-left: auto; color: #C4B09A; flex-shrink: 0; }
.off-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.off-fields-col { display: flex; flex-direction: column; gap: 14px; }
.off-input-wrap { display: flex; align-items: center; background: #fff; border: 1.5px solid rgba(216,106,28,0.2); border-radius: 12px; padding: 0 14px; transition: border-color 0.2s, box-shadow 0.2s; }
.off-input-focus { border-color: #D86A1C; box-shadow: 0 0 0 3px rgba(216,106,28,0.1); }
.off-input-err { border-color: #D32F2F; }
.off-input-disabled { background: rgba(248,241,234,0.6); }
.off-input { flex: 1; border: none; background: transparent; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1A1208; padding: 12px 0; }
.off-input::placeholder { color: #C4B09A; }
.off-input:disabled { color: #6B5B45; }
.off-err-msg { font-size: 11px; color: #D32F2F; font-weight: 500; }

/* ── COUPON ── */
.off-coupon-wrap { display: flex; flex-direction: column; gap: 8px; }
.off-coupon-row { display: flex; gap: 10px; }
.off-coupon-input-wrap {
  flex: 1; display: flex; align-items: center; gap: 8px;
  background: rgba(248,241,234,0.6); border: 1.5px solid rgba(216,106,28,0.2);
  border-radius: 12px; padding: 0 12px; transition: border-color 0.2s;
}
.off-coupon-input-wrap:focus-within { border-color: #D86A1C; background: #fff; }
.off-coupon-icon-sm { font-size: 14px; flex-shrink: 0; }
.off-coupon-input {
  flex: 1; border: none; background: transparent; outline: none;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;
  font-weight: 600; color: #1A1208; letter-spacing: 1px; padding: 11px 0;
}
.off-coupon-input::placeholder { color: #C4B09A; font-weight: 400; letter-spacing: 0; }
.off-coupon-btn {
  flex-shrink: 0; padding: 11px 20px;
  background: linear-gradient(135deg,#D86A1C,#F0924A);
  color: #fff; border: none; border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; min-width: 70px;
}
.off-coupon-btn:hover:not(:disabled) { transform: translateY(-1px); }
.off-coupon-btn:disabled { opacity: 0.7; cursor: wait; }
.off-coupon-spinner { width: 13px; height: 13px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: offSpin 0.7s linear infinite; }
.off-coupon-error { font-size: 11px; color: #D32F2F; font-weight: 500; }

.off-coupon-applied {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border-radius: 12px;
  background: rgba(46,125,50,0.06); border: 1.5px solid rgba(46,125,50,0.25);
}
.off-coupon-icon { font-size: 18px; flex-shrink: 0; }
.off-coupon-info { flex: 1; }
.off-coupon-code { font-size: 13px; font-weight: 700; color: #2E7D32; letter-spacing: 1px; display: block; }
.off-coupon-desc { font-size: 11px; color: #6B5B45; display: block; margin-top: 2px; }
.off-coupon-savings { font-size: 15px; font-weight: 700; color: #2E7D32; flex-shrink: 0; }
.off-coupon-remove { width: 26px; height: 26px; border-radius: 50%; background: rgba(211,47,47,0.08); border: 1px solid rgba(211,47,47,0.2); color: #D32F2F; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; flex-shrink: 0; }
.off-coupon-remove:hover { background: rgba(211,47,47,0.15); }

/* ── PRICE ── */
.off-price-breakdown { display: flex; flex-direction: column; gap: 10px; }
.off-price-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #6B5B45; }
.off-price-discount { color: #2E7D32; }
.off-price-coupon { color: #2E7D32; font-weight: 600; }
.off-price-total { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208; }
.off-price-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(216,106,28,0.2), transparent); margin: 4px 0; }
.off-price-savings-msg { font-size: 11px; color: #2E7D32; font-weight: 600; background: rgba(46,125,50,0.06); padding: 7px 10px; border-radius: 8px; }

/* ── LOCATION ── */
.off-loc-prompt { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 28px 20px; gap: 12px; background: rgba(216,106,28,0.03); border-radius: 14px; border: 1.5px dashed rgba(216,106,28,0.25); }
.off-loc-prompt-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(216,106,28,0.08); display: flex; align-items: center; justify-content: center; }
.off-loc-prompt-title { font-size: 15px; font-weight: 700; color: #1A1208; }
.off-loc-prompt-sub { font-size: 12px; color: #9A8570; line-height: 1.7; max-width: 300px; }
.off-loc-detecting { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 14px; background: rgba(216,106,28,0.04); border: 1px solid rgba(216,106,28,0.15); }
.off-loc-pulse { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; border: 3px solid rgba(216,106,28,0.15); border-top-color: #D86A1C; animation: offSpin 0.8s linear infinite; }
.off-loc-det-title { font-size: 13px; font-weight: 700; color: #1A1208; margin-bottom: 3px; }
.off-loc-det-sub { font-size: 11px; color: #9A8570; }
.off-loc-error-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px; gap: 10px; background: rgba(211,47,47,0.04); border-radius: 14px; border: 1.5px solid rgba(211,47,47,0.2); }
.off-loc-err-icon { font-size: 28px; }
.off-loc-err-title { font-size: 14px; font-weight: 700; color: #D32F2F; }
.off-loc-err-msg { font-size: 12px; color: #6B5B45; line-height: 1.6; max-width: 300px; }
.off-loc-btn { display: inline-flex; align-items: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; color: #D86A1C; background: rgba(216,106,28,0.1); border: 1.5px solid rgba(216,106,28,0.3); border-radius: 24px; padding: 9px 20px; cursor: pointer; transition: all 0.2s; }
.off-loc-btn:hover { background: rgba(216,106,28,0.18); transform: translateY(-1px); }
.off-loc-btn-main { color: #fff; background: linear-gradient(135deg,#D86A1C,#F0924A); border-color: transparent; box-shadow: 0 6px 18px rgba(216,106,28,0.3); padding: 12px 28px; font-size: 13px; }
.off-loc-btn-main:hover { box-shadow: 0 10px 24px rgba(216,106,28,0.4); }
.off-loc-map-wrap { display: flex; flex-direction: column; gap: 12px; }
.off-loc-map-frame { position: relative; border-radius: 14px; overflow: hidden; height: 200px; border: 1.5px solid rgba(216,106,28,0.2); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.off-loc-map-frame iframe { width: 100%; height: 100%; border: 0; display: block; }
.off-loc-map-badge { position: absolute; top: 10px; left: 10px; display: inline-flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); border-radius: 20px; padding: 4px 12px; font-size: 10px; font-weight: 700; color: #D86A1C; border: 1px solid rgba(216,106,28,0.2); }
.off-loc-addr-row { display: flex; align-items: flex-start; gap: 8px; background: rgba(248,241,234,0.8); border-radius: 10px; padding: 10px 14px; border: 1px solid rgba(216,106,28,0.1); }
.off-loc-addr-text { font-size: 12px; color: #6B5B45; line-height: 1.6; flex: 1; }
.off-loc-update-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: #D86A1C; background: none; border: none; cursor: pointer; white-space: nowrap; padding: 2px 0; flex-shrink: 0; transition: opacity 0.2s; }
.off-loc-update-btn:hover { opacity: 0.7; }
.off-loc-coords-pill { font-size: 10px; color: #C4B09A; font-family: monospace; text-align: center; letter-spacing: 0.5px; }

/* ── SUMMARY ── */
.off-sticky-summary { position: sticky; top: 100px; background: #fff; border-radius: 20px; border: 1px solid rgba(216,106,28,0.15); box-shadow: 0 8px 32px rgba(216,106,28,0.12); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.off-summary-item { display: flex; justify-content: space-between; align-items: center; }
.off-summary-label { font-size: 11px; font-weight: 600; color: #9A8570; text-transform: uppercase; letter-spacing: 1px; }
.off-summary-val { font-size: 13px; font-weight: 600; color: #1A1208; max-width: 180px; text-align: right; }
.off-summary-total { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #D86A1C; }
.off-summary-coupon-val { font-size: 14px; font-weight: 700; color: #2E7D32; }

.off-loc-status-pill { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 7px 14px; letter-spacing: 0.3px; }
.off-loc-ok { background: rgba(76,175,80,0.1); color: #2E7D32; border: 1px solid rgba(76,175,80,0.25); }
.off-loc-pending { background: rgba(216,106,28,0.08); color: #D86A1C; border: 1px solid rgba(216,106,28,0.2); }
.off-loc-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.off-loc-ok .off-loc-dot { background: #4CAF50; }
.off-loc-pending .off-loc-dot { background: #D86A1C; animation: offPulse 1.2s ease-in-out infinite; }
@keyframes offPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

.off-btn-primary { width: 100%; padding: 15px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; border: none; border-radius: 50px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(216,106,28,0.35); transition: all 0.25s; display: flex; align-items: center; justify-content: center; }
.off-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(216,106,28,0.45); }
.off-btn-primary:disabled { opacity: 0.75; cursor: not-allowed; }
.off-btn-disabled-loc { background: linear-gradient(135deg,#9A8570,#B8A090) !important; box-shadow: none !important; }
.off-btn-loading { opacity: 0.85; }
.off-btn-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: offSpin 0.7s linear infinite; margin-right: 10px; }
.off-btn-outline { padding: 14px 28px; background: transparent; color: #D86A1C; border: 1.5px solid #D86A1C; border-radius: 50px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.25s; width: 100%; }
.off-btn-outline:hover { background: #D86A1C; color: #fff; transform: translateY(-2px); }
.off-submit-btn { margin-top: 4px; }

/* ── SUCCESS ── */
.off-success-wrap { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
.off-success-card { background: #fff; border-radius: 28px; border: 1px solid rgba(216,106,28,0.12); box-shadow: 0 20px 60px rgba(0,0,0,0.1); padding: 48px 40px; max-width: 520px; width: 100%; text-align: center; animation: offScaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes offScaleIn { from{opacity:0;transform:scale(0.9);} to{opacity:1;transform:scale(1);} }
.off-success-icon { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#4CAF50,#66BB6A); color: #fff; font-size: 32px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 8px 28px rgba(76,175,80,0.35); }
.off-success-title { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 600; color: #1A1208; margin-bottom: 10px; }
.off-success-sub { font-size: 14px; color: #6B5B45; line-height: 1.7; margin-bottom: 24px; }
.off-order-id-wrap { display: inline-flex; align-items: center; gap: 10px; background: rgba(216,106,28,0.08); border: 1px solid rgba(216,106,28,0.2); border-radius: 12px; padding: 10px 20px; margin-bottom: 24px; }
.off-order-id-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #D86A1C; }
.off-order-id-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1208; }
.off-success-details { background: #F8F1EA; border-radius: 14px; padding: 16px 20px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px; text-align: left; }
.off-suc-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; font-size: 13px; }
.off-suc-row span { color: #9A8570; flex-shrink: 0; } .off-suc-row strong { color: #1A1208; font-weight: 600; text-align: right; }
.off-status-placed { color: #D86A1C !important; }
.off-success-savings { background: rgba(46,125,50,0.08); border: 1px solid rgba(46,125,50,0.2); border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 700; color: #2E7D32; margin-bottom: 20px; }
.off-success-btns { display: flex; flex-direction: column; gap: 10px; }

@media (max-width: 900px) {
  .off-layout { grid-template-columns: 1fr; }
  .off-sticky-summary { position: static; }
  .off-form-wrap { padding: 28px 20px 60px; }
  .off-hero { padding: 40px 20px 36px; }
  .off-fields-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .off-success-card { padding: 32px 20px; }
  .off-hero { padding: 32px 16px 28px; }
  .off-form-wrap { padding: 20px 14px 48px; }
  .off-loc-map-frame { height: 160px; }
  .off-coupon-row { flex-direction: column; }
  .off-coupon-btn { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .off-success-card { animation: none; }
  .off-loc-pending .off-loc-dot { animation: none; }
}
`;