const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env or root .env
if (fs.existsSync(path.join(__dirname, '.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} else if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} else {
  require('dotenv').config();
}

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const plantRoutes = require('./routes/plantRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// fs is already required above

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Local plant images serving with robust extension/space/default fallback
app.get('/assets/images/plants/:category/:filename.webp', (req, res, next) => {
  const { category, filename } = req.params;
  const baseDir = path.join(__dirname, '..', 'frontend', 'assets', 'images', 'plants');
  
  const mimeTypes = {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.avif': 'image/avif'
  };

  // Try exact webp path first
  const webpPath = path.join(baseDir, category, `${filename}.webp`);
  if (fs.existsSync(webpPath)) {
    res.setHeader('Content-Type', 'image/webp');
    return res.sendFile(webpPath);
  }

  // Fallbacks: check other extensions (e.g. .jpg, .avif, .png)
  // Also try replacing hyphens back to spaces (handles "Carmona Bonsai.jpg" style files)
  const fallbacks = ['.webp', '.jpg', '.jpeg', '.png', '.avif'];
  const namesToCheck = [filename, filename.replace(/-/g, ' ')];
  
  for (const name of namesToCheck) {
    for (const ext of fallbacks) {
      const filePath = path.join(baseDir, category, `${name}${ext}`);
      if (fs.existsSync(filePath)) {
        if (mimeTypes[ext]) {
          res.setHeader('Content-Type', mimeTypes[ext]);
        }
        return res.sendFile(filePath);
      }
    }
  }

  // Fallback to default.webp if no match is found
  const defaultPath = path.join(baseDir, 'default.webp');
  if (fs.existsSync(defaultPath)) {
    res.setHeader('Content-Type', 'image/webp');
    return res.sendFile(defaultPath);
  }
  
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Test Route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Nurvana Backend API is running successfully' });
});

// Serve frontend static assets
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')));

// Serve frontend static pages
app.use(express.static(path.join(__dirname, '..', 'frontend', 'pages')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
