const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');

router.get('/plans', ctrl.listPlans);
router.get('/me', authenticate, ctrl.mySubscription);
router.post('/subscribe', authenticate, ctrl.subscribe);

router.get('/admin/plans', authenticate, requireAdmin, ctrl.listPlansAdmin);
router.post('/admin/plans', authenticate, requireAdmin, requirePermission('subscriptions.create'), ctrl.createPlan);
router.put('/admin/plans/:id', authenticate, requireAdmin, requirePermission('subscriptions.edit'), ctrl.updatePlan);
router.delete('/admin/plans/:id', authenticate, requireAdmin, requirePermission('subscriptions.delete'), ctrl.removePlan);
router.get('/admin/list', authenticate, requireAdmin, ctrl.listSubscriptionsAdmin);

module.exports = router;