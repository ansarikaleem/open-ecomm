const pool = require('../config/db');

exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    
    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const [category] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    
    if (category.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No category found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        category: category[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    
    const [newCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      status: 'success',
      data: {
        category: newCategory[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, req.params.id]
    );
    
    const [updatedCategory] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        category: updatedCategory[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};