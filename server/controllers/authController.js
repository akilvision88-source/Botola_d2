/* =========================================================
   BOTOLA D2 — authController.js (v2)
   Auth + admin notification on new user
   ========================================================= */

const { success, error } = require('../utils/response');
const { registerUser, loginUser } = require('../services/authService');
const { User, Role, SubscriptionPlan } = require('../models');
const { cleanString, isEmail, isStrongPassword } = require('../utils/validators');
const { notifyNewUser } = require('../services/adminNotifier');

/* ═══════════════════════════════════════════════════════
   REGISTER
   ═══════════════════════════════════════════════════════ */
const register = async (req, res, next) => {
  try {
    const full_name = cleanString(req.body.full_name, 120);
    const email = cleanString(req.body.email, 150)?.toLowerCase();
    const phone = cleanString(req.body.phone, 30);
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm_password || '');

    if (!full_name || !email || !password) {
      return error(res, 'Missing required fields', 400);
    }
    if (!isEmail(email)) return error(res, 'Invalid email', 400);
    if (!isStrongPassword(password)) {
      return error(res, 'Password must be at least 8 chars with letters and numbers', 400);
    }
    if (password !== confirm) return error(res, 'Passwords do not match', 400);

    const user = await registerUser({ full_name, email, phone, password });

    // ✅ Send admin notification
    try {
      const fullUser = await User.findByPk(user.id, {
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });
      notifyNewUser(fullUser).catch(() => {});
    } catch (_) {}

    return success(res, { id: user.id, email: user.email }, 'Account created', 201);
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════════ */
const login = async (req, res, next) => {
  try {
    const email = cleanString(req.body.email, 150)?.toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return error(res, 'Email and password required', 400);

    const result = await loginUser({ email, password });
    return success(res, result, 'Login successful');
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   ME
   ═══════════════════════════════════════════════════════ */
const me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: SubscriptionPlan, as: 'plan' }
      ]
    });
    return success(res, user, 'OK');
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   LOGOUT
   ═══════════════════════════════════════════════════════ */
const logout = async (req, res) => {
  return success(res, null, 'Logged out');
};

module.exports = { register, login, me, logout };