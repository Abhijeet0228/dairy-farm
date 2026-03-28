// server.js — Main Express Application Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

console.log('--- Server Starting ---');
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('--- Setting up Static Folders ---');
// Use absolute paths from the root for maximum reliability
const frontendPath = path.resolve(__dirname, '..', 'frontend');
const publicPath = path.resolve(__dirname, '..', 'frontend', 'public');
const uploadsPath = path.resolve(__dirname, 'uploads');

console.log('Serving Frontend from:', frontendPath);
console.log('Serving Public from:', publicPath);

app.use('/uploads', express.static(uploadsPath));
app.use(express.static(publicPath));
app.use(express.static(frontendPath));

console.log('--- Loading API Routes ---');
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

console.log('--- Setting up Fallback Routing ---');
// ─── Catch-all: serve frontend index for SPA-like navigation ────────────────────
app.get('*', (req, res) => {
  // Only serve index for non-API requests
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
console.log(`--- Initializing Port ${PORT} ---`);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dairy Farm Server successfully listening on port ${PORT}`);
  console.log(`🌐 Public URL check: http://0.0.0.0:${PORT}`);
});
