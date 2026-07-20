const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/my', authenticate, requireStudent, fineController.getMyFines);
router.get('/stats', authenticate, requireAdmin, fineController.getFineStats);
router.get('/', authenticate, requireAdmin, fineController.getAllFines);
router.put('/:id/pay', authenticate, requireAdmin, fineController.markFinePaid);

module.exports = router;
