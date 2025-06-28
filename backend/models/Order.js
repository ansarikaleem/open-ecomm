const pool = require('../config/db');

class Order {
  static async create({ userId, sessionId, totalAmount, shippingAddress, billingAddress }) {
    const [result] = await pool.query(
      'INSERT INTO orders (user_id, session_id, total_amount, shipping_address, billing_address) VALUES (?, ?, ?, ?, ?)',
      [userId, sessionId, totalAmount, shippingAddress, billingAddress]
    );
    return result.insertId;
  }

  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0];
  }

  static async getByUser(userId) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async getBySession(sessionId) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC', [sessionId]);
    return rows;
  }
}

module.exports = Order;