/* =========================================================
   BOTOLA D2 — replayRoutes.js
   ========================================================= */
const express = require('express');
const router = express.Router();

const replayController = require('../controllers/replayController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');
const upload = require('../middleware/upload');

/* ✅ PUBLIC — optionalAuth لتحميل المستخدم إن وُجد */
router.get('/', optionalAuth, replayController.list);
router.get('/:id', optionalAuth, replayController.getById);
router.get('/:id/access', optionalAuth, replayController.access);  // ← optionalAuth بدل authenticate

/* ✅ ADMIN */
router.post('/', authenticate, requireAdmin, requirePermission('replay.create'),
  upload.single('thumbnail'), replayController.create);
router.put('/:id', authenticate, requireAdmin, requirePermission('replay.edit'),
  upload.single('thumbnail'), replayController.update);
router.delete('/:id', authenticate, requireAdmin, requirePermission('replay.delete'),
  replayController.remove);

module.exports = router;