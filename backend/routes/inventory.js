// routes/inventory.js — Inventory Management
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

const LOW_STOCK_THRESHOLD = 10;

router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, p.name AS product_name, p.price, c.name AS category_name
       FROM inventory i LEFT JOIN products p ON i.product_id = p.id 
       LEFT JOIN categories c ON p.category_id = c.id ORDER BY i.quantity ASC`
    );
    const lowStock = rows.filter(r => r.quantity <= LOW_STOCK_THRESHOLD);
    res.json({ success: true, inventory: rows, lowStock, threshold: LOW_STOCK_THRESHOLD });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/alerts', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, p.name AS product_name FROM inventory i LEFT JOIN products p ON i.product_id = p.id WHERE i.quantity <= ?`,
      [LOW_STOCK_THRESHOLD]
    );
    res.json({ success: true, alerts: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    await db.query('UPDATE inventory SET quantity=?, last_updated=NOW(), notes=? WHERE id=?', [quantity, notes, req.params.id]);
    if (req.body.product_id) {
      await db.query('UPDATE products SET stock_quantity=? WHERE id=?', [quantity, req.body.product_id]);
    }
    res.json({ success: true, message: 'Inventory updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Add standalone inventory item (for raw milk etc)
router.post('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { item_name, quantity, unit, notes } = req.body;
    const [result] = await db.query(
      'INSERT INTO inventory (item_name, quantity, unit, notes) VALUES (?, ?, ?, ?)',
      [item_name, quantity, unit, notes]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
