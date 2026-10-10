/* =========================================================
   BOTOLA D2 — routes/userRoutes.js
   User routes (Self + Admin management)
   ========================================================= */

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');
const upload = require('../middleware/upload');

/* ═══════════════════════════════════════════════════════
   SELF ROUTES (Authenticated user)
   ═══════════════════════════════════════════════════════ */

/**
 * GET /api/users/me
 * Get current user account
 */
router.get('/me', authenticate, ctrl.myAccount);

/**
 * PUT /api/users/me
 * Update current user profile (name, phone, language, avatar)
 */
router.put('/me', authenticate, upload.single('avatar'), ctrl.updateMe);

/**
 * PUT /api/users/me/password
 * Change current user password
 */
router.put('/me/password', authenticate, ctrl.changePassword);

/* ═══════════════════════════════════════════════════════
   ADMIN ROUTES
   ═══════════════════════════════════════════════════════ */

/**
 * GET /api/users
 * List all users (paginated) — Admin only
 */
router.get('/', authenticate, requireAdmin, ctrl.listAdmin);

/**
 * POST /api/users
 * Create a new user — Admin only
 */
router.post('/', authenticate, requireAdmin, requirePermission('users.create'), ctrl.createUserAdmin);

/**
 * GET /api/users/:id
 * Get user by ID — Admin only
 */
router.get('/:id', authenticate, requireAdmin, ctrl.getByIdAdmin);

/**
 * PUT /api/users/:id
 * Update user — Admin only
 */
router.put('/:id', authenticate, requireAdmin, requirePermission('users.edit'), ctrl.updateByAdmin);

/**
 * PUT /api/users/:id/role
 * Change user role — Admin only
 */
router.put('/:id/role', authenticate, requireAdmin, requirePermission('users.edit'), ctrl.changeRole);

/**
 * PUT /api/users/:id/suspend
 * Suspend user — Admin only
 */
router.put('/:id/suspend', authenticate, requireAdmin, requirePermission('users.edit'), ctrl.suspend);

/**
 * DELETE /api/users/:id
 * Delete user — Admin only
 */
router.delete('/:id', authenticate, requireAdmin, requirePermission('users.delete'), ctrl.remove);

module.exports = router;