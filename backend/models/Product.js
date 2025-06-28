const pool = require('../config/db');

class Product {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    return rows[0];
  }

  static async create({ name, description, price, stock_quantity, category_id, image_url }) {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock_quantity, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock_quantity, category_id, image_url]
    );
    return this.getById(result.insertId);
  }

  static async update(id, { name, description, price, stock_quantity, category_id, image_url }) {
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ?, image_url = ? WHERE id = ?',
      [name, description, price, stock_quantity, category_id, image_url, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Product;