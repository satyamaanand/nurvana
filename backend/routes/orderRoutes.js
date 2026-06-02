const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Plant = require('../models/Plant');
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');

// @desc    Create a new order (Checkout)
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Please provide shipping address' });
    }

    // Verify stock and calculate total
    let orderTotal = 0;
    const verifiedItems = [];

    // Loop through items to verify stock and price
    for (const item of items) {
      const plant = await Plant.findById(item.plant);
      if (!plant) {
        return res.status(404).json({ success: false, message: `Plant not found: ${item.plant}` });
      }

      if (plant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${plant.name}. Available: ${plant.stock}, requested: ${item.quantity}`
        });
      }

      // Add to total
      orderTotal += plant.price * item.quantity;
      verifiedItems.push({
        plant: plant._id,
        quantity: item.quantity,
        price: plant.price
      });
    }

    // Decrement stock for each item
    for (const item of items) {
      await Plant.findByIdAndUpdate(item.plant, {
        $inc: { stock: -item.quantity }
      });
    }

    // Create the order
    const lowercaseMethod = paymentMethod ? paymentMethod.toLowerCase() : 'card';
    const order = new Order({
      user: req.user._id,
      items: verifiedItems,
      shippingAddress,
      orderTotal,
      paymentStatus: lowercaseMethod === 'cod' ? 'pending' : 'paid',
      paymentMethod: lowercaseMethod,
      orderStatus: 'pending',
    });

    const createdOrder = await order.save();

    // Clear user cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.plant', 'name images')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.plant', 'name images price');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership (only owner or admin can view)
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get order tracking logs
// @route   GET /api/orders/:id/track
// @access  Private
router.get('/:id/track', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('trackingLogs user');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view tracking' });
    }

    res.json({ success: true, data: order.trackingLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
