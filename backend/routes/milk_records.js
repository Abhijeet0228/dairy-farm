// routes/milk_records.js — Daily Milk Production Records
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET all records (with optional date filter)
router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { date_from, date_to, milk_type } = req.query;
    let query = 'SELECT * FROM milk_records WHERE 1=1';
    const params = [];
    if (date_from) { query += ' AND record_date >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND record_date <= ?'; params.push(date_to); }
    if (milk_type) { query += ' AND milk_type = ?'; params.push(milk_type); }
    query += ' ORDER BY record_date DESC';
    const [records] = await db.query(query, params);
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET summary for dashboard
router.get('/summary', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [today] = await db.query('SELECT SUM(quantity_liters) as total FROM milk_records WHERE record_date = CURDATE()');
    const [month] = await db.query('SELECT SUM(quantity_liters) as total FROM milk_records WHERE MONTH(record_date)=MONTH(NOW()) AND YEAR(record_date)=YEAR(NOW())');
    const [weekly] = await db.query(`SELECT record_date, SUM(quantity_liters) as total, milk_type 
      FROM milk_records WHERE record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY record_date, milk_type ORDER BY record_date`);
    res.json({ success: true, today: today[0].total || 0, month: month[0].total || 0, weekly });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST — add new milk record
router.post('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { record_date, milk_type, quantity_liters, fat_percentage, notes, shift = 'morning' } = req.body;
    const [result] = await db.query(
      'INSERT INTO milk_records (record_date, milk_type, quantity_liters, fat_percentage, notes, shift) VALUES (?, ?, ?, ?, ?, ?)',
      [record_date, milk_type, quantity_liters, fat_percentage, notes, shift]
    );
    // Update raw milk inventory
    await db.query(
      'INSERT INTO inventory (item_name, quantity, unit) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?',
      [`${milk_type} Milk`, quantity_liters, 'liters', quantity_liters]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT
router.put('/:id', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { record_date, milk_type, quantity_liters, fat_percentage, notes, shift } = req.body;
    await db.query(
      'UPDATE milk_records SET record_date=?, milk_type=?, quantity_liters=?, fat_percentage=?, notes=?, shift=? WHERE id=?',
      [record_date, milk_type, quantity_liters, fat_percentage, notes, shift, req.params.id]
    );
    res.json({ success: true, message: 'Record updated.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM milk_records WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
