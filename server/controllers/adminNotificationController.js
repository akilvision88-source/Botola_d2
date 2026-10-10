/* =========================================================
   BOTOLA D2 — adminNotificationController.js
   Admin notifications API
   ========================================================= */

const { AdminNotification, User } = require('../models');
const { success, error, paginated } = require('../utils/response');
const { toInt } = require('../utils/validators');
const { Op } = require('sequelize');

/* =========================================================
   GET /api/admin-notifications
   List all notifications (paginated)
   ========================================================= */
const list = async (req, res, next) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.type) where.type = req.query.type;
    if (req.query.is_read !== undefined) {
      where.is_read = req.query.is_read === 'true';
    }
    if (req.query.priority) where.priority = req.query.priority;

    const { count, rows } = await AdminNotification.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'avatar'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

/* =========================================================
   GET /api/admin-notifications/counts
   Get unread & unseen counts (for badge)
   ========================================================= */
const counts = async (req, res, next) => {
  try {
    const unread = await AdminNotification.count({ where: { is_read: false } });
    const unseen = await AdminNotification.count({ where: { is_seen: false } });

    return success(res, { unread, unseen });
  } catch (err) { next(err); }
};

/* =========================================================
   GET /api/admin-notifications/recent
   Get last 10 notifications (for dropdown)
   ========================================================= */
const recent = async (req, res, next) => {
  try {
    const rows = await AdminNotification.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });

    return success(res, rows);
  } catch (err) { next(err); }
};

/* =========================================================
   PUT /api/admin-notifications/:id/read
   Mark single as read
   ========================================================= */
const markRead = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    const notif = await AdminNotification.findByPk(id);
    if (!notif) return error(res, 'Notification introuvable', 404);

    await notif.update({ is_read: true, is_seen: true });

    return success(res, notif, 'Marquée comme lue');
  } catch (err) { next(err); }
};

/* =========================================================
   PUT /api/admin-notifications/read-all
   Mark all as read
   ========================================================= */
const markAllRead = async (req, res, next) => {
  try {
    await AdminNotification.update(
      { is_read: true, is_seen: true },
      { where: { is_read: false } }
    );

    return success(res, null, 'Toutes marquées comme lues');
  } catch (err) { next(err); }
};

/* =========================================================
   PUT /api/admin-notifications/mark-seen
   Mark all as seen (removes badge without marking read)
   ========================================================= */
const markSeen = async (req, res, next) => {
  try {
    await AdminNotification.update(
      { is_seen: true },
      { where: { is_seen: false } }
    );

    return success(res, null, 'Marquées comme vues');
  } catch (err) { next(err); }
};

/* =========================================================
   DELETE /api/admin-notifications/:id
   Delete a notification
   ========================================================= */
const remove = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    const notif = await AdminNotification.findByPk(id);
    if (!notif) return error(res, 'Notification introuvable', 404);

    await notif.destroy();
    return success(res, null, 'Supprimée');
  } catch (err) { next(err); }
};

/* =========================================================
   DELETE /api/admin-notifications/clear-all
   Clear all notifications
   ========================================================= */
const clearAll = async (req, res, next) => {
  try {
    await AdminNotification.destroy({ where: {} });
    return success(res, null, 'Toutes supprimées');
  } catch (err) { next(err); }
};

module.exports = {
  list,
  counts,
  recent,
  markRead,
  markAllRead,
  markSeen,
  remove,
  clearAll
};