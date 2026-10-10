const { error } = require('../utils/response');
const { Role, Permission, RolePermission } = require('../models');

const requirePermission = (...permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return error(res, 'Authentication required', 401);

      const role = req.user.role;
      if (!role) return error(res, 'Role not found', 403);

      if (role.slug === 'super_admin') return next();

      const permissions = await Permission.findAll({
        include: [{
          model: Role,
          as: 'roles',
          where: { id: role.id },
          through: { attributes: [] },
          required: true
        }]
      });

      const userPerms = permissions.map(p => p.name);
      const hasAll = permissionNames.every(p => userPerms.includes(p));

      if (!hasAll) {
        return error(res, 'Permission denied', 403);
      }

      next();
    } catch (err) {
      return error(res, 'Permission check failed', 500);
    }
  };
};

module.exports = { requirePermission };