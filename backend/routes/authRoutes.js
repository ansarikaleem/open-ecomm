const express = require('express');
const router = express.Router();
const cors = require('cors'); // Add this line
const authController = require('../controllers/authController');

router.options('/login', cors());
router.options('/signup', cors());

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;