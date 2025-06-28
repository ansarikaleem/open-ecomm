const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/auth');

router.route('/')
  .get(categoryController.getAllCategories)
  .post(protect, restrictTo('admin'), categoryController.createCategory);

router.route('/:id')
  .get(categoryController.getCategory)
  .patch(protect, restrictTo('admin'), categoryController.updateCategory)
  .delete(protect, restrictTo('admin'), categoryController.deleteCategory);

module.exports = router;