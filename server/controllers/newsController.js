const { NewsTicker } = require('../models');
const { Op } = require('sequelize');
const { success, error } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');

const getPublic = async (req, res, next) => {
  try {
    const now = new Date();
    const rows = await NewsTicker.findAll({
      where: {
        is_active: true,
        [Op.and]: [
          { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
          { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: now } }] }
        ]
      },
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    return success(res, rows);
  } catch (err) { next(err); }
};

const listAdmin = async (req, res, next) => {
  try {
    const rows = await NewsTicker.findAll({
      order: [['display_order', 'ASC'], ['id', 'ASC']]
    });
    return success(res, rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const message = cleanString(req.body.message, 500);
    if (!message) return error(res, 'Message required', 400);

    const ticker = await NewsTicker.create({
      message,
      link_url: cleanString(req.body.link_url, 500) || null,
      link_text: cleanString(req.body.link_text, 100) || null,
      icon: cleanString(req.body.icon, 50) || 'fa-bullhorn',
      color: ['primary', 'success', 'warning', 'danger', 'info'].includes(req.body.color) ? req.body.color : 'primary',
      display_order: toInt(req.body.display_order, 0),
      is_active: req.body.is_active !== false,
      starts_at: req.body.starts_at || null,
      ends_at: req.body.ends_at || null
    });

    return success(res, ticker, 'Ticker created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const ticker = await NewsTicker.findByPk(req.params.id);
    if (!ticker) return error(res, 'Ticker not found', 404);

    const patch = {};
    if (req.body.message !== undefined) patch.message = cleanString(req.body.message, 500);
    if (req.body.link_url !== undefined) patch.link_url = cleanString(req.body.link_url, 500) || null;
    if (req.body.link_text !== undefined) patch.link_text = cleanString(req.body.link_text, 100) || null;
    if (req.body.icon !== undefined) patch.icon = cleanString(req.body.icon, 50);
    if (req.body.color !== undefined && ['primary', 'success', 'warning', 'danger', 'info'].includes(req.body.color)) {
      patch.color = req.body.color;
    }
    if (req.body.display_order !== undefined) patch.display_order = toInt(req.body.display_order, 0);
    if (req.body.is_active !== undefined) patch.is_active = !!req.body.is_active;
    if (req.body.starts_at !== undefined) patch.starts_at = req.body.starts_at || null;
    if (req.body.ends_at !== undefined) patch.ends_at = req.body.ends_at || null;

    await ticker.update(patch);
    return success(res, ticker, 'Ticker updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const ticker = await NewsTicker.findByPk(req.params.id);
    if (!ticker) return error(res, 'Ticker not found', 404);
    await ticker.destroy();
    return success(res, null, 'Ticker deleted');
  } catch (err) { next(err); }
};

module.exports = { getPublic, listAdmin, create, update, remove };