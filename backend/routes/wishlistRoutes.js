const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Plant = require('../models/Plant');
const { protect } = require('../middleware/auth');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'plants',
      select: 'name price images stock averageRating'
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, plants: [] });
    }

    res.json({ success: true, data: wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add plant to wishlist
// @route   POST /api/wishlist
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { plantId } = req.body;

    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, plants: [] });
    }

    // Check if already in wishlist
    if (wishlist.plants.includes(plantId)) {
      return res.status(400).json({ success: false, message: 'Plant already in wishlist' });
    }

    wishlist.plants.push(plantId);
    await wishlist.save();

    res.json({ success: true, message: 'Plant added to wishlist', data: wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Remove plant from wishlist
// @route   DELETE /api/wishlist/:plantId
// @access  Private
router.delete('/:plantId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.plants = wishlist.plants.filter(id => id.toString() !== req.params.plantId);
    await wishlist.save();

    const updatedWishlist = await Wishlist.findOne({ user: req.user._id }).populate('plants');
    res.json({ success: true, message: 'Plant removed from wishlist', data: updatedWishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
