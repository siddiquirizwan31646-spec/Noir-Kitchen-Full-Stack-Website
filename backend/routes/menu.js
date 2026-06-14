const express = require("express");
const router  = express.Router();
const MenuItem = require("../models/MenuItem");

// GET /api/menu — all available items
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true }).sort({ category: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/:category — items by category
router.get("/:category", async (req, res) => {
  try {
    const items = await MenuItem.find({
      available: true,
      category: { $regex: new RegExp(`^${req.params.category}$`, "i") }
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/menu — add item (for Thunder Client seeding)
router.post("/", async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/menu/:id
router.delete("/:id", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;