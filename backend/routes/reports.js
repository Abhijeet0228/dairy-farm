// routes/reports.js — Sales & Analytics Reports
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// GET /api/reports/sales?period=daily|weekly|monthly&date_from=&date_to=
router.get('/sales', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { period = 'daily', date_from, date_to } = req.query;
    const from = date_from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10);
    const to = date_to || new Date().toISOString().slice(0,10);
    let groupBy;
    if (period === 'weekly') groupBy = 'WEEK(o.created_at)';
    else if (period === 'monthly') groupBy = 'DATE_FORMAT(o.created_at, "%Y-%m")';
    else groupBy = 'DATE(o.created_at)';
    const [sales] = await db.query(
      `SELECT ${groupBy} AS period_label, DATE(MIN(o.created_at)) AS date,
       COUNT(o.id) AS total_orders, SUM(o.total_amount) AS revenue
       FROM orders o WHERE DATE(o.created_at) BETWEEN ? AND ? AND o.status != 'cancelled'
       GROUP BY ${groupBy} ORDER BY date ASC`,
      [from, to]
    );
    res.json({ success: true, sales, period, from, to });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/products — product-wise sales
router.get('/products', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const from = date_from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10);
    const to = date_to || new Date().toISOString().slice(0,10);
    const [rows] = await db.query(
      `SELECT p.name AS product_name, c.name AS category, SUM(oi.quantity) AS units_sold,
       SUM(oi.subtotal) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id JOIN orders o ON oi.order_id = o.id
       WHERE DATE(o.created_at) BETWEEN ? AND ? AND o.status != 'cancelled'
       GROUP BY p.id ORDER BY revenue DESC`,
      [from, to]
    );
    res.json({ success: true, products: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/customers — customer-wise sales
router.get('/customers', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const from = date_from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10);
    const to = date_to || new Date().toISOString().slice(0,10);
    const [rows] = await db.query(
      `SELECT u.name AS customer_name, u.email, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS total_spent
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE DATE(o.created_at) BETWEEN ? AND ? AND o.status != 'cancelled'
       GROUP BY u.id ORDER BY total_spent DESC LIMIT 20`,
      [from, to]
    );
    res.json({ success: true, customers: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/summary — dashbaord summary cards
router.get('/summary', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [[totalCustomers]] = await db.query('SELECT COUNT(*) as count FROM customers');
    const [[totalProducts]] = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active=1');
    const [[totalOrders]] = await db.query('SELECT COUNT(*) as count FROM orders');
    const [[todaySales]] = await db.query('SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE DATE(created_at)=CURDATE() AND status!="cancelled"');
    const [[monthRevenue]] = await db.query('SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW()) AND status!="cancelled"');
    const [[pendingDeliveries]] = await db.query('SELECT COUNT(*) as count FROM deliveries WHERE status="pending"');
    const [[pendingOrders]] = await db.query('SELECT COUNT(*) as count FROM orders WHERE status="pending"');
    const [lowStock] = await db.query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= 10');
    res.json({ success: true, summary: {
      totalCustomers: totalCustomers.count,
      totalProducts: totalProducts.count,
      totalOrders: totalOrders.count,
      todaySales: todaySales.total,
      monthRevenue: monthRevenue.total,
      pendingDeliveries: pendingDeliveries.count,
      pendingOrders: pendingOrders.count,
      lowStockAlerts: lowStock[0].count
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
