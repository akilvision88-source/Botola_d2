/* =========================================================
   BOTOLA D2 — matchRoutes.js
   Matches routes with multipart/form-data support.
   ========================================================= */

const express = require('express');
const router = express.Router();

const matchController = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { requirePermission } = require('../middleware/permission');
const upload = require('../middleware/upload');

/* =========================================================
   UPLOAD FIELDS
   Allows multiple file fields on the same request.
   ========================================================= */
const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'card_background_file', maxCount: 1 }
]);

/* =========================================================
   PUBLIC routes (no auth)
   ========================================================= */
router.get('/live', matchController.getLive);
router.get('/upcoming', matchController.getUpcoming);
router.get('/results', matchController.getResults);
router.get('/search', matchController.search);

/* =========================================================
   ADMIN list
   ========================================================= */
router.get('/admin/list',
  authenticate,
  requireAdmin,
  matchController.listAdmin
);

/* =========================================================
   GOALS / CARDS / STATS
   ========================================================= */
router.post('/:id/goals',
  authenticate,
  requireAdmin,
  requirePermission('matches.edit'),
  matchController.addGoal
);

router.delete('/:id/goals/:goalId',
  authenticate,
  requireAdmin,
  requirePermission('matches.edit'),
  matchController.deleteGoal
);

router.post('/:id/cards',
  authenticate,
  requireAdmin,
  requirePermission('matches.edit'),
  matchController.addCard
);

router.delete('/:id/cards/:cardId',
  authenticate,
  requireAdmin,
  requirePermission('matches.edit'),
  matchController.deleteCard
);

router.put('/:id/statistics',
  authenticate,
  requireAdmin,
  requirePermission('matches.edit'),
  matchController.upsertStatistics
);

/* =========================================================
   CRUD — with multipart/form-data (file uploads)
   ========================================================= */
router.post('/',
  authenticate,
  requireAdmin,
  requirePermission('matches.create'),
  uploadFields,
  matchController.create
);

router.put('/:id',
  authenticate,
  requireAdmin,
  requirePermission('matches.edit'),
  uploadFields,
  matchController.update
);

router.delete('/:id',
  authenticate,
  requireAdmin,
  requirePermission('matches.delete'),
  matchController.remove
);

/* =========================================================
   Get by id — MUST be the LAST route
   ========================================================= */
router.get('/:id', matchController.getById);

module.exports = router;