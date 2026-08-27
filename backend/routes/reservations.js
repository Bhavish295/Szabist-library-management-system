const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const validate = require('../middleware/validate');

const idParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];
const createRules = [body('book_id').isInt({ min: 1 }).withMessage('A valid book is required.')];

router.post('/', authenticate, requireStudent, createRules, validate, reservationController.createReservation);
router.get('/my', authenticate, requireStudent, reservationController.getMyReservations);
router.put('/:id/cancel', authenticate, requireStudent, idParamRule, validate, reservationController.cancelMyReservation);
router.get('/', authenticate, requireAdmin, reservationController.getAllReservations);
router.put('/:id/approve', authenticate, requireAdmin, idParamRule, validate, reservationController.approveReservation);
router.put('/:id/reject', authenticate, requireAdmin, idParamRule, validate, reservationController.rejectReservation);
router.post('/cancel-expired', authenticate, requireAdmin, reservationController.cancelExpired);

module.exports = router;
