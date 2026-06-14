const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');

// POST /api/orders — place a new order
router.post('/', async (req, res) => {
    try {
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