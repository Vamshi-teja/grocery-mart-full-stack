const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'grocery-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'vamshi3405$',
  database: process.env.DB_NAME || 'grocery_db2'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.userId && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
};

// ==================== AUTH ROUTES ====================

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'customer';

    const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(query, [username, email, hashedPassword, userRole], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Username or email already exists' });
        }
        return res.status(500).json({ message: 'Error creating user', error: err });
      }
      res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
});

// Logout User
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get Current User
app.get('/api/auth/me', isAuthenticated, (req, res) => {
  const query = 'SELECT id, username, email, role, created_at FROM users WHERE id = ?';
  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(results[0]);
  });
});

// ==================== PRODUCT ROUTES ====================

// Get All Products
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name';

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// Get Product by ID
app.get('/api/products/:id', (req, res) => {
  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(results[0]);
  });
});

// Create Product (Admin Only)
app.post('/api/products', isAdmin, (req, res) => {
  const { name, description, category, price, stock_quantity, image_url } = req.body;

  if (!name || !price || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Name, price, and stock quantity are required' });
  }

  const query = 'INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [name, description, category, price, stock_quantity, image_url], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating product', error: err });
    }
    res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
  });
});

// Update Product (Admin Only)
app.put('/api/products/:id', isAdmin, (req, res) => {
  const { name, description, category, price, stock_quantity, image_url } = req.body;

  const query = 'UPDATE products SET name = ?, description = ?, category = ?, price = ?, stock_quantity = ?, image_url = ? WHERE id = ?';
  db.query(query, [name, description, category, price, stock_quantity, image_url, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error updating product', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully' });
  });
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', isAdmin, (req, res) => {
  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error deleting product', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Get Product Categories
app.get('/api/categories', (req, res) => {
  const query = 'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results.map(r => r.category));
  });
});

// ==================== CART ROUTES ====================

// Get User's Cart
app.get('/api/cart', isAuthenticated, (req, res) => {
  const query = `
    SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity,
           (c.quantity * p.price) as subtotal
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  
  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// Add to Cart
app.post('/api/cart', isAuthenticated, (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'Valid product_id and quantity are required' });
  }

  // Check if product exists and has enough stock
  const checkQuery = 'SELECT stock_quantity FROM products WHERE id = ?';
  db.query(checkQuery, [product_id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (results[0].stock_quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Check if item already in cart
    const cartCheckQuery = 'SELECT * FROM cart WHERE user_id = ? AND product_id = ?';
    db.query(cartCheckQuery, [req.session.userId, product_id], (err, cartResults) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }

      if (cartResults.length > 0) {
        // Update quantity
        const newQuantity = cartResults[0].quantity + quantity;
        if (results[0].stock_quantity < newQuantity) {
          return res.status(400).json({ message: 'Insufficient stock for requested quantity' });
        }
        const updateQuery = 'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?';
        db.query(updateQuery, [newQuantity, req.session.userId, product_id], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error updating cart', error: err });
          }
          res.json({ message: 'Cart updated successfully' });
        });
      } else {
        // Insert new item
        const insertQuery = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
        db.query(insertQuery, [req.session.userId, product_id, quantity], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error adding to cart', error: err });
          }
          res.status(201).json({ message: 'Added to cart successfully' });
        });
      }
    });
  });
});

// Update Cart Item
app.put('/api/cart/:productId', isAuthenticated, (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Valid quantity is required' });
  }

  // Check stock
  const checkQuery = 'SELECT stock_quantity FROM products WHERE id = ?';
  db.query(checkQuery, [req.params.productId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (results[0].stock_quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const query = 'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?';
    db.query(query, [quantity, req.session.userId, req.params.productId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating cart', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
      res.json({ message: 'Cart updated successfully' });
    });
  });
});

// Remove from Cart
app.delete('/api/cart/:productId', isAuthenticated, (req, res) => {
  const query = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
  db.query(query, [req.session.userId, req.params.productId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error removing from cart', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    res.json({ message: 'Removed from cart successfully' });
  });
});

// Clear Cart
app.delete('/api/cart', isAuthenticated, (req, res) => {
  const query = 'DELETE FROM cart WHERE user_id = ?';
  db.query(query, [req.session.userId], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error clearing cart', error: err });
    }
    res.json({ message: 'Cart cleared successfully' });
  });
});

// ==================== ORDER ROUTES ====================

// Get User's Orders
app.get('/api/orders', isAuthenticated, (req, res) => {
  const query = req.session.role === 'admin' 
    ? 'SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
    : 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
  
  const params = req.session.role === 'admin' ? [] : [req.session.userId];

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// Get Order Details
app.get('/api/orders/:id', isAuthenticated, (req, res) => {
  const orderQuery = 'SELECT * FROM orders WHERE id = ?';
  
  db.query(orderQuery, [req.params.id], (err, orderResults) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (orderResults.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResults[0];
    
    // Check authorization
    if (req.session.role !== 'admin' && order.user_id !== req.session.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const itemsQuery = `
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    
    db.query(itemsQuery, [req.params.id], (err, itemsResults) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.json({ ...order, items: itemsResults });
    });
  });
});

// Create Order (Checkout)
app.post('/api/orders', isAuthenticated, (req, res) => {
  const { shipping_address, payment_method } = req.body;

  if (!shipping_address || !payment_method) {
    return res.status(400).json({ message: 'Shipping address and payment method are required' });
  }

  // Get cart items
  const cartQuery = `
    SELECT c.*, p.price, p.stock_quantity
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;

  db.query(cartQuery, [req.session.userId], (err, cartItems) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total and check stock
    let total = 0;
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product ID ${item.product_id}` 
        });
      }
      total += item.price * item.quantity;
    }

    // Create order
    const orderQuery = 'INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)';
    db.query(orderQuery, [req.session.userId, total, 'pending', shipping_address, payment_method], (err, orderResult) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating order', error: err });
      }

      const orderId = orderResult.insertId;

      // Insert order items and update stock
      let completed = 0;
      const totalItems = cartItems.length;

      cartItems.forEach(item => {
        const orderItemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
        db.query(orderItemQuery, [orderId, item.product_id, item.quantity, item.price], (err) => {
          if (err) {
            console.error('Error inserting order item:', err);
          }

          // Update product stock
          const updateStockQuery = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?';
          db.query(updateStockQuery, [item.quantity, item.product_id], (err) => {
            if (err) {
              console.error('Error updating stock:', err);
            }

            completed++;
            if (completed === totalItems) {
              // Clear cart
              const clearCartQuery = 'DELETE FROM cart WHERE user_id = ?';
              db.query(clearCartQuery, [req.session.userId], () => {
                res.status(201).json({ 
                  message: 'Order created successfully', 
                  orderId: orderId,
                  total: total
                });
              });
            }
          });
        });
      });
    });
  });
});

// Update Order Status (Admin Only)
app.put('/api/orders/:id/status', isAdmin, (req, res) => {
  const { status } = req.body;

  if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const query = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(query, [status, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error updating order', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated successfully' });
  });
});

// ==================== STATISTICS (Admin) ====================

app.get('/api/admin/stats', isAdmin, (req, res) => {
  const queries = {
    totalUsers: 'SELECT COUNT(*) as count FROM users',
    totalProducts: 'SELECT COUNT(*) as count FROM products',
    totalOrders: 'SELECT COUNT(*) as count FROM orders',
    totalRevenue: 'SELECT SUM(total_amount) as revenue FROM orders WHERE status != "cancelled"',
    lowStock: 'SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10'
  };

  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, results) => {
      if (!err) {
        stats[key] = results[0].count || results[0].revenue || 0;
      }
      completed++;
      if (completed === total) {
        res.json(stats);
      }
    });
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
