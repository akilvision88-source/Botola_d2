/* =========================================================
   BOTOLA D2 — contactController.js (v2)
   Contact messages + admin notification
   ========================================================= */

const { ContactMessage } = require('../models');
const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt, isEmail } = require('../utils/validators');
const { notifyNewMessage } = require('../services/adminNotifier');

/* =========================================================
   PUBLIC — Create message
   ========================================================= */
const create = async (req, res, next) => {
  try {
    const name = cleanString(req.body.name, 120);
    const email = cleanString(req.body.email, 150)?.toLowerCase();
    const subject = cleanString(req.body.subject, 200);
    const message = cleanString(req.body.message, 5000);

    if (!name || !email || !subject || !message) {
      return error(res, 'All fields are required', 400);
    }
    if (!isEmail(email)) return error(res, 'Invalid email', 400);

    const item = await ContactMessage.create({
      name, email,
      phone: cleanString(req.body.phone, 30),
      subject, message,
      ip_address: req.ip
    });

    // ✅ Notify admin
    notifyNewMessage(item).catch(() => {});

    return success(res, { id: item.id }, 'Message received', 201);
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — List
   ========================================================= */
const listAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const { count, rows } = await ContactMessage.findAndCountAll({
      where, order: [['created_at','DESC']], limit, offset
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Update status
   ========================================================= */
const updateStatus = async (req, res, next) => {
  try {
    const item = await ContactMessage.findByPk(req.params.id);
    if (!item) return error(res, 'Not found', 404);
    const status = req.body.status;
    if (!['new','read','replied','archived'].includes(status)) {
      return error(res, 'Invalid status', 400);
    }
    await item.update({ status });
    return success(res, item, 'Updated');
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Delete
   ========================================================= */
const remove = async (req, res, next) => {
  try {
    const item = await ContactMessage.findByPk(req.params.id);
    if (!item) return error(res, 'Not found', 404);
    await item.destroy();
    return success(res, null, 'Deleted');
  } catch (err) { next(err); }
};

module.exports = { create, listAdmin, updateStatus, remove };