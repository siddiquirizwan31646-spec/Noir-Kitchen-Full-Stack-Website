import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../component/ui/Navbar";

const FONT_LINK =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GST_RATE = 0.18;
const ESTIMATED_DELIVERY = "30–45 minutes";

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

export default function OrderFoodForm({ user: propUser, onLogout, cart }) {
    const { foodName, vegType, price, customerName, username, addressStr } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const orderState = location.state || {};

    const qty              = orderState.qty || 1;
    const note             = orderState.note || "";
    const selectedVariant  = orderState.selectedVariant || null;
    const selectedAddons   = orderState.selectedAddons || [];
    const itemImg          = orderState.itemImg || "";
    const user             = propUser || { name: customerName || "Guest", email: "" };
    const decodedFood      = decodeURIComponent(foodName || "");
    const decodedPrice     = decodeURIComponent(price || "0");
    const decodedAddress   = decodeURIComponent(addressStr || "");
    const isPlaceholder    = decodedAddress.startsWith("ADDR-");

    const [item, setItem]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted]   = useState(false);
    const [orderId, setOrderId]       = useState(null);
    const [errors, setErrors]         = useState({});
    const [activeNav, setActiveNav]   = useState("Menu");

    const [form, setForm] = useState({
        fullName: user?.name || "",
        mobile:   user?.phone || "",
        houseNo: "", areaName: "", areaNo: "", city: "", pinCode: "",
    });

    useEffect(() => {
        if (user?.address && !isPlaceholder) {
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
        async function fetchItem() {
            try {
                const res  = await fetch(`${API_BASE}/api/menu`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const found = json.data.find(
                        d => d.name.toLowerCase().trim() === decodedFood.toLowerCase().trim()
                    );
                    setItem(found || null);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchItem();
    }, [decodedFood]);

    const now = new Date();
    const orderDateTime = now.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
    const rawPrice = (() => {
        const src = selectedVariant?.price || decodedPrice;
        return parseInt(String(src).replace(/[^\d]/g, "")) || 0;
    })();
    const addonTotal     = selectedAddons.reduce((s, a) => s + (parseInt(String(a.price || "0").replace(/[^\d]/g, "")) || 0), 0);
    const gstAmount      = Math.round((rawPrice + addonTotal) * qty * GST_RATE);
    const totalAmount    = (rawPrice + addonTotal) * qty + gstAmount;
    const discount       = orderState.discount || item?.discount || null;
    const discountAmount = discount ? Math.round(totalAmount * (parseInt(discount) / 100)) : 0;
    const finalAmount    = totalAmount - discountAmount;

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
        if (!form.houseNo.trim())  e.houseNo  = "House / Flat No. is required";
        if (!form.areaName.trim()) e.areaName = "Area / Apartment Name is required";
        if (!form.areaNo.trim())   e.areaNo   = "Area / Apartment No. is required";
        if (!form.city.trim())     e.city     = "City is required";
        if (!form.pinCode.trim())  e.pinCode  = "PIN Code is required";
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
                gstAmount,
                totalAmount:         finalAmount,
                discountApplied:     discount ? `${discount}% off` : "None",
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

            const res  = await fetch(`${API_BASE}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success || json.orderId || json._id) {
                setOrderId(json.orderId || json._id || "NK" + Date.now());
                setSubmitted(true);
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
                        <div className="off-success-details">
                            <div className="off-suc-row"><span>Item</span><strong>{decodedFood}</strong></div>
                            <div className="off-suc-row"><span>Total Paid</span><strong>₹{finalAmount.toLocaleString("en-IN")}</strong></div>
                            <div className="off-suc-row"><span>Payment</span><strong>Cash on Delivery</strong></div>
                            <div className="off-suc-row"><span>Delivery to</span><strong>{form.city}</strong></div>
                            <div className="off-suc-row"><span>Estimated Time</span><strong>{ESTIMATED_DELIVERY}</strong></div>
                            <div className="off-suc-row"><span>Status</span><strong className="off-status-placed">● Placed</strong></div>
                        </div>
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
                        <p className="off-hero-sub">Review your order details and fill in your delivery information below.</p>
                    </div>
                </div>

                <form className="off-form-wrap" onSubmit={handleSubmit} noValidate>
                    <div className="off-layout">
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
                                    <div className="off-price-row"><span>GST (18%)</span><span>+ ₹{gstAmount.toLocaleString("en-IN")}</span></div>
                                    {discountAmount > 0 && <div className="off-price-row off-price-discount"><span>Discount ({discount}% off)</span><span>− ₹{discountAmount.toLocaleString("en-IN")}</span></div>}
                                    <div className="off-price-divider" />
                                    <div className="off-price-row off-price-total"><span>Total Amount</span><span>₹{finalAmount.toLocaleString("en-IN")}</span></div>
                                </div>
                            </div>
                        </div>

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

                            <div className="off-section">
                                <div className="off-section-hd">
                                    <span className="off-section-icon">📍</span>
                                    <div>
                                        <h3 className="off-section-title">Delivery Address</h3>
                                        <p className="off-section-sub">Where should we deliver your order?</p>
                                    </div>
                                </div>
                                <div className="off-fields-col">
                                    <InputField label="House / Flat No." name="houseNo" value={form.houseNo} onChange={handleChange} placeholder="e.g. B-204, Tower 3" required error={errors.houseNo} />
                                    <InputField label="Area / Apartment Name" name="areaName" value={form.areaName} onChange={handleChange} placeholder="e.g. Green Valley Apartments" required error={errors.areaName} />
                                    <InputField label="Area / Apartment No." name="areaNo" value={form.areaNo} onChange={handleChange} placeholder="e.g. Sector 14" required error={errors.areaNo} />
                                    <div className="off-fields-row-2">
                                        <InputField label="City" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Jaipur" required error={errors.city} />
                                        <InputField label="PIN Code" name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="6-digit PIN" required error={errors.pinCode} />
                                    </div>
                                </div>
                            </div>

                            <div className="off-sticky-summary">
                                <div className="off-summary-item"><span className="off-summary-label">Item</span><span className="off-summary-val">{decodedFood}</span></div>
                                <div className="off-summary-item"><span className="off-summary-label">Total</span><span className="off-summary-total">₹{finalAmount.toLocaleString("en-IN")}</span></div>
                                <div className="off-summary-item"><span className="off-summary-label">Payment</span><span className="off-summary-val">Cash on Delivery</span></div>
                                <button type="submit" className={`off-btn-primary off-submit-btn ${submitting ? "off-btn-loading" : ""}`} disabled={submitting}>
                                    {submitting ? (
                                        <><span className="off-btn-spinner" /> Placing Order…</>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
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
.off-fields-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.off-input-wrap { display: flex; align-items: center; background: #fff; border: 1.5px solid rgba(216,106,28,0.2); border-radius: 12px; padding: 0 14px; transition: border-color 0.2s, box-shadow 0.2s; }
.off-input-focus { border-color: #D86A1C; box-shadow: 0 0 0 3px rgba(216,106,28,0.1); }
.off-input-err { border-color: #D32F2F; }
.off-input-disabled { background: rgba(248,241,234,0.6); }
.off-input { flex: 1; border: none; background: transparent; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1A1208; padding: 12px 0; }
.off-input::placeholder { color: #C4B09A; }
.off-input:disabled { color: #6B5B45; }
.off-err-msg { font-size: 11px; color: #D32F2F; font-weight: 500; }

.off-price-breakdown { display: flex; flex-direction: column; gap: 10px; }
.off-price-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #6B5B45; }
.off-price-discount { color: #2E7D32; }
.off-price-total { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208; }
.off-price-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(216,106,28,0.2), transparent); margin: 4px 0; }

.off-sticky-summary { position: sticky; top: 100px; background: #fff; border-radius: 20px; border: 1px solid rgba(216,106,28,0.15); box-shadow: 0 8px 32px rgba(216,106,28,0.12); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.off-summary-item { display: flex; justify-content: space-between; align-items: center; }
.off-summary-label { font-size: 11px; font-weight: 600; color: #9A8570; text-transform: uppercase; letter-spacing: 1px; }
.off-summary-val { font-size: 13px; font-weight: 600; color: #1A1208; max-width: 180px; text-align: right; }
.off-summary-total { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #D86A1C; }

.off-btn-primary { width: 100%; padding: 15px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; border: none; border-radius: 50px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(216,106,28,0.35); transition: all 0.25s; display: flex; align-items: center; justify-content: center; }
.off-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(216,106,28,0.45); }
.off-btn-primary:disabled { opacity: 0.75; cursor: not-allowed; }
.off-btn-loading { opacity: 0.85; }
.off-btn-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: offSpin 0.7s linear infinite; margin-right: 10px; }
.off-btn-outline { padding: 14px 28px; background: transparent; color: #D86A1C; border: 1.5px solid #D86A1C; border-radius: 50px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.25s; width: 100%; }
.off-btn-outline:hover { background: #D86A1C; color: #fff; transform: translateY(-2px); }
.off-submit-btn { margin-top: 4px; }

.off-success-wrap { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
.off-success-card { background: #fff; border-radius: 28px; border: 1px solid rgba(216,106,28,0.12); box-shadow: 0 20px 60px rgba(0,0,0,0.1); padding: 48px 40px; max-width: 520px; width: 100%; text-align: center; animation: offScaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes offScaleIn { from{opacity:0;transform:scale(0.9);} to{opacity:1;transform:scale(1);} }
.off-success-icon { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg,#4CAF50,#66BB6A); color: #fff; font-size: 32px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 8px 28px rgba(76,175,80,0.35); }
.off-success-title { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 600; color: #1A1208; margin-bottom: 10px; }
.off-success-sub { font-size: 14px; color: #6B5B45; line-height: 1.7; margin-bottom: 24px; }
.off-order-id-wrap { display: inline-flex; align-items: center; gap: 10px; background: rgba(216,106,28,0.08); border: 1px solid rgba(216,106,28,0.2); border-radius: 12px; padding: 10px 20px; margin-bottom: 24px; }
.off-order-id-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #D86A1C; }
.off-order-id-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1208; }
.off-success-details { background: #F8F1EA; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px; text-align: left; }
.off-suc-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.off-suc-row span { color: #9A8570; } .off-suc-row strong { color: #1A1208; font-weight: 600; }
.off-status-placed { color: #D86A1C !important; }
.off-success-btns { display: flex; flex-direction: column; gap: 10px; }

@media (max-width: 900px) {
  .off-layout { grid-template-columns: 1fr; }
  .off-sticky-summary { position: static; }
  .off-form-wrap { padding: 28px 20px 60px; }
  .off-hero { padding: 40px 20px 36px; }
  .off-fields-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .off-fields-row-2 { grid-template-columns: 1fr; }
  .off-success-card { padding: 32px 20px; }
  .off-hero { padding: 32px 16px 28px; }
  .off-form-wrap { padding: 20px 14px 48px; }
}
@media (prefers-reduced-motion: reduce) { .off-success-card { animation: none; } }
`;