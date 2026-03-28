-- ============================================================
-- DAIRY FARM MANAGEMENT SYSTEM — Full Database Schema + Seed Data
-- ============================================================
CREATE DATABASE IF NOT EXISTS dairy_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dairy_farm;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  role ENUM('admin','staff','customer','inactive') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  description TEXT,
  icon VARCHAR(60) DEFAULT 'fa-droplet',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INT,
  stock_quantity DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'unit',
  image_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120),
  phone VARCHAR(15),
  address TEXT,
  subscription_type ENUM('none','daily','weekly','monthly') DEFAULT 'none',
  daily_milk_liters DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','processing','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
  payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  payment_method ENUM('cod','online','upi') DEFAULT 'cod',
  delivery_address TEXT,
  delivery_notes TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity_per_day DECIMAL(5,2) NOT NULL,
  delivery_time ENUM('morning','evening','both') DEFAULT 'morning',
  start_date DATE NOT NULL,
  end_date DATE,
  is_active TINYINT(1) DEFAULT 1,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT NOT NULL,
  delivery_date DATE NOT NULL,
  quantity DECIMAL(5,2) NOT NULL,
  status ENUM('pending','delivered','missed','partial') DEFAULT 'pending',
  notes TEXT,
  delivered_at TIMESTAMP NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  invoice_id INT,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('cod','online','upi','cash','bank_transfer') DEFAULT 'cod',
  status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  period_from DATE,
  period_to DATE,
  total_amount DECIMAL(10,2) NOT NULL,
  type ENUM('monthly','one_time','subscription') DEFAULT 'monthly',
  status ENUM('pending','paid','overdue') DEFAULT 'pending',
  payment_method VARCHAR(30),
  due_date DATE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE milk_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_date DATE NOT NULL,
  milk_type ENUM('cow','buffalo','mixed') NOT NULL,
  quantity_liters DECIMAL(8,2) NOT NULL,
  fat_percentage DECIMAL(4,2),
  shift ENUM('morning','evening') DEFAULT 'morning',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  item_name VARCHAR(100),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'unit',
  notes TEXT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── SEED DATA ──────────────────────────────────────────────
-- All passwords = 'dairy123' (bcrypt hash)
INSERT INTO users (name, email, password, phone, address, role) VALUES
('Admin Owner','admin@dairyfarm.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi','9876543210','Farm Lane, Pune','admin'),
('Staff Member','staff@dairyfarm.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi','9876543211','Pune, Maharashtra','staff'),
('Rajesh Sharma','rajesh@example.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi','9812345001','12 MG Road, Pune','customer'),
('Priya Patel','priya@example.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi','9812345002','45 FC Road, Pune','customer'),
('Amit Desai','amit@example.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi','9812345003','78 Kothrud, Pune','customer'),
('Sunita Kulkarni','sunita@example.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi','9812345004','23 Baner, Pune','customer'),
('Vikram Singh','vikram@example.com','$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi','9812345005','56 Wakad, Pune','customer');

INSERT INTO categories (name, description, icon) VALUES
('Cow Milk','Fresh cow milk products','fa-cow'),
('Buffalo Milk','Rich buffalo milk products','fa-cow'),
('Curd & Yogurt','Fresh homemade curd and yogurt','fa-jar'),
('Ghee','Pure desi ghee','fa-fire-flame-curved'),
('Butter','Fresh churned butter','fa-bread-slice'),
('Paneer','Soft fresh cottage cheese','fa-cheese'),
('Buttermilk','Refreshing chilled buttermilk','fa-bottle-water'),
('Other Products','Cheese, cream and more','fa-star');

INSERT INTO products (name, description, price, category_id, stock_quantity, unit) VALUES
('Fresh Cow Milk','Pure pasteurized cow milk, rich in calcium. Collected fresh every morning.',60.00,1,200,'litre'),
('Toned Cow Milk','Low-fat toned cow milk ideal for health-conscious customers.',52.00,1,150,'litre'),
('Fresh Buffalo Milk','Rich creamy buffalo milk with high fat. Ideal for sweets and paneer.',70.00,2,120,'litre'),
('Full Cream Buffalo Milk','Premium full-cream buffalo milk, straight from the farm.',75.00,2,80,'litre'),
('Fresh Dahi (Curd)','Thick creamy homemade curd set in earthen pots. No preservatives.',40.00,3,100,'500g'),
('Greek Style Yogurt','Thick strained yogurt, high in protein. Great for breakfast.',65.00,3,60,'400g'),
('Desi Cow Ghee','Bilona method pure cow ghee. Aromatic granular texture.',650.00,4,40,'500ml'),
('Buffalo Ghee','Pure buffalo ghee with traditional flavour. Made from fresh cream.',580.00,4,8,'500ml'),
('White Butter','Fresh unsalted white butter churned from cow milk.',120.00,5,50,'200g'),
('Salted Butter','Creamy salted butter, perfect for toast and parathas.',130.00,5,45,'200g'),
('Fresh Paneer','Soft moist paneer made from full-fat cow milk. Made fresh daily.',90.00,6,80,'200g'),
('Malai Paneer','Extra-creamy malai paneer with rich texture. Made daily.',110.00,6,60,'200g'),
('Sweet Buttermilk','Chilled sweet chaas with a hint of cumin. Refreshing summer drink.',25.00,7,150,'500ml'),
('Masala Buttermilk','Tangy masala chaas with ginger, coriander and spices.',30.00,7,120,'500ml'),
('Mozzarella Cheese','Freshly made mozzarella from cow milk. Perfect for pizza.',180.00,8,9,'200g'),
('Fresh Cream','Thick fresh dairy cream, ideal for cooking and desserts.',85.00,8,40,'200ml');

INSERT INTO customers (user_id, name, email, phone, address, subscription_type, daily_milk_liters) VALUES
(3,'Rajesh Sharma','rajesh@example.com','9812345001','12 MG Road, Pune','daily',2.0),
(4,'Priya Patel','priya@example.com','9812345002','45 FC Road, Pune','daily',1.5),
(5,'Amit Desai','amit@example.com','9812345003','78 Kothrud, Pune','monthly',1.0),
(6,'Sunita Kulkarni','sunita@example.com','9812345004','23 Baner, Pune','none',0),
(7,'Vikram Singh','vikram@example.com','9812345005','56 Wakad, Pune','daily',3.0);

INSERT INTO subscriptions (customer_id, product_id, quantity_per_day, delivery_time, start_date, is_active) VALUES
(1,1,2.0,'morning','2026-03-01',1),
(2,1,1.5,'morning','2026-03-05',1),
(5,3,3.0,'morning','2026-03-10',1);

INSERT INTO orders (order_number, user_id, total_amount, status, payment_status, payment_method, delivery_address) VALUES
('ORD-1000001',3,770.00,'delivered','paid','cod','12 MG Road, Pune'),
('ORD-1000002',4,285.00,'delivered','paid','upi','45 FC Road, Pune'),
('ORD-1000003',5,1230.00,'processing','pending','cod','78 Kothrud, Pune'),
('ORD-1000004',6,180.00,'confirmed','pending','cod','23 Baner, Pune'),
('ORD-1000005',7,1300.00,'pending','pending','online','56 Wakad, Pune'),
('ORD-1000006',3,385.00,'delivered','paid','cod','12 MG Road, Pune'),
('ORD-1000007',4,290.00,'out_for_delivery','pending','cod','45 FC Road, Pune');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1,7,1,650.00,650.00),(1,9,1,120.00,120.00),
(2,5,3,40.00,120.00),(2,13,3,25.00,75.00),(2,11,1,90.00,90.00),
(3,7,1,650.00,650.00),(3,8,1,580.00,580.00),
(4,15,1,180.00,180.00),
(5,7,2,650.00,1300.00),
(6,1,5,60.00,300.00),(6,16,1,85.00,85.00),
(7,11,2,90.00,180.00),(7,12,1,110.00,110.00);

INSERT INTO milk_records (record_date, milk_type, quantity_liters, fat_percentage, shift) VALUES
(CURDATE(),'cow',85.5,3.8,'morning'),
(CURDATE(),'buffalo',42.0,6.5,'morning'),
(CURDATE(),'cow',78.0,3.9,'evening'),
(DATE_SUB(CURDATE(),INTERVAL 1 DAY),'cow',82.0,3.7,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 1 DAY),'buffalo',40.5,6.4,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 2 DAY),'cow',86.0,3.8,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 2 DAY),'buffalo',43.0,6.6,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 3 DAY),'cow',79.5,3.6,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 4 DAY),'cow',88.0,3.9,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 4 DAY),'buffalo',45.0,6.8,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 5 DAY),'cow',84.0,3.7,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 6 DAY),'cow',81.0,3.8,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 7 DAY),'cow',80.0,3.7,'morning'),
(DATE_SUB(CURDATE(),INTERVAL 7 DAY),'buffalo',41.0,6.5,'morning');

INSERT INTO inventory (product_id, item_name, quantity, unit) VALUES
(1,'Fresh Cow Milk',200,'litre'),(2,'Toned Cow Milk',150,'litre'),
(3,'Fresh Buffalo Milk',120,'litre'),(4,'Full Cream Buffalo Milk',80,'litre'),
(5,'Fresh Dahi',100,'500g pack'),(6,'Greek Style Yogurt',60,'400g pack'),
(7,'Desi Cow Ghee',40,'500ml jar'),(8,'Buffalo Ghee',8,'500ml jar'),
(9,'White Butter',50,'200g pack'),(10,'Salted Butter',45,'200g pack'),
(11,'Fresh Paneer',80,'200g pack'),(12,'Malai Paneer',60,'200g pack'),
(13,'Sweet Buttermilk',150,'500ml bottle'),(14,'Masala Buttermilk',120,'500ml bottle'),
(15,'Mozzarella Cheese',9,'200g pack'),(16,'Fresh Cream',40,'200ml pack');

INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
(3,1,5,'Best quality milk! Fresh every morning.'),
(4,7,5,'The ghee is absolutely pure and aromatic.'),
(5,11,4,'Paneer is very soft and fresh. Will buy again.'),
(6,5,5,'The curd is thick and creamy. My family loves it!'),
(7,13,4,'Very refreshing buttermilk. Great for summer days.');

INSERT INTO invoices (invoice_number, customer_id, period_from, period_to, total_amount, type, status, due_date) VALUES
('INV-2026-001',1,'2026-02-01','2026-02-28',3360.00,'monthly','paid','2026-03-10'),
('INV-2026-002',2,'2026-02-01','2026-02-28',2520.00,'monthly','paid','2026-03-10'),
('INV-2026-003',5,'2026-02-01','2026-02-28',5040.00,'monthly','pending','2026-03-10'),
('INV-2026-004',1,'2026-03-01','2026-03-31',3720.00,'monthly','pending','2026-04-10'),
('INV-2026-005',2,'2026-03-01','2026-03-31',2790.00,'monthly','pending','2026-04-10');

INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, subtotal) VALUES
(1,'Cow Milk 2L/day x 28 days',56,60.00,3360.00),
(2,'Cow Milk 1.5L/day x 28 days',42,60.00,2520.00),
(3,'Buffalo Milk 3L/day x 28 days',84,70.00,5880.00),
(4,'Cow Milk 2L/day x 31 days',62,60.00,3720.00),
(5,'Cow Milk 1.5L/day x 31 days',46.5,60.00,2790.00);
