const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/newsController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.get('/public', ctrl.getPublic);
router.get('/', authenticate, requireAdmin, ctrl.listAdmin);
router.post('/', authenticate, requireAdmin, ctrl.create);
router.put('/:id', authenticate, requireAdmin, ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;