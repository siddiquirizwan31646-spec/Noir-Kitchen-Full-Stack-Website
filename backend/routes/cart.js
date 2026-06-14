const router = require("express").Router();
const Cart = require("../models/Cart");
const { protect } = require("../middleware/auth");

router.get("/", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    res.json({ success: true, data: cart?.items || [] });
  } catch { res.json({ success: false }); }
});

router.post("/add", protect, async (req, res) => {
  try {
    const { menuItemId, name, img, price, variant, addons, qty, note } = req.body;
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });
    const existing = cart.items.find(i =>
      i.menuItemId.toString() === menuItemId && i.variant === variant
    );
    if (existing) {
      existing.qty += qty || 1;
    } else {
      cart.items.push({ menuItemId, name, img, price, variant, addons, qty: qty || 1, note });
    }
    await cart.save();
    res.json({ success: true, data: cart.items });
  } catch (err) {
    console.error("Cart add error:", err);
    res.json({ success: false, error: err.message });
  }
});

router.patch("/update", protect, async (req, res) => {
  try {
    const { menuItemId, variant, qty } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.json({ success: false });
    const item = cart.items.find(i =>
      i.menuItemId.toString() === menuItemId && i.variant === variant
    );
    if (item) item.qty = qty;
    await cart.save();
    res.json({ success: true, data: cart.items });
  } catch { res.json({ success: false }); }
});

router.delete("/remove", protect, async (req, res) => {
  try {
    const { menuItemId, variant } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.json({ success: false });
    cart.items = cart.items.filter(i =>
      !(i.menuItemId.toString() === menuItemId && i.variant === variant)
    );
    await cart.save();
    res.json({ success: true, data: cart.items });
  } catch { res.json({ success: false }); }
});

router.delete("/clear", protect, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
    res.json({ success: true });
  } catch { res.json({ success: false }); }
});

module.exports = router;