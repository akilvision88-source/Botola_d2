const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/homeSectionController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/public', ctrl.getPublic);
router.get('/', authenticate, requireAdmin, ctrl.listAdmin);
router.put('/:key', authenticate, requireAdmin, ctrl.update);

module.exports = router;