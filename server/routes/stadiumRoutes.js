const express = require('express');
const router = express.Router();
const stadiumController = require('../controllers/stadiumController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');
const upload = require('../middleware/upload');

router.get('/', stadiumController.getAll);
router.get('/admin/list', authenticate, requireAdmin, stadiumController.listPaginated);
router.post('/', authenticate, requireAdmin, requirePermission('stadiums.create'),
  upload.single('image'), stadiumController.create);
router.put('/:id', authenticate, requireAdmin, requirePermission('stadiums.edit'),
  upload.single('image'), stadiumController.update);
router.delete('/:id', authenticate, requireAdmin, requirePermission('stadiums.delete'), stadiumController.remove);

module.exports = router;