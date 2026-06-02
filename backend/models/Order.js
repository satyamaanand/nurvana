const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    plant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: true,
    }
  }],
  shippingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    phone: { type: String, required: true }
  },
  orderTotal: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'cod'],
    default: 'card',
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  trackingLogs: [{
    status: { type: String, required: true },
    message: { type: String },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
});

// Pre-save hook to add the initial "pending" tracking log if it's new
orderSchema.pre('save', function (next) {
  if (this.isNew && this.trackingLogs.length === 0) {
    let logMsg = 'Order has been placed successfully and is awaiting processing.';
    if (this.paymentMethod === 'cod') {
      logMsg = 'Pay securely when your order is delivered. Pending Payment (COD).';
    }
    this.trackingLogs.push({
      status: 'pending',
      message: logMsg
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
