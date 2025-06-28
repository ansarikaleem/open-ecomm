const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, cartController.getCart)
  .post(protect, cartController.addToCart);

// router.route('/:id')
//   .patch(protect, cartController.updateCartItem)
//   .delete(protect, cartController.removeCartItem);

module.exports = router;