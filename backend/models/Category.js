const pool = require('../config/db');

class Category {
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM categories');
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  }

  static async create({ name, description }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    return this.getById(result.insertId);
  }

  static async update(id, { name, description }) {
    await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Category;