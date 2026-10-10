/* =========================================================
   BOTOLA D2 — middleware/validate.js
   Lightweight validation wrapper (uses express-validator).
   ========================================================= */

const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

const validate = (chains) => {
  return async (req, res, next) => {
    await Promise.all(chains.map(c => c.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const formatted = errors.array().map(e => ({
      field: e.path || e.param,
      message: e.msg
    }));
    return error(res, 'Validation error', 400, formatted);
  };
};

module.exports = { validate };