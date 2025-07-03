-- Database: open_ecomm
CREATE DATABASE IF NOT EXISTS open_ecomm;
USE open_ecomm;


CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id INT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  session_id VARCHAR(255),
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  shipping_address TEXT,
  billing_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255),
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id));



-- seed.sql
-- This file contains sample data for the Open E-Commerce application

-- Clear existing data (optional, be careful with this in production)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Latest gadgets and electronic devices'),
('Clothing', 'Fashionable apparel for all occasions'),
('Home & Kitchen', 'Everything for your home and kitchen'),
('Books', 'Books for all ages and interests'),
('Sports', 'Sports equipment and accessories');

-- Insert sample products
INSERT INTO products (name, description, price, stock_quantity, category_id, image_url) VALUES
('Smartphone X', 'Latest smartphone with advanced camera features', 799.99, 100, 1, 'https://example.com/images/phone.jpg'),
('Wireless Headphones', 'Noise-cancelling wireless headphones with 30hr battery', 199.99, 50, 1, 'https://example.com/images/headphones.jpg'),
('Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 24.99, 200, 2, 'https://example.com/images/tshirt.jpg'),
('Chef Knife Set', 'Professional 6-piece knife set for your kitchen', 89.99, 30, 3, 'https://example.com/images/knives.jpg'),
('Programming Book', 'Learn JavaScript in 30 days', 39.99, 75, 4, 'https://example.com/images/book.jpg'),
('Yoga Mat', 'Non-slip premium yoga mat', 29.99, 60, 5, 'https://example.com/images/yogamat.jpg'),
('Smart Watch', 'Track your fitness with this advanced smartwatch', 249.99, 40, 1, 'https://example.com/images/watch.jpg'),
('Denim Jeans', 'Classic fit denim jeans', 59.99, 120, 2, 'https://example.com/images/jeans.jpg'),
('Air Fryer', 'Digital air fryer with multiple cooking functions', 129.99, 25, 3, 'https://example.com/images/airfryer.jpg'),
('Mystery Novel', 'Bestselling mystery novel by famous author', 14.99, 90, 4, 'https://example.com/images/novel.jpg');

-- Insert sample users
-- Note: Passwords are hashed versions of 'password123'
INSERT INTO users (username, email, password, role) VALUES
('admin_user', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq5Y6FQH7Z7fRYs4V2Z3J5Wfzj4DmO', 'admin'),
('john_doe', 'john@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq5Y6FQH7Z7fRYs4V2Z3J5Wfzj4DmO', 'customer'),
('jane_smith', 'jane@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq5Y6FQH7Z7fRYs4V2Z3J5Wfzj4DmO', 'customer');

-- Insert sample orders
INSERT INTO orders (user_id, session_id, total_amount, status, shipping_address, billing_address) VALUES
(2, 'session_abc123', 839.98, 'delivered', '123 Main St, Anytown, USA', '123 Main St, Anytown, USA'),
(3, 'session_def456', 149.98, 'processing', '456 Oak Ave, Somewhere, USA', '456 Oak Ave, Somewhere, USA'),
(NULL, 'session_ghi789', 89.99, 'pending', '789 Pine Rd, Nowhere, USA', '789 Pine Rd, Nowhere, USA');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 799.99),
(1, 3, 2, 24.99),
(2, 6, 1, 29.99),
(2, 10, 2, 14.99),
(3, 4, 1, 89.99);

-- Insert sample cart items (for guest users)
INSERT INTO cart_items (session_id, product_id, quantity, price) VALUES
('session_new123', 2, 1, 199.99),
('session_new123', 5, 1, 39.99),
('session_new456', 7, 1, 249.99);


UPDATE users SET role = 'admin' WHERE id = 1;