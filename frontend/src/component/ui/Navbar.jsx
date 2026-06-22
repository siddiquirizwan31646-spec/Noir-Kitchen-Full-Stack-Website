import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars, faTimes, faChevronDown, faUser, faRightFromBracket,
  faShoppingBag, faTrash, faClipboardList, faBell, faArrowLeft,
  faExternalLinkAlt, faCircleInfo, faCircleCheck,
  faTriangleExclamation, faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import gsap from "gsap";

const NAV_ITEMS = ["Home", "Menu", "About", "Review", "Contact"];
const API_BASE  = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getInitials(name = "") {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

const TYPE_CONFIG = {
  info:    { color: "#2F7BD1", bg: "rgba(47,123,209,0.10)",  icon: faCircleInfo },
  success: { color: "#63992E", bg: "rgba(99,153,46,0.10)",   icon: faCircleCheck },
  warning: { color: "#C99A1E", bg: "rgba(201,154,30,0.10)",  icon: faTriangleExclamation },
  error:   { color: "#E24B4A", bg: "rgba(226,75,74,0.10)",   icon: faCircleXmark },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Navbar({ user, onLogout, activeNav, setActiveNav, cart }) {
  const [cartOpen,          setCartOpen]          = useState(false);
  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [userDropdownOpen,  setUserDropdownOpen]  = useState(false);
  const [notifications,     setNotifications]     = useState([]);
  const [notifOpen,         setNotifOpen]         = useState(false);
  const [notifDetail,       setNotifDetail]       = useState(null); // null=list, number=detail
  const seenRef    = useRef(false);
  const navRef     = useRef(null);
  const animatedIn = useRef(false);

  /* ── Fetch notifications ── */
  useEffect(() => {
    if (seenRef.current) return;
    seenRef.current = true;
    fetch(`${API_BASE}/api/notifications/active`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        const list = Array.isArray(data?.notifications) ? data.notifications : [];
        setNotifications(list);
      })
      .catch((err) => console.error("[Notif]", err.message));
  }, []);

  const cartItems  = cart?.cartItems || [];
  const totalCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartItems.reduce((s, i) =>
    s + parseInt(String(i.price || "0").replace(/[^\d]/g, "")) * i.qty, 0);

  const navigate  = useNavigate();
  const userName  = user?.name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  /* ── Lock scroll when any overlay open on mobile ── */
  useEffect(() => {
    const anyOpen = mobileMenuOpen || cartOpen || userDropdownOpen || notifOpen;
    if (anyOpen && window.innerWidth <= 768) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileMenuOpen, cartOpen, userDropdownOpen, notifOpen]);

  /* ── Entrance animation ── */
  useEffect(() => {
    if (animatedIn.current || !navRef.current) return;
    animatedIn.current = true;
    const w  = navRef.current;
    const c  = w.querySelector(".noir-nav-container");
    const l  = w.querySelector(".noir-logo-wrap");
    const ls = w.querySelectorAll(".noir-nav-link");
    const u  = w.querySelector(".noir-user-btn, .noir-hamburger");
    gsap.set(w,  { opacity: 0, y: -24 });
    gsap.set(c,  { opacity: 0, scale: 0.97 });
    gsap.set(l,  { opacity: 0, x: -20 });
    gsap.set(ls, { opacity: 0, y: -12 });
    if (u) gsap.set(u, { opacity: 0, scale: 0.7 });
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });
    tl.to(w,  { opacity: 1, y: 0,    duration: 0.45, ease: "power3.out" })
      .to(c,  { opacity: 1, scale: 1, duration: 0.4,  ease: "back.out(1.4)" }, "-=0.25")
      .to(l,  { opacity: 1, x: 0,    duration: 0.42 }, "-=0.22")
      .to(ls, { opacity: 1, y: 0,    duration: 0.35, stagger: 0.06 }, "-=0.28")
      .to(u,  { opacity: 1, scale: 1, duration: 0.38, ease: "back.out(2)" }, "-=0.22");
  }, []);

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setActiveNav?.(item);
    setMobileMenuOpen(false);
    setCartOpen(false);
    if      (item === "Review")  navigate("/reviews");
    else if (item === "Home")    navigate(`/dashboard?token=${localStorage.getItem("token")}`);
    else if (item === "About")   navigate("/about/the-noir-experience");
    else if (item === "Menu")    navigate("/NoirKitchen/Menu");
    else if (item === "Contact") navigate("/Contact-us/Noir-Kitchen-Team");
  };

  const handleLogout = (e) => {
    e.preventDefault(); e.stopPropagation();
    setUserDropdownOpen(false); onLogout?.();
  };

  const handleCheckout = () => {
    if (!cartItems.length) return;
    setCartOpen(false);
    navigate("/cart/checkout", { state: { cartItems, totalPrice, clearCartOnSuccess: true } });
  };

  /* ── Notif helpers ── */
  const openNotifPanel = () => {
    setNotifOpen(v => !v);
    setNotifDetail(null);
    setCartOpen(false);
    setUserDropdownOpen(false);
  };

  const handleNotifCTA = (notif) => {
    if (!notif?.link) return;
    setNotifOpen(false); setNotifDetail(null);
    /^https?:\/\//.test(notif.link)
      ? window.open(notif.link, "_blank", "noopener,noreferrer")
      : navigate(notif.link);
  };

  /* ────────────────────────────────────────────
     NOTIFICATION PANEL  (list view + detail view)
     Renders as bottom-sheet on mobile, dropdown on desktop
  ──────────────────────────────────────────── */
  const renderNotifPanel = () => {
    if (!notifOpen) return null;

    /* ── DETAIL VIEW ── */
    if (notifDetail !== null) {
      const n   = notifications[notifDetail];
      if (!n) return null;
      const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
      return (
        <>
          <div className="noir-notif-backdrop" onClick={() => setNotifOpen(false)} />
          <div className="noir-notif-panel" style={{ "--na": cfg.color, "--nb": cfg.bg }}>
            <div className="noir-notif-panel-header">
              <button className="noir-notif-back-btn" onClick={() => setNotifDetail(null)}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>All Notifications</span>
              </button>
              <button className="noir-notif-close-btn" onClick={() => setNotifOpen(false)}>✕</button>
            </div>

            {n.imageUrl && (
              <div className="noir-notif-hero">
                <img src={n.imageUrl} alt={n.title} className="noir-notif-hero-img" />
                <div className="noir-notif-hero-fade" />
              </div>
            )}

            <div className="noir-notif-detail-body">
              <div className="noir-notif-type-badge" style={{ background: cfg.bg, color: cfg.color }}>
                <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: 10 }} />
                <span>{n.type || "info"}</span>
              </div>

              <div className="noir-notif-title-row">
                {n.emoji && <span className="noir-notif-emoji">{n.emoji}</span>}
                <h3 className="noir-notif-title">{n.title}</h3>
              </div>

              <div className="noir-notif-meta">
                {n.createdAt && <span>{timeAgo(n.createdAt)}</span>}
                {n.expiryDate && (
                  <span style={{ color: "#C99A1E" }}>
                    Expires {new Date(n.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>

              {n.message && <p className="noir-notif-message">{n.message}</p>}

              {n.link && (
                <button className="noir-notif-cta" style={{ background: cfg.color }}
                  onClick={() => handleNotifCTA(n)}>
                  Explore Now <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: 10 }} />
                </button>
              )}
            </div>

            {notifications.length > 1 && (
              <div className="noir-notif-pager">
                <button className="noir-notif-pager-btn"
                  disabled={notifDetail === 0}
                  onClick={() => setNotifDetail(i => i - 1)}>‹ Prev</button>
                <span className="noir-notif-pager-count">{notifDetail + 1} / {notifications.length}</span>
                <button className="noir-notif-pager-btn"
                  disabled={notifDetail === notifications.length - 1}
                  onClick={() => setNotifDetail(i => i + 1)}>Next ›</button>
              </div>
            )}
          </div>
        </>
      );
    }

    /* ── LIST VIEW ── */
    return (
      <>
        <div className="noir-notif-backdrop" onClick={() => setNotifOpen(false)} />
        <div className="noir-notif-panel">
          <div className="noir-notif-panel-header">
            <div className="noir-notif-panel-title">
              <FontAwesomeIcon icon={faBell} style={{ color: "#C4510A", fontSize: 14 }} />
              <span>Notifications</span>
              {notifications.length > 0 && (
                <span className="noir-notif-count-pill">{notifications.length}</span>
              )}
            </div>
            <button className="noir-notif-close-btn" onClick={() => setNotifOpen(false)}>✕</button>
          </div>

          {/* Mobile drag handle */}
          <div className="noir-notif-drag-handle" />

          {notifications.length === 0 ? (
            <div className="noir-notif-empty">
              <FontAwesomeIcon icon={faBell} style={{ fontSize: 28, color: "rgba(196,81,10,0.15)", marginBottom: 10 }} />
              <p>No notifications right now</p>
            </div>
          ) : (
            <div className="noir-notif-list">
              {notifications.map((n, idx) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                return (
                  <button key={n._id || idx} className="noir-notif-row"
                    onClick={() => setNotifDetail(idx)}>
                    <div className="noir-notif-row-icon" style={{ background: cfg.bg, color: cfg.color }}>
                      {n.imageUrl
                        ? <img src={n.imageUrl} alt="" className="noir-notif-row-thumb" />
                        : n.emoji
                          ? <span style={{ fontSize: 18 }}>{n.emoji}</span>
                          : <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: 15 }} />
                      }
                    </div>
                    <div className="noir-notif-row-body">
                      <div className="noir-notif-row-top">
                        <span className="noir-notif-row-title">{n.title}</span>
                        <span className="noir-notif-row-time">{timeAgo(n.createdAt)}</span>
                      </div>
                      {n.message && (
                        <p className="noir-notif-row-msg">
                          {n.message.length > 72 ? n.message.slice(0, 72) + "…" : n.message}
                        </p>
                      )}
                      {n.link && (
                        <span className="noir-notif-row-tag"
                          style={{ color: cfg.color, borderColor: cfg.color }}>
                          View offer
                        </span>
                      )}
                    </div>
                    <div className="noir-notif-row-dot" style={{ background: cfg.color }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  /* ──────────────────────────── JSX ──────────────────────────── */
  return (
    <>
      <style>{CSS}</style>

      {/* Backdrops for cart / user */}
      {userDropdownOpen && <div className="noir-backdrop" onClick={() => setUserDropdownOpen(false)} />}
      {cartOpen         && <div className="noir-backdrop" onClick={() => setCartOpen(false)} />}

      {/* Notification panel (self-contains its backdrop) */}
      {renderNotifPanel()}

      {/* User dropdown */}
      {userDropdownOpen && (
        <div className="noir-user-dropdown noir-dropdown-fixed">
          <div className="noir-dropdown-header">
            <div className="noir-avatar noir-avatar-lg">{getInitials(userName)}</div>
            <div>
              <div className="noir-dropdown-name">{userName}</div>
              <div className="noir-dropdown-email">{userEmail}</div>
            </div>
          </div>
          <div className="noir-dropdown-divider" />
          <a href="/profile" className="noir-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
            <FontAwesomeIcon icon={faUser} className="noir-icon-accent" /> My Profile
          </a>
          <a href={`/user/${localStorage.getItem("token")}`}
            className="noir-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
            <FontAwesomeIcon icon={faClipboardList} className="noir-icon-accent" /> My Orders
          </a>
          <button className="noir-dropdown-item noir-dropdown-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} className="noir-icon-accent" /> Logout
          </button>
        </div>
      )}

      {/* Cart dropdown */}
      {cartOpen && (
        <div className="noir-cart-dropdown noir-dropdown-fixed">
          <div className="noir-cart-header">
            <span className="noir-cart-title">
              <FontAwesomeIcon icon={faShoppingBag} className="noir-icon-accent" style={{ marginRight: 8 }} />
              Your Cart
            </span>
            <span className="noir-cart-count">{totalCount} item{totalCount !== 1 ? "s" : ""}</span>
          </div>
          {cartItems.length === 0 ? (
            <div className="noir-cart-empty">
              <FontAwesomeIcon icon={faShoppingBag} className="noir-cart-empty-icon" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="noir-cart-items">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="noir-cart-item">
                    <img src={item.img} alt={item.name} className="noir-cart-img" />
                    <div className="noir-cart-info">
                      <div className="noir-cart-name">{item.name}</div>
                      {item.variant && <div className="noir-cart-variant">{item.variant}</div>}
                      <div className="noir-cart-price">
                        ₹{parseInt(String(item.price || "0").replace(/[^\d]/g, "")) * item.qty}
                      </div>
                    </div>
                    <div className="noir-cart-qty-wrap">
                      <button className="noir-qty-btn"
                        onClick={() => item.qty > 1
                          ? cart.updateQty(item.menuItemId, item.variant, item.qty - 1)
                          : cart.removeItem(item.menuItemId, item.variant)}>−</button>
                      <span className="noir-qty-val">{item.qty}</span>
                      <button className="noir-qty-btn"
                        onClick={() => cart.updateQty(item.menuItemId, item.variant, item.qty + 1)}>+</button>
                    </div>
                    <button className="noir-remove-btn"
                      onClick={() => cart.removeItem(item.menuItemId, item.variant)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="noir-cart-footer">
                <div className="noir-cart-total-row">
                  <span className="noir-cart-total-label">Total</span>
                  <span className="noir-cart-total-val">₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="noir-cart-actions">
                  <button className="noir-cart-clear-btn"
                    onClick={() => { cart.clearCart(); setCartOpen(false); }}>
                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: 6 }} /> Clear
                  </button>
                  <button className="noir-cart-checkout-btn" onClick={handleCheckout}>
                    Checkout
                    <FontAwesomeIcon icon={faChevronDown} className="noir-checkout-arrow" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Navbar ── */}
      <div ref={navRef} className="noir-nav-wrapper">
        <nav className="noir-nav-container">
          {/* Logo */}
          <div className="noir-logo-wrap" onClick={() => navigate("/")}>
            <img src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
              alt="Noir Kitchen" className="noir-logo-img" />
            <div className="noir-logo-divider" />
            <div className="noir-brand-wrap">
              <div className="noir-brand-row">
                <span className="noir-brand-name noir-brand-dark">NOIR</span>
                <span className="noir-brand-name noir-brand-accent">KITCHEN</span>
              </div>
              <span className="noir-tagline">Elevated Taste, Timeless Experience</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="noir-navlinks-desktop">
            {NAV_ITEMS.map((item) => (
              <a key={item} href="#"
                className={`noir-nav-link${activeNav === item ? " active" : ""}`}
                onClick={(e) => handleNavClick(e, item)}>{item}</a>
            ))}
          </div>

          {/* Right actions */}
          <div className="noir-right-actions">
            <button className="noir-cart-btn" onClick={openNotifPanel} title="Notifications">
              <FontAwesomeIcon icon={faBell} style={{ fontSize: 16, color: "#C4510A" }} />
              {notifications.length > 0 && (
                <span className="noir-cart-badge">{notifications.length}</span>
              )}
            </button>

            <button className="noir-cart-btn"
              onClick={() => { setCartOpen(v => !v); setUserDropdownOpen(false); setNotifOpen(false); }}>
              <FontAwesomeIcon icon={faShoppingBag} style={{ fontSize: 16, color: "#C4510A" }} />
              {totalCount > 0 && <span className="noir-cart-badge">{totalCount}</span>}
            </button>

            <div className="noir-user-wrap">
              <button className="noir-user-btn"
                onClick={() => { setUserDropdownOpen(v => !v); setCartOpen(false); setNotifOpen(false); }}>
                <div className="noir-avatar">{getInitials(userName)}</div>
                <span className="noir-username">{userName}</span>
                <FontAwesomeIcon icon={faChevronDown}
                  style={{ fontSize: 10, color: "#C4510A", transition: "transform 0.2s",
                    transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
            </div>

            <button className="noir-hamburger"
              onClick={() => { setMobileMenuOpen(v => !v); setCartOpen(false); setUserDropdownOpen(false); setNotifOpen(false); }}
              aria-label="Toggle menu">
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="noir-mobile-menu">
            <div className="noir-mobile-user">
              <div className="noir-avatar">{getInitials(userName)}</div>
              <div>
                <div className="noir-dropdown-name">{userName}</div>
                <div className="noir-dropdown-email">{userEmail}</div>
              </div>
            </div>
            <div className="noir-dropdown-divider" style={{ margin: "8px 0" }} />
            {NAV_ITEMS.map((item) => (
              <a key={item} href="#"
                className={`noir-mobile-link${activeNav === item ? " active" : ""}`}
                onClick={(e) => handleNavClick(e, item)}>{item}</a>
            ))}
            {cartItems.length > 0 && (
              <button className="noir-mobile-cart-row"
                onClick={() => { setMobileMenuOpen(false); setCartOpen(true); }}>
                <FontAwesomeIcon icon={faShoppingBag} style={{ color: "#C4510A" }} />
                <span>Cart ({totalCount} items)</span>
                <span style={{ marginLeft: "auto", color: "#C4510A", fontWeight: 700 }}>
                  ₹{totalPrice.toLocaleString("en-IN")}
                </span>
              </button>
            )}
            {notifications.length > 0 && (
              <button className="noir-mobile-cart-row"
                onClick={() => { setMobileMenuOpen(false); setNotifDetail(null); setNotifOpen(true); }}>
                <FontAwesomeIcon icon={faBell} style={{ color: "#C4510A" }} />
                <span>Notifications ({notifications.length})</span>
              </button>
            )}
            <div className="noir-mobile-auth">
              <a href="/profile" className="noir-mobile-profile-btn" onClick={() => setMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faUser} /> Profile
              </a>
              <a href={`/user/${localStorage.getItem("token")}`}
                className="noir-mobile-orders-btn" onClick={() => setMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faClipboardList} /> Orders
              </a>
            </div>
            <button className="noir-mobile-logout-btn" onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} style={{ marginRight: 7 }} /> Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  /* ── BACKDROP (cart / user) ── */
  .noir-backdrop {
    position: fixed; inset: 0; z-index: 9997;
    background: rgba(20,12,4,0);
  }

  /* ── NAV WRAPPER ── */
  .noir-nav-wrapper { position: relative; z-index: 10000; padding: 18px 24px 0; }

  .noir-nav-container {
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(255,255,255,0.45);
    backdrop-filter: blur(22px) saturate(160%); -webkit-backdrop-filter: blur(22px) saturate(160%);
    box-shadow: 0 10px 36px rgba(40,20,5,0.10), 0 2px 8px rgba(40,20,5,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
    border-radius: 22px; padding: 5px 22px; gap: 14px;
    transition: box-shadow 0.3s, background 0.3s;
  }

  /* ── LOGO ── */
  .noir-logo-wrap { display: flex; align-items: center; gap: 13px; flex-shrink: 0; cursor: pointer; transition: opacity 0.2s; }
  .noir-logo-wrap:hover { opacity: 0.85; }
  .noir-logo-img     { height: 54px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12)); }
  .noir-logo-divider { width: 1px; height: 44px; background: linear-gradient(180deg,transparent,rgba(0,0,0,0.16),transparent); }
  .noir-brand-wrap   { display: flex; flex-direction: column; gap: 2px; }
  .noir-brand-row    { display: flex; align-items: baseline; gap: 7px; }
  .noir-brand-name   { font-family: 'Cormorant Garamond',serif; font-size: 23px; font-weight: 900; letter-spacing: 0.03em; line-height: 1; }
  .noir-brand-dark   { color: #1A1A1A; }
  .noir-brand-accent { color: #C4510A; }
  .noir-tagline      { font-size: 0.72em; font-family: 'Plus Jakarta Sans',sans-serif; color: #53392c; opacity: 0.85; }

  /* ── DESKTOP NAV ── */
  .noir-navlinks-desktop { display: flex; align-items: center; gap: 2px; }
  .noir-nav-link {
    position: relative; display: block; text-transform: uppercase;
    padding: 9px 15px; text-decoration: none; color: #262626;
    font-family: 'Plus Jakarta Sans',sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.08em; transition: color 0.3s, transform 0.25s; z-index: 1; border-radius: 12px;
  }
  .noir-nav-link::before {
    content:''; position:absolute; inset:0; border-radius:12px;
    border-top:2px solid #C4510A; border-bottom:2px solid #C4510A;
    transform:scaleY(2); opacity:0; transition:0.3s;
  }
  .noir-nav-link::after {
    content:''; position:absolute; inset:0; border-radius:12px;
    background:linear-gradient(135deg,#C4510A,#E8763A);
    transform:scale(0); opacity:0; transition:0.3s; z-index:-1;
    box-shadow:0 6px 16px rgba(196,81,10,0.35);
  }
  .noir-nav-link:hover,.noir-nav-link.active { color:#fff; transform:translateY(-1px); }
  .noir-nav-link:hover::before,.noir-nav-link.active::before { transform:scaleY(1); opacity:1; }
  .noir-nav-link:hover::after,.noir-nav-link.active::after { transform:scale(1); opacity:1; }

  /* ── RIGHT ACTIONS ── */
  .noir-right-actions { display:flex; align-items:center; gap:10px; flex-shrink:0; }

  .noir-cart-btn {
    position:relative; width:42px; height:42px; border-radius:50%;
    background:rgba(196,81,10,0.07); border:1.5px solid rgba(196,81,10,0.25);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all 0.25s cubic-bezier(.34,1.56,.64,1); flex-shrink:0;
  }
  .noir-cart-btn:hover { background:rgba(196,81,10,0.16); border-color:#C4510A; transform:scale(1.08); box-shadow:0 6px 16px rgba(196,81,10,0.2); }
  .noir-cart-btn:active { transform:scale(0.96); }
  .noir-cart-badge {
    position:absolute; top:-6px; right:-6px;
    background:linear-gradient(135deg,#C4510A,#E8763A);
    color:#fff; font-size:10px; font-weight:700;
    width:19px; height:19px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 3px 8px rgba(196,81,10,0.4); border:1.5px solid #fff;
  }

  /* ── CART / USER DROPDOWN SHARED ── */
  .noir-dropdown-fixed {
    position:fixed; top:122px; right:26px; z-index:9999;
    animation:noirDropIn 0.22s cubic-bezier(.2,.9,.3,1.2) both;
  }
  @keyframes noirDropIn {
    from { opacity:0; transform:translateY(-8px) scale(0.98); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  /* ── CART ── */
  .noir-cart-dropdown {
    width:390px; background:rgba(255,255,255,0.98);
    backdrop-filter:blur(24px) saturate(160%); -webkit-backdrop-filter:blur(24px) saturate(160%);
    border:1px solid rgba(196,81,10,0.16); border-radius:22px;
    box-shadow:0 24px 56px rgba(40,20,5,0.18),0 4px 14px rgba(40,20,5,0.08); overflow:hidden;
  }
  .noir-cart-header {
    padding:18px 22px; border-bottom:1px solid rgba(196,81,10,0.1);
    display:flex; justify-content:space-between; align-items:center;
    background:linear-gradient(180deg,rgba(196,81,10,0.04),transparent);
  }
  .noir-cart-title { font-family:'Cormorant Garamond',serif; font-size:21px; font-weight:600; color:#1A1208; }
  .noir-cart-count { font-size:11px; color:#9A8570; font-family:'Plus Jakarta Sans',sans-serif; background:rgba(196,81,10,0.06); padding:4px 10px; border-radius:20px; font-weight:600; }
  .noir-cart-empty { padding:44px 24px; text-align:center; color:#9A8570; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; display:flex; flex-direction:column; align-items:center; gap:12px; }
  .noir-cart-empty-icon { font-size:28px; color:rgba(196,81,10,0.18); }
  .noir-cart-items { max-height:340px; overflow-y:auto; padding:8px 0; }
  .noir-cart-items::-webkit-scrollbar { width:6px; }
  .noir-cart-items::-webkit-scrollbar-thumb { background:rgba(196,81,10,0.2); border-radius:10px; }
  .noir-cart-item { display:flex; gap:12px; padding:11px 18px; align-items:center; transition:background 0.15s; }
  .noir-cart-item:hover { background:rgba(196,81,10,0.035); }
  .noir-cart-img   { width:54px; height:54px; border-radius:12px; object-fit:cover; flex-shrink:0; box-shadow:0 3px 10px rgba(0,0,0,0.1); }
  .noir-cart-info  { flex:1; min-width:0; }
  .noir-cart-name  { font-size:13px; font-weight:700; color:#1A1208; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-cart-variant { font-size:11px; color:#9A8570; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-cart-price { font-size:12px; color:#C4510A; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif; margin-top:2px; }
  .noir-cart-qty-wrap { display:flex; align-items:center; gap:7px; flex-shrink:0; }
  .noir-qty-btn {
    width:27px; height:27px; border-radius:50%;
    border:1.5px solid rgba(196,81,10,0.3); background:none;
    color:#C4510A; cursor:pointer; font-size:14px; line-height:1;
    display:flex; align-items:center; justify-content:center;
    transition:all 0.18s; font-family:'Plus Jakarta Sans',sans-serif;
  }
  .noir-qty-btn:hover { background:#C4510A; color:#fff; border-color:#C4510A; transform:scale(1.08); }
  .noir-qty-val   { font-size:13px; font-weight:700; min-width:18px; text-align:center; color:#1A1208; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-remove-btn {
    width:29px; height:29px; border-radius:9px; border:none;
    background:rgba(196,81,10,0.07); color:#C4510A; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:11px;
    flex-shrink:0; transition:all 0.18s;
  }
  .noir-remove-btn:hover { background:rgba(211,47,47,0.12); color:#D32F2F; }
  .noir-cart-footer { padding:16px 22px; border-top:1px solid rgba(196,81,10,0.1); background:linear-gradient(0deg,rgba(196,81,10,0.03),transparent); }
  .noir-cart-total-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .noir-cart-total-label { font-size:11px; font-weight:700; color:#9A8570; text-transform:uppercase; letter-spacing:1px; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-cart-total-val   { font-family:'Cormorant Garamond',serif; font-size:25px; font-weight:600; color:#C4510A; }
  .noir-cart-actions { display:flex; gap:9px; }
  .noir-cart-clear-btn {
    flex:1; padding:11px; border-radius:50px;
    border:1.5px solid #C4510A; background:transparent;
    color:#C4510A; font-size:12px; font-weight:700; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s;
  }
  .noir-cart-clear-btn:hover { background:rgba(196,81,10,0.08); transform:translateY(-1px); }
  .noir-cart-checkout-btn {
    flex:2; padding:11px; border-radius:50px; border:none;
    background:linear-gradient(135deg,#C4510A,#E8763A); color:#fff;
    font-size:12px; font-weight:700; cursor:pointer; letter-spacing:0.5px;
    font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 8px 22px rgba(196,81,10,0.32); transition:all 0.25s;
    display:flex; align-items:center; justify-content:center; gap:8px;
  }
  .noir-cart-checkout-btn:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(196,81,10,0.42); }
  .noir-checkout-arrow { transform:rotate(-90deg); font-size:10px; }

  /* ════════════════════════════════════════════════════════
     NOTIFICATION PANEL
     Desktop: dropdown anchored top-right
     Mobile:  bottom sheet sliding up from bottom
  ════════════════════════════════════════════════════════ */

  /* Backdrop specific to notif panel */
  .noir-notif-backdrop {
    position:fixed; inset:0; z-index:10001;
    background:rgba(20,12,4,0.35);
    backdrop-filter:blur(2px);
    animation:noirFadeIn 0.2s ease both;
  }
  @keyframes noirFadeIn { from{opacity:0} to{opacity:1} }

  /* Panel base — desktop dropdown */
  .noir-notif-panel {
    position:fixed; z-index:10002;
    top:122px; right:26px;
    width:360px;
    max-height:calc(100vh - 150px);
    background:rgba(255,255,255,0.99);
    backdrop-filter:blur(24px) saturate(160%); -webkit-backdrop-filter:blur(24px) saturate(160%);
    border:1px solid rgba(196,81,10,0.16); border-radius:22px;
    box-shadow:0 24px 56px rgba(40,20,5,0.20),0 4px 14px rgba(40,20,5,0.08);
    display:flex; flex-direction:column; overflow:hidden;
    animation:noirDropIn 0.24s cubic-bezier(.2,.9,.3,1.2) both;
  }

  /* Drag handle — hidden on desktop, visible on mobile */
  .noir-notif-drag-handle { display:none; }

  /* Panel header */
  .noir-notif-panel-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 16px 12px;
    border-bottom:1px solid rgba(196,81,10,0.09);
    background:linear-gradient(180deg,rgba(196,81,10,0.04),transparent);
    flex-shrink:0;
  }
  .noir-notif-panel-title {
    display:flex; align-items:center; gap:8px;
    font-family:'Cormorant Garamond',serif; font-size:19px; font-weight:600; color:#1A1208;
  }
  .noir-notif-count-pill {
    background:linear-gradient(135deg,#C4510A,#E8763A);
    color:#fff; font-size:10px; font-weight:700;
    padding:2px 8px; border-radius:20px;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .noir-notif-close-btn {
    width:28px; height:28px; border-radius:50%;
    background:rgba(196,81,10,0.07); border:1px solid rgba(196,81,10,0.18);
    color:#9A8570; font-size:11px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:background 0.2s,color 0.2s; flex-shrink:0;
  }
  .noir-notif-close-btn:hover { background:#C4510A; color:#fff; }

  /* Back button */
  .noir-notif-back-btn {
    display:flex; align-items:center; gap:7px;
    background:none; border:none; cursor:pointer;
    font-size:12px; font-weight:600; color:#C4510A;
    font-family:'Plus Jakarta Sans',sans-serif; padding:0; transition:opacity 0.2s;
  }
  .noir-notif-back-btn:hover { opacity:0.72; }

  /* Empty state */
  .noir-notif-empty {
    padding:52px 24px; text-align:center; color:#9A8570;
    font-size:13px; font-family:'Plus Jakarta Sans',sans-serif;
    display:flex; flex-direction:column; align-items:center;
  }

  /* ── LIST ── */
  .noir-notif-list { overflow-y:auto; flex:1; }
  .noir-notif-list::-webkit-scrollbar { width:5px; }
  .noir-notif-list::-webkit-scrollbar-thumb { background:rgba(196,81,10,0.18); border-radius:10px; }

  .noir-notif-row {
    display:flex; align-items:flex-start; gap:12px;
    padding:13px 16px; width:100%; border:none; background:transparent;
    cursor:pointer; text-align:left; position:relative;
    border-bottom:1px solid rgba(196,81,10,0.07); transition:background 0.15s;
  }
  .noir-notif-row:last-child { border-bottom:none; }
  .noir-notif-row:hover { background:rgba(196,81,10,0.04); }

  .noir-notif-row-icon {
    width:44px; height:44px; border-radius:12px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; overflow:hidden;
  }
  .noir-notif-row-thumb { width:100%; height:100%; object-fit:cover; border-radius:12px; }

  .noir-notif-row-body { flex:1; min-width:0; }
  .noir-notif-row-top  { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:4px; }
  .noir-notif-row-title { font-size:13px; font-weight:700; color:#1A1208; font-family:'Plus Jakarta Sans',sans-serif; line-height:1.3; }
  .noir-notif-row-time  { font-size:10px; color:#9A8570; font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap; flex-shrink:0; margin-top:2px; }
  .noir-notif-row-msg   { font-size:12px; color:#6B5C4C; font-family:'Plus Jakarta Sans',sans-serif; line-height:1.5; margin:0 0 5px; }
  .noir-notif-row-tag   { display:inline-block; font-size:10px; font-weight:700; border:1px solid; border-radius:20px; padding:2px 9px; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-notif-row-dot   { width:7px; height:7px; border-radius:50%; flex-shrink:0; margin-top:5px; }

  /* ── DETAIL ── */
  .noir-notif-hero      { position:relative; width:100%; height:160px; overflow:hidden; background:#f5f5f3; flex-shrink:0; }
  .noir-notif-hero-img  { width:100%; height:100%; object-fit:cover; display:block; }
  .noir-notif-hero-fade { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 50%,rgba(255,255,255,0.55) 100%); }

  .noir-notif-detail-body { padding:16px 18px 18px; overflow-y:auto; flex:1; }
  .noir-notif-detail-body::-webkit-scrollbar { width:5px; }
  .noir-notif-detail-body::-webkit-scrollbar-thumb { background:rgba(196,81,10,0.18); border-radius:10px; }

  .noir-notif-type-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:3px 10px; border-radius:20px;
    font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;
    font-family:'Plus Jakarta Sans',sans-serif; margin-bottom:10px;
  }
  .noir-notif-title-row { display:flex; align-items:flex-start; gap:8px; margin-bottom:5px; }
  .noir-notif-emoji     { font-size:24px; line-height:1; flex-shrink:0; }
  .noir-notif-title     { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600; color:#1A1208; line-height:1.25; margin:0; }
  .noir-notif-meta      { display:flex; gap:12px; margin-bottom:12px; font-size:11px; color:#9A8570; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-notif-message   { font-size:13px; color:#4A4540; line-height:1.65; margin:0 0 16px; font-family:'Plus Jakarta Sans',sans-serif; white-space:pre-wrap; }
  .noir-notif-cta {
    display:inline-flex; align-items:center; gap:8px;
    color:#fff; border:none; padding:10px 20px; border-radius:50px;
    font-size:12px; font-weight:700; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 8px 20px rgba(196,81,10,0.28); transition:transform 0.2s,box-shadow 0.2s;
  }
  .noir-notif-cta:hover { transform:translateY(-2px); box-shadow:0 10px 24px rgba(196,81,10,0.4); }

  .noir-notif-pager {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 16px 14px; border-top:1px solid rgba(196,81,10,0.1); flex-shrink:0;
  }
  .noir-notif-pager-btn {
    background:rgba(196,81,10,0.07); border:1px solid rgba(196,81,10,0.2);
    color:#C4510A; padding:5px 14px; border-radius:20px;
    font-size:11px; font-weight:700; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s;
  }
  .noir-notif-pager-btn:hover:not(:disabled) { background:#C4510A; color:#fff; }
  .noir-notif-pager-btn:disabled { opacity:0.3; cursor:default; }
  .noir-notif-pager-count { font-size:11px; color:#9A8570; font-family:'Plus Jakarta Sans',sans-serif; }

  /* ── USER BUTTON ── */
  .noir-user-wrap { position:relative; flex-shrink:0; }
  .noir-user-btn {
    display:flex; align-items:center; gap:9px;
    background:rgba(196,81,10,0.07); border:1.5px solid rgba(196,81,10,0.25);
    border-radius:50px; padding:5px 15px 5px 5px;
    cursor:pointer; transition:all 0.25s cubic-bezier(.34,1.56,.64,1); font-family:'Plus Jakarta Sans',sans-serif;
  }
  .noir-user-btn:hover { background:rgba(196,81,10,0.14); border-color:#C4510A; transform:scale(1.03); box-shadow:0 6px 16px rgba(196,81,10,0.18); }
  .noir-user-btn:active { transform:scale(0.98); }
  .noir-avatar {
    width:35px; height:35px; border-radius:50%;
    background:linear-gradient(135deg,#C4510A,#E8763A);
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; color:#fff;
    font-family:'Plus Jakarta Sans',sans-serif; flex-shrink:0;
    box-shadow:0 3px 10px rgba(196,81,10,0.3);
  }
  .noir-avatar-lg { width:46px; height:46px; font-size:17px; }
  .noir-username  { font-size:13px; font-weight:600; color:#1A1A1A; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-icon-accent { color:#C4510A; }

  /* ── USER DROPDOWN ── */
  .noir-user-dropdown {
    background:rgba(255,255,255,0.98); backdrop-filter:blur(24px) saturate(160%);
    -webkit-backdrop-filter:blur(24px) saturate(160%); border:1px solid rgba(196,81,10,0.16);
    border-radius:18px; padding:13px; min-width:230px;
    box-shadow:0 24px 56px rgba(40,20,5,0.18),0 4px 14px rgba(40,20,5,0.08);
  }
  .noir-dropdown-header { display:flex; align-items:center; gap:13px; padding:4px 4px 13px; }
  .noir-dropdown-name   { font-weight:700; font-size:14px; color:#1A1A1A; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-dropdown-email  { font-size:11px; color:#9CA3AF; margin-top:2px; font-family:'Plus Jakarta Sans',sans-serif; }
  .noir-dropdown-divider { height:1px; background:rgba(196,81,10,0.12); margin:0 0 8px; }
  .noir-dropdown-item {
    display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:11px; width:100%;
    font-size:13px; font-weight:600; color:#1A1A1A; font-family:'Plus Jakarta Sans',sans-serif;
    text-decoration:none; cursor:pointer; background:transparent; border:none; text-align:left;
    transition:background 0.2s, transform 0.15s;
  }
  .noir-dropdown-item:hover { background:rgba(196,81,10,0.08); transform:translateX(2px); }
  .noir-dropdown-logout:hover { background:rgba(211,47,47,0.08); color:#D32F2F; }
  .noir-dropdown-logout:hover .noir-icon-accent { color:#D32F2F; }

  /* ── HAMBURGER ── */
  .noir-hamburger {
  display:none; background:transparent; border:1.5px solid #C4510A;
  padding:6px 11px; border-radius:11px; font-size:14px; color:#C4510A;
  cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s;
  align-items:center; justify-content:center; line-height:1;
}
  .noir-hamburger:hover { background:linear-gradient(135deg,#C4510A,#E8763A); color:#fff; box-shadow:0 6px 16px rgba(196,81,10,0.3); }
  .noir-hamburger:active { transform:scale(0.94); }

  /* ── MOBILE MENU ── */
  .noir-mobile-menu {
    margin-top:10px; background:rgba(255,255,255,0.97);
    backdrop-filter:blur(24px) saturate(160%); -webkit-backdrop-filter:blur(24px) saturate(160%);
    border:1px solid rgba(196,81,10,0.18); border-radius:18px;
    padding:16px; display:flex; flex-direction:column; gap:4px;
    box-shadow:0 18px 44px rgba(40,20,5,0.14);
    animation:noirDropIn 0.22s cubic-bezier(.2,.9,.3,1.2) both;
    max-height:calc(100vh - 110px); overflow-y:auto;
  }
  .noir-mobile-user { display:flex; align-items:center; gap:12px; padding:4px 8px 8px; }
  .noir-mobile-link {
    display:block; padding:12px 16px; text-decoration:none; color:#262626;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.08em; border-radius:12px; transition:all 0.2s;
  }
  .noir-mobile-link:hover,.noir-mobile-link.active {
    background:linear-gradient(135deg,#C4510A,#E8763A); color:#fff;
    box-shadow:0 6px 16px rgba(196,81,10,0.25);
  }
  .noir-mobile-cart-row {
    display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:12px;
    background:rgba(196,81,10,0.06); border:1.5px solid rgba(196,81,10,0.15);
    font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; color:#1A1208;
    cursor:pointer; width:100%; margin-top:4px; transition:all 0.2s;
  }
  .noir-mobile-cart-row:hover { background:rgba(196,81,10,0.12); }
  .noir-mobile-auth { display:flex; gap:10px; margin-top:10px; padding-top:10px; border-top:1px solid rgba(196,81,10,0.15); }
  .noir-mobile-profile-btn,.noir-mobile-orders-btn {
    flex:1; display:flex; align-items:center; justify-content:center; gap:7px;
    background:transparent; border:1.5px solid #C4510A;
    padding:11px 14px; border-radius:12px; font-size:13px; font-weight:600; color:#1A1A1A;
    cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s; text-decoration:none;
  }
  .noir-mobile-profile-btn:hover,.noir-mobile-orders-btn:hover { background:linear-gradient(135deg,#C4510A,#E8763A); color:#fff; }
  .noir-mobile-logout-btn {
    width:100%; background:linear-gradient(135deg,#C4510A,#E8763A); border:1.5px solid transparent;
    margin-top:10px; padding:12px 18px; border-radius:12px; font-size:13px; font-weight:700; color:#fff;
    cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.25s;
    box-shadow:0 8px 20px rgba(196,81,10,0.3);
  }
  .noir-mobile-logout-btn:hover { transform:translateY(-1px); box-shadow:0 10px 24px rgba(196,81,10,0.4); }

  /* ════════════════════════════════════════
     RESPONSIVE
  ════════════════════════════════════════ */
  @media (max-width: 1024px) {
    .noir-tagline { display:none; }
    .noir-logo-img { height:46px; }
    .noir-brand-name { font-size:19px; }
    .noir-logo-divider { display:none; }
    .noir-username { max-width:80px; }
  }

 @media (max-width: 768px) {
  .noir-navlinks-desktop { display:none; }
  .noir-user-wrap        { display:none; }
  .noir-hamburger        { display:flex; }
  .noir-nav-wrapper      { padding:14px 16px 0; }
  .noir-nav-container    { padding:9px 16px; border-radius:18px; }
  .noir-backdrop { z-index: 9998; background: rgba(20,12,4,0.35); backdrop-filter: blur(2px); }
  
  /* Cart: bottom sheet */
  .noir-cart-dropdown {
    position: fixed !important;
    z-index: 10002 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 85vh !important;
    border-radius: 24px 24px 0 0 !important;
    animation: noirSheetUp 0.32s cubic-bezier(.2,.9,.3,1.1) both !important;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* Cart drag handle */
  .noir-cart-dropdown::before {
    content: '';
    display: block;
    width: 40px; height: 4px;
    background: rgba(196,81,10,0.2);
    border-radius: 4px;
    margin: 10px auto 0;
    flex-shrink: 0;
  }
  .noir-cart-items {
    max-height: none;
    flex: 1;
    overflow-y: auto;
  }
  .noir-dropdown-fixed { right:16px; top:110px; }

  /* Notification: bottom sheet on mobile */
  .noir-notif-panel {
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 85vh !important;
    border-radius: 24px 24px 0 0 !important;
    animation: noirSheetUp 0.32s cubic-bezier(.2,.9,.3,1.1) both !important;
  }
  @keyframes noirSheetUp {
    from { transform: translateY(100%); opacity: 0.6; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .noir-notif-drag-handle {
    display: block;
    width: 40px; height: 4px; border-radius: 4px;
    background: rgba(196,81,10,0.2);
    margin: 10px auto 0;
    flex-shrink: 0;
  }
  .noir-notif-panel-header { padding: 10px 16px 12px; }
  .noir-notif-hero { height: 180px; }
  .noir-notif-row  { padding: 14px 16px; }
  .noir-notif-row-icon { width: 48px; height: 48px; }
  .noir-notif-row-title { font-size: 14px; }
  .noir-notif-row-msg   { font-size: 13px; }
  .noir-notif-detail-body { padding: 16px 18px 24px; }
  .noir-notif-title { font-size: 22px; }
  .noir-notif-message { font-size: 14px; }
  .noir-notif-cta { width: 100%; justify-content: center; padding: 13px 20px; font-size: 14px; }
}

  @media (max-width: 480px) {
  .noir-nav-wrapper   { padding:10px 10px 0; }
  .noir-nav-container { padding:8px 12px; border-radius:16px; gap:8px; }
  .noir-logo-img      { height:36px; }
  .noir-logo-wrap     { gap:9px; }
  .noir-brand-name    { font-size:15px; letter-spacing:0.01em; }
  .noir-hamburger     { padding:5px 9px; font-size:13px; }
  .noir-cart-btn      { width:38px; height:38px; }
  .noir-cart-item     { padding:9px 14px; gap:9px; }
  .noir-cart-img      { width:48px; height:48px; }
  .noir-cart-header,.noir-cart-footer { padding:14px 16px; }
  .noir-mobile-menu   { padding:14px; }
  .noir-mobile-auth   { flex-direction:column; gap:8px; }
  .noir-mobile-link   { padding:12px 14px; font-size:13px; }
  .noir-notif-panel   { max-height:92vh !important; }
  .noir-notif-pager   { padding:10px 14px 20px; }
}

  @media (max-width: 360px) {
    .noir-brand-name { font-size:13.5px; }
    .noir-tagline    { display:none; }
    .noir-logo-divider { display:none; }
    .noir-username   { display:none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .noir-notif-panel, .noir-dropdown-fixed, .noir-mobile-menu { animation:none !important; }
    .noir-nav-link,.noir-cart-btn,.noir-user-btn,.noir-hamburger { transition:none; }
  }
`;