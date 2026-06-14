const nodemailer = require('nodemailer');

// Create transporter (singleton)
let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Build a beautiful HTML email for the OTP.
 * Changes: logo row + brand name are now fully centered.
 */
const buildOTPEmailHTML = (name, otp, expiryMinutes) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NoirKitchen — Your Login Code</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      margin: 0; padding: 20px;
      background: #f0ebe3;
    }

    .email-outer {
      width: 600px;
      margin: 0 auto;
      position: relative;
      border: 2px solid #d6c9b8;
      border-radius: 16px;
      overflow: hidden;
      background-image: url('https://i.postimg.cc/XqP376Yq/Chat-GPT-Image-Jun-4-2026-09-13-39-PM.png');
      background-size: cover;
      background-position: center top;
      background-repeat: no-repeat;
    }

    .email-content {
      position: relative;
      z-index: 1;
      padding: 52px 60px 44px;
    }

    /* ── Centered logo row ── */
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 0 auto 20px;
      width: 100%;
      text-align: center;
    }
    .logo-img {
      width: 45px; height: 45px; border-radius: 10px;
      object-fit: contain; background: transparent;
      box-shadow: 0 2px 10px rgba(232,101,42,0.18);
      display: block;
    }
    .logo-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px; color: #1a1208;
    }
    .logo-text span { color: #e8652a; }

    .header-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.72); border: 1px solid rgba(232,101,42,0.25);
      border-radius: 100px; padding: 5px 18px;
      font-size: 11px; font-weight: 600; color: #e8652a;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 22px;
    }
    .header-badge::before { content: '🔒'; font-size: 11px; }

    .header-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 34px; font-weight: 700; color: #1a1208;
      line-height: 1.25; margin-bottom: 32px; text-align: center;
    }
    .header-title em { color: #e8652a; font-style: italic; }

    .body-section {
      background: transparent;
      border: none;
      padding: 28px 32px 32px;
    }

    .greeting { font-size: 16px; color: #1a1208; font-weight: 600; margin-bottom: 8px; }
    .body-text { font-size: 14px; color: #7a6650; line-height: 1.75; margin-bottom: 24px; }

    .otp-label {
      font-size: 11px; font-weight: 600; color: #9c8a74;
      letter-spacing: 0.09em; text-transform: uppercase;
      margin-bottom: 10px; text-align: center;
    }
    .otp-box {
      background: rgba(255,248,244,0.92); border: 2px dashed #f0c4a8;
      border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 20px;
    }
    .otp-code {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 54px; font-weight: 700; color: #e8652a;
      letter-spacing: 0.22em; line-height: 1; margin-bottom: 8px;
    }
    .otp-expiry {
      font-size: 12px; color: #b89a80;
      display: flex; align-items: center; justify-content: center; gap: 5px;
    }
    .otp-expiry::before { content: '⏱'; font-size: 13px; }

    .info-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .info-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.80); border: 1px solid #ede5d8;
      border-radius: 100px; padding: 6px 14px;
      font-size: 12px; color: #5a4a35; font-weight: 500;
    }

    .warning {
      background: rgba(255,248,244,0.88); border: 1px solid #f0c4a8;
      border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;
      font-size: 13px; color: #7a5a40; line-height: 1.65;
      display: flex; gap: 12px; align-items: flex-start;
    }
    .warning-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
    .warning strong { color: #e8652a; font-weight: 600; }

    .divider { height: 1px; background: rgba(237,229,216,0.8); margin: 20px 0; }

    .footer-text { font-size: 13px; color: #9c8a74; line-height: 1.7; text-align: center; }
    .footer-text em { color: #e8652a; font-style: normal; font-weight: 600; }
    .footer-heart { color: #e8652a; }

    .brand-bar { text-align: center; padding: 20px 0 8px; }
    .brand-bar-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15px; color: #1a1208; display: block; margin-bottom: 3px;
    }
    .brand-bar-name span { color: #e8652a; }
    .brand-bar-tagline { font-size: 11px; color: #b0a090; }
  </style>
</head>
<body>
  <div class="email-outer">
    <div class="email-content">

      <!-- ── Centered header ── -->
      <div style="text-align:center;">
        <div class="logo-row">
          <img class="logo-img" src="https://i.postimg.cc/59T61MdL/Chat-GPT-Image-Jun-4-2026-08-47-16-PM.png" alt="NoirKitchen" />
          <div class="logo-text">Noir<span>Kitchen</span></div>
        </div>
        <div class="header-badge">Secure Login</div>
        <div class="header-title">Your <em>one-time</em><br>login code</div>
      </div>

      <div class="body-section">
        <p class="greeting">Hi ${name} 👋</p>
        <p class="body-text">
          We received a sign-in request for your NoirKitchen account.
          Use the code below to complete your login. This code is valid
          for <strong style="color:#1a1208">10 minutes</strong> only.
        </p>

        <div class="otp-label">Your verification code</div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">Expires in ${expiryMinutes} minutes</div>
        </div>

        <div class="info-row">
          <div class="info-pill">🌿 Fresh &amp; Secure</div>
          <div class="info-pill">🔒 One-time use only</div>
          <div class="info-pill">⏱ ${expiryMinutes} min validity</div>
        </div>

        <div class="warning">
          <span class="warning-icon">🛡️</span>
          <span>
            <strong>Never share this code.</strong> NoirKitchen will never ask for your OTP via phone or chat.
            If you didn't request this, please ignore this email — your account remains safe.
          </span>
        </div>

        <div class="divider"></div>

        <p class="footer-text">
          Thank you for choosing NoirKitchen.<br>
          <span class="footer-heart">❤️</span><br>
          <em>Delicious food, Happy mood!</em>
        </p>
      </div>

      <div class="brand-bar">
        <span class="brand-bar-name">Noir<span>Kitchen</span></span>
        <span class="brand-bar-tagline">Fine Dining · Fresh Ingredients · Expert Chefs</span>
      </div>

    </div>
  </div>
</body>
</html>
`;

/**
 * Send OTP email to user.
 */
const sendOTPEmail = async ({ to, name, otp }) => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  const transport = getTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `${otp} is your login code — Noir Kitchen`,
    text: `Hi ${name},\n\nYour one-time login code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes. Do not share it with anyone.\n\nIf you didn't request this, please ignore this email.\n\n— Noir Kitchen Restaurant`,
    html: buildOTPEmailHTML(name, otp, expiryMinutes),
  };

  const info = await transport.sendMail(mailOptions);
  console.log(`📧 OTP email sent to ${to}: ${info.messageId}`);
  return info;
};

/**
 * Send welcome / congratulations email after first sign-up.
 * Uses the same background image as the OTP email.
 */
const sendWelcomeEmail = async ({ to, name }) => {
  const transport = getTransporter();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to NoirKitchen</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      margin: 0; padding: 20px;
      background: #f0ebe3;
    }

    /* ── Same outer wrapper + bg image as OTP email ── */
    .email-outer {
      width: 600px;
      margin: 0 auto;
      position: relative;
      border: 2px solid #d6c9b8;
      border-radius: 16px;
      overflow: hidden;
      background-image: url('https://i.postimg.cc/XqP376Yq/Chat-GPT-Image-Jun-4-2026-09-13-39-PM.png');
      background-size: cover;
      background-position: center top;
      background-repeat: no-repeat;
    }

    .email-content {
      position: relative;
      z-index: 1;
      padding: 52px 60px 44px;
    }

    /* ── Centered logo row (identical to OTP) ── */
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 0 auto 20px;
      width: 100%;
    }
    .logo-img {
      width: 45px; height: 45px; border-radius: 10px;
      object-fit: contain; background: transparent;
      box-shadow: 0 2px 10px rgba(232,101,42,0.18);
      display: block;
    }
    .logo-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px; color: #1a1208;
    }
    .logo-text span { color: #e8652a; }

    .header-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.72); border: 1px solid rgba(232,101,42,0.25);
      border-radius: 100px; padding: 5px 18px;
      font-size: 11px; font-weight: 600; color: #e8652a;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 22px;
    }
    .header-badge::before { content: '🎉'; font-size: 11px; }

    .header-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 34px; font-weight: 700; color: #1a1208;
      line-height: 1.25; margin-bottom: 32px; text-align: center;
    }
    .header-title em { color: #e8652a; font-style: italic; }

    .body-section {
      background: transparent;
      border: none;
      padding: 28px 32px 32px;
    }

    .greeting { font-size: 16px; color: #1a1208; font-weight: 600; margin-bottom: 8px; }
    .body-text { font-size: 14px; color: #7a6650; line-height: 1.75; margin-bottom: 24px; }

    /* ── Congrats highlight box ── */
    .congrats-box {
      background: rgba(255,248,244,0.92);
      border: 2px dashed #f0c4a8;
      border-radius: 16px;
      padding: 28px 24px;
      text-align: center;
      margin-bottom: 24px;
    }
    .congrats-icon { font-size: 44px; margin-bottom: 10px; }
    .congrats-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26px; font-weight: 700; color: #e8652a;
      margin-bottom: 6px;
    }
    .congrats-sub {
      font-size: 13px; color: #b89a80; line-height: 1.6;
    }

    .info-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .info-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.80); border: 1px solid #ede5d8;
      border-radius: 100px; padding: 6px 14px;
      font-size: 12px; color: #5a4a35; font-weight: 500;
    }

    /* ── What's next card ── */
    .next-card {
      background: rgba(255,248,244,0.88);
      border: 1px solid #f0c4a8;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .next-card-title {
      font-size: 12px; font-weight: 600; color: #e8652a;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;
    }
    .next-item {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 13px; color: #7a5a40; line-height: 1.6; margin-bottom: 8px;
    }
    .next-item:last-child { margin-bottom: 0; }
    .next-item-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

    .divider { height: 1px; background: rgba(237,229,216,0.8); margin: 20px 0; }

    .footer-text { font-size: 13px; color: #9c8a74; line-height: 1.7; text-align: center; }
    .footer-text em { color: #e8652a; font-style: normal; font-weight: 600; }
    .footer-heart { color: #e8652a; }

    .brand-bar { text-align: center; padding: 20px 0 8px; }
    .brand-bar-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15px; color: #1a1208; display: block; margin-bottom: 3px;
    }
    .brand-bar-name span { color: #e8652a; }
    .brand-bar-tagline { font-size: 11px; color: #b0a090; }
  </style>
</head>
<body>
  <div class="email-outer">
    <div class="email-content">

      <!-- ── Centered header ── -->
      <div style="text-align:center;">
        <div class="logo-row">
          <img class="logo-img" src="https://i.postimg.cc/59T61MdL/Chat-GPT-Image-Jun-4-2026-08-47-16-PM.png" alt="NoirKitchen" />
          <div class="logo-text">Noir<span>Kitchen</span></div>
        </div>
        <div class="header-badge">Account Created</div>
        <div class="header-title">Welcome to the<br><em>NoirKitchen</em> Family 🥂</div>
      </div>

      <div class="body-section">
        <p class="greeting">Congratulations, ${name}! 🎊</p>
        <p class="body-text">
          Your NoirKitchen account has been successfully created. We are absolutely thrilled
          to have you join our dining community — where every meal is crafted with the freshest
          ingredients, expert hands, and a whole lot of love.
        </p>

        <!-- Congrats highlight -->
        <div class="congrats-box">
          <div class="congrats-icon">🍽️</div>
          <div class="congrats-title">You're officially a member!</div>
          <div class="congrats-sub">Your table is always ready at NoirKitchen.<br>Fine dining, fresh ingredients, happy moments.</div>
        </div>

        <div class="info-row">
          <div class="info-pill">🌿 Fresh Ingredients</div>
          <div class="info-pill">👨‍🍳 Expert Chefs</div>
          <div class="info-pill">❤️ Healthy &amp; Tasty</div>
        </div>

        <!-- What's next -->
        <div class="next-card">
          <div class="next-card-title">✨ What's next for you</div>
          <div class="next-item">
            <span class="next-item-icon">📅</span>
            <span><strong style="color:#1a1208;">Make a reservation</strong> — Book your perfect table for any occasion, any time.</span>
          </div>
          <div class="next-item">
            <span class="next-item-icon">❤️</span>
            <span><strong style="color:#1a1208;">Save your favourites</strong> — Bookmark dishes and menus you love for quick reordering.</span>
          </div>
          <div class="next-item">
            <span class="next-item-icon">🎁</span>
            <span><strong style="color:#1a1208;">Exclusive member offers</strong> — Enjoy special deals and seasonal menus just for members.</span>
          </div>
        </div>

        <div class="divider"></div>

        <p class="footer-text">
          We look forward to serving you soon.<br>
          <span class="footer-heart">❤️</span><br>
          <em>Delicious food, Happy mood!</em>
        </p>
      </div>

      <div class="brand-bar">
        <span class="brand-bar-name">Noir<span>Kitchen</span></span>
        <span class="brand-bar-tagline">Fine Dining · Fresh Ingredients · Expert Chefs</span>
      </div>

    </div>
  </div>
</body>
</html>`;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Congratulations ${name}, welcome to Noir Kitchen! 🍽️`,
    html,
  });
};

/**
 * Verify transporter connection (call on startup).
 */
const verifyEmailConnection = async () => {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Email server connection verified');
  } catch (err) {
    console.warn(`⚠️  Email server connection failed: ${err.message}`);
    console.warn('   Emails will not be sent. Check your .env EMAIL_* settings.');
  }
};

module.exports = { sendOTPEmail, sendWelcomeEmail, verifyEmailConnection };