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

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          user.avatar = avatar;
          user.lastLoginAt = new Date();
          user.loginCount += 1;
          if (!user.address || user.address.houseNo === undefined) {
            user.address = { houseNo: '', areaName: '', areaNo: '', city: '', pinCode: '' };
          }
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.avatar = avatar;
          user.authMethod = 'both';
          user.isVerified = true;
          user.lastLoginAt = new Date();
          user.loginCount += 1;
          if (!user.address || user.address.houseNo === undefined) {
            user.address = { houseNo: '', areaName: '', areaNo: '', city: '', pinCode: '' };
          }
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          name, email, googleId: profile.id,
          avatar, authMethod: 'google', isVerified: true,
          address: { houseNo: '', areaName: '', areaNo: '', city: '', pinCode: '' },
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

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