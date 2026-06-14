const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many OTP requests. Please wait 15 minutes.' },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many verification attempts. Please wait 15 minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

// ─── Helper ───────────────────────────────────────────────────────────────────

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// OTP ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/register
 * Body: { name, email, phone? }
 */
router.post('/register', otpLimiter, async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email)
      return res.status(400).json({ success: false, message: 'Name and email are required.' });

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.authMethod === 'google')
        return res.status(409).json({
          success: false,
          message: 'This email is linked to a Google account. Please sign in with Google.',
        });
      return res.status(409).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    const user = await User.create({ name, email, phone, authMethod: 'otp' });
    const otp = await user.generateOTP();
    await sendOTPEmail({ to: email, name, otp });

    res.status(201).json({
      success: true,
      message: `Account created! A 6-digit OTP has been sent to ${email}.`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/send-otp
 * Send OTP to existing registered email.
 * Body: { email }
 */
router.post('/send-otp', otpLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(200).json({ success: true, message: 'If that email is registered, an OTP has been sent.' });

    if (user.authMethod === 'google')
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });

    if (!user.canRequestOTP())
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another OTP.',
      });

    const otp = await user.generateOTP();
    await sendOTPEmail({ to: email, name: user.name, otp });

    res.json({
      success: true,
      message: `OTP sent to ${email}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/send-otp-with-password
 * Create user if not exists, then send OTP.
 * Password is saved after OTP verification.
 * Body: { email }
 */
router.post('/send-otp-with-password', otpLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    let user = await User.findOne({ email });

    if (user && user.authMethod === 'google')
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });

    if (!user) {
      user = await User.create({ name: email.split('@')[0], email, authMethod: 'password' });
    }

    if (!user.canRequestOTP())
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another OTP.',
      });

    const otp = await user.generateOTP();
    await sendOTPEmail({ to: email, name: user.name, otp });

    res.json({ success: true, message: `OTP sent to ${email}.` });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP → save password if provided → issue JWT.
 * Body: { email, otp, password? }
 */
router.post('/verify-otp', verifyLimiter, async (req, res, next) => {
  try {
    const { email, otp, password, address } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const result = await user.verifyOTP(otp);
    if (!result.valid)
      return res.status(401).json({ success: false, message: result.reason });

    // Save password if this is the email+password flow
    if (password && password.length >= 8) {
      user.password = password;
      user.authMethod = 'password';
    }

    // Save address if provided
    if (address && address.houseNo && address.areaName && address.city && address.pinCode) {
      user.address = {
        houseNo:  address.houseNo.trim(),
        areaName: address.areaName.trim(),
        areaNo:   address.areaNo?.trim() || '',
        city:     address.city.trim(),
        pinCode:  address.pinCode.trim(),
      };
    }

    await user.save();

    if (user.loginCount === 1)
      sendWelcomeEmail({ to: email, name: user.name }).catch(() => {});

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        address: user.address || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/resend-otp
 * Body: { email }
 */
router.post('/resend-otp', otpLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account found with that email.' });

    if (user.authMethod === 'google')
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });

    if (!user.canRequestOTP())
      return res.status(429).json({
        success: false,
        message: 'Please wait 60 seconds before requesting another OTP.',
      });

    const otp = await user.generateOTP();
    await sendOTPEmail({ to: email, name: user.name, otp });

    res.json({ success: true, message: `OTP resent to ${email}.` });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PASSWORD ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/register-password
 * Body: { name, email, password, phone? }
 */
router.post('/register-password', otpLimiter, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.authMethod === 'google')
        return res.status(409).json({
          success: false,
          message: 'This email is linked to a Google account. Please sign in with Google.',
        });
      return res.status(409).json({ success: false, message: 'Email already registered. Please log in.' });
    }

    const user = await User.create({ name, email, password, phone, authMethod: 'password', isVerified: true });

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (user.authMethod === 'google')
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });

    if (!user.password)
      return res.status(400).json({
        success: false,
        message: 'This account uses email OTP. Please sign in with OTP instead.',
      });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    user.lastLoginAt = new Date();
    user.loginCount += 1;
    await user.save();

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/address
 * Body: { houseNo, areaName, areaNo, city, pinCode }
 * Saves delivery address for any logged-in user (including Google users).
 */
router.put('/address', protect, async (req, res, next) => {
  try {
    const { houseNo, areaName, areaNo, city, pinCode } = req.body;

    if (!houseNo?.trim()) return res.status(400).json({ success: false, message: 'House / Flat No. is required.' });
    if (!areaName?.trim()) return res.status(400).json({ success: false, message: 'Area / Apartment Name is required.' });
    if (!city?.trim()) return res.status(400).json({ success: false, message: 'City is required.' });
    if (!pinCode?.trim()) return res.status(400).json({ success: false, message: 'PIN Code is required.' });
    if (!/^\d{6}$/.test(pinCode.trim())) return res.status(400).json({ success: false, message: 'Enter a valid 6-digit PIN Code.' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { address: { houseNo: houseNo.trim(), areaName: areaName.trim(), areaNo: areaNo?.trim() || '', city: city.trim(), pinCode: pinCode.trim() } } },
      { new: true, runValidators: true }
    ).select('-otp');

    res.json({
      success: true,
      message: 'Address saved.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        address: user.address,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/auth/me
 */
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      avatar: req.user.avatar,
      isVerified: req.user.isVerified,
      authMethod: req.user.authMethod,
      loginCount: req.user.loginCount,
      lastLoginAt: req.user.lastLoginAt,
      createdAt: req.user.createdAt,
      address: req.user.address || null,
    },
  });
});

/**
 * PUT /api/auth/profile
 * Body: { name?, phone? }
 */
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-otp');

    res.json({
      success: true,
      message: 'Profile updated.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user);
    setTokenCookie(res, token);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        message: 'Google login successful.',
        token,
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          avatar: req.user.avatar,
          authMethod: req.user.authMethod,
          address: req.user.address || null,
        },
      });
    }

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;