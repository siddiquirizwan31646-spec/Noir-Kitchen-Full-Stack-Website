const express = require("express");
const router  = express.Router();
const Chef    = require("../models/Chef");

router.get("/", async (req, res) => {
  try {
    const chefs = await Chef.find().sort({ createdAt: -1 });
    res.json(chefs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const chef = await Chef.create(req.body);
    res.status(201).json(chef);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const chef = await Chef.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!chef) return res.status(404).json({ error: "Chef not found" });
    res.json(chef);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const chef = await Chef.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!chef) return res.status(404).json({ error: "Chef not found" });
    res.json({ success: true, chef });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const chef = await Chef.findByIdAndDelete(req.params.id);
    if (!chef) return res.status(404).json({ error: "Chef not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;