const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');

router.post('/', authenticate, requireStudent, reservationController.createReservation);
router.get('/my', authenticate, requireStudent, reservationController.getMyReservations);
router.get('/', authenticate, requireAdmin, reservationController.getAllReservations);
router.put('/:id/approve', authenticate, requireAdmin, reservationController.approveReservation);
router.put('/:id/reject', authenticate, requireAdmin, reservationController.rejectReservation);
router.post('/cancel-expired', authenticate, requireAdmin, reservationController.cancelExpired);

module.exports = router;
