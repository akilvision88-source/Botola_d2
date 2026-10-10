const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const { User, Role, SubscriptionPlan } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return error(res, 'Authentication required', 401);
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, as: 'role' },
        { model: SubscriptionPlan, as: 'plan' }
      ]
    });

    if (!user || user.status !== 'active') {
      return error(res, 'Account not active', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, as: 'role' },
        { model: SubscriptionPlan, as: 'plan' }
      ]
    });
    if (user && user.status === 'active') req.user = user;
    next();
  } catch (err) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };