const express = require("express");
const router = express.Router();
const WebContent = require("../models/WebContent");

// GET /api/webcontent
router.get("/webcontent", async (req, res) => {
  try {
    const doc = await WebContent.findOne().sort({ updatedAt: -1 }).lean();
    if (!doc) {
      return res.json({ boxes: [] });
    }
    res.json({ boxes: doc.boxes || [] });
  } catch (err) {
    console.error("getWebContent error:", err);
    res.status(500).json({ boxes: [], error: "Failed to fetch web content" });
  }
});

module.exports = router;