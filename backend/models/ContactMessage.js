const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email address'],
    lowercase: true,
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Please add a message'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved'],
    default: 'Pending',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
