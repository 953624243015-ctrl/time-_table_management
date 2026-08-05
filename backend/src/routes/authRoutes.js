const router = require('express').Router();
const { body } = require('express-validator');
const { login, getMe, changePassword, getDashboardStats } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], login);

router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], changePassword);

router.get('/dashboard', authenticate, getDashboardStats);

module.exports = router;
