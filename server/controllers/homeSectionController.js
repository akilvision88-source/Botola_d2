const { HomeSection } = require('../models');
const { success, error } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');

const getPublic = async (req, res, next) => {
  try {
    const rows = await HomeSection.findAll({
      where: { is_visible: true },
      order: [['display_order', 'ASC']]
    });
    return success(res, rows);
  } catch (err) { next(err); }
};

const listAdmin = async (req, res, next) => {
  try {
    const rows = await HomeSection.findAll({
      order: [['display_order', 'ASC']]
    });
    return success(res, rows);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const key = String(req.params.key).toLowerCase();
    const section = await HomeSection.findOne({ where: { section_key: key } });
    if (!section) return error(res, 'Section not found', 404);

    const patch = {};
    if (req.body.title !== undefined)         patch.title = cleanString(req.body.title, 120);
    if (req.body.subtitle !== undefined)      patch.subtitle = cleanString(req.body.subtitle, 200);
    if (req.body.is_visible !== undefined)    patch.is_visible = !!req.body.is_visible;
    if (req.body.display_order !== undefined) patch.display_order = toInt(req.body.display_order, 0);
    if (req.body.items_limit !== undefined)   patch.items_limit = Math.min(20, Math.max(1, toInt(req.body.items_limit, 8)));
    if (req.body.view_all_url !== undefined)  patch.view_all_url = cleanString(req.body.view_all_url, 200);
    if (req.body.view_all_text !== undefined) patch.view_all_text = cleanString(req.body.view_all_text, 100);

    await section.update(patch);
    return success(res, section, 'Section updated');
  } catch (err) { next(err); }
};

module.exports = { getPublic, listAdmin, update };