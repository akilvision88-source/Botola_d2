const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');

router.post('/', ctrl.create);
router.get('/', authenticate, requireAdmin, ctrl.listAdmin);
router.put('/:id/status', authenticate, requireAdmin, requirePermission('messages.edit'), ctrl.updateStatus);
router.delete('/:id', authenticate, requireAdmin, requirePermission('messages.delete'), ctrl.remove);

module.exports = router;