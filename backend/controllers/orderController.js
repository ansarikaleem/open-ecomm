const pool = require('../config/db');

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod } = req.body;
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    
    // Get cart items
    const [cartItems] = await pool.query(`
      SELECT ci.product_id, ci.quantity, p.price 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.session_id = ?
    `, [sessionId]);
    
    if (cartItems.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No items in cart'
      });
    }
    
    // Calculate total
    const totalAmount = cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    // Create order
    const [orderResult] = await pool.query(
      'INSERT INTO orders (user_id, session_id, total_amount, shipping_address, billing_address) VALUES (?, ?, ?, ?, ?)',
      [userId || null, sessionId, totalAmount, shippingAddress, billingAddress]
    );
    
    const orderId = orderResult.insertId;
    
    // Add order items
    for (const item of cartItems) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      
      // Update product stock
      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);
    
    // Get created order
    const [order] = await pool.query(`
      SELECT o.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);
    
    res.status(201).json({
      status: 'success',
      data: {
        order: order[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    const orderId = req.params.id;
    
    const [order] = await pool.query(`
      SELECT o.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = ? AND (o.user_id = ? OR o.session_id = ?)
      GROUP BY o.id
    `, [orderId, userId, sessionId]);
    
    if (order.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No order found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        order: order[0]
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};