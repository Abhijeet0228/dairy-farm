// routes/categories.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT *, (SELECT COUNT(*) FROM products WHERE category_id = categories.id AND is_active=1) as product_count FROM categories ORDER BY name');
    res.json({ success: true, categories: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, role('admin'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const [result] = await db.query('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)', [name, description, icon]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    await db.query('UPDATE categories SET name=?, description=?, icon=? WHERE id=?', [name, description, icon, req.params.id]);
    res.json({ success: true, message: 'Category updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
