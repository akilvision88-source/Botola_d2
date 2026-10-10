const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/standingController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');

/* Public */
router.get('/', ctrl.getStandings);

/* Admin */
router.get('/admin', authenticate, requireAdmin, ctrl.getAdminStandings);
router.put('/adjustments/:teamId',
  authenticate,
  requireAdmin,
  requirePermission('standings.manage'),
  ctrl.upsertAdjustment
);
router.delete('/adjustments/:teamId',
  authenticate,
  requireAdmin,
  requirePermission('standings.manage'),
  ctrl.clearAdjustment
);

module.exports = router;