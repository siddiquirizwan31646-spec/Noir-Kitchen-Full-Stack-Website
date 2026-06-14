const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatar = profile.photos[0]?.value || '';
        const name = profile.displayName;

        // ── Case 1: user already exists with this googleId ──────────────────
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          // Refresh avatar in case it changed
          user.avatar = avatar;
          user.lastLoginAt = new Date();
          user.loginCount += 1;
          // Backfill empty address for users created before this field existed
          if (!user.address || user.address.houseNo === undefined) {
            user.address = { houseNo: '', areaName: '', areaNo: '', city: '', pinCode: '' };
          }
          await user.save();
          return done(null, user);
        }

        // ── Case 2: email exists but registered via OTP ──────────────────────
        user = await User.findOne({ email });
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.avatar = avatar;
          user.authMethod = 'both';
          user.isVerified = true;
          user.lastLoginAt = new Date();
          user.loginCount += 1;
          // Init empty address if not already set
          if (!user.address || !user.address.houseNo) {
            user.address = { houseNo: '', areaName: '', areaNo: '', city: '', pinCode: '' };
          }
          await user.save();
          return done(null, user);
        }

        // ── Case 3: brand new user via Google ────────────────────────────────
        user = await User.create({
          name,
          email,
          googleId: profile.id,
          avatar,
          authMethod: 'google',
          isVerified: true, // Google already verified the email
          address: { houseNo: '', areaName: '', areaNo: '', city: '', pinCode: '' },
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// We use JWT (session: false) so serialize/deserialize are not strictly needed,
// but passport requires them to be defined when passport.session() is present.
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-otp');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;