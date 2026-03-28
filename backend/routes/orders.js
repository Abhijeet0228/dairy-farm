// routes/orders.js — Order Management
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET /api/orders — admin gets all, customer gets own
router.get('/', auth, async (req, res) => {
  try {
    let query, params = [];
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      const { status, payment_status, date_from, date_to } = req.query;
      query = `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone 
               FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1`;
      if (status) { query += ' AND o.status = ?'; params.push(status); }
      if (payment_status) { query += ' AND o.payment_status = ?'; params.push(payment_status); }
      if (date_from) { query += ' AND DATE(o.created_at) >= ?'; params.push(date_from); }
      if (date_to) { query += ' AND DATE(o.created_at) <= ?'; params.push(date_to); }
      query += ' ORDER BY o.created_at DESC';
    } else {
      query = `SELECT o.* FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC`;
      params.push(req.user.id);
    }
    const [orders] = await db.query(query, params);
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
       FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });
    const order = rows[0];
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const [items] = await db.query(
      `SELECT oi.*, p.name AS product_name, p.image_url FROM order_items oi 
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, order: { ...order, items } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/orders — place new order
router.post('/', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { items, delivery_address, payment_method = 'cod', notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'No items in order.' });
    let total_amount = 0;
    for (const item of items) {
      const [rows] = await conn.query('SELECT price, stock_quantity FROM products WHERE id = ? AND is_active = 1', [item.product_id]);
      if (rows.length === 0) throw new Error(`Product ${item.product_id} not found.`);
      if (rows[0].stock_quantity < item.quantity) throw new Error(`Insufficient stock for product ${item.product_id}.`);
      total_amount += rows[0].price * item.quantity;
      item.unit_price = rows[0].price;
    }
    const order_number = `ORD-${Date.now()}`;
    const [orderResult] = await conn.query(
      'INSERT INTO orders (order_number, user_id, total_amount, delivery_address, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [order_number, req.user.id, total_amount, delivery_address, payment_method, notes]
    );
    const orderId = orderResult.insertId;
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price, item.unit_price * item.quantity]
      );
      await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
      await conn.query('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?', [item.quantity, item.product_id]);
    }
    await conn.query('INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)',
      [orderId, total_amount, payment_method, payment_method === 'cod' ? 'pending' : 'paid']);
    await conn.commit();
    res.status(201).json({ success: true, message: 'Order placed successfully.', order_id: orderId, order_number });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally { conn.release(); }
});

// PUT /api/orders/:id/status — admin/staff only
router.put('/:id/status', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { status, payment_status, delivery_notes } = req.body;
    await db.query(
      'UPDATE orders SET status=?, payment_status=COALESCE(?,payment_status), delivery_notes=COALESCE(?,delivery_notes) WHERE id=?',
      [status, payment_status, delivery_notes, req.params.id]
    );
    if (payment_status === 'paid') {
      await db.query('UPDATE payments SET status=? WHERE order_id=?', ['paid', req.params.id]);
    }
    res.json({ success: true, message: 'Order status updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
