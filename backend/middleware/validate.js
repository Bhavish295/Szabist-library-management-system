const { validationResult } = require('express-validator');

// Runs after an array of express-validator checks; short-circuits with a
// 400 + field-level messages if any of them failed instead of letting bad
// data reach a controller.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
