// routes/reviews.js — Product Reviews
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/product/:product_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.*, u.name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC',
      [req.params.product_id]
    );
    res.json({ success: true, reviews: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const [existing] = await db.query('SELECT id FROM reviews WHERE user_id=? AND product_id=?', [req.user.id, product_id]);
    if (existing.length > 0) {
      await db.query('UPDATE reviews SET rating=?, comment=? WHERE id=?', [rating, comment, existing[0].id]);
      return res.json({ success: true, message: 'Review updated.' });
    }
    await db.query('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, product_id, rating, comment]);
    res.status(201).json({ success: true, message: 'Review submitted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
