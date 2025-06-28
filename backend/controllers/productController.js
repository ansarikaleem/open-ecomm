const pool = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    const [products] = await pool.query(query);
    
    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (product.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        product: product[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, image_url } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock_quantity, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock_quantity, category_id, image_url]
    );
    
    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, image_url } = req.body;
    
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ?, image_url = ? WHERE id = ?',
      [name, description, price, stock_quantity, category_id, image_url, req.params.id]
    );
    
    const [updatedProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    
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