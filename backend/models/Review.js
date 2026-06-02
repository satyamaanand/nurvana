const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plant',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'Please add a review comment'],
    trim: true,
  }
}, {
  timestamps: true,
});

// Ensure a user can only leave one review per plant
reviewSchema.index({ plant: 1, user: 1 }, { unique: true });

// Static method to get avg rating and update Plant model
reviewSchema.statics.getAverageRating = async function (plantId) {
  const obj = await this.aggregate([
    { $match: { plant: plantId } },
    {
      $group: {
        _id: '$plant',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (obj.length > 0) {
      await this.model('Plant').findByIdAndUpdate(plantId, {
        averageRating: Math.round(obj[0].averageRating * 10) / 10,
        numReviews: obj[0].numReviews
      });
    } else {
      await this.model('Plant').findByIdAndUpdate(plantId, {
        averageRating: 0,
        numReviews: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.plant);
});

// Call getAverageRating before delete
reviewSchema.post('remove', async function () {
  await this.constructor.getAverageRating(this.plant);
});

module.exports = mongoose.model('Review', reviewSchema);
