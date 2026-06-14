// routes/migrate.js
// ── ONE-TIME migration — run once, then remove or disable ────────────────────
// Call: POST /api/migrate/add-address
// Adds empty address object to every user that doesn't have one yet.

const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

router.post('/add-address', async (req, res) => {
  try {
    const result = await User.updateMany(
      {
        $or: [
          { address: { $exists: false } },
          { address: null },
          { 'address.houseNo': { $exists: false } },
        ]
      },
      {
        $set: {
          address: {
            houseNo:  '',
            areaName: '',
            areaNo:   '',
            city:     '',
            pinCode:  '',
          },
        },
      }
    );

    res.json({
      success: true,
      matched:  result.matchedCount,
      modified: result.modifiedCount,
      message:  `Patched ${result.modifiedCount} user(s) with empty address field.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;