const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a plant name'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be positive'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please specify a category'],
  },
  stock: {
    type: Number,
    required: [true, 'Please specify stock level'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  careInstructions: {
    light: { type: String, default: 'Indirect sunlight' },
    water: { type: String, default: 'Water when top dry' },
    soil: { type: String, default: 'Well-draining potting mix' },
    temperature: { type: String, default: '18°C - 24°C' }
  },
  images: {
    type: [String],
    default: []
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be below 0'],
    max: [5, 'Rating cannot be above 5']
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Plant', plantSchema);
