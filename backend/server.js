// server.js — Main Express Application Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend statically
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/categories',    require('./routes/categories'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/customers',     require('./routes/customers'));
app.use('/api/milk-records',  require('./routes/milk_records'));
app.use('/api/inventory',     require('./routes/inventory'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/deliveries',    require('./routes/deliveries'));
app.use('/api/billing',       require('./routes/billing'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// ─── Catch-all: serve frontend pages ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dairy Farm Server running on port ${PORT}`);
});
