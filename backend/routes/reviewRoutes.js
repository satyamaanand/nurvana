const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Plant = require('../models/Plant');
const { protect } = require('../middleware/auth');

// @desc    Get reviews for a plant
// @route   GET /api/reviews/:plantId
// @access  Public
router.get('/:plantId', async (req, res) => {
  try {
    const reviews = await Review.find({ plant: req.params.plantId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { plantId, rating, comment } = req.body;
    const score = parseInt(rating, 10);

    if (!plantId || !score || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide plantId, rating, and comment' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if plant exists
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      plant: plantId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this plant' });
    }

    // Create review
    const review = await Review.create({
      user: req.user._id,
      plant: plantId,
      rating: score,
      comment,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
