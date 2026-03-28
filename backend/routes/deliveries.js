// routes/deliveries.js — Delivery Management
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = `SELECT d.*, c.name AS customer_name, c.address, c.phone, p.name AS product_name
                 FROM deliveries d JOIN subscriptions s ON d.subscription_id = s.id
                 JOIN customers c ON s.customer_id = c.id JOIN products p ON s.product_id = p.id WHERE 1=1`;
    const params = [];
    if (date) { query += ' AND d.delivery_date = ?'; params.push(date); }
    if (status) { query += ' AND d.status = ?'; params.push(status); }
    query += ' ORDER BY d.delivery_date DESC, c.name';
    const [rows] = await db.query(query, params);
    res.json({ success: true, deliveries: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Generate today's delivery schedule from active subscriptions
router.post('/generate-schedule', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { date } = req.body;
    const deliveryDate = date || new Date().toISOString().slice(0, 10);
    const [subs] = await db.query('SELECT * FROM subscriptions WHERE is_active = 1');
    let created = 0;
    for (const sub of subs) {
      const [exists] = await db.query('SELECT id FROM deliveries WHERE subscription_id=? AND delivery_date=?', [sub.id, deliveryDate]);
      if (exists.length === 0) {
        await db.query(
          'INSERT INTO deliveries (subscription_id, delivery_date, quantity, status) VALUES (?, ?, ?, "pending")',
          [sub.id, deliveryDate, sub.quantity_per_day]
        );
        created++;
      }
    }
    res.json({ success: true, message: `${created} deliveries scheduled for ${deliveryDate}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { status, quantity, notes } = req.body;
    await db.query('UPDATE deliveries SET status=?, quantity=COALESCE(?,quantity), notes=? WHERE id=?', [status, quantity, notes, req.params.id]);
    res.json({ success: true, message: 'Delivery updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
