const express = require("express");
const router  = express.Router();
const Moment  = require("../models/Moments");

// GET all active moments (public)
router.get("/", async (req, res) => {
  const moments = await Moment.find({ active: true }).sort("order");
  res.json({ success: true, data: moments });
});

// POST create (admin)
router.post("/", async (req, res) => {
  try {
    const m = await Moment.create(req.body);
    res.json({ success: true, data: m });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT edit (admin)
router.put("/:id", async (req, res) => {
  try {
    const m = await Moment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: m });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE (admin)
router.delete("/:id", async (req, res) => {
  try {
    await Moment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;