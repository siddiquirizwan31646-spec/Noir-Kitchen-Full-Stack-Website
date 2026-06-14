const express  = require("express");
const mongoose = require("mongoose");
const Review   = require("../models/Review");

const router = express.Router();

/* ── helpers ── */
const bad  = (res, msg, code = 400) => res.status(code).json({ success: false, message: msg });
const ok   = (res, data, code = 200) => res.status(code).json({ success: true, ...data });

/* ════════════════════════════════════════════
   POST /api/reviews  — submit a new review
════════════════════════════════════════════ */
router.post("/", async (req, res) => {
  try {
    const { name, email, userId, rating, message } = req.body;

    /* ── validation ── */
    if (!name  || typeof name  !== "string" || name.trim().length  < 1)
      return bad(res, "Name is required.");
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return bad(res, "A valid email is required.");
    if (!rating || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)
      return bad(res, "Rating must be an integer between 1 and 5.");
    if (!message || typeof message !== "string" || message.trim().length < 10)
      return bad(res, "Message must be at least 10 characters.");
    if (message.trim().length > 1000)
      return bad(res, "Message cannot exceed 1000 characters.");

    /* ── duplicate guard: same email within 24 h ── */
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Review.findOne({
      "user.email": email.trim().toLowerCase(),
      createdAt:    { $gte: oneDayAgo },
    });
    if (recent)
      return bad(res, "You have already submitted a review in the last 24 hours.", 429);

    const review = await Review.create({
      user:    { name: name.trim(), email: email.trim().toLowerCase(), userId: userId || null },
      rating:  Number(rating),
      message: message.trim(),
    });

    return ok(res, { message: "Review submitted successfully!", review }, 201);
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return bad(res, "Server error. Please try again.", 500);
  }
});

/* ════════════════════════════════════════════
   GET /api/reviews  — fetch all reviews
   Query params:
     ?page=1&limit=10&sort=newest|oldest|highest|lowest
════════════════════════════════════════════ */
router.get("/", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const sort  = req.query.sort || "newest";

    const sortMap = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
      highest: { rating: -1, createdAt: -1 },
      lowest:  { rating:  1, createdAt: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    const [reviews, total] = await Promise.all([
      Review.find()
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-__v")
        .lean(),
      Review.countDocuments(),
    ]);

    /* ── aggregate stats ── */
    const stats = await Review.aggregate([
      {
        $group: {
          _id:       null,
          avgRating: { $avg: "$rating" },
          total:     { $sum: 1 },
          r1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          r2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          r3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          r4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          r5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        },
      },
    ]);

    const s = stats[0] || { avgRating: 0, total: 0, r1:0, r2:0, r3:0, r4:0, r5:0 };

    return ok(res, {
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        avgRating:    parseFloat((s.avgRating || 0).toFixed(1)),
        total:        s.total,
        distribution: { 1: s.r1, 2: s.r2, 3: s.r3, 4: s.r4, 5: s.r5 },
      },
    });
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    return bad(res, "Server error. Please try again.", 500);
  }
});

/* ════════════════════════════════════════════
   DELETE /api/reviews/:id  — admin delete
════════════════════════════════════════════ */
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return bad(res, "Invalid review ID.");
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) return bad(res, "Review not found.", 404);
    return ok(res, { message: "Review deleted." });
  } catch (err) {
    console.error("[DELETE /api/reviews]", err);
    return bad(res, "Server error.", 500);
  }
});

module.exports = router;