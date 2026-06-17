const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    email:               { type: String, default: '' },
    foodId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null },
    itemName:            { type: String, required: true },
    variant:             { type: String, default: 'Standard' },
    addons:              { type: String, default: '' },
    quantity:            { type: Number, required: true, min: 1 },
    specialInstructions: { type: String, default: '' },
    orderDateTime:       { type: Date, default: Date.now },
    paymentMethod:       { type: String, default: 'Cash' },
    baseAmount:          { type: Number, required: true },
    addonTotal:          { type: Number, default: 0 },
    gstAmount:           { type: Number, default: 0 },
    totalAmount:         { type: Number, required: true },
    discountApplied:     { type: String, default: 'None' },
    estimatedDelivery:   { type: String, default: '30–45 minutes' },
    customerId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fullName:            { type: String, required: true },
    mobile:              { type: String, required: true },

    // ── GPS-based delivery location (no manual address fields) ────────────
    deliveryAddress:     { type: String, required: true }, // reverse-geocoded string
    latitude:            { type: Number, required: true },
    longitude:           { type: Number, required: true },

    // GeoJSON point — kept in sync via pre-save hook for $near queries
    location: {
        type:        { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },

    // Legacy address fields — optional, kept for backward compatibility
    houseNo:  { type: String, default: '' },
    areaName: { type: String, default: '' },
    areaNo:   { type: String, default: '' },
    city:     { type: String, default: '' },
    pinCode:  { type: String, default: '' },

    orderStatus:     { type: String, enum: ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Placed' },
    deliveryPartner: { type: String, default: null },
}, { timestamps: true });

// ── Sync GeoJSON point before save ────────────────────────────────────────
orderSchema.pre('save', function (next) {
    if (this.latitude != null && this.longitude != null) {
        this.location = {
            type: 'Point',
            coordinates: [this.longitude, this.latitude],
        };
    }
    next();
});

// ── Also sync on Order.create() which uses insertMany internally ──────────
orderSchema.pre('insertMany', function (next, docs) {
    if (Array.isArray(docs)) {
        docs.forEach(doc => {
            if (doc.latitude != null && doc.longitude != null) {
                doc.location = {
                    type: 'Point',
                    coordinates: [doc.longitude, doc.latitude],
                };
            }
        });
    }
    next();
});

orderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);