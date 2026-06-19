// src/components/ui/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faChevronDown,
  faUser,
  faRightFromBracket,
  faShoppingBag,
  faTrash,
  faClipboardList
} from "@fortawesome/free-solid-svg-icons";
import gsap from "gsap";

const NAV_ITEMS = ["Home", "Menu", "About", "Review", "Contact"];

function getInitials(name = "") {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export default function Navbar({ user, onLogout, activeNav, setActiveNav, cart }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const cartItems = cart?.cartItems || [];
  const totalCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartItems.reduce((s, i) =>
    s + parseInt(String(i.price || "0").replace(/[^\d]/g, "")) * i.qty, 0
  );

  const navigate = useNavigate();
  const navRef = useRef(null);
  const animatedIn = useRef(false);

  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  /* ── Entrance animation ── */
  useEffect(() => {
    if (animatedIn.current || !navRef.current) return;
    animatedIn.current = true;
    const wrapper = navRef.current;
    const container = wrapper.querySelector(".noir-nav-container");
    const logo = wrapper.querySelector(".noir-logo-wrap");
    const links = wrapper.querySelectorAll(".noir-nav-link");
    const userBtn = wrapper.querySelector(".noir-user-btn, .noir-hamburger");

    gsap.set(wrapper, { opacity: 0, y: -24 });
    gsap.set(container, { opacity: 0, scale: 0.97 });
    gsap.set(logo, { opacity: 0, x: -20 });
    gsap.set(links, { opacity: 0, y: -12 });
    if (userBtn) gsap.set(userBtn, { opacity: 0, scale: 0.7 });

    const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });
    tl.to(wrapper, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" })
      .to(container, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" }, "-=0.25")
      .to(logo, { opacity: 1, x: 0, duration: 0.42 }, "-=0.22")
      .to(links, { opacity: 1, y: 0, duration: 0.35, stagger: 0.06 }, "-=0.28")
      .to(userBtn, { opacity: 1, scale: 1, duration: 0.38, ease: "back.out(2)" }, "-=0.22");
  }, []);

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setActiveNav?.(item);
    setMobileMenuOpen(false);
    setCartOpen(false);
    if (item === "Review") navigate("/reviews");
    else if (item === "Home") navigate(`/dashboard?token=${localStorage.getItem("token")}`);
    else if (item === "About") navigate("/about/the-noir-experience");
    else if (item === "Menu") navigate("/NoirKitchen/Menu");
    else if (item === "Contact") navigate("/Contact-us/Noir-Kitchen-Team");
  };

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUserDropdownOpen(false);
    onLogout?.();
  };

  /* ── Cart checkout: pass all items as state ── */
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setCartOpen(false);
    navigate("/cart/checkout", { state: { cartItems, totalPrice, clearCartOnSuccess: true } });
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrops */}
      {userDropdownOpen && (
        <div className="noir-backdrop" onClick={() => setUserDropdownOpen(false)} />
      )}
      {cartOpen && (
        <div className="noir-backdrop" onClick={() => setCartOpen(false)} />
      )}

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
            className="noir-dropdown-item"
            onClick={() => setUserDropdownOpen(false)}
          >
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
            <div className="noir-cart-empty">Your cart is empty</div>
          ) : (
            <>
              <div className="noir-cart-items">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="noir-cart-item">
                    <img src={item.img} alt={item.name} className="noir-cart-img" />
                    <div className="noir-cart-info">
                      <div className="noir-cart-name">{item.name}</div>
                      {item.variant && <div className="noir-cart-variant">{item.variant}</div>}
                      <div className="noir-cart-price">₹{parseInt(String(item.price || "0").replace(/[^\d]/g, "")) * item.qty}</div>
                    </div>
                    <div className="noir-cart-qty-wrap">
                      <button
                        className="noir-qty-btn"
                        onClick={() => item.qty > 1
                          ? cart.updateQty(item.menuItemId, item.variant, item.qty - 1)
                          : cart.removeItem(item.menuItemId, item.variant)
                        }
                      >−</button>
                      <span className="noir-qty-val">{item.qty}</span>
                      <button
                        className="noir-qty-btn"
                        onClick={() => cart.updateQty(item.menuItemId, item.variant, item.qty + 1)}
                      >+</button>
                    </div>
                    <button
                      className="noir-remove-btn"
                      onClick={() => cart.removeItem(item.menuItemId, item.variant)}
                      title="Remove"
                    >
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
                  <button
                    className="noir-cart-clear-btn"
                    onClick={() => { cart.clearCart(); setCartOpen(false); }}
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: 6 }} /> Clear
                  </button>
                  <button className="noir-cart-checkout-btn" onClick={handleCheckout}>
                    Checkout →
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
            <img
              src="https://i.postimg.cc/hG4FkpbT/Chat-GPT-Image-Jun-6-2026-05-29-17-PM.png"
              alt="Noir Kitchen"
              className="noir-logo-img"
            />
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
              <a
                key={item}
                href="#"
                className={`noir-nav-link${activeNav === item ? " active" : ""}`}
                onClick={(e) => handleNavClick(e, item)}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right side actions */}
          <div className="noir-right-actions">
            {/* Cart button */}
            <button className="noir-cart-btn" onClick={() => { setCartOpen(v => !v); setUserDropdownOpen(false); }}>
              <FontAwesomeIcon icon={faShoppingBag} style={{ fontSize: 16, color: "#C4510A" }} />
              {totalCount > 0 && <span className="noir-cart-badge">{totalCount}</span>}
            </button>

            {/* User button — desktop */}
            <div className="noir-user-wrap">
              <button
                className="noir-user-btn"
                onClick={() => { setUserDropdownOpen(v => !v); setCartOpen(false); }}
              >
                <div className="noir-avatar">{getInitials(userName)}</div>
                <span className="noir-username">{userName}</span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  style={{ fontSize: 10, color: "#C4510A", transition: "transform 0.2s", transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            </div>

            {/* Hamburger */}
            <button
              className="noir-hamburger"
              onClick={() => { setMobileMenuOpen(v => !v); setCartOpen(false); setUserDropdownOpen(false); }}
              aria-label="Toggle menu"
            >
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
              <a
                key={item}
                href="#"
                className={`noir-mobile-link${activeNav === item ? " active" : ""}`}
                onClick={(e) => handleNavClick(e, item)}
              >
                {item}
              </a>
            ))}

            {/* Mobile cart summary */}
            {cartItems.length > 0 && (
              <button className="noir-mobile-cart-row" onClick={() => { setMobileMenuOpen(false); setCartOpen(true); }}>
                <FontAwesomeIcon icon={faShoppingBag} style={{ color: "#C4510A" }} />
                <span>Cart ({totalCount} items)</span>
                <span style={{ marginLeft: "auto", color: "#C4510A", fontWeight: 700 }}>₹{totalPrice.toLocaleString("en-IN")}</span>
              </button>
            )}

            <div className="noir-mobile-auth">
              <a href="/profile" className="noir-mobile-profile-btn" onClick={() => setMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faUser} /> Profile
              </a>
              <a href={`/user/${localStorage.getItem("token")}`}
                className="noir-mobile-link"
                style={{ marginBottom: 4 }}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </a>
              <button className="noir-mobile-logout-btn" onClick={handleLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} style={{ marginRight: 7 }} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  /* ── BACKDROP ── */
  .noir-backdrop {
    position: fixed; inset: 0; z-index: 9997;
  }

  /* ── WRAPPER ── */
  .noir-nav-wrapper {
    position: relative; z-index: 10000;
    padding: 16px 20px 0;
  }

  /* ── CONTAINER ── */
  .noir-nav-container {
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.35);
    box-shadow: 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6);
    border-radius: 20px; padding: 10px 20px; gap: 12px;
  }

  /* ── LOGO ── */
  .noir-logo-wrap {
    display: flex; align-items: center; gap: 12px;
    flex-shrink: 0; cursor: pointer;
  }
  .noir-logo-img      { height: 52px; width: auto; object-fit: contain; }
  .noir-logo-divider  { width: 1px; height: 44px; background: rgba(0,0,0,0.12); }
  .noir-brand-wrap    { display: flex; flex-direction: column; gap: 2px; }
  .noir-brand-row     { display: flex; align-items: baseline; gap: 7px; }
  .noir-brand-name    { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 900; letter-spacing: 0.03em; line-height: 1; }
  .noir-brand-dark    { color: #1A1A1A; }
  .noir-brand-accent  { color: #C4510A; }
  .noir-tagline       { font-size: 0.72em; font-family: 'Plus Jakarta Sans', sans-serif; color: #a97458; }

  /* ── DESKTOP NAV LINKS ── */
  .noir-navlinks-desktop { display: flex; align-items: center; }
  .noir-nav-link {
    position: relative; display: block; text-transform: uppercase;
    padding: 8px 14px; text-decoration: none; color: #262626;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;
    font-weight: 600; letter-spacing: 0.08em; transition: color 0.3s; z-index: 1;
  }
  .noir-nav-link::before {
    content: ''; position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    border-top: 2px solid #C4510A; border-bottom: 2px solid #C4510A;
    transform: scaleY(2); opacity: 0; transition: 0.3s;
  }
  .noir-nav-link::after {
    content: ''; position: absolute; top: 2px; left: 0;
    width: 100%; height: 100%; background: #C4510A;
    transform: scale(0); opacity: 0; transition: 0.3s; z-index: -1;
  }
  .noir-nav-link:hover, .noir-nav-link.active { color: #fff; }
  .noir-nav-link:hover::before, .noir-nav-link.active::before { transform: scaleY(1); opacity: 1; }
  .noir-nav-link:hover::after, .noir-nav-link.active::after { transform: scale(1); opacity: 1; }

  /* ── RIGHT ACTIONS ── */
  .noir-right-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  /* ── CART BTN ── */
  .noir-cart-btn {
    position: relative; width: 40px; height: 40px; border-radius: 50%;
    background: rgba(196,81,10,0.06); border: 1.5px solid rgba(196,81,10,0.25);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  .noir-cart-btn:hover { background: rgba(196,81,10,0.14); border-color: #C4510A; transform: scale(1.05); }
  .noir-cart-badge {
    position: absolute; top: -6px; right: -6px;
    background: linear-gradient(135deg,#C4510A,#E8763A);
    color: #fff; font-size: 10px; font-weight: 700;
    width: 18px; height: 18px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* ── CART DROPDOWN ── */
  .noir-dropdown-fixed { position: fixed; top: 80px; right: 24px; z-index: 9999; }
  .noir-cart-dropdown {
    width: 380px; background: rgba(255,255,255,0.98);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(196,81,10,0.18); border-radius: 20px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.15); overflow: hidden;
  }
  .noir-cart-header {
    padding: 16px 20px; border-bottom: 1px solid rgba(196,81,10,0.1);
    display: flex; justify-content: space-between; align-items: center;
  }
  .noir-cart-title {
    font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #1A1208;
  }
  .noir-cart-count { font-size: 11px; color: #9A8570; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-empty { padding: 32px; text-align: center; color: #9A8570; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-items { max-height: 320px; overflow-y: auto; padding: 8px 0; }
  .noir-cart-item {
    display: flex; gap: 10px; padding: 10px 16px; align-items: center;
    transition: background 0.15s;
  }
  .noir-cart-item:hover { background: rgba(196,81,10,0.03); }
  .noir-cart-img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
  .noir-cart-info { flex: 1; min-width: 0; }
  .noir-cart-name { font-size: 13px; font-weight: 700; color: #1A1208; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-variant { font-size: 11px; color: #9A8570; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-price { font-size: 12px; color: #C4510A; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; margin-top: 2px; }
  .noir-cart-qty-wrap { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .noir-qty-btn {
    width: 26px; height: 26px; border-radius: 50%;
    border: 1.5px solid rgba(196,81,10,0.3); background: none;
    color: #C4510A; cursor: pointer; font-size: 14px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .noir-qty-btn:hover { background: #C4510A; color: #fff; border-color: #C4510A; }
  .noir-qty-val { font-size: 13px; font-weight: 700; min-width: 18px; text-align: center; color: #1A1208; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-remove-btn {
    width: 28px; height: 28px; border-radius: 8px; border: none;
    background: rgba(196,81,10,0.06); color: #C4510A; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
    flex-shrink: 0; transition: all 0.15s;
  }
  .noir-remove-btn:hover { background: rgba(196,81,10,0.15); }
  .noir-cart-footer { padding: 14px 20px; border-top: 1px solid rgba(196,81,10,0.1); }
  .noir-cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .noir-cart-total-label { font-size: 11px; font-weight: 700; color: #9A8570; text-transform: uppercase; letter-spacing: 1px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-total-val { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #C4510A; }
  .noir-cart-actions { display: flex; gap: 8px; }
  .noir-cart-clear-btn {
    flex: 1; padding: 10px; border-radius: 50px;
    border: 1.5px solid #C4510A; background: transparent;
    color: #C4510A; font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s;
  }
  .noir-cart-clear-btn:hover { background: rgba(196,81,10,0.08); }
  .noir-cart-checkout-btn {
    flex: 2; padding: 10px; border-radius: 50px; border: none;
    background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff;
    font-size: 12px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 6px 18px rgba(196,81,10,0.3); transition: all 0.2s;
  }
  .noir-cart-checkout-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(196,81,10,0.4); }

  /* ── USER BUTTON ── */
  .noir-user-wrap { position: relative; flex-shrink: 0; }
  .noir-user-btn {
    display: flex; align-items: center; gap: 8px;
    background: rgba(196,81,10,0.06); border: 1.5px solid rgba(196,81,10,0.25);
    border-radius: 50px; padding: 5px 14px 5px 5px;
    cursor: pointer; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .noir-user-btn:hover { background: rgba(196,81,10,0.12); border-color: #C4510A; transform: scale(1.02); }
  .noir-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg,#C4510A,#E8763A);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif; flex-shrink: 0;
  }
  .noir-avatar-lg { width: 44px; height: 44px; font-size: 16px; }
  .noir-username { font-size: 13px; font-weight: 600; color: #1A1A1A; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-icon-accent { color: #C4510A; }

  /* ── USER DROPDOWN ── */
  .noir-user-dropdown {
    background: rgba(255,255,255,0.98); backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(196,81,10,0.18);
    border-radius: 16px; padding: 12px; min-width: 220px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.15);
  }
  .noir-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 4px 4px 12px; }
  .noir-dropdown-name { font-weight: 700; font-size: 14px; color: #1A1A1A; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-dropdown-email { font-size: 11px; color: #9CA3AF; margin-top: 2px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-dropdown-divider { height: 1px; background: rgba(196,81,10,0.12); margin: 0 0 8px; }
  .noir-dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    width: 100%; font-size: 13px; font-weight: 600; color: #1A1A1A;
    font-family: 'Plus Jakarta Sans', sans-serif;
    text-decoration: none; cursor: pointer;
    background: transparent; border: none; text-align: left; transition: background 0.2s;
  }
  .noir-dropdown-item:hover { background: rgba(196,81,10,0.08); }
  .noir-dropdown-logout:hover { background: rgba(196,81,10,0.1); color: #C4510A; }

  /* ── HAMBURGER ── */
  .noir-hamburger {
    display: none; background: transparent; border: 1.5px solid #C4510A;
    padding: 8px 12px; border-radius: 10px; font-size: 16px; color: #C4510A;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.3s;
    align-items: center; justify-content: center;
  }
  .noir-hamburger:hover { background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff; }

  /* ── MOBILE MENU ── */
  .noir-mobile-menu {
    margin-top: 10px; background: rgba(255,255,255,0.96);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(196,81,10,0.2); border-radius: 16px;
    padding: 16px; display: flex; flex-direction: column; gap: 4px;
  }
  .noir-mobile-user { display: flex; align-items: center; gap: 12px; padding: 4px 8px 8px; }
  .noir-mobile-link {
    display: block; padding: 10px 16px; text-decoration: none; color: #262626;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em; border-radius: 10px; transition: all 0.2s;
  }
  .noir-mobile-link:hover, .noir-mobile-link.active {
    background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff;
  }
  .noir-mobile-cart-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-radius: 10px;
    background: rgba(196,81,10,0.06); border: 1.5px solid rgba(196,81,10,0.15);
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600; color: #1A1208;
    cursor: pointer; width: 100%; margin-top: 4px; transition: all 0.2s;
  }
  .noir-mobile-cart-row:hover { background: rgba(196,81,10,0.12); }
  .noir-mobile-auth { display: flex; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(196,81,10,0.15); }
  .noir-mobile-profile-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    background: transparent; border: 1.5px solid #C4510A;
    padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #1A1A1A;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.3s; text-decoration: none;
  }
  .noir-mobile-profile-btn:hover { background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff; }
  .noir-mobile-logout-btn {
    flex: 1; background: linear-gradient(135deg,#C4510A,#E8763A); border: 1.5px solid transparent;
    padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #fff;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.3s;
  }
  .noir-mobile-logout-btn:hover { background: transparent; color: #C4510A; border-color: #C4510A; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .noir-tagline    { display: none; }
    .noir-logo-img   { height: 44px; }
    .noir-brand-name { font-size: 19px; }
    .noir-logo-divider { display: none; }
    .noir-username   { max-width: 80px; }
  }
  @media (max-width: 768px) {
    .noir-navlinks-desktop { display: none; }
    .noir-user-wrap        { display: none; }
    .noir-hamburger        { display: flex; }
    .noir-nav-wrapper      { padding: 12px 16px 0; }
    .noir-nav-container    { padding: 8px 16px; border-radius: 16px; }
    .noir-cart-dropdown    { width: calc(100vw - 32px); right: 16px; }
    .noir-dropdown-fixed   { top: 70px; }
  }
  @media (max-width: 480px) {
    .noir-nav-wrapper   { padding: 10px 12px 0; }
    .noir-logo-img      { height: 38px; }
    .noir-brand-name    { font-size: 17px; }
    .noir-cart-dropdown { width: calc(100vw - 24px); right: 12px; }
    .noir-cart-item     { padding: 8px 12px; }
  }
  `;