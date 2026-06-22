require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const chefRoutes = require("./routes/chefRoutes");
const connectDB = require('./config/db');
require('./config/passport');
const webContentRoutes = require("./routes/webContentRoutes");
const authRoutes    = require('./routes/Auth');
const reviewRoutes  = require('./routes/reviewRoutes');
const contactRoute  = require('./routes/contact');
const momentRoutes  = require('./routes/moments');

const { errorHandler, notFound }    = require('./middleware/errorHandler');
const { verifyEmailConnection }     = require('./utils/email');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── DB ──────────────────────────────────────────────
connectDB();

// ── Security ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:         process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            1000,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { success: false, message: 'Too many requests. Please try again later.' },
}));

// ── Body / Cookie ────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Session / Passport ───────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge:   10 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Health ───────────────────────────────────────────
app.get('/health', (_req, res) => res.status(200).json({
  success:     true,
  message:     'Restaurant Auth API is running',
  environment: process.env.NODE_ENV,
  timestamp:   new Date().toISOString(),
}));

// ── Routes ───────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use("/api/menu", require("./routes/menu"));
app.use('/api/reviews', reviewRoutes);
app.use("/api", webContentRoutes);
app.use('/api/contact', contactRoute);
app.use("/api", require("./routes/notifications"));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/moments', momentRoutes);
app.use('/api/migrate', require('./routes/migrate'));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/connect", require("./routes/connect"));
app.use("/api/chefs", chefRoutes);
app.use("/api/chefs", chefRoutes);
app.use("/api/coupons", require("./routes/coupons"));
// ── Error handling ───────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────
app.listen(PORT, async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  }
  await verifyEmailConnection();
});

module.exports = app;