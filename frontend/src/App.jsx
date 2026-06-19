// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import MainHome from "./Pages/MainHome";
import LoginPage from "./Pages/login";
import SignupPage from "./Pages/Signup";
import OTPVerify from "./Pages/Otpverify";
import AuthCallback from "./Pages/AuthCallback";
import Profile from "./Pages/Profile";
import ReviewPage from "./Pages/ReviewPage";
import AboutPage from "./Pages/Aboutpage";
import ContactPage from "./Pages/Contactpage";
import MomentsPage from "./Pages/Momentspage";
import ExpertChefsPage from "./Pages/Expertchefspage";
import MenuPage from "./Pages/Noirkitchenmenu";
import NoirKitchenIngredients from "./Pages/Noirkitcheningredients";
import FoodOrder from "./Pages/FoodOrder";
import { useCart } from "./hooks/useCart";
import OrderFoodForm from "./Pages/Orderfoodform";
import SignatureDishes from "./Pages/SignatureDishes";
import ReserveTable from "./Pages/ReserveTable";
import CartCheckout from "./Pages/CartCheckout";
import ElegantPage from "./Pages/Elegantambience";
import UserOrders from "./pages/Userorders";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Route Guards ────────────────────────────────────────────────────────────

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ user, children }) {
  if (user) {
    const token = localStorage.getItem("token");
    return <Navigate to={`/dashboard?token=${token}`} replace />;
  }
  return children;
}

// ─── Dashboard wrapper ───────────────────────────────────────────────────────

function Dashboard({ user, onLogout, cart }) {
  return <MainHome user={user} onLogout={onLogout} cart={cart} />;
}

// ─── Main route tree ─────────────────────────────────────────────────────────

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const getEmail = () => sessionStorage.getItem("otpEmail") || "";

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const cart = useCart(user);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setChecking(false); return; }

    fetch(`${API}/api/auth/me`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          const path = window.location.pathname;
          if (path === "/" || path === "/login" || path === "/signup") {
            navigate(`/dashboard?token=${token}`, { replace: true });
          }
        } else {
          localStorage.removeItem("token");
        }
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setChecking(false));
  }, []);

  const handleLoginSuccess = (data) => {
    const userData = data.user || data;
    const token = data.token;
    if (token) localStorage.setItem("token", token);
    setUser(userData);
    navigate(`/dashboard?token=${token}`, { replace: true });
  };

  // ── FIXED: clear state FIRST, navigate AFTER, API call is fire-and-forget ──
  const handleLogout = () => {
    const token = localStorage.getItem("token");

    // 1. Clear everything synchronously so PrivateRoute sees null immediately
    localStorage.removeItem("token");
    setUser(null);

    // 2. Navigate to landing page
    navigate("/", { replace: true });

    // 3. Tell backend to clear the cookie (non-blocking — we don't await this)
    fetch(`${API}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => { });
  };

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#fdf8f4",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "2px solid rgba(196,81,10,0.2)",
          borderTopColor: "#C4510A",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>

      {/* ── Fully public ──────────────────────────────────────────────────── */}

      <Route
        path="/"
        element={
          user
            ? <Navigate to={`/dashboard?token=${localStorage.getItem("token")}`} replace />
            : <Home onLoginClick={() => navigate("/login")} onSignupClick={() => navigate("/signup")} />
        }
      />

      <Route path="/auth/callback" element={<AuthCallback onSuccess={handleLoginSuccess} />} />

      <Route
        path="/verify-otp"
        element={
          <OTPVerify
            email={getEmail()}
            onVerified={(data) => {
              sessionStorage.removeItem("otpEmail");
              sessionStorage.removeItem("otpPassword");
              handleLoginSuccess(data);
            }}
            onBack={() => navigate("/login")}
          />
        }
      />

      {/* ── Public-only (logged-in users → dashboard) ─────────────────────── */}

      <Route
        path="/login"
        element={
          <PublicRoute user={user}>
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onSwitchToSignup={() => navigate("/signup")}
            />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute user={user}>
            <SignupPage
              onSignup={(email) => {
                sessionStorage.setItem("otpEmail", email);
                navigate("/verify-otp");
              }}
              onSwitchToLogin={() => navigate("/login")}
            />
          </PublicRoute>
        }
      />

      {/* ── Private routes ────────────────────────────────────────────────── */}

      <Route
        path="/dashboard"
        element={
          <PrivateRoute user={user}>
            <Dashboard user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/home"
        element={
          <PrivateRoute user={user}>
            <Dashboard user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/:foodName/:vegType/:price/:customerName/:username/:addressStr"
        element={
          <PrivateRoute user={user}>
            <FoodOrder key={location.pathname} user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/order/:foodName/:vegType/:price/:customerName/:username/:addressStr"
        element={
          <PrivateRoute user={user}>
            <OrderFoodForm user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/cart/checkout"
        element={
          <PrivateRoute user={user}>
            <CartCheckout user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/signature-dishes"
        element={
          <PrivateRoute user={user}>
            <SignatureDishes user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/reserve"
        element={
          <PrivateRoute user={user}>
            <ReserveTable user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/Noir-Kitchen-StaffMembers"
        element={
          <PrivateRoute user={user}>
            <ExpertChefsPage user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/moments"
        element={
          <PrivateRoute user={user}>
            <MomentsPage user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/Elegantambience"
        element={
          <PrivateRoute user={user}>
            <ElegantPage user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/NoirKitchenIngredients"
        element={
          <PrivateRoute user={user}>
            <NoirKitchenIngredients user={user} onLogout={handleLogout} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/about/the-noir-experience"
        element={
          <PrivateRoute user={user}>
            <AboutPage user={user} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/Contact-us/Noir-Kitchen-Team"
        element={
          <PrivateRoute user={user}>
            <ContactPage user={user} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/reviews"
        element={
          <PrivateRoute user={user}>
            <ReviewPage user={user} cart={cart} />
          </PrivateRoute>
        }
      />

      <Route
        path="/NoirKitchen/Menu"
        element={
          <PrivateRoute user={user}>
            <MenuPage user={user} cart={cart} />
          </PrivateRoute>
        }
      />
      <Route path="/user/:token" element={<UserOrders />} />
      <Route path="/user/:token/:orderId" element={<UserOrders />} />
      <Route
        path="/profile"
        element={
          <PrivateRoute user={user}>
            <Profile user={user} cart={cart} />
          </PrivateRoute>
        }
      />

      {/* ── Catch-all ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}