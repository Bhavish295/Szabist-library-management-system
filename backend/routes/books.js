const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const bookController = require('../controllers/bookController');
const upload = require('../middleware/upload');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const validate = require('../middleware/validate');

const bookRules = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('author').trim().notEmpty().withMessage('Author is required.'),
  body('category_id').isInt({ min: 1 }).withMessage('A valid category is required.'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
  body('isbn').optional({ checkFalsy: true }).trim(),
];

const idParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid id.')];

router.get('/categories', bookController.getCategories);
router.get('/search', bookController.searchBooks);
router.get('/:id/download', authenticate, requireStudent, idParamRule, validate, bookController.downloadEbook);
router.get('/:id', idParamRule, validate, bookController.getBookById);

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  bookRules,
  validate,
  bookController.addBook
);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
  ]),
  idParamRule,
  validate,
  bookController.updateBook
);
router.delete('/:id', authenticate, requireAdmin, idParamRule, validate, bookController.deleteBook);

module.exports = router;
