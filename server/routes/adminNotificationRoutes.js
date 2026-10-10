/* =========================================================
   BOTOLA D2 — adminNotificationRoutes.js
   ========================================================= */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminNotificationController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/', authenticate, requireAdmin, ctrl.list);
router.get('/counts', authenticate, requireAdmin, ctrl.counts);
router.get('/recent', authenticate, requireAdmin, ctrl.recent);
router.put('/read-all', authenticate, requireAdmin, ctrl.markAllRead);
router.put('/mark-seen', authenticate, requireAdmin, ctrl.markSeen);
router.put('/:id/read', authenticate, requireAdmin, ctrl.markRead);
router.delete('/clear-all', authenticate, requireAdmin, ctrl.clearAll);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;