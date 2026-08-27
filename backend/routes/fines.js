const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const fineController = require('../controllers/fineController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const validate = require('../middleware/validate');

const idParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

router.get('/my', authenticate, requireStudent, fineController.getMyFines);
router.get('/stats', authenticate, requireAdmin, fineController.getFineStats);
router.get('/', authenticate, requireAdmin, fineController.getAllFines);
router.put('/:id/pay', authenticate, requireAdmin, idParamRule, validate, fineController.markFinePaid);

module.exports = router;
