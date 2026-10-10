const logger = require('../utils/logger');
const { error } = require('../utils/response');

const notFound = (req, res) => {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, err.stack);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return error(res, 'Validation error', 400, err.errors.map(e => ({
      field: e.path, message: e.message
    })));
  }

  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401);
  }

  if (err.message && err.message.includes('Only image files')) {
    return error(res, err.message, 400);
  }

  const status = err.status || 500;
  return error(res, err.message || 'Internal server error', status);
};

module.exports = { notFound, errorHandler };