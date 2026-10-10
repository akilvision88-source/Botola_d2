const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');

router.get('/public', ctrl.getPublic);
router.get('/', authenticate, requireAdmin, ctrl.getAll);
router.put('/', authenticate, requireAdmin, requirePermission('settings.manage'), ctrl.updateMany);

module.exports = router;