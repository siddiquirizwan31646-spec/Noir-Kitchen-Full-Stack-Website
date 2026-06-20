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

  /* ── Lock body scroll when a mobile overlay is open ── */
  useEffect(() => {
    const anyOpen = mobileMenuOpen || cartOpen || userDropdownOpen;
    if (anyOpen && window.innerWidth <= 480) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileMenuOpen, cartOpen, userDropdownOpen]);

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
                className="noir-mobile-orders-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
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

  /* ── BACKDROP ── */
  .noir-backdrop {
    position: fixed; inset: 0; z-index: 9997;
    background: rgba(20,12,4,0); 
    transition: background 0.25s ease;
  }

  /* ── WRAPPER ── */
  .noir-nav-wrapper {
    position: relative; z-index: 10000;
    padding: 18px 24px 0;
  }

  /* ── CONTAINER ── */
  .noir-nav-container {
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(22px) saturate(160%); -webkit-backdrop-filter: blur(22px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0);
    box-shadow: 0 10px 36px rgba(40,20,5,0.10), 0 2px 8px rgba(40,20,5,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
    border-radius: 22px; padding: 5px 22px; gap: 14px;
    transition: box-shadow 0.3s ease, background 0.3s ease;
  }

  /* ── LOGO ── */
  .noir-logo-wrap {
    display: flex; align-items: center; gap: 13px;
    flex-shrink: 0; cursor: pointer;
    transition: opacity 0.2s ease;
  }
  .noir-logo-wrap:hover { opacity: 0.85; }
  .noir-logo-img      { height: 54px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12)); }
  .noir-logo-divider  { width: 1px; height: 44px; background: linear-gradient(180deg, transparent, rgba(0,0,0,0.16), transparent); }
  .noir-brand-wrap    { display: flex; flex-direction: column; gap: 2px; }
  .noir-brand-row     { display: flex; align-items: baseline; gap: 7px; }
  .noir-brand-name    { font-family: 'Cormorant Garamond', serif; font-size: 23px; font-weight: 900; letter-spacing: 0.03em; line-height: 1; }
  .noir-brand-dark    { color: #1A1A1A; }
  .noir-brand-accent  { color: #C4510A; }
  .noir-tagline       { font-size: 0.72em; font-family: 'Plus Jakarta Sans', sans-serif; color: #53392c; opacity: 0.85; }

  /* ── DESKTOP NAV LINKS ── */
  .noir-navlinks-desktop { display: flex; align-items: center; gap: 2px; }
  .noir-nav-link {
    position: relative; display: block; text-transform: uppercase;
    padding: 9px 15px; text-decoration: none; color: #262626;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;
    font-weight: 600; letter-spacing: 0.08em; transition: color 0.3s, transform 0.25s; z-index: 1;
    border-radius: 12px;
  }
  .noir-nav-link::before {
    content: ''; position: absolute; inset: 0;
    border-radius: 12px;
    border-top: 2px solid #C4510A; border-bottom: 2px solid #C4510A;
    transform: scaleY(2); opacity: 0; transition: 0.3s;
  }
  .noir-nav-link::after {
    content: ''; position: absolute; inset: 0;
    border-radius: 12px;
    background: linear-gradient(135deg,#C4510A,#E8763A);
    transform: scale(0); opacity: 0; transition: 0.3s; z-index: -1;
    box-shadow: 0 6px 16px rgba(196,81,10,0.35);
  }
  .noir-nav-link:hover, .noir-nav-link.active { color: #fff; transform: translateY(-1px); }
  .noir-nav-link:hover::before, .noir-nav-link.active::before { transform: scaleY(1); opacity: 1; }
  .noir-nav-link:hover::after, .noir-nav-link.active::after { transform: scale(1); opacity: 1; }
  .noir-nav-link:focus-visible { outline: 2px solid #C4510A; outline-offset: 2px; }

  /* ── RIGHT ACTIONS ── */
  .noir-right-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

  /* ── CART BTN ── */
  .noir-cart-btn {
    position: relative; width: 42px; height: 42px; border-radius: 50%;
    background: rgba(196,81,10,0.07); border: 1.5px solid rgba(196,81,10,0.25);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.25s cubic-bezier(.34,1.56,.64,1); flex-shrink: 0;
  }
  .noir-cart-btn:hover { background: rgba(196,81,10,0.16); border-color: #C4510A; transform: scale(1.08); box-shadow: 0 6px 16px rgba(196,81,10,0.2); }
  .noir-cart-btn:active { transform: scale(0.96); }
  .noir-cart-badge {
    position: absolute; top: -6px; right: -6px;
    background: linear-gradient(135deg,#C4510A,#E8763A);
    color: #fff; font-size: 10px; font-weight: 700;
    width: 19px; height: 19px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 3px 8px rgba(196,81,10,0.4);
    border: 1.5px solid #fff;
  }

  /* ── CART DROPDOWN ── */
  .noir-dropdown-fixed {
    position: fixed; top: 122px; right: 26px; z-index: 9999;
    animation: noirDropIn 0.22s cubic-bezier(.2,.9,.3,1.2) both;
  }
  @keyframes noirDropIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .noir-cart-dropdown {
    width: 390px; background: rgba(255,255,255,0.98);
    backdrop-filter: blur(24px) saturate(160%); -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgba(196,81,10,0.16); border-radius: 22px;
    box-shadow: 0 24px 56px rgba(40,20,5,0.18), 0 4px 14px rgba(40,20,5,0.08); overflow: hidden;
  }
  .noir-cart-header {
    padding: 18px 22px; border-bottom: 1px solid rgba(196,81,10,0.1);
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(180deg, rgba(196,81,10,0.04), transparent);
  }
  .noir-cart-title {
    font-family: 'Cormorant Garamond', serif; font-size: 21px; font-weight: 600; color: #1A1208;
  }
  .noir-cart-count {
    font-size: 11px; color: #9A8570; font-family: 'Plus Jakarta Sans', sans-serif;
    background: rgba(196,81,10,0.06); padding: 4px 10px; border-radius: 20px; font-weight: 600;
  }
  .noir-cart-empty {
    padding: 44px 24px; text-align: center; color: #9A8570;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .noir-cart-empty-icon { font-size: 28px; color: rgba(196,81,10,0.18); }
  .noir-cart-items { max-height: 340px; overflow-y: auto; padding: 8px 0; }
  .noir-cart-items::-webkit-scrollbar { width: 6px; }
  .noir-cart-items::-webkit-scrollbar-thumb { background: rgba(196,81,10,0.2); border-radius: 10px; }
  .noir-cart-item {
    display: flex; gap: 12px; padding: 11px 18px; align-items: center;
    transition: background 0.15s;
  }
  .noir-cart-item:hover { background: rgba(196,81,10,0.035); }
  .noir-cart-img { width: 54px; height: 54px; border-radius: 12px; object-fit: cover; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
  .noir-cart-info { flex: 1; min-width: 0; }
  .noir-cart-name { font-size: 13px; font-weight: 700; color: #1A1208; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-variant { font-size: 11px; color: #9A8570; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-price { font-size: 12px; color: #C4510A; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; margin-top: 2px; }
  .noir-cart-qty-wrap { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
  .noir-qty-btn {
    width: 27px; height: 27px; border-radius: 50%;
    border: 1.5px solid rgba(196,81,10,0.3); background: none;
    color: #C4510A; cursor: pointer; font-size: 14px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .noir-qty-btn:hover { background: #C4510A; color: #fff; border-color: #C4510A; transform: scale(1.08); }
  .noir-qty-val { font-size: 13px; font-weight: 700; min-width: 18px; text-align: center; color: #1A1208; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-remove-btn {
    width: 29px; height: 29px; border-radius: 9px; border: none;
    background: rgba(196,81,10,0.07); color: #C4510A; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
    flex-shrink: 0; transition: all 0.18s;
  }
  .noir-remove-btn:hover { background: rgba(211,47,47,0.12); color: #D32F2F; }
  .noir-cart-footer { padding: 16px 22px; border-top: 1px solid rgba(196,81,10,0.1); background: linear-gradient(0deg, rgba(196,81,10,0.03), transparent); }
  .noir-cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .noir-cart-total-label { font-size: 11px; font-weight: 700; color: #9A8570; text-transform: uppercase; letter-spacing: 1px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-cart-total-val { font-family: 'Cormorant Garamond', serif; font-size: 25px; font-weight: 600; color: #C4510A; }
  .noir-cart-actions { display: flex; gap: 9px; }
  .noir-cart-clear-btn {
    flex: 1; padding: 11px; border-radius: 50px;
    border: 1.5px solid #C4510A; background: transparent;
    color: #C4510A; font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s;
  }
  .noir-cart-clear-btn:hover { background: rgba(196,81,10,0.08); transform: translateY(-1px); }
  .noir-cart-checkout-btn {
    flex: 2; padding: 11px; border-radius: 50px; border: none;
    background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff;
    font-size: 12px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 8px 22px rgba(196,81,10,0.32); transition: all 0.25s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .noir-cart-checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(196,81,10,0.42); }
  .noir-checkout-arrow { transform: rotate(-90deg); font-size: 10px; }

  /* ── USER BUTTON ── */
  .noir-user-wrap { position: relative; flex-shrink: 0; }
  .noir-user-btn {
    display: flex; align-items: center; gap: 9px;
    background: rgba(196,81,10,0.07); border: 1.5px solid rgba(196,81,10,0.25);
    border-radius: 50px; padding: 5px 15px 5px 5px;
    cursor: pointer; transition: all 0.25s cubic-bezier(.34,1.56,.64,1); font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .noir-user-btn:hover { background: rgba(196,81,10,0.14); border-color: #C4510A; transform: scale(1.03); box-shadow: 0 6px 16px rgba(196,81,10,0.18); }
  .noir-user-btn:active { transform: scale(0.98); }
  .noir-avatar {
    width: 35px; height: 35px; border-radius: 50%;
    background: linear-gradient(135deg,#C4510A,#E8763A);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
    font-family: 'Plus Jakarta Sans', sans-serif; flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(196,81,10,0.3);
  }
  .noir-avatar-lg { width: 46px; height: 46px; font-size: 17px; }
  .noir-username { font-size: 13px; font-weight: 600; color: #1A1A1A; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-icon-accent { color: #C4510A; }

  /* ── USER DROPDOWN ── */
  .noir-user-dropdown {
    background: rgba(255,255,255,0.98); backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%); border: 1px solid rgba(196,81,10,0.16);
    border-radius: 18px; padding: 13px; min-width: 230px;
    box-shadow: 0 24px 56px rgba(40,20,5,0.18), 0 4px 14px rgba(40,20,5,0.08);
  }
  .noir-dropdown-header { display: flex; align-items: center; gap: 13px; padding: 4px 4px 13px; }
  .noir-dropdown-name { font-weight: 700; font-size: 14px; color: #1A1A1A; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-dropdown-email { font-size: 11px; color: #9CA3AF; margin-top: 2px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .noir-dropdown-divider { height: 1px; background: rgba(196,81,10,0.12); margin: 0 0 8px; }
  .noir-dropdown-item {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 13px; border-radius: 11px;
    width: 100%; font-size: 13px; font-weight: 600; color: #1A1A1A;
    font-family: 'Plus Jakarta Sans', sans-serif;
    text-decoration: none; cursor: pointer;
    background: transparent; border: none; text-align: left; transition: background 0.2s, transform 0.15s;
  }
  .noir-dropdown-item:hover { background: rgba(196,81,10,0.08); transform: translateX(2px); }
  .noir-dropdown-logout:hover { background: rgba(211,47,47,0.08); color: #D32F2F; }
  .noir-dropdown-logout:hover .noir-icon-accent { color: #D32F2F; }

  /* ── HAMBURGER ── */
  .noir-hamburger {
    display: none; background: transparent; border: 1.5px solid #C4510A;
    padding: 9px 13px; border-radius: 11px; font-size: 16px; color: #C4510A;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.25s;
    align-items: center; justify-content: center;
  }
  .noir-hamburger:hover { background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff; box-shadow: 0 6px 16px rgba(196,81,10,0.3); }
  .noir-hamburger:active { transform: scale(0.94); }

  /* ── MOBILE MENU ── */
  .noir-mobile-menu {
    margin-top: 10px; background: rgba(255,255,255,0.97);
    backdrop-filter: blur(24px) saturate(160%); -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgba(196,81,10,0.18); border-radius: 18px;
    padding: 16px; display: flex; flex-direction: column; gap: 4px;
    box-shadow: 0 18px 44px rgba(40,20,5,0.14);
    animation: noirDropIn 0.22s cubic-bezier(.2,.9,.3,1.2) both;
    max-height: calc(100vh - 110px);
    overflow-y: auto;
  }
  .noir-mobile-user { display: flex; align-items: center; gap: 12px; padding: 4px 8px 8px; }
  .noir-mobile-link {
    display: block; padding: 12px 16px; text-decoration: none; color: #262626;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em; border-radius: 12px; transition: all 0.2s;
  }
  .noir-mobile-link:hover, .noir-mobile-link.active {
    background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff;
    box-shadow: 0 6px 16px rgba(196,81,10,0.25);
  }
  .noir-mobile-cart-row {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px;
    background: rgba(196,81,10,0.06); border: 1.5px solid rgba(196,81,10,0.15);
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600; color: #1A1208;
    cursor: pointer; width: 100%; margin-top: 4px; transition: all 0.2s;
  }
  .noir-mobile-cart-row:hover { background: rgba(196,81,10,0.12); }
  .noir-mobile-auth { display: flex; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(196,81,10,0.15); }
  .noir-mobile-profile-btn, .noir-mobile-orders-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    background: transparent; border: 1.5px solid #C4510A;
    padding: 11px 14px; border-radius: 12px; font-size: 13px; font-weight: 600; color: #1A1A1A;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.25s; text-decoration: none;
  }
  .noir-mobile-profile-btn:hover, .noir-mobile-orders-btn:hover { background: linear-gradient(135deg,#C4510A,#E8763A); color: #fff; }
  .noir-mobile-logout-btn {
    width: 100%; background: linear-gradient(135deg,#C4510A,#E8763A); border: 1.5px solid transparent;
    margin-top: 10px;
    padding: 12px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.25s;
    box-shadow: 0 8px 20px rgba(196,81,10,0.3);
  }
  .noir-mobile-logout-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(196,81,10,0.4); }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .noir-tagline    { display: none; }
    .noir-logo-img   { height: 46px; }
    .noir-brand-name { font-size: 19px; }
    .noir-logo-divider { display: none; }
    .noir-username   { max-width: 80px; }
  }
  @media (max-width: 768px) {
    .noir-navlinks-desktop { display: none; }
    .noir-user-wrap        { display: none; }
    .noir-hamburger        { display: flex; }
    .noir-nav-wrapper      { padding: 14px 16px 0; }
    .noir-nav-container    { padding: 9px 16px; border-radius: 18px; }
    .noir-cart-dropdown    { width: min(390px, calc(100vw - 32px)); }
    .noir-dropdown-fixed   { right: 16px; top: 110px; }
  }
  @media (max-width: 480px) {
    .noir-nav-wrapper    { padding: 10px 10px 0; }
    .noir-nav-container  { padding: 8px 12px; border-radius: 16px; gap: 8px; }
    .noir-logo-img       { height: 36px; }
    .noir-logo-wrap      { gap: 9px; }
    .noir-brand-name     { font-size: 15px; letter-spacing: 0.01em; }
    .noir-hamburger      { padding: 8px 11px; font-size: 14px; }
    .noir-cart-btn       { width: 38px; height: 38px; }

    .noir-dropdown-fixed {
      left: 10px; right: 10px; top: 96px;
      width: auto;
    }
    .noir-cart-dropdown, .noir-user-dropdown {
      width: 100%;
      max-width: none;
      max-height: calc(100vh - 130px);
      display: flex;
      flex-direction: column;
    }
    .noir-cart-items { max-height: none; flex: 1; overflow-y: auto; }
    .noir-cart-item { padding: 9px 14px; gap: 9px; }
    .noir-cart-img   { width: 48px; height: 48px; }
    .noir-cart-header, .noir-cart-footer { padding: 14px 16px; }

    .noir-mobile-menu { padding: 14px; }
    .noir-mobile-auth { flex-direction: column; gap: 8px; }
    .noir-mobile-link { padding: 12px 14px; font-size: 13px; }
  }
  @media (max-width: 360px) {
    .noir-brand-name { font-size: 13.5px; }
    .noir-tagline    { display: none; }
    .noir-logo-divider { display: none; }
    .noir-username   { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .noir-dropdown-fixed, .noir-mobile-menu { animation: none; }
    .noir-nav-link, .noir-cart-btn, .noir-user-btn, .noir-hamburger { transition: none; }
  }
  `;