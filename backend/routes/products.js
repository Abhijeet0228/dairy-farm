// routes/products.js — Product CRUD Routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../backend/uploads/products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `product_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/products — public, with search/filter
router.get('/', async (req, res) => {
  try {
    const { category_id, search, min_price, max_price, sort = 'name', order = 'ASC', page = 1, limit = 12 } = req.query;
    let query = `SELECT p.*, c.name AS category_name 
                 FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1`;
    const params = [];
    if (category_id) { query += ' AND p.category_id = ?'; params.push(category_id); }
    if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (min_price) { query += ' AND p.price >= ?'; params.push(min_price); }
    if (max_price) { query += ' AND p.price <= ?'; params.push(max_price); }
    query += ` ORDER BY p.${sort} ${order}`;
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
    const [products] = await db.query(query, params);
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM products WHERE is_active = 1');
    res.json({ success: true, products, total: countResult[0].total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name,
       (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) AS avg_rating,
       (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count
       FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    const [reviews] = await db.query(
      'SELECT r.*, u.name AS customer_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, product: rows[0], reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products — admin/staff only
router.post('/', auth, role('admin', 'staff'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category_id, stock_quantity, unit, is_active = 1 } = req.body;
    const image_url = req.file ? `/uploads/products/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO products (name, description, price, category_id, stock_quantity, unit, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category_id, stock_quantity, unit || 'unit', image_url, is_active]
    );
    // Update inventory
    await db.query('INSERT INTO inventory (product_id, quantity, unit) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?',
      [result.insertId, stock_quantity, unit || 'unit', stock_quantity]);
    res.status(201).json({ success: true, message: 'Product created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, role('admin', 'staff'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category_id, stock_quantity, unit, is_active } = req.body;
    let image_url = req.body.existing_image;
    if (req.file) image_url = `/uploads/products/${req.file.filename}`;
    await db.query(
      'UPDATE products SET name=?, description=?, price=?, category_id=?, stock_quantity=?, unit=?, image_url=?, is_active=? WHERE id=?',
      [name, description, price, category_id, stock_quantity, unit, image_url, is_active, req.params.id]
    );
    await db.query('UPDATE inventory SET quantity = ? WHERE product_id = ?', [stock_quantity, req.params.id]);
    res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
