// routes/billing.js — Invoice & Billing
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET all invoices
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, c.name AS customer_name, c.phone FROM invoices i 
       JOIN customers c ON i.customer_id = c.id ORDER BY i.created_at DESC`
    );
    res.json({ success: true, invoices: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET my invoices (customer)
router.get('/my', auth, async (req, res) => {
  try {
    const [cust] = await db.query('SELECT id FROM customers WHERE user_id = ?', [req.user.id]);
    if (cust.length === 0) return res.status(404).json({ success: false, message: 'Customer not found.' });
    const [rows] = await db.query('SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC', [cust[0].id]);
    res.json({ success: true, invoices: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single invoice with line items
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, c.name AS customer_name, c.phone, c.address, u.email 
       FROM invoices i JOIN customers c ON i.customer_id = c.id JOIN users u ON c.user_id = u.id WHERE i.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    const [items] = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    res.json({ success: true, invoice: { ...rows[0], items } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST — generate invoice
router.post('/generate', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { customer_id, period_from, period_to, type = 'monthly', items } = req.body;
    const invoice_number = `INV-${Date.now()}`;
    const total_amount = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 15);
    const [result] = await db.query(
      'INSERT INTO invoices (invoice_number, customer_id, period_from, period_to, total_amount, type, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [invoice_number, customer_id, period_from, period_to, total_amount, type, due_date.toISOString().slice(0, 10)]
    );
    for (const item of items) {
      await db.query(
        'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }
    res.status(201).json({ success: true, id: result.insertId, invoice_number });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT — mark invoice paid
router.put('/:id/pay', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { payment_method = 'cash' } = req.body;
    await db.query('UPDATE invoices SET status="paid", payment_method=?, paid_at=NOW() WHERE id=?', [payment_method, req.params.id]);
    res.json({ success: true, message: 'Invoice marked as paid.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
