const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const otpStore = new Map(); // email -> { otp, expiresAt }

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Noir Kitchen Verification Code",
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/verify", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ success: false, message: "Request a new OTP" });
  if (Date.now() > record.expiresAt) { otpStore.delete(email); return res.status(400).json({ success: false, message: "OTP expired" }); }
  if (record.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });
  otpStore.delete(email);
  res.json({ success: true, message: "OTP verified" });
});

module.exports = router;