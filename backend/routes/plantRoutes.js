const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Plant = require('../models/Plant');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @desc    Get all plants with search, filter, sort, and pagination
// @route   GET /api/plants
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const skip = (page - 1) * limit;

    let query = {};

    // Search filter
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      if (mongoose.Types.ObjectId.isValid(req.query.category)) {
        query.category = req.query.category;
      } else {
        const searchName = req.query.category.trim();
        let cat = await Category.findOne({ name: { $regex: new RegExp('^' + searchName + '$', 'i') } });
        if (!cat) {
          // Try prefix match: e.g. category "Indoor" matches "Indoor Plants"
          cat = await Category.findOne({ name: { $regex: new RegExp('^' + searchName, 'i') } });
        }
        if (!cat) {
          // Try substring match: e.g. "Succulent" matches "Succulents"
          cat = await Category.findOne({ name: { $regex: new RegExp(searchName, 'i') } });
        }
        if (!cat) {
          // Try word-based matching (e.g. "Herbal & Medicinal" -> find category containing "Herbal")
          const firstWord = searchName.split(/[\s&]+/)[0];
          if (firstWord) {
            cat = await Category.findOne({ name: { $regex: new RegExp('^' + firstWord, 'i') } });
          }
        }

        if (cat) {
          query.category = cat._id;
        } else {
          // Return empty if category is queried but doesn't exist
          return res.json({ success: true, count: 0, page, pages: 0, data: [] });
        }
      }
    }

    // Sorting
    let sort = {};
    if (req.query.sort === 'priceAsc') {
      sort = { price: 1 };
    } else if (req.query.sort === 'priceDesc') {
      sort = { price: -1 };
    } else if (req.query.sort === 'newest') {
      sort = { createdAt: -1 };
    } else if (req.query.sort === 'popularity') {
      sort = { averageRating: -1, numReviews: -1 };
    } else {
      sort = { createdAt: -1 }; // default sorting
    }

    // Execute query
    const total = await Plant.countDocuments(query);
    const plants = await Plant.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: total,
      page,
      pages: Math.ceil(total / limit),
      data: plants
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single plant details
// @route   GET /api/plants/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Plant ID format' });
    }

    const plant = await Plant.findById(req.params.id).populate('category', 'name');

    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    res.json({ success: true, data: plant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a plant
// @route   POST /api/plants
// @access  Private/Admin
router.post('/', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    let { name, price, description, category, stock, light, water, soil, temperature, careInstructions } = req.body;

    // Parse careInstructions if passed as stringified JSON, or extract individual components
    let parsedCare = {};
    if (careInstructions) {
      parsedCare = typeof careInstructions === 'string' ? JSON.parse(careInstructions) : careInstructions;
    } else {
      parsedCare = { light, water, soil, temperature };
    }

    // Handle files
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Ensure category exists or check if ObjectId
    let categoryId = category;
    if (!mongoose.Types.ObjectId.isValid(category)) {
      const cat = await Category.findOne({ name: category });
      if (cat) {
        categoryId = cat._id;
      } else {
        // Create category if it doesn't exist
        const newCat = await Category.create({ name: category, description: `Automated category for ${category}` });
        categoryId = newCat._id;
      }
    }

    const plant = await Plant.create({
      name,
      price: parseFloat(price),
      description,
      category: categoryId,
      stock: parseInt(stock, 10) || 0,
      careInstructions: parsedCare,
      images: imageUrls,
    });

    res.status(201).json({ success: true, data: plant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a plant
// @route   PUT /api/plants/:id
// @access  Private/Admin
router.put('/:id', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    let { name, price, description, category, stock, light, water, soil, temperature, careInstructions } = req.body;

    // Parse careInstructions
    let parsedCare = plant.careInstructions;
    if (careInstructions) {
      parsedCare = typeof careInstructions === 'string' ? JSON.parse(careInstructions) : careInstructions;
    } else if (light || water || soil || temperature) {
      parsedCare = {
        light: light || plant.careInstructions.light,
        water: water || plant.careInstructions.water,
        soil: soil || plant.careInstructions.soil,
        temperature: temperature || plant.careInstructions.temperature,
      };
    }

    // Handle files
    let imageUrls = plant.images;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      // Add or replace images
      imageUrls = [...imageUrls, ...newImages];
    } else if (req.body.images) {
      imageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Update category relation if provided
    let categoryId = plant.category;
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = category;
      } else {
        const cat = await Category.findOne({ name: category });
        if (cat) {
          categoryId = cat._id;
        } else {
          const newCat = await Category.create({ name: category, description: `Automated category for ${category}` });
          categoryId = newCat._id;
        }
      }
    }

    plant.name = name || plant.name;
    plant.price = price !== undefined ? parseFloat(price) : plant.price;
    plant.description = description || plant.description;
    plant.category = categoryId;
    plant.stock = stock !== undefined ? parseInt(stock, 10) : plant.stock;
    plant.careInstructions = parsedCare;
    plant.images = imageUrls;

    const updatedPlant = await plant.save();
    res.json({ success: true, data: updatedPlant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a plant
// @route   DELETE /api/plants/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ success: false, message: 'Plant not found' });
    }

    await Plant.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Plant deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
