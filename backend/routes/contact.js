const express = require("express");
const router = express.Router();
const ContactMessage = require("../models/ContactMessage");

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const msg = await ContactMessage.create({
      name, email, subject, message,
      date: new Date().toISOString().split("T")[0],  // "2026-06-11"
      time: new Date().toLocaleTimeString("en-IN"),
      count: await ContactMessage.countDocuments() + 1,
    });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;