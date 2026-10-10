const { error } = require('../utils/response');

const requireRole = (...roleSlugs) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Authentication required', 401);
    const userRole = req.user.role?.slug;
    if (!userRole || !roleSlugs.includes(userRole)) {
      return error(res, 'Insufficient role permissions', 403);
    }
    next();
  };
};

const requireAdmin = requireRole('super_admin', 'admin');

module.exports = { requireRole, requireAdmin };