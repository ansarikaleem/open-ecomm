const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, orderController.createOrder);

router.route('/:id')
  .get(protect, orderController.getOrder);

module.exports = router;