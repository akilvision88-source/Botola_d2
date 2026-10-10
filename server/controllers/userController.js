/* =========================================================
   BOTOLA D2 — userController.js
   User self-service + Admin user management.
   ========================================================= */

const { User, Role, SubscriptionPlan, Subscription } = require('../models');
const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt, isEmail, isStrongPassword } = require('../utils/validators');
const { hashPassword, comparePassword } = require('../utils/password');

/* =========================================================
   SELF (Authenticated user)
   ========================================================= */

/**
 * GET /api/users/me
 * Returns the current user with role + plan.
 */
const myAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'slug'] },
        { model: SubscriptionPlan, as: 'plan' }
      ]
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) { next(err); }
};

/**
 * PUT /api/users/me
 * Update own profile (name, phone, language, avatar).
 */
const updateMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return error(res, 'User not found', 404);

    const patch = {};

    if (req.body.full_name !== undefined) {
      const name = cleanString(req.body.full_name, 120);
      if (!name || name.length < 2) return error(res, 'Invalid full name', 400);
      patch.full_name = name;
    }

    if (req.body.phone !== undefined) {
      patch.phone = cleanString(req.body.phone, 30) || null;
    }

    if (req.body.language !== undefined) {
      if (!['fr', 'en', 'ar'].includes(req.body.language)) {
        return error(res, 'Invalid language', 400);
      }
      patch.language = req.body.language;
    }

    if (req.file) {
      patch.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.update(patch);

    const fresh = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'slug'] },
        { model: SubscriptionPlan, as: 'plan' }
      ]
    });

    return success(res, fresh, 'Profile updated');
  } catch (err) { next(err); }
};

/**
 * PUT /api/users/me/password
 * Change own password (requires current password).
 */
const changePassword = async (req, res, next) => {
  try {
    const current_password = String(req.body.current_password || '');
    const new_password = String(req.body.new_password || '');
    const confirm = String(req.body.confirm_password || '');

    if (!current_password || !new_password) {
      return error(res, 'Current and new passwords are required', 400);
    }
    if (!isStrongPassword(new_password)) {
      return error(res, 'New password must be at least 8 chars with letters and numbers', 400);
    }
    if (confirm && confirm !== new_password) {
      return error(res, 'Passwords do not match', 400);
    }

    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user) return error(res, 'User not found', 404);

    const ok = await comparePassword(current_password, user.password);
    if (!ok) return error(res, 'Current password is incorrect', 401);

    const hashed = await hashPassword(new_password);
    await user.update({ password: hashed });

    return success(res, null, 'Password updated');
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — List / Get
   ========================================================= */

/**
 * GET /api/users?page=1&limit=20&status=&role_id=
 * Admin list with pagination.
 */
const listAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.role_id) where.role_id = toInt(req.query.role_id);
    if (req.query.subscription_status) {
      where.subscription_status = req.query.subscription_status;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'slug'] },
        { model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name', 'slug', 'price'] }
      ],
      order: [['id', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

/**
 * GET /api/users/:id
 * Admin: full user detail.
 */
const getByIdAdmin = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return error(res, 'Invalid user id', 400);

    const user = await User.findByPk(id, {
      include: [
        { model: Role, as: 'role' },
        { model: SubscriptionPlan, as: 'plan' }
      ]
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Create / Update / Delete
   ========================================================= */

/**
 * POST /api/users
 * Admin: create a new user (with optional subscription).
 */
const createUserAdmin = async (req, res, next) => {
  try {
    const full_name = cleanString(req.body.full_name, 120);
    const email = cleanString(req.body.email, 150)?.toLowerCase();
    const phone = cleanString(req.body.phone, 30) || null;
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm_password || '');
    const role_id = toInt(req.body.role_id) || null;
    const plan_id = toInt(req.body.subscription_plan_id) || null;
    const status = ['active', 'suspended', 'inactive'].includes(req.body.status)
      ? req.body.status : 'active';
    const subscription_status = ['active', 'pending', 'expired', 'cancelled'].includes(req.body.subscription_status)
      ? req.body.subscription_status : 'active';
    const language = ['fr', 'en', 'ar'].includes(req.body.language) ? req.body.language : 'fr';

    if (!full_name || !email || !password) {
      return error(res, 'Missing required fields', 400);
    }
    if (!isEmail(email)) return error(res, 'Invalid email', 400);
    if (!isStrongPassword(password)) {
      return error(res, 'Password must be at least 8 chars with letters and numbers', 400);
    }
    if (password !== confirm) {
      return error(res, 'Passwords do not match', 400);
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return error(res, 'Email already registered', 409);

    let role = null;
    if (role_id) role = await Role.findByPk(role_id);
    if (!role) role = await Role.findOne({ where: { slug: 'user' } });
    if (!role) return error(res, 'Default role not found', 500);

    let plan = null;
    if (plan_id) plan = await SubscriptionPlan.findByPk(plan_id);

    const hashed = await hashPassword(password);

    const now = new Date();
    let subStart = null;
    let subEnd = null;
    if (plan && plan.duration_days) {
      subStart = now;
      subEnd = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
    }

    const created = await User.create({
      full_name,
      email,
      phone,
      password: hashed,
      role_id: role.id,
      subscription_plan_id: plan ? plan.id : null,
      subscription_start: subStart,
      subscription_end: subEnd,
      subscription_status,
      status,
      language,
      email_verified: true
    });

    // Also create a Subscription record if plan is paid
    if (plan && Number(plan.price) > 0) {
      try {
        await Subscription.create({
          user_id: created.id,
          plan_id: plan.id,
          amount: plan.price,
          currency: plan.currency || 'MAD',
          payment_method: 'admin_manual',
          payment_reference: null,
          status: 'active',
          start_date: subStart,
          end_date: subEnd
        });
      } catch (_) { /* non-blocking */ }
    }

    const out = created.toJSON();
    delete out.password;

    return success(res, out, 'User created', 201);
  } catch (err) { next(err); }
};

/**
 * PUT /api/users/:id
 * Admin: update user fields (not password via this route).
 */
const updateByAdmin = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return error(res, 'Invalid user id', 400);

    const user = await User.findByPk(id);
    if (!user) return error(res, 'User not found', 404);

    const patch = {};

    if (req.body.full_name !== undefined) {
      const name = cleanString(req.body.full_name, 120);
      if (!name || name.length < 2) return error(res, 'Invalid full name', 400);
      patch.full_name = name;
    }

    if (req.body.phone !== undefined) {
      patch.phone = cleanString(req.body.phone, 30) || null;
    }

    if (req.body.email !== undefined && req.body.email !== user.email) {
      const email = cleanString(req.body.email, 150)?.toLowerCase();
      if (!isEmail(email)) return error(res, 'Invalid email', 400);
      const dup = await User.findOne({ where: { email } });
      if (dup && dup.id !== user.id) return error(res, 'Email already in use', 409);
      patch.email = email;
    }

    if (req.body.role_id !== undefined) {
      const role_id = toInt(req.body.role_id);
      if (role_id) {
        const role = await Role.findByPk(role_id);
        if (!role) return error(res, 'Role not found', 404);
        patch.role_id = role_id;
      }
    }

    if (req.body.subscription_plan_id !== undefined) {
      const plan_id = toInt(req.body.subscription_plan_id);
      if (plan_id) {
        const plan = await SubscriptionPlan.findByPk(plan_id);
        if (!plan) return error(res, 'Plan not found', 404);
        patch.subscription_plan_id = plan_id;

        // Refresh subscription dates based on plan duration
        if (plan.duration_days) {
          const now = new Date();
          patch.subscription_start = now;
          patch.subscription_end = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
        }
      } else {
        patch.subscription_plan_id = null;
        patch.subscription_start = null;
        patch.subscription_end = null;
      }
    }

    if (req.body.status !== undefined) {
      if (!['active', 'suspended', 'inactive'].includes(req.body.status)) {
        return error(res, 'Invalid status', 400);
      }
      patch.status = req.body.status;
    }

    if (req.body.subscription_status !== undefined) {
      if (!['active', 'pending', 'expired', 'cancelled'].includes(req.body.subscription_status)) {
        return error(res, 'Invalid subscription status', 400);
      }
      patch.subscription_status = req.body.subscription_status;
    }

    if (req.body.language !== undefined) {
      if (!['fr', 'en', 'ar'].includes(req.body.language)) {
        return error(res, 'Invalid language', 400);
      }
      patch.language = req.body.language;
    }

    // Optional password change from admin (no need for current password)
    if (req.body.password) {
      const pwd = String(req.body.password);
      const confirm = String(req.body.confirm_password || '');
      if (!isStrongPassword(pwd)) {
        return error(res, 'Password must be at least 8 chars with letters and numbers', 400);
      }
      if (confirm && confirm !== pwd) {
        return error(res, 'Passwords do not match', 400);
      }
      patch.password = await hashPassword(pwd);
    }

    await user.update(patch);

    const fresh = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: SubscriptionPlan, as: 'plan' }
      ]
    });

    return success(res, fresh, 'User updated');
  } catch (err) { next(err); }
};

/**
 * PUT /api/users/:id/role
 * Admin: change user role (dedicated endpoint).
 */
const changeRole = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    const role_id = toInt(req.body.role_id);

    if (!id || !role_id) return error(res, 'User id and role_id required', 400);

    const user = await User.findByPk(id);
    if (!user) return error(res, 'User not found', 404);

    const role = await Role.findByPk(role_id);
    if (!role) return error(res, 'Role not found', 404);

    // Prevent demoting the last Super Admin
    if (user.role_id === 1 && role_id !== 1) {
      const superAdminsCount = await User.count({ where: { role_id: 1 } });
      if (superAdminsCount <= 1) {
        return error(res, 'Cannot demote the last Super Admin', 400);
      }
    }

    await user.update({ role_id });

    const fresh = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    return success(res, fresh, 'Role updated');
  } catch (err) { next(err); }
};

/**
 * PUT /api/users/:id/suspend
 * Admin: suspend a user account.
 */
const suspend = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return error(res, 'Invalid user id', 400);

    const user = await User.findByPk(id);
    if (!user) return error(res, 'User not found', 404);

    // Prevent suspending yourself
    if (user.id === req.user.id) {
      return error(res, 'You cannot suspend your own account', 400);
    }

    // Prevent suspending a Super Admin
    if (user.role_id === 1) {
      return error(res, 'Cannot suspend a Super Admin', 400);
    }

    await user.update({ status: 'suspended' });
    return success(res, user, 'User suspended');
  } catch (err) { next(err); }
};

/**
 * DELETE /api/users/:id
 * Admin: delete a user (cascade-safe guards).
 */
const remove = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return error(res, 'Invalid user id', 400);

    const user = await User.findByPk(id);
    if (!user) return error(res, 'User not found', 404);

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return error(res, 'You cannot delete your own account', 400);
    }

    // Prevent deleting Super Admin
    if (user.role_id === 1) {
      return error(res, 'Cannot delete a Super Admin', 400);
    }

    await user.destroy();
    return success(res, null, 'User deleted');
  } catch (err) { next(err); }
};

/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  // Self
  myAccount,
  updateMe,
  changePassword,

  // Admin
  listAdmin,
  getByIdAdmin,
  createUserAdmin,
  updateByAdmin,
  changeRole,
  suspend,
  remove
};