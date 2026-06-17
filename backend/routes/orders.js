const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');

// POST /api/orders — place a new order
router.post('/', async (req, res) => {
    try {
        const { latitude, longitude, deliveryAddress } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Delivery location is required. Please enable location access.',
            });
        }
        if (!deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address could not be resolved. Please try enabling location again.',
            });
        }

        const order = await Order.create(req.body);
        res.status(201).json({
            success: true,
            orderId: order._id,
            message: 'Order placed successfully',
        });
    } catch (err) {
        console.error('Order error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
});

// GET /api/orders/nearby?lat=...&lng=...&radius=5000 — orders near a point
// (for assigning the closest delivery partner)
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng query params are required' });
        }
        const orders = await Order.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius, 10),
                },
            },
        });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/orders — get all orders (admin use)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/orders/:id — single order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;