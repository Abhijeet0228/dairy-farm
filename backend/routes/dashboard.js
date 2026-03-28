// routes/dashboard.js — Admin Dashboard Summary
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, role('admin', 'staff'), async (req, res) => {
  try {
    const [[totalCustomers]] = await db.query('SELECT COUNT(*) as count FROM customers');
    const [[totalProducts]] = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active=1');
    const [[totalOrders]] = await db.query('SELECT COUNT(*) as count FROM orders');
    const [[todaySales]] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE DATE(created_at)=CURDATE() AND status!='cancelled'");
    const [[monthRevenue]] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW()) AND status!='cancelled'");
    const [[pendingDeliveries]] = await db.query("SELECT COUNT(*) as count FROM deliveries WHERE status='pending'");
    const [[pendingOrders]] = await db.query("SELECT COUNT(*) as count FROM orders WHERE status='pending'");
    const [[todayMilk]] = await db.query('SELECT COALESCE(SUM(quantity_liters),0) as total FROM milk_records WHERE record_date=CURDATE()');
    const [lowStock] = await db.query('SELECT i.*, p.name AS product_name FROM inventory i LEFT JOIN products p ON i.product_id = p.id WHERE i.quantity <= 10');
    const [recentOrders] = await db.query(
      "SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC LIMIT 5"
    );
    const [salesChart] = await db.query(
      "SELECT DATE(created_at) as date, SUM(total_amount) as revenue FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status!='cancelled' GROUP BY DATE(created_at) ORDER BY date"
    );
    const [milkChart] = await db.query(
      "SELECT record_date as date, SUM(quantity_liters) as liters, milk_type FROM milk_records WHERE record_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY record_date, milk_type ORDER BY record_date"
    );

    res.json({ success: true, stats: {
      totalCustomers: totalCustomers.count,
      totalProducts: totalProducts.count,
      totalOrders: totalOrders.count,
      todaySales: todaySales.total,
      monthRevenue: monthRevenue.total,
      pendingDeliveries: pendingDeliveries.count,
      pendingOrders: pendingOrders.count,
      todayMilk: todayMilk.total
    }, lowStock, recentOrders, salesChart, milkChart });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
