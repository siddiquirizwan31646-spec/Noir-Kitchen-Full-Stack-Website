const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Coupon  = require('../models/Coupon');

// POST /api/orders — place a new order
router.post('/', async (req, res) => {
    try {
        const { latitude, longitude, deliveryAddress, couponCode } = req.body;

        // Validate required GPS fields
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

        // Pull authoritative discount type/value from the Coupon collection
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
            if (coupon) {
                orderData.discountType  = coupon.discountType;  // "Percentage" | "Flat"
                orderData.discountValue = coupon.discountValue; // 15 or 100
            }
        }
        if (!orderData.discountType) orderData.discountType = 'None';

        // Use new + save so pre('save') hook always runs
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
orderData.deliveryOtp = otp;

const order = new Order(orderData);
await order.save();;

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

router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

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