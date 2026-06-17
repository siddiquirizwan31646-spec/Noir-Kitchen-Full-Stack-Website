const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    email:              { type: String },
    foodId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null },
    itemName:           { type: String, required: true },
    variant:            { type: String, default: 'Standard' },
    addons:             { type: String, default: '' },
    quantity:           { type: Number, required: true, min: 1 },
    specialInstructions:{ type: String, default: '' },
    orderDateTime:      { type: Date, default: Date.now },
    paymentMethod:      { type: String, default: 'Cash' },
    baseAmount:         { type: Number, required: true },
    addonTotal:         { type: Number, default: 0 },
    gstAmount:          { type: Number, default: 0 },
    totalAmount:        { type: Number, required: true },
    discountApplied:    { type: String, default: 'None' },
    estimatedDelivery:  { type: String, default: '30–45 minutes' },
    customerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fullName:           { type: String, required: true },
    mobile:             { type: String, required: true },

    // Delivery location — captured via device geolocation, no manual entry
    deliveryAddress:    { type: String, required: true }, // reverse-geocoded human-readable address
    latitude:           { type: Number, required: true },
    longitude:          { type: Number, required: true },
    location: {
        type:        { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },

    orderStatus:        { type: String, enum: ['Placed','Preparing','Out for Delivery','Delivered','Cancelled'], default: 'Placed' },
    deliveryPartner:    { type: String, default: null },
}, { timestamps: true });

// Keep the GeoJSON point in sync with latitude/longitude so $near queries
// work for assigning the nearest delivery partner.
orderSchema.pre('save', function (next) {
    if (this.latitude !== undefined && this.longitude !== undefined) {
        this.location = { type: 'Point', coordinates: [this.longitude, this.latitude] };
    }
    next();
});

orderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);