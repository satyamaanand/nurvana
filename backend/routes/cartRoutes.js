const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Plant = require('../models/Plant');
const { protect } = require('../middleware/auth');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.plant',
      select: 'name price images stock'
    });

    // If no cart exists, create one
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add or update item in cart
// @route   POST /api/cart
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { plantId, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    // Verify plant exists
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    // Check stock
    if (plant.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${plant.stock} items left in stock` });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(item => item.plant.toString() === plantId);

    if (itemIndex > -1) {
      // Update quantity
      cart.items[itemIndex].quantity = qty;
    } else {
      // Add new item
      cart.items.push({ plant: plantId, quantity: qty });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.plant');
    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:plantId
// @access  Private
router.delete('/:plantId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Filter out the item
    cart.items = cart.items.filter(item => item.plant.toString() !== req.params.plantId);

    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.plant');
    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Sync guest cart with database on login
// @route   POST /api/cart/sync
// @access  Private
router.post('/sync', protect, async (req, res) => {
  try {
    const { items } = req.body; // Array of { plantId, quantity }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid items array' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Process each item
    for (const localItem of items) {
      const plant = await Plant.findById(localItem.plantId);
      if (!plant) continue; // Skip if invalid plant

      const itemIndex = cart.items.findIndex(item => item.plant.toString() === localItem.plantId);
      const targetQty = Math.min(localItem.quantity, plant.stock); // Caps at stock level

      if (itemIndex > -1) {
        // Merge or replace quantity (we'll replace with local storage or choose max)
        cart.items[itemIndex].quantity = Math.max(cart.items[itemIndex].quantity, targetQty);
      } else {
        cart.items.push({ plant: localItem.plantId, quantity: targetQty });
      }
    }

    await cart.save();
    const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.plant');
    res.json({ success: true, data: populatedCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
