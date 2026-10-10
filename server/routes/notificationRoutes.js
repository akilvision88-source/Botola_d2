const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');

router.get('/', authenticate, ctrl.listMine);
router.get('/unread-count', authenticate, ctrl.unreadCount);
router.put('/read-all', authenticate, ctrl.markAllRead);
router.put('/:id/read', authenticate, ctrl.markRead);
router.post('/match/:id/notify', authenticate, ctrl.notifyMatch);
router.post('/broadcast', authenticate, requireAdmin, requirePermission('notifications.send'), ctrl.broadcast);

module.exports = router;