// routes/subscriptions.js — Daily Milk Subscription
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET all subscriptions (admin)
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, c.name AS customer_name, c.phone, c.address, p.name AS product_name
       FROM subscriptions s 
       JOIN customers c ON s.customer_id = c.id
       JOIN products p ON s.product_id = p.id
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, subscriptions: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET my subscription (customer)
router.get('/my', auth, async (req, res) => {
  try {
    const [cust] = await db.query('SELECT id FROM customers WHERE user_id = ?', [req.user.id]);
    if (cust.length === 0) return res.status(404).json({ success: false, message: 'Customer profile not found.' });
    const [rows] = await db.query(
      `SELECT s.*, p.name AS product_name, p.price, p.unit FROM subscriptions s 
       JOIN products p ON s.product_id = p.id WHERE s.customer_id = ?`,
      [cust[0].id]
    );
    res.json({ success: true, subscriptions: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscriptions — subscribe
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, quantity_per_day, delivery_time = 'morning', start_date } = req.body;
    const [cust] = await db.query('SELECT id FROM customers WHERE user_id = ?', [req.user.id]);
    if (cust.length === 0) return res.status(404).json({ success: false, message: 'Customer profile not found.' });
    const [existing] = await db.query('SELECT id FROM subscriptions WHERE customer_id = ? AND product_id = ? AND is_active = 1', [cust[0].id, product_id]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Already subscribed to this product.' });
    const [result] = await db.query(
      'INSERT INTO subscriptions (customer_id, product_id, quantity_per_day, delivery_time, start_date, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [cust[0].id, product_id, quantity_per_day, delivery_time, start_date || new Date().toISOString().slice(0, 10)]
    );
    await db.query('UPDATE customers SET subscription_type = "daily", daily_milk_liters = ? WHERE id = ?', [quantity_per_day, cust[0].id]);
    res.status(201).json({ success: true, message: 'Subscription created.', id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/subscriptions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { quantity_per_day, delivery_time, is_active } = req.body;
    await db.query(
      'UPDATE subscriptions SET quantity_per_day=?, delivery_time=?, is_active=? WHERE id=?',
      [quantity_per_day, delivery_time, is_active, req.params.id]
    );
    res.json({ success: true, message: 'Subscription updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Admin manually update customer daily supply
router.put('/:id/supply', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { quantity_per_day, notes } = req.body;
    await db.query('UPDATE subscriptions SET quantity_per_day=?, admin_notes=? WHERE id=?', [quantity_per_day, notes, req.params.id]);
    res.json({ success: true, message: 'Daily supply updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/subscriptions/:id (cancel)
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE subscriptions SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Subscription cancelled.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
