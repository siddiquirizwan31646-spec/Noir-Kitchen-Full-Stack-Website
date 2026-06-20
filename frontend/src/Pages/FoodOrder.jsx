import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../component/ui/Navbar";

const FONT_LINK =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

const FA_LINK =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const LOC_KEY = "nk_delivery_coords";
const ADDR_KEY = "nk_delivery_address";

// ── Helpers ────────────────────────────────────────────────────────────────
function Stars({ rating }) {
    return (
        <span className="fo-stars">
            {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#D86A1C" : "#E8D5C0"}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </span>
    );
}

function SpiceIcon({ filled }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#D86A1C" : "#E8D5C0"}>
            <path d="M12 2C8 2 6 6 6 9c0 2.5 1.5 4.5 3 6l1 5h4l1-5c1.5-1.5 3-3.5 3-6 0-3-2-7-6-7z" />
        </svg>
    );
}

function VegBadge({ veg }) {
    return (
        <span className={`fo-vegbadge ${veg ? "fo-veg" : "fo-nonveg"}`}>
            <span className="fo-vegbadge-dot" />
            {veg ? "Vegetarian" : "Non-Vegetarian"}
        </span>
    );
}

function VegDot({ veg }) {
    return (
        <span className={`fo-vegdot ${veg ? "fo-veg" : "fo-nonveg"}`}>
            <span className="fo-vegdot-inner" />
        </span>
    );
}

// ── Legal Modal (Privacy Policy / Terms of Use) ────────────────────────────
function LegalModal({ open, title, onClose }) {
    if (!open) return null;
    return (
        <div className="fo-modal-overlay" onClick={onClose}>
            <div className="fo-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="fo-modal-header">
                    <div className="fo-modal-title-wrap">
                        <i className="fa-solid fa-scale-balanced fo-modal-icon" />
                        <h3 className="fo-modal-title">{title}</h3>
                    </div>
                    <button className="fo-modal-close" onClick={onClose} aria-label="Close">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="fo-modal-body">
                    <p>
                        This is placeholder {title.toLowerCase()} content for Noir Kitchen. Replace this
                        section with your finalized legal copy covering data collection, usage, customer
                        rights, and order terms before going live.
                    </p>
                    <p>
                        By using this service you agree to the practices described here, including how your
                        order, contact, and delivery location information is collected, stored, and used to
                        fulfil your order.
                    </p>
                    <p>
                        For questions about this policy, please contact the restaurant directly through the
                        details provided on the Reservations page.
                    </p>
                </div>
                <div className="fo-modal-footer">
                    <button className="fo-modal-btn" onClick={onClose}>I Understand</button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function FoodOrder({ user, onLogout, cart }) {
    const { foodName, vegType, price } = useParams();
    const navigate = useNavigate();

    const decodedFood = decodeURIComponent(foodName || "");
    const decodedPrice = decodeURIComponent(price || "₹0");

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState(0);
    const [selVariant, setSelVariant] = useState(0);
    const [addons, setAddons] = useState({});
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState("");
    const [cartCount, setCartCount] = useState(0);
    const [added, setAdded] = useState(false);
    const [suggested, setSuggested] = useState([]);
    const [activeNav, setActiveNav] = useState("Menu");

    // ── Legal modals ─────────────────────────────────────────────────────────
    const [legalModal, setLegalModal] = useState(null); // "privacy" | "terms" | null

    // ── Careers toast ─────────────────────────────────────────────────────────
    const [careersMsg, setCareersMsg] = useState(false);

    // ── Delivery location ──────────────────────────────────────────────────
    const [coords, setCoords] = useState(() => {
        try {
            const saved = localStorage.getItem(LOC_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [resolvedAddress, setResolvedAddress] = useState(() => localStorage.getItem(ADDR_KEY) || "");
    const [locating, setLocating] = useState(false);
    const [locError, setLocError] = useState("");

    const useMyLocation = () => {
        if (!navigator.geolocation) { setLocError("Geolocation isn't supported by your browser."); return; }
        setLocating(true);
        setLocError("");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCoords({ lat, lng });
                localStorage.setItem(LOC_KEY, JSON.stringify({ lat, lng }));
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    const addr = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    setResolvedAddress(addr);
                    localStorage.setItem(ADDR_KEY, addr);
                } catch {
                    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    setResolvedAddress(fallback);
                    localStorage.setItem(ADDR_KEY, fallback);
                } finally { setLocating(false); }
            },
            (err) => {
                setLocating(false);
                if (err.code === 1) setLocError("Location permission denied. Enable it in your browser settings.");
                else if (err.code === 2) setLocError("Location unavailable right now. Please try again.");
                else setLocError("Location request timed out. Please try again.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        onLogout?.();
        navigate("/");
    };

    useEffect(() => {
        setItem(null);
        setActiveImg(0);
        setSelVariant(0);
        setAddons({});
        setQty(1);
        setNote("");
        setAdded(false);

        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/menu`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const found = json.data.find(
                        (d) => d.name.toLowerCase().trim() === decodedFood.toLowerCase().trim()
                    );
                    setItem(found || null);
                    if (found) {
                        const sug = json.data.filter((d) => d.category === found.category && d._id !== found._id).slice(0, 4);
                        setSuggested(sug.length ? sug : json.data.filter((d) => d._id !== found?._id).slice(0, 4));
                    } else {
                        setSuggested(json.data.slice(0, 4));
                    }
                }
            } catch (err) {
                console.error("Menu fetch failed:", err);
                setItem(null);
            } finally { setLoading(false); }
        }
        if (decodedFood) load();
    }, [decodedFood]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [decodedFood]);

    // Auto-dismiss the careers notice
    useEffect(() => {
        if (!careersMsg) return;
        const t = setTimeout(() => setCareersMsg(false), 3000);
        return () => clearTimeout(t);
    }, [careersMsg]);

    const displayItem = item || {
        name: decodedFood,
        price: decodedPrice,
        veg: vegType === "veg",
        desc: "A signature dish crafted with the finest ingredients.",
        category: "Signature",
        spice: 2,
        rating: 4.5,
        available: true,
        prepTime: 20,
        vegan: false,
        featured: true,
        ingredients: "",
        tags: [],
    };

    const variants = (() => {
        if (!item?.variants) return [];
        if (Array.isArray(item.variants)) return item.variants;
        return item.variants.split("|").map((v) => {
            const [label, p, desc, serves] = v.split(":");
            return { label, price: p, desc, serves };
        }).filter((v) => v.label);
    })();

    const addonList = (() => {
        if (!item?.addons) return [];
        if (Array.isArray(item.addons)) return item.addons;
        return item.addons.split("|").map((a) => {
            const [label, p, img] = a.split(":");
            return { label, price: p, img };
        }).filter((a) => a.label);
    })();

    const basePrice = (() => {
        const src = variants.length ? variants[selVariant]?.price : item?.price || decodedPrice;
        return parseInt(String(src || "0").replace(/[^\d]/g, "")) || 0;
    })();

    const selectedVariantBasePrice = (() => {
        if (!variants.length) return basePrice;
        return parseInt(String(variants[0]?.price || "0").replace(/[^\d]/g, "")) || 0;
    })();

    const addonTotal = addonList.reduce((sum, a, i) => {
        if (!addons[i]) return sum;
        return sum + (parseInt(String(a.price || "0").replace(/[^\d]/g, "")) || 0);
    }, 0);

    const subtotal = (basePrice + addonTotal) * qty;
    const total = subtotal;

    const handleAddToCart = async () => {
        if (!item || !cart) return;
        const success = await cart.addToCart({
            menuItemId: item._id,
            name: item.name,
            img: item.img,
            price: variants.length ? variants[selVariant].price : item.price,
            variant: variants.length ? variants[selVariant].label : "",
            addons: addonList.filter((_, i) => addons[i]),
            qty,
            note
        });
        if (success) {
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    const handleOrderNow = () => {
        if (!coords) {
            document.querySelector(".fo-location-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
            useMyLocation();
            return;
        }
        localStorage.setItem(LOC_KEY, JSON.stringify(coords));
        localStorage.setItem(ADDR_KEY, resolvedAddress);

        navigate(
            `/order/${encodeURIComponent(displayItem.name)}/${displayItem.veg ? "veg" : "non-veg"}/${encodeURIComponent(
                variants.length ? variants[selVariant].price : displayItem.price
            )}/${encodeURIComponent(user?.name || "Guest")}/${encodeURIComponent(user?.username || "guest")}/${encodeURIComponent(
                `${coords.lat},${coords.lng}`
            )}`,
            {
                state: {
                    qty,
                    note,
                    selectedVariant: variants.length ? variants[selVariant] : null,
                    selectedAddons: addonList.filter((_, i) => addons[i]),
                    itemId: item?._id,
                    itemImg: item?.img,
                    discount: item?.discount || null,
                    latitude: coords.lat,
                    longitude: coords.lng,
                    deliveryAddress: resolvedAddress,
                },
            }
        );
    };

    const imgs = (() => {
        const list = [];
        if (item?.img) list.push(item.img);
        if (item?.images && Array.isArray(item.images)) list.push(...item.images);
        // Drop empty/falsy/whitespace-only entries so broken thumbnails never render
        const cleaned = list.map((u) => (typeof u === "string" ? u.trim() : "")).filter(Boolean);
        if (!cleaned.length) cleaned.push("https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80");
        return [...new Set(cleaned)];
    })();

    const tags = item?.tags || (displayItem.veg ? ["Gluten Free", "No Added Preservatives"] : ["Gluten Free"]);

    const handleFooterClick = (label) => {
        if (label === "Privacy Policy") setLegalModal("privacy");
        else if (label === "Terms of Use") setLegalModal("terms");
        else if (label === "Reservations") navigate("/reserve");
        else if (label === "Careers") setCareersMsg(true);
    };

    if (loading)
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F1EA", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="fo-loader" />
                    <p style={{ marginTop: 16, color: "#D86A1C", fontWeight: 600, fontSize: 14 }}>Loading dish…</p>
                </div>
            </div>
        );

    return (
        <>
            <link href={FONT_LINK} rel="stylesheet" />
            <link href={FA_LINK} rel="stylesheet" />
            <div className="fo-root">
                <Navbar user={user} onLogout={handleLogout} activeNav={activeNav} setActiveNav={setActiveNav} cart={cart} />

                {/* ── DELIVERY LOCATION ── */}
                <div className="fo-location-card">
                    <div className="fo-location-header">
                        <i className="fa-solid fa-location-dot fo-location-icon" />
                        <div>
                            <span className="fo-location-title">Delivery Location</span>
                            <span className="fo-location-sub">
                                {coords ? "We'll deliver to your current location" : "Enable location to continue ordering"}
                            </span>
                        </div>
                        {coords && (
                            <button className="fo-locate-btn fo-locate-btn-ghost" onClick={useMyLocation} disabled={locating}>
                                <i className="fa-solid fa-rotate" />
                                {locating ? "Updating…" : "Update"}
                            </button>
                        )}
                    </div>

                    {!coords && (
                        <div className="fo-location-empty">
                            <button className="fo-locate-btn" onClick={useMyLocation} disabled={locating}>
                                <i className="fa-solid fa-location-crosshairs" />
                                {locating ? "Detecting your location…" : "Use Current Location"}
                            </button>
                            {locError && (
                                <span className="fo-loc-error">
                                    <i className="fa-solid fa-triangle-exclamation" /> {locError}
                                </span>
                            )}
                        </div>
                    )}

                    {coords && (
                        <>
                            <div className="fo-location-map">
                                <iframe
                                    title="Delivery location map"
                                    src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <p className="fo-location-address">
                                <i className="fa-solid fa-map-pin" />
                                {resolvedAddress || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
                            </p>
                            {locError && (
                                <span className="fo-loc-error">
                                    <i className="fa-solid fa-triangle-exclamation" /> {locError}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* ══ PART 1 — HERO ══ */}
                <div className="fo-page1">
                    {/* LEFT: Gallery */}
                    <div className="fo-gallery">
                        <div className="fo-img-main-wrap">
                            <img src={imgs[activeImg]} alt={displayItem.name} className="fo-img-main" />
                            {displayItem.featured && (
                                <div className="fo-featured-badge">
                                    <i className="fa-solid fa-star" /> Featured
                                </div>
                            )}
                            <div className={`fo-avail-badge ${displayItem.available ? "fo-avail-yes" : "fo-avail-no"}`}>
                                <i className="fa-solid fa-circle" style={{ fontSize: 6, marginRight: 5 }} />
                                {displayItem.available ? "Available" : "Out of Stock"}
                            </div>
                            <button className="fo-expand-btn" onClick={() => window.open(imgs[activeImg], "_blank")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                </svg>
                            </button>
                        </div>

                        {imgs.length > 1 && (
                            <div className="fo-thumbs">
                                {imgs.map((src, i) => (
                                    <button key={i} onClick={() => setActiveImg(i)} className={`fo-thumb ${activeImg === i ? "fo-thumb-active" : ""}`}>
                                        <img
                                            src={src}
                                            alt=""
                                            onError={(e) => { e.currentTarget.closest(".fo-thumb").style.display = "none"; }}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Order panel */}
                    <div className="fo-panel">
                        <span className="fo-category-pill">{displayItem.category}</span>
                        <h1 className="fo-food-name">{displayItem.name}</h1>

                        <div className="fo-rating-row">
                            <Stars rating={displayItem.rating || 4.5} />
                            <span className="fo-rating-val">{displayItem.rating || "4.5"}</span>
                            <span className="fo-rating-ct"><i className="fa-solid fa-circle fo-dot-icon" /> 128 reviews</span>
                        </div>

                        <p className="fo-desc">{displayItem.desc}</p>

                        <div className="fo-price-row">
                            <span className="fo-price-main">
                                {variants.length ? variants[selVariant]?.price : displayItem.price}
                            </span>
                            <span className="fo-prep-time">
                                <i className="fa-regular fa-clock" />
                                {displayItem.prepTime || 20}–{(displayItem.prepTime || 20) + 5} mins{" "}
                                <span style={{ color: "#C4B09A" }}>Prep Time</span>
                            </span>
                        </div>

                        <div className="fo-tags-row">
                            <span className="fo-tag fo-tag-gf">Gluten Info</span>
                            {tags.map((t) => (
                                <span key={t} className="fo-tag fo-tag-extra">{t}</span>
                            ))}
                        </div>

                        {(displayItem.spice ?? 0) > 0 && (
                            <div className="fo-field">
                                <label className="fo-field-label">Spice Level</label>
                                <div className="fo-spice-row">
                                    {[1, 2, 3, 4].map((i) => (
                                        <SpiceIcon key={i} filled={i <= (displayItem.spice || 0)} />
                                    ))}
                                    <span className="fo-spice-label">
                                        {["Mild", "Medium", "Hot", "Extra Hot"][Math.max(0, (displayItem.spice || 1) - 1)]}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="fo-dietary-row">
                            <VegBadge veg={displayItem.veg} />
                            {displayItem.vegan && <span className="fo-tag fo-tag-vegan">Vegan</span>}
                            {displayItem.glutenFree && <span className="fo-tag fo-tag-gf2">Gluten Free</span>}
                        </div>
                    </div>
                </div>

                {/* ══ PART 2 — VARIANTS, ADD-ONS, QTY, CTA ══ */}
                <div className="fo-page2">

                    {/* Variants — only render the picker when there's more than one option */}
                    {variants.length > 1 && (
                        <div className="fo-section-block">
                            <label className="fo-field-label">Variants</label>
                            <div className="fo-variants">
                                {variants.map((v, i) => {
                                    const vPrice = parseInt(String(v.price || "0").replace(/[^\d]/g, "")) || 0;
                                    const diff = vPrice - selectedVariantBasePrice;
                                    return (
                                        <label key={i} className={`fo-variant-card ${selVariant === i ? "fo-variant-sel" : ""}`} onClick={() => setSelVariant(i)}>
                                            <div className="fo-variant-radio">
                                                <span className={`fo-radio ${selVariant === i ? "fo-radio-sel" : ""}`} />
                                            </div>
                                            <div className="fo-variant-info">
                                                <span className="fo-variant-name">{v.label}</span>
                                                {v.serves && <span className="fo-variant-serves">Serves {v.serves}</span>}
                                            </div>
                                            <div className="fo-variant-price-col">
                                                <span className="fo-variant-price">{v.price}</span>
                                                {i > 0 && diff > 0 && <span className="fo-variant-diff">+ ₹{diff}</span>}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Single variant — show as a simple info line, not a picker */}
                    {variants.length === 1 && (
                        <div className="fo-section-block">
                            <label className="fo-field-label">Serving</label>
                            <div className="fo-variant-single">
                                <i className="fa-solid fa-bowl-food" />
                                <span className="fo-variant-single-name">{variants[0].label}</span>
                                {variants[0].serves && <span className="fo-variant-single-serves">· Serves {variants[0].serves}</span>}
                                <span className="fo-variant-single-price">{variants[0].price}</span>
                            </div>
                        </div>
                    )}

                    {/* Add-ons */}
                    {addonList.length > 0 && (
                        <div className="fo-section-block">
                            <label className="fo-field-label">Add-ons</label>
                            <div className="fo-addons-grid">
                                {addonList.map((a, i) => (
                                    <label key={i} className={`fo-addon-card ${addons[i] ? "fo-addon-sel" : ""}`}>
                                        <input type="checkbox" checked={!!addons[i]} onChange={(e) => setAddons((prev) => ({ ...prev, [i]: e.target.checked }))} className="fo-addon-cb" />
                                        {a.img && <img src={a.img} alt={a.label} className="fo-addon-img" />}
                                        <span className="fo-addon-name">{a.label}</span>
                                        <span className="fo-addon-price">+ {a.price}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="fo-section-block fo-qty-row">
                        <label className="fo-field-label">Quantity</label>
                        <div className="fo-qty">
                            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="fo-qty-btn">
                                <i className="fa-solid fa-minus" />
                            </button>
                            <span className="fo-qty-val">{qty}</span>
                            <button onClick={() => setQty((q) => q + 1)} className="fo-qty-btn">
                                <i className="fa-solid fa-plus" />
                            </button>
                        </div>
                    </div>

                    {/* Special instructions */}
                    <div className="fo-section-block">
                        <label className="fo-field-label">Special Instructions</label>
                        <textarea
                            className="fo-textarea"
                            placeholder="Add cooking instructions, allergies, or preferences…"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* CTA */}
                    <div className="fo-cta-block">
                        <div className="fo-total-section">
                            <div className="fo-total-row">
                                <span className="fo-total-label">Total</span>
                                <span className="fo-total-val">₹{total.toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        <div className="fo-cta-btns">
                            <button onClick={handleAddToCart} className={`fo-btn-primary ${added ? "fo-btn-added" : ""}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                                </svg>
                                {added ? (<><i className="fa-solid fa-check" style={{ marginRight: 6 }} /> Added to Cart</>) : "Add to Cart"}
                            </button>
                            <button className="fo-btn-secondary" onClick={handleOrderNow}>
                                {coords ? "Order Now" : (
                                    <><i className="fa-solid fa-location-crosshairs" style={{ marginRight: 6 }} /> Enable Location</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══ PART 3 — DISH DETAILS + SUGGESTED ══ */}
                <div className="fo-page3">
                    <div className="fo-details-header">
                        <p className="fo-eyebrow">
                            Dish Details{" "}
                            <i className="fa-solid fa-star" style={{ color: "#D86A1C", marginLeft: 6, fontSize: 10 }} />
                        </p>
                        <h2 className="fo-section-h2">
                            About This <em className="fo-accent">Dish</em>
                        </h2>
                    </div>

                    <div className="fo-info-cards">
                        {[
                            { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>), label: "Category", val: displayItem.category || "—" },
                            { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>), label: "Availability", val: displayItem.available ? "Available" : "Out of Stock", green: displayItem.available },
                            { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>), label: "Prep Time", val: `${displayItem.prepTime || 20}–${(displayItem.prepTime || 20) + 5} mins` },
                            { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>), label: "Dietary", val: displayItem.veg ? (displayItem.vegan ? "Vegan" : "Vegetarian") : "Non-Vegetarian" },
                            { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="1.8"><path d="M12 2C8 2 6 6 6 9c0 2.5 1.5 4.5 3 6l1 5h4l1-5c1.5-1.5 3-3.5 3-6 0-3-2-7-6-7z" /></svg>), label: "Spice Level", val: ["None", "Mild", "Medium", "Hot", "Extra Hot"][displayItem.spice || 0] },
                            { icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D86A1C" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>), label: "Created On", val: item?.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                        ].map(({ icon, label, val, green }) => (
                            <div key={label} className="fo-info-card">
                                <div className="fo-info-icon">{icon}</div>
                                <span className="fo-info-key">{label}</span>
                                <span className={`fo-info-val ${green ? "fo-info-green" : ""}`}>{val}</span>
                            </div>
                        ))}
                    </div>

                    <div className="fo-bottom-row">
                        {displayItem.ingredients && (
                            <div className="fo-ingredients-block">
                                <p className="fo-field-label" style={{ marginBottom: 12 }}>Ingredients</p>
                                <p className="fo-ingredients-text">{displayItem.ingredients}</p>
                            </div>
                        )}

                        <div className="fo-suggested-block">
                            <p className="fo-eyebrow" style={{ marginBottom: 16 }}>
                                You May Also Like{" "}
                                <i className="fa-solid fa-star" style={{ color: "#D86A1C", marginLeft: 6, fontSize: 10 }} />
                            </p>
                            <div className="fo-sug-scroll-wrap">
                                <div className="fo-sug-grid">
                                    {suggested.map((s) => (
                                        <div key={s._id} className="fo-sug-card"
                                            onClick={() => navigate(`/${encodeURIComponent(s.name)}/${s.veg ? "veg" : "nonveg"}/${encodeURIComponent(s.price)}/Guest/guest/${encodeURIComponent(coords ? `${coords.lat},${coords.lng}` : "no-location")}`)}>
                                            <div className="fo-sug-img-wrap">
                                                <img src={s.img} alt={s.name} className="fo-sug-img" loading="lazy" />
                                                <VegDot veg={s.veg} />
                                            </div>
                                            <div className="fo-sug-body">
                                                <h4 className="fo-sug-name">{s.name}</h4>
                                                <div className="fo-sug-meta">
                                                    <Stars rating={s.rating || 4.5} />
                                                    <span className="fo-sug-rating">{s.rating || "4.5"}</span>
                                                </div>
                                                <div className="fo-sug-footer">
                                                    <span className="fo-sug-price">{s.price}</span>
                                                    <button className="fo-sug-add" onClick={(e) => { e.stopPropagation(); setCartCount((c) => c + 1); }}>
                                                        <i className="fa-solid fa-plus" /> Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {suggested.length > 3 && (
                                    <div className="fo-sug-arrows">
                                        <button className="fo-sug-arrow" onClick={() => document.querySelector(".fo-sug-grid").scrollBy({ left: -240, behavior: "smooth" })}>
                                            <i className="fa-solid fa-chevron-left" />
                                        </button>
                                        <button className="fo-sug-arrow" onClick={() => document.querySelector(".fo-sug-grid").scrollBy({ left: 240, behavior: "smooth" })}>
                                            <i className="fa-solid fa-chevron-right" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <footer className="fo-footer">
                    <div className="fo-footer-inner">
                        <div className="fo-footer-brand">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="fo-logo-nk">NK</span>
                                <span className="fo-logo-text">Noir Kitchen</span>
                            </div>
                            <p className="fo-footer-tagline">An Ode to Indian Gastronomy</p>
                        </div>
                        <div className="fo-footer-links">
                            {["Privacy Policy", "Terms of Use", "Reservations", "Careers"].map((l) => (
                                <a
                                    key={l}
                                    href="#"
                                    className="fo-footer-link"
                                    onClick={(e) => { e.preventDefault(); handleFooterClick(l); }}
                                >
                                    {l}
                                </a>
                            ))}
                        </div>
                        <p className="fo-footer-copy">© 2026 Noir Kitchen. All rights reserved.</p>
                    </div>
                </footer>

                {/* ── Careers notice toast ── */}
                {careersMsg && (
                    <div className="fo-toast">
                        <i className="fa-solid fa-circle-info" />
                        Careers page isn't open right now. Please check back later.
                    </div>
                )}

                {/* ── Legal modals ── */}
                <LegalModal
                    open={legalModal === "privacy"}
                    title="Privacy Policy"
                    onClose={() => setLegalModal(null)}
                />
                <LegalModal
                    open={legalModal === "terms"}
                    title="Terms of Use"
                    onClose={() => setLegalModal(null)}
                />
            </div>

            <style>{`
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.fo-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #F8F1EA;
  color: #1A1208;
  overflow-x: hidden;
  min-height: 100vh;
}

.fo-loader {
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid rgba(216,106,28,0.15);
  border-top-color: #D86A1C;
  animation: foSpin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes foSpin { to { transform: rotate(360deg); } }

/* ── DELIVERY LOCATION CARD ── */
.fo-location-card {
  max-width: 1320px; margin: 24px auto 0;
  padding: 20px 28px; background: #fff;
  border-radius: 16px; border: 1px solid rgba(216,106,28,0.12);
  box-shadow: 0 4px 18px rgba(0,0,0,0.05);
}
.fo-location-header { display: flex; align-items: center; gap: 14px; }
.fo-location-icon { font-size: 20px; color: #D86A1C; flex-shrink: 0; }
.fo-location-title { display: block; font-size: 14px; font-weight: 700; color: #1A1208; }
.fo-location-sub { display: block; font-size: 12px; color: #9A8570; margin-top: 2px; }
.fo-location-empty { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.fo-location-map { margin-top: 14px; height: 180px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(216,106,28,0.12); }
.fo-location-map iframe { width: 100%; height: 100%; border: 0; display: block; }
.fo-location-address { margin-top: 12px; font-size: 13px; color: #6B5B45; line-height: 1.5; display: flex; align-items: flex-start; gap: 8px; }
.fo-location-address i { color: #D86A1C; margin-top: 2px; }

.fo-locate-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg,#D86A1C,#F0924A);
  border: none; border-radius: 24px; padding: 11px 22px;
  cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 18px rgba(216,106,28,0.3);
}
.fo-locate-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(216,106,28,0.4); }
.fo-locate-btn:disabled { opacity: 0.6; cursor: wait; transform: none; }
.fo-locate-btn-ghost {
  margin-left: auto; flex-shrink: 0;
  background: rgba(216,106,28,0.1); color: #D86A1C;
  box-shadow: none; padding: 8px 16px; font-size: 11px;
}
.fo-loc-error { display: flex; align-items: center; gap: 6px; color: #D32F2F; font-size: 12px; font-weight: 600; }

/* ══ PART 1 — HERO ══ */
.fo-page1 {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 48px; max-width: 1320px; margin: 0 auto;
  padding: 36px 48px 40px; align-items: start;
}
.fo-gallery { position: sticky; top: 100px; }
.fo-img-main-wrap { position: relative; border-radius: 20px; overflow: hidden; aspect-ratio: 4/3; box-shadow: 0 20px 56px rgba(0,0,0,0.18); background: #EEE; }
.fo-img-main { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.22,1,0.36,1); display: block; }
.fo-img-main-wrap:hover .fo-img-main { transform: scale(1.03); }
.fo-featured-badge { position: absolute; top: 14px; left: 14px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; }
.fo-avail-badge { position: absolute; top: 14px; right: 48px; font-size: 10px; font-weight: 700; padding: 5px 12px; border-radius: 20px; backdrop-filter: blur(12px); }
.fo-avail-yes { background: rgba(76,175,80,0.15); color: #2E7D32; border: 1px solid rgba(76,175,80,0.3); }
.fo-avail-no { background: rgba(211,47,47,0.15); color: #D32F2F; border: 1px solid rgba(211,47,47,0.3); }
.fo-expand-btn { position: absolute; bottom: 14px; right: 14px; width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border: none; cursor: pointer; color: #1A1208; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.fo-expand-btn:hover { background: #fff; }
.fo-thumbs { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.fo-thumb { border: 2px solid transparent; border-radius: 10px; overflow: hidden; width: 80px; height: 64px; cursor: pointer; background: none; padding: 0; flex-shrink: 0; transition: border-color 0.2s, transform 0.2s; }
.fo-thumb:hover { transform: translateY(-2px); }
.fo-thumb-active { border-color: #D86A1C; }
.fo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.fo-panel { display: flex; flex-direction: column; gap: 18px; padding-top: 8px; }
.fo-category-pill { display: inline-flex; align-self: flex-start; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #D86A1C; background: rgba(216,106,28,0.1); border-radius: 20px; padding: 4px 14px; }
.fo-food-name { font-family: 'Cormorant Garamond', serif; font-size: clamp(32px,4vw,52px); font-weight: 600; line-height: 1.05; color: #1A1208; }
.fo-rating-row { display: flex; align-items: center; gap: 8px; }
.fo-stars { display: flex; gap: 2px; align-items: center; }
.fo-rating-val { font-size: 13px; font-weight: 700; color: #1A1208; }
.fo-rating-ct { font-size: 12px; color: #9A8570; display: inline-flex; align-items: center; gap: 6px; }
.fo-dot-icon { font-size: 3px; color: #C4B09A; }
.fo-desc { font-size: 14px; color: #6B5B45; line-height: 1.85; max-width: 480px; }
.fo-price-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: #fff; border-radius: 14px; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 3px 14px rgba(0,0,0,0.05); }
.fo-price-main { font-family: Helvetica, sans-serif; font-size: 34px; font-weight: 600; color: #D86A1C; }
.fo-prep-time { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9A8570; margin-left: auto; }
.fo-tags-row { display: flex; gap: 8px; flex-wrap: wrap; }
.fo-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 20px; padding: 4px 12px; }
.fo-tag-gf { color: #1565C0; background: rgba(21,101,192,0.08); border: 1px solid rgba(21,101,192,0.2); }
.fo-tag-extra { color: #5D4037; background: rgba(93,64,55,0.08); border: 1px solid rgba(93,64,55,0.2); }
.fo-tag-vegan { color: #1B5E20; background: rgba(27,94,32,0.1); border: 1px solid rgba(27,94,32,0.25); }
.fo-tag-gf2 { color: #2E7D32; background: rgba(46,125,50,0.1); border: 1px solid rgba(46,125,50,0.25); }
.fo-spice-row { display: flex; align-items: center; gap: 2px; }
.fo-spice-label { font-size: 12px; color: #6B5B45; font-weight: 600; margin-left: 8px; }
.fo-dietary-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.fo-vegbadge { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; border-radius: 20px; padding: 5px 14px; border: 1px solid; }
.fo-vegbadge.fo-veg { color: #2E7D32; background: rgba(46,125,50,0.08); border-color: rgba(46,125,50,0.3); }
.fo-vegbadge.fo-nonveg { color: #D32F2F; background: rgba(211,47,47,0.08); border-color: rgba(211,47,47,0.3); }
.fo-vegbadge-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.fo-vegbadge.fo-veg .fo-vegbadge-dot { background: #4CAF50; }
.fo-vegbadge.fo-nonveg .fo-vegbadge-dot { background: #D32F2F; }
.fo-vegdot { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 4px; background: rgba(248,241,234,0.9); backdrop-filter: blur(8px); position: absolute; top: 10px; right: 10px; }
.fo-vegdot.fo-veg { border: 1.5px solid #4CAF50; }
.fo-vegdot.fo-nonveg { border: 1.5px solid #D32F2F; }
.fo-vegdot-inner { width: 9px; height: 9px; border-radius: 50%; }
.fo-vegdot.fo-veg .fo-vegdot-inner { background: #4CAF50; }
.fo-vegdot.fo-nonveg .fo-vegdot-inner { background: #D32F2F; }
.fo-field-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8570; display: block; }

/* ══ PART 2 — VARIANTS / ADDONS / CTA ══ */
.fo-page2 { max-width: 1320px; margin: 0 auto; padding: 0 48px 48px; display: flex; flex-direction: column; gap: 28px; }
.fo-section-block { display: flex; flex-direction: column; gap: 14px; }
.fo-variants { display: flex; flex-direction: column; gap: 10px; }
.fo-variant-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 14px; border: 1.5px solid rgba(216,106,28,0.15); background: #fff; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
.fo-variant-card:hover { border-color: #D86A1C; }
.fo-variant-sel { border-color: #D86A1C; background: rgba(216,106,28,0.04); box-shadow: 0 4px 16px rgba(216,106,28,0.12); }
.fo-variant-radio { flex-shrink: 0; }
.fo-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(216,106,28,0.3); display: inline-flex; align-items: center; justify-content: center; transition: border-color 0.2s; }
.fo-radio-sel { border-color: #D86A1C; background: radial-gradient(circle, #D86A1C 5px, transparent 5px); }
.fo-variant-info { flex: 1; }
.fo-variant-name { font-size: 14px; font-weight: 700; color: #1A1208; display: block; }
.fo-variant-serves { font-size: 11px; color: #9A8570; margin-top: 2px; display: block; }
.fo-variant-price-col { text-align: right; }
.fo-variant-price { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208; display: block; }
.fo-variant-diff { font-size: 11px; color: #9A8570; }
.fo-variant-single {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-radius: 14px;
  border: 1.5px solid rgba(216,106,28,0.15); background: #fff;
}
.fo-variant-single i { color: #D86A1C; font-size: 16px; }
.fo-variant-single-name { font-size: 14px; font-weight: 700; color: #1A1208; }
.fo-variant-single-serves { font-size: 12px; color: #9A8570; }
.fo-variant-single-price { margin-left: auto; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #D86A1C; }
.fo-addons-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.fo-addon-card { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 12px; border: 1.5px solid rgba(216,106,28,0.15); background: #fff; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.fo-addon-card:hover { border-color: rgba(216,106,28,0.4); }
.fo-addon-sel { border-color: #D86A1C; background: rgba(216,106,28,0.04); }
.fo-addon-cb { width: 15px; height: 15px; accent-color: #D86A1C; cursor: pointer; flex-shrink: 0; }
.fo-addon-img { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.fo-addon-name { font-size: 12.5px; color: #1A1208; font-weight: 500; flex: 1; }
.fo-addon-price { font-size: 12px; color: #D86A1C; font-weight: 700; white-space: nowrap; }
.fo-qty-row { flex-direction: row; align-items: center; gap: 24px; }
.fo-qty { display: flex; align-items: center; border: 1.5px solid rgba(216,106,28,0.25); border-radius: 10px; overflow: hidden; background: #fff; }
.fo-qty-btn { width: 40px; height: 40px; background: none; border: none; font-size: 13px; color: #D86A1C; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center; }
.fo-qty-btn:hover { background: rgba(216,106,28,0.08); }
.fo-qty-val { width: 44px; text-align: center; font-size: 15px; font-weight: 700; color: #1A1208; border-left: 1px solid rgba(216,106,28,0.15); border-right: 1px solid rgba(216,106,28,0.15); line-height: 40px; }
.fo-textarea { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid rgba(216,106,28,0.2); background: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1A1208; resize: vertical; outline: none; transition: border-color 0.2s; }
.fo-textarea:focus { border-color: #D86A1C; }
.fo-textarea::placeholder { color: #C4B09A; }

/* ── CTA ── */
.fo-cta-block { background: #fff; border-radius: 16px; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.fo-total-section { display: flex; flex-direction: column; gap: 8px; }
.fo-total-row { display: flex; align-items: center; justify-content: space-between; }
.fo-total-label { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8570; }
.fo-total-val { font-family: 'Segoe UI', sans-serif; font-size: 32px; font-weight: 600; color: #2c190b; }
.fo-cta-btns { display: flex; gap: 12px; }
.fo-btn-primary { flex: 1; padding: 15px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; border: none; border-radius: 50px; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(216,106,28,0.35); transition: all 0.25s; display: flex; align-items: center; justify-content: center; }
.fo-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(216,106,28,0.45); }
.fo-btn-added { background: linear-gradient(135deg,#4CAF50,#66BB6A); box-shadow: 0 8px 24px rgba(76,175,80,0.35); }
.fo-btn-secondary { flex: 0 0 auto; padding: 15px 28px; background: transparent; color: #D86A1C; border: 1.5px solid #D86A1C; border-radius: 50px; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; justify-content: center; }
.fo-btn-secondary:hover { background: #D86A1C; color: #fff; transform: translateY(-2px); }

/* ══ PART 3 — DETAILS + SUGGESTED ══ */
.fo-page3 { max-width: 1320px; margin: 0 auto; padding: 0 48px 80px; }
.fo-details-header { margin-bottom: 28px; }
.fo-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #D86A1C; margin-bottom: 8px; display: flex; align-items: center; gap: 0; }
.fo-section-h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px,3vw,44px); font-weight: 600; line-height: 1.1; color: #1A1208; }
.fo-accent { font-style: italic; color: #D86A1C; }
.fo-info-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 40px; }
.fo-info-card { background: #fff; border-radius: 14px; padding: 18px 16px; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 3px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px; transition: transform 0.22s, box-shadow 0.22s; }
.fo-info-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(216,106,28,0.1); }
.fo-info-icon { margin-bottom: 2px; }
.fo-info-key { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #D86A1C; }
.fo-info-val { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 600; color: #1A1208; }
.fo-info-green { color: #2E7D32 !important; }
.fo-bottom-row { display: grid; grid-template-columns: 280px 1fr; gap: 40px; align-items: start; }
.fo-ingredients-block { background: #fff; border-radius: 16px; padding: 24px; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 3px 14px rgba(0,0,0,0.05); }
.fo-ingredients-text { font-size: 13px; color: #6B5B45; line-height: 1.8; }
.fo-suggested-block { min-width: 0; }
.fo-sug-scroll-wrap { position: relative; }
.fo-sug-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; overflow-x: auto; scroll-behavior: smooth; scrollbar-width: none; }
.fo-sug-grid::-webkit-scrollbar { display: none; }
.fo-sug-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(216,106,28,0.1); box-shadow: 0 4px 16px rgba(0,0,0,0.07); transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; flex-shrink: 0; }
.fo-sug-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(216,106,28,0.14); }
.fo-sug-img-wrap { position: relative; height: 150px; overflow: hidden; }
.fo-sug-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; display: block; }
.fo-sug-card:hover .fo-sug-img { transform: scale(1.06); }
.fo-sug-body { padding: 14px; display: flex; flex-direction: column; gap: 7px; }
.fo-sug-name { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 600; color: #1A1208; }
.fo-sug-meta { display: flex; align-items: center; gap: 6px; }
.fo-sug-rating { font-size: 12px; font-weight: 700; color: #6B5B45; }
.fo-sug-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.fo-sug-price { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: #D86A1C; }
.fo-sug-add { display: inline-flex; align-items: center; gap: 5px; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 11px; font-weight: 700; color: #D86A1C; background: rgba(216,106,28,0.1); border: none; border-radius: 20px; padding: 5px 14px; cursor: pointer; transition: all 0.2s; }
.fo-sug-add:hover { background: #D86A1C; color: #fff; }
.fo-sug-arrows { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
.fo-sug-arrow { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid rgba(216,106,28,0.3); background: #fff; color: #D86A1C; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; }
.fo-sug-arrow:hover { background: #D86A1C; color: #fff; border-color: #D86A1C; }

/* ── FOOTER ── */
.fo-footer { background: linear-gradient(135deg,#2B1600,#4A2500); padding: 48px; }
.fo-footer-inner { max-width: 1320px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; }
.fo-footer-brand { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.fo-logo-nk { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #D86A1C; border: 1.5px solid #D86A1C; border-radius: 6px; padding: 2px 8px; }
.fo-logo-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #F8F1EA; letter-spacing: 0.3px; }
.fo-footer-tagline { font-family: 'Cormorant Garamond', serif; font-size: 13px; font-style: italic; color: rgba(248,241,234,0.5); }
.fo-footer-links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
.fo-footer-link { font-size: 12px; color: rgba(248,241,234,0.5); text-decoration: none; transition: color 0.2s; cursor: pointer; }
.fo-footer-link:hover { color: #F0924A; }
.fo-footer-copy { font-size: 11px; color: rgba(248,241,234,0.28); }

/* ── TOAST ── */
.fo-toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: #1A1208; color: #F8F1EA;
  padding: 14px 24px; border-radius: 12px;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
  z-index: 999; animation: foToastIn 0.25s ease;
}
.fo-toast i { color: #F0924A; font-size: 14px; }
@keyframes foToastIn { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }

/* ── LEGAL MODAL ── */
.fo-modal-overlay {
  position: fixed; inset: 0; background: rgba(26,18,8,0.55);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; z-index: 1000;
}
.fo-modal-card {
  background: #fff; border-radius: 18px; max-width: 520px; width: 100%;
  max-height: 80vh; display: flex; flex-direction: column;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
  animation: foModalIn 0.22s ease;
}
@keyframes foModalIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.fo-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; border-bottom: 1px solid rgba(216,106,28,0.12); }
.fo-modal-title-wrap { display: flex; align-items: center; gap: 12px; }
.fo-modal-icon { color: #D86A1C; font-size: 16px; }
.fo-modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1208; }
.fo-modal-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(216,106,28,0.08); color: #D86A1C; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; flex-shrink: 0; }
.fo-modal-close:hover { background: rgba(216,106,28,0.18); }
.fo-modal-body { padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.fo-modal-body p { font-size: 13.5px; color: #6B5B45; line-height: 1.8; }
.fo-modal-footer { padding: 16px 24px 22px; }
.fo-modal-btn { width: 100%; padding: 13px; background: linear-gradient(135deg,#D86A1C,#F0924A); color: #fff; border: none; border-radius: 50px; font-family: 'Plus Jakarta Sans',sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
.fo-modal-btn:hover { transform: translateY(-1px); }

/* ── RESPONSIVE ── */
@media (max-width: 1200px) {
  .fo-info-cards { grid-template-columns: repeat(3, 1fr); }
  .fo-bottom-row { grid-template-columns: 1fr; }
  .fo-sug-grid { grid-template-columns: repeat(4, minmax(180px, 1fr)); }
}
@media (max-width: 1024px) {
  .fo-page1 { grid-template-columns: 1fr; gap: 32px; padding: 28px 32px 32px; }
  .fo-gallery { position: static; }
  .fo-page2, .fo-page3 { padding-left: 32px; padding-right: 32px; }
  .fo-addons-grid { grid-template-columns: 1fr 1fr; }
  .fo-location-card { margin: 20px 32px 0; padding: 16px 20px; }
}
@media (max-width: 768px) {
  .fo-page1, .fo-page2, .fo-page3 { padding-left: 16px; padding-right: 16px; }
  .fo-location-card { margin: 16px 16px 0; padding: 16px; }
  .fo-location-header { flex-wrap: wrap; }
  .fo-locate-btn-ghost { margin-left: 0; }
  .fo-info-cards { grid-template-columns: repeat(2, 1fr); }
  .fo-sug-grid { grid-template-columns: repeat(2, minmax(160px, 1fr)); }
  .fo-cta-btns { flex-direction: column; }
  .fo-btn-secondary { width: 100%; text-align: center; }
  .fo-addons-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .fo-info-cards { grid-template-columns: repeat(2, 1fr); }
  .fo-food-name { font-size: clamp(26px,8vw,36px); }
  .fo-sug-grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  .fo-img-main, .fo-sug-img { transition: none; }
}
      `}</style>
        </>
    );
}