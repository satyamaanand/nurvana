const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plant = require('../models/Plant');
const Order = require('../models/Order');
const ContactMessage = require('../models/ContactMessage');
const { protect, admin } = require('../middleware/auth');

// Apply protect & admin middleware to all routes in this file
router.use(protect);
router.use(admin);

// @desc    Get dashboard summary statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalPlants = await Plant.countDocuments({});
    const totalOrders = await Order.countDocuments({});

    // Fetch low stock alerts (stock < 5)
    const lowStockAlerts = await Plant.find({ stock: { $lt: 5 } }).populate('category', 'name');

    // Fetch 5 most recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPlants,
        totalOrders,
        lowStockAlertsCount: lowStockAlerts.length,
        lowStockAlerts,
        recentOrders
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('items.plant', 'name price')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update order status & append tracking log
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, message } = req.body; // status: 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    const lowercaseStatus = status ? status.toLowerCase() : '';

    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(lowercaseStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    if (oldStatus === lowercaseStatus) {
      return res.status(400).json({ success: false, message: `Order is already marked as ${status}` });
    }

    // Handle inventory return if order is being cancelled
    if (lowercaseStatus === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        await Plant.findByIdAndUpdate(item.plant, {
          $inc: { stock: item.quantity }
        });
      }
      order.paymentStatus = 'failed';
    }

    // Handle delivered status
    if (lowercaseStatus === 'delivered') {
      order.paymentStatus = 'paid';
    }

    order.orderStatus = lowercaseStatus;

    // Append to tracking logs
    let logMsg = message || `Order status updated to ${status}.`;
    if (lowercaseStatus === 'shipped' && !message) {
      logMsg = 'Your package has been handed over to our courier partner and is on the way.';
    } else if (lowercaseStatus === 'delivered' && !message) {
      logMsg = 'Package delivered successfully. Thank you for shopping with Nurvana!';
    } else if (lowercaseStatus === 'cancelled' && !message) {
      logMsg = 'Order has been cancelled and items returned to nursery inventory.';
    } else if (lowercaseStatus === 'confirmed' && !message) {
      logMsg = 'Order has been confirmed and is being prepared for shipment.';
    }

    order.trackingLogs.push({ status: lowercaseStatus, message: logMsg });

    const updatedOrder = await order.save();
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
