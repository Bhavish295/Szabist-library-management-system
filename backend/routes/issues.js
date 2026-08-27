const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const validate = require('../middleware/validate');

const issueRules = [
  body('student_id').isInt({ min: 1 }).withMessage('A valid student is required.'),
  body('book_id').isInt({ min: 1 }).withMessage('A valid book is required.'),
];
const returnRules = [body('issue_id').isInt({ min: 1 }).withMessage('A valid issue record is required.')];
const idParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

router.get('/my', authenticate, requireStudent, issueController.getMyIssuedBooks);
router.get('/', authenticate, requireAdmin, issueController.getAllIssuedBooks);
router.post('/issue', authenticate, requireAdmin, issueRules, validate, issueController.issueBook);
router.post('/return', authenticate, requireAdmin, returnRules, validate, issueController.returnBook);
router.post('/:id/renew', authenticate, requireStudent, idParamRule, validate, issueController.renewBook);

module.exports = router;
