const mongoose = require('mongoose');
const assignOrderSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent' },
    customerDetails: {
        fullName: String, mobile: String, email: String,
        deliveryAddress: String, houseNo: String, areaName: String,
        areaNo: String, city: String, pinCode: String,
    },
    deliveryPartnerDetails: {
        name: String, phone: String, email: String,
        vehicleType: String, vehicleNumber: String,
    },
    foodDetails: {
        itemName: String, variant: String, addons: String, quantity: Number,
        specialInstructions: String, baseAmount: Number, addonTotal: Number,
        gstAmount: Number, totalAmount: Number, paymentMethod: String,
    },
    status: { type: String, default: 'Assigned' },
    assignedAt: Date,
}, { timestamps: true, collection: 'assignorders' });
module.exports = mongoose.model('AssignOrder', assignOrderSchema);