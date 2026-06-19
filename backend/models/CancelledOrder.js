const mongoose = require('mongoose');
const cancelledOrderSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    fullName: String, mobile: String, itemName: String,
    quantity: Number, totalAmount: Number, orderCreatedAt: Date,
    reason: String, cancelledAt: Date,
}, { timestamps: true, collection: 'cancelledOrder' });
module.exports = mongoose.model('CancelledOrder', cancelledOrderSchema);