const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');
const upload = require('../middleware/upload');

router.get('/', teamController.getAll);
router.get('/admin/list', authenticate, requireAdmin, teamController.listPaginated);
router.get('/:id', teamController.getById);
router.post('/', authenticate, requireAdmin, requirePermission('teams.create'),
  upload.single('logo'), teamController.create);
router.put('/:id', authenticate, requireAdmin, requirePermission('teams.edit'),
  upload.single('logo'), teamController.update);
router.delete('/:id', authenticate, requireAdmin, requirePermission('teams.delete'), teamController.remove);

module.exports = router;