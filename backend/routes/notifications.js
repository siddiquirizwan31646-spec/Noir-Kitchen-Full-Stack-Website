
const express = require("express");
const router  = express.Router();
const Notification = require("../models/Notification");
router.get("/notifications/active", async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gt: now } },
      ],
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    console.log(`[Notifications] /active → found ${notifications.length} active notification(s)`);
    res.json({ notifications });
  } catch (err) {
    console.error("[Notifications] /active error:", err);
    res.status(500).json({ notifications: [], error: "Failed to fetch notifications" });
  }
});
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    res.json({ notifications });
  } catch (err) {
    console.error("[Notifications] list error:", err);
    res.status(500).json({ notifications: [], error: "Failed to fetch notifications" });
  }
});
router.post("/notifications", async (req, res) => {
  try {
    const created = await Notification.create(req.body);
    res.status(201).json({ notification: created });
  } catch (err) {
    console.error("[Notifications] create error:", err);
    res.status(400).json({ error: err.message || "Failed to create notification" });
  }
});
router.put("/notifications/:id", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Notification not found" });
    res.json({ notification: updated });
  } catch (err) {
    console.error("[Notifications] update error:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("[Notifications] delete error:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

module.exports = router;