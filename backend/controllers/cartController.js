const pool = require('../config/db');

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Session ID is required'
      });
    }
    
    // Check if product exists
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    if (product.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
      });
    }
    
    // Check if product is already in cart
    const [existingCartItem] = await pool.query(
      'SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?',
      [sessionId, productId]
    );
    
    if (existingCartItem.length > 0) {
      // Update quantity
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE session_id = ? AND product_id = ?',
        [quantity, sessionId, productId]
      );
    } else {
      // Add new item to cart
      await pool.query(
        'INSERT INTO cart_items (session_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [sessionId, productId, quantity, product[0].price]
      );
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Product added to cart'
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(200).json({
        status: 'success',
        data: {
          cart: []
        }
      });
    }
    
    const [cartItems] = await pool.query(`
      SELECT ci.*, p.name, p.image_url, p.description 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = ?
    `, [sessionId]);
    
    res.status(200).json({
      status: 'success',
      data: {
        cart: cartItems
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};