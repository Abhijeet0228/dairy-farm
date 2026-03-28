# 🐄 Jadhav Dairy Farm — Full-Stack Management System

A complete, professional Dairy Farm Management & E-Commerce website built with **Node.js + Express + MySQL** backend and **HTML/CSS/JS** frontend.

---

## 📁 Project Structure

```
dairy-farm/
├── backend/               ← Node.js + Express API server
│   ├── server.js          ← Entry point
│   ├── .env               ← Environment variables (edit this)
│   ├── config/db.js       ← MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js        ← JWT verification
│   │   └── role.js        ← Role-based access control
│   └── routes/            ← All API routes
│       ├── auth.js
│       ├── products.js
│       ├── categories.js
│       ├── orders.js
│       ├── customers.js
│       ├── subscriptions.js
│       ├── deliveries.js
│       ├── milk_records.js
│       ├── inventory.js
│       ├── billing.js
│       ├── reports.js
│       ├── reviews.js
│       └── dashboard.js
├── database/
│   └── dairy_farm.sql     ← Full schema + seed data
└── frontend/
    ├── public/            ← Public pages (Home, Products, Cart...)
    ├── admin/             ← Admin dashboard pages
    ├── customer/          ← Customer panel pages
    ├── css/
    │   ├── main.css       ← Global design system
    │   ├── admin.css      ← Admin styles
    │   └── customer.css   ← Customer panel styles
    └── js/
        └── api.js         ← API helper + auth + toast utilities
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **MySQL** 8.0+ — [mysql.com](https://mysql.com) or XAMPP/WAMP

---

### Step 1 — Create the Database

1. Open MySQL Workbench, phpMyAdmin, or terminal
2. Run the SQL file:

```sql
-- In MySQL terminal:
source C:\path\to\dairy-farm\database\dairy_farm.sql

-- Or in phpMyAdmin:
-- Create database 'dairy_farm', then Import → dairy_farm.sql
```

---

### Step 2 — Configure Environment

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password   ← CHANGE THIS
DB_NAME=dairy_farm
JWT_SECRET=dairy_farm_super_secret_key_2024
JWT_EXPIRES_IN=7d
```

---

### Step 3 — Install & Run Backend

```bash
cd dairy-farm/backend
npm install
npm run dev          # starts with nodemon (auto-restart)
# OR
npm start            # production start
```

Server starts at: **http://localhost:5000**

---

### Step 4 — Open the Website

Open any of these files directly in your browser **or** serve via the backend:

| Page | Path |
|------|------|
| 🏠 Home | `frontend/public/index.html` |
| 🛒 Products | `frontend/public/products.html` |
| 🔐 Login | `frontend/public/login.html` |
| 📊 Admin Dashboard | `frontend/admin/dashboard.html` |
| 👤 Customer Dashboard | `frontend/customer/dashboard.html` |

> **Tip:** You can also visit `http://localhost:5000` and the backend serves the frontend automatically.

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@dairyfarm.com | dairy123 |
| **Staff** | staff@dairyfarm.com | dairy123 |
| **Customer 1** | rajesh@example.com | dairy123 |
| **Customer 2** | priya@example.com | dairy123 |
| **Customer 3** | amit@example.com | dairy123 |

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | JWT |
| PUT | `/api/auth/profile` | JWT |

### Products & Categories
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | Admin/Staff |
| PUT | `/api/products/:id` | Admin/Staff |
| DELETE | `/api/products/:id` | Admin |
| GET | `/api/categories` | Public |

### Orders
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/orders` | JWT |
| GET | `/api/orders/:id` | JWT |
| POST | `/api/orders` | Customer |
| PUT | `/api/orders/:id/status` | Admin/Staff |

### Subscriptions
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/subscriptions` | Admin/Staff |
| GET | `/api/subscriptions/my` | Customer |
| POST | `/api/subscriptions` | Customer |
| PUT | `/api/subscriptions/:id` | JWT |
| DELETE | `/api/subscriptions/:id` | JWT |

### Admin Modules
| Endpoint | Description |
|----------|-------------|
| `/api/customers` | Customer CRUD |
| `/api/milk-records` | Milk production logs |
| `/api/inventory` | Stock management |
| `/api/deliveries` | Delivery schedule |
| `/api/billing` | Invoices |
| `/api/reports/sales` | Sales analytics |
| `/api/reports/products` | Product-wise report |
| `/api/reports/customers` | Customer-wise report |
| `/api/dashboard` | Admin dashboard summary |

---

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `users` | Auth accounts (admin/staff/customer) |
| `categories` | Product categories |
| `products` | Dairy products with stock |
| `customers` | Extended customer profiles |
| `orders` | Customer purchase orders |
| `order_items` | Items per order |
| `subscriptions` | Daily milk delivery subs |
| `deliveries` | Daily delivery records |
| `payments` | Payment tracking |
| `invoices` | Monthly/one-time bills |
| `invoice_items` | Invoice line items |
| `milk_records` | Farm milk production |
| `inventory` | Stock levels |
| `reviews` | Product reviews |

---

## 🎨 Design System

- **Colors**: Forest Green `#2d6a4f`, Mint `#74c69d`, Amber `#f4a261`, Cream `#fefae0`
- **Fonts**: Playfair Display (headings) + Inter (body)
- **UI**: Glassmorphism cards, smooth transitions, Chart.js dashboards, toast notifications

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| Auth | JWT + bcrypt |
| Charts | Chart.js |
| Icons | Font Awesome 6 |
| File Upload | Multer |

---

## 💡 Key Features

- ✅ Role-based access (Admin / Staff / Customer)
- ✅ JWT Authentication
- ✅ Daily milk subscription system with auto-billing
- ✅ Monthly invoice generation & printing
- ✅ Sales charts (daily / weekly / monthly)
- ✅ Low-stock inventory alerts
- ✅ Order tracking timeline
- ✅ Delivery schedule generator
- ✅ Product image upload
- ✅ Customer review system
- ✅ Fully responsive mobile design
- ✅ Toast notifications & form validation

---

## 🚀 Quick Start (Summary)

```bash
1. Import database/dairy_farm.sql into MySQL
2. Edit backend/.env — set DB_PASSWORD
3. cd backend && npm install && npm run dev
4. Open frontend/public/index.html in browser
5. Login: admin@dairyfarm.com / dairy123
```

---

*Built with ❤️ for dairy farmers and their families.*
