// routes/customers.js — Customer Management
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET /api/customers
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { search, subscription_type } = req.query;
    let query = `SELECT c.*, u.email, u.role FROM customers c JOIN users u ON c.user_id = u.id WHERE 1=1`;
    const params = [];
    if (search) { query += ' AND (c.name LIKE ? OR c.phone LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (subscription_type) { query += ' AND c.subscription_type = ?'; params.push(subscription_type); }
    query += ' ORDER BY c.name';
    const [customers] = await db.query(query, params);
    res.json({ success: true, customers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/customers/:id
router.get('/:id', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT c.*, u.email FROM customers c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found.' });
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [rows[0].user_id]);
    const [subscription] = await db.query('SELECT * FROM subscriptions WHERE customer_id = ? AND is_active = 1', [req.params.id]);
    res.json({ success: true, customer: rows[0], orders, subscription: subscription[0] || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/customers — admin creates customer manually
router.post('/', auth, role('admin', 'staff'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { name, email, phone, address, subscription_type = 'none', daily_milk_liters = 0 } = req.body;
    const bcrypt = require('bcryptjs');
    const tempPass = await bcrypt.hash('dairy123', 12);
    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, tempPass, phone, address, 'customer']
    );
    const [custResult] = await conn.query(
      'INSERT INTO customers (user_id, name, email, phone, address, subscription_type, daily_milk_liters) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userResult.insertId, name, email, phone, address, subscription_type, daily_milk_liters]
    );
    await conn.commit();
    res.status(201).json({ success: true, message: 'Customer created. Default password: dairy123', id: custResult.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally { conn.release(); }
});

// PUT /api/customers/:id
router.put('/:id', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { name, phone, address, subscription_type, daily_milk_liters } = req.body;
    const [cust] = await db.query('SELECT user_id FROM customers WHERE id = ?', [req.params.id]);
    if (cust.length === 0) return res.status(404).json({ success: false, message: 'Customer not found.' });
    await db.query('UPDATE customers SET name=?, phone=?, address=?, subscription_type=?, daily_milk_liters=? WHERE id=?',
      [name, phone, address, subscription_type, daily_milk_liters, req.params.id]);
    await db.query('UPDATE users SET name=?, phone=?, address=? WHERE id=?', [name, phone, address, cust[0].user_id]);
    res.json({ success: true, message: 'Customer updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/customers/:id
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    const [cust] = await db.query('SELECT user_id FROM customers WHERE id = ?', [req.params.id]);
    if (cust.length === 0) return res.status(404).json({ success: false, message: 'Customer not found.' });
    await db.query('UPDATE users SET role="inactive" WHERE id=?', [cust[0].user_id]);
    res.json({ success: true, message: 'Customer deactivated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
