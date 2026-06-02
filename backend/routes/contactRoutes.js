const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { protect, admin } = require('../middleware/auth');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const contactMsg = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({ success: true, message: 'Message sent successfully', data: contactMsg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Resolve a contact message (Admin)
// @route   PUT /api/contact/:id/resolve
// @access  Private/Admin
router.put('/:id/resolve', protect, admin, async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.status = 'Resolved';
    await message.save();

    res.json({ success: true, message: 'Message marked as resolved', data: message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
