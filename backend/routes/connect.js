const express = require("express");
const router = express.Router();
const Connect = require("../models/Connect");

router.post("/", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const entry = await Connect.create({ name, email });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;