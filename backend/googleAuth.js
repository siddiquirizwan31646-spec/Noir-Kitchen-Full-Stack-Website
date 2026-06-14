/**
 * Google OAuth Routes — append these to your existing auth.js router
 *
 * SETUP:
 *   npm install passport passport-google-oauth20 express-session
 *
 * .env additions:
 *   GOOGLE_CLIENT_ID=your_google_client_id
 *   GOOGLE_CLIENT_SECRET=your_google_client_secret
 *   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
 *   SESSION_SECRET=your_session_secret
 *
 * In server.js, add BEFORE routes:
 *   const session = require('express-session');
 *   const passport = require('passport');
 *   require('./config/passport'); // this file below
 *   app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
 *   app.use(passport.initialize());
 *   app.use(passport.session());
 */

const express = require('express');
const passport = require('passport');
const { generateToken } = require('../utils/jwt');

const router = express.Router();

/**
 * GET /api/auth/google
 * Redirect user to Google consent screen.
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * GET /api/auth/google/callback
 * Google redirects here after auth.
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with token in query (for SPA to store in memory/state)
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;