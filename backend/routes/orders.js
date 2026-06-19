const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Coupon  = require('../models/Coupon');
const { protect } = require('../middleware/auth');

// POST /api/orders — place a new order
router.post('/', async (req, res) => {
    try {
        const { latitude, longitude, deliveryAddress, couponCode } = req.body;

        if (latitude == null || longitude == null) {
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

        const orderData = { ...req.body };

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
            if (coupon) {
                orderData.discountType  = coupon.discountType;
                orderData.discountValue = coupon.discountValue;
            }
        }
        if (!orderData.discountType) orderData.discountType = 'None';

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        orderData.deliveryOtp = otp;

        const order = new Order(orderData);
        await order.save();

        res.status(201).json({
            success: true,
            orderId: order._id,
            deliveryOtp: otp,
            message: 'Order placed successfully',
        });
    } catch (err) {
        console.error('Order error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
});

// GET /api/orders/nearby
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

// GET /api/orders/my-orders — must be before /:id
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user._id })
            .sort({ orderDateTime: -1 })
            .populate('deliveryPartner', 'name mobile');
        res.json({ success: true, orders });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/orders — all orders (admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/orders/:id — single order with delivery agent
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('deliveryPartner', 'name mobile');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;