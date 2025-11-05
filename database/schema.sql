-- Grocery Management System Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS grocery_db2;
USE grocery_db2;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_name (name)
);

-- Cart Table
CREATE TABLE IF NOT EXISTS cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Seed Data

-- Insert Admin User (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@grocery.com', '$2b$10$YrQ7ZqvVvJnN2WzJVqKmOeYx5N.8DqLvR3ZGqJQRJXqVLKGx5JQGS', 'admin');

-- Insert Sample Customer (password: customer123)
INSERT INTO users (username, email, password, role) VALUES
('john_doe', 'john@example.com', '$2b$10$YrQ7ZqvVvJnN2WzJVqKmOeYx5N.8DqLvR3ZGqJQRJXqVLKGx5JQGS', 'customer');

-- Insert Sample Products

-- Vegetables
INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES
('Fresh Tomatoes', 'Ripe and juicy tomatoes', 'Vegetables', 2.99, 100, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337'),
('Organic Carrots', 'Fresh organic carrots', 'Vegetables', 1.99, 150, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37'),
('Green Bell Peppers', 'Crisp green bell peppers', 'Vegetables', 3.49, 80, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83'),
('Fresh Lettuce', 'Crispy green lettuce', 'Vegetables', 2.49, 120, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1'),
('Red Onions', 'Sweet red onions', 'Vegetables', 1.79, 200, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb');

-- Fruits
INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES
('Red Apples', 'Sweet and crunchy red apples', 'Fruits', 3.99, 150, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6'),
('Fresh Bananas', 'Ripe yellow bananas', 'Fruits', 1.49, 200, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224'),
('Oranges', 'Juicy Valencia oranges', 'Fruits', 4.49, 100, 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b'),
('Strawberries', 'Fresh sweet strawberries', 'Fruits', 5.99, 50, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6'),
('Green Grapes', 'Seedless green grapes', 'Fruits', 4.99, 75, 'https://images.unsplash.com/photo-1599819177123-3c1a7d06f1c7');

-- Dairy
INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES
('Whole Milk', 'Fresh whole milk - 1 gallon', 'Dairy', 3.99, 80, 'https://images.unsplash.com/photo-1550583724-b2692b85b150'),
('Cheddar Cheese', 'Sharp cheddar cheese block', 'Dairy', 5.99, 60, 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c'),
('Greek Yogurt', 'Plain Greek yogurt', 'Dairy', 4.49, 100, 'https://images.unsplash.com/photo-1488477304112-4944851de03d'),
('Butter', 'Salted butter - 1 lb', 'Dairy', 4.29, 90, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d'),
('Fresh Eggs', 'Farm fresh eggs - dozen', 'Dairy', 3.49, 120, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f');

-- Bakery
INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES
('Whole Wheat Bread', 'Fresh baked whole wheat bread', 'Bakery', 2.99, 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff'),
('Croissants', 'Butter croissants - 6 pack', 'Bakery', 5.49, 40, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a'),
('Bagels', 'Plain bagels - 6 pack', 'Bakery', 3.99, 60, 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae'),
('Chocolate Donuts', 'Glazed chocolate donuts - 6 pack', 'Bakery', 4.99, 35, 'https://images.unsplash.com/photo-1551024506-0bccd828d307'),
('Baguette', 'French baguette', 'Bakery', 2.49, 45, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73');

-- Beverages
INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES
('Orange Juice', 'Fresh squeezed orange juice - 1L', 'Beverages', 4.99, 70, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba'),
('Mineral Water', 'Sparkling mineral water - 6 pack', 'Beverages', 5.99, 100, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d'),
('Green Tea', 'Organic green tea bags - 20 count', 'Beverages', 3.99, 80, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9'),
('Coffee Beans', 'Premium arabica coffee beans - 1 lb', 'Beverages', 12.99, 50, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e'),
('Apple Cider', 'Fresh apple cider - 1L', 'Beverages', 5.49, 45, 'https://images.unsplash.com/photo-1570544820779-c2c6a65c0432');

-- Snacks
INSERT INTO products (name, description, category, price, stock_quantity, image_url) VALUES
('Potato Chips', 'Classic salted potato chips', 'Snacks', 2.99, 100, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b'),
('Mixed Nuts', 'Roasted mixed nuts - 12 oz', 'Snacks', 7.99, 60, 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32'),
('Chocolate Bar', 'Dark chocolate bar', 'Snacks', 2.49, 150, 'https://images.unsplash.com/photo-1511381939415-e44015466834'),
('Pretzels', 'Salted pretzels', 'Snacks', 3.49, 80, 'https://images.unsplash.com/photo-1599599810694-3f25d3eb1a48'),
('Granola Bars', 'Oats and honey granola bars - 6 pack', 'Snacks', 4.99, 90, 'https://images.unsplash.com/photo-1625869016774-3e9ace6e8a07');

-- Sample Order for demonstration
INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) VALUES
(2, 15.97, 'delivered', '123 Main St, Anytown, USA 12345', 'credit_card');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 2, 2.99),
(1, 6, 2, 3.99),
(1, 11, 1, 3.99);

-- Create Views for reporting

-- Products Low Stock View
CREATE OR REPLACE VIEW low_stock_products AS
SELECT id, name, category, stock_quantity, price
FROM products
WHERE stock_quantity < 10
ORDER BY stock_quantity ASC;

-- Order Summary View
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.id as order_id,
    u.username,
    u.email,
    o.total_amount,
    o.status,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.username, u.email, o.total_amount, o.status, o.created_at
ORDER BY o.created_at DESC;

-- Revenue by Category View
CREATE OR REPLACE VIEW revenue_by_category AS
SELECT 
    p.category,
    SUM(oi.quantity * oi.price) as total_revenue,
    SUM(oi.quantity) as total_items_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY p.category
ORDER BY total_revenue DESC;

-- User Purchase History View
CREATE OR REPLACE VIEW user_purchase_history AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.role = 'customer'
GROUP BY u.id, u.username, u.email
ORDER BY total_spent DESC;

-- Show database info
SHOW TABLES;
SELECT 'Database setup completed successfully!' as Status;
