const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('department').trim().notEmpty().withMessage('Department is required.'),
  body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be a number between 1 and 12.'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email/username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const forgotPasswordRules = [body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail()];

const resetPasswordRules = [
  body('token').trim().notEmpty().withMessage('Reset token is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const updateProfileRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('department').trim().notEmpty().withMessage('Department is required.'),
  body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be a number between 1 and 12.'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.'),
];

router.post('/register', authLimiter, registerRules, validate, authController.register);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, validate, authController.resetPassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, updateProfileRules, validate, authController.updateProfile);
router.put('/change-password', authenticate, changePasswordRules, validate, authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;
