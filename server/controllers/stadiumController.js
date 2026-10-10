const { Stadium } = require('../models');
const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');

const getAll = async (req, res, next) => {
  try {
    const items = await Stadium.findAll({ order: [['name','ASC']] });
    return success(res, items);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const name = cleanString(req.body.name, 150);
    const city = cleanString(req.body.city, 100);
    if (!name || !city) return error(res, 'Name and city required', 400);

    const stadium = await Stadium.create({
      name, city,
      capacity: toInt(req.body.capacity),
      address: cleanString(req.body.address, 255),
      image: req.file ? `/uploads/stadiums/${req.file.filename}` : cleanString(req.body.image, 255)
    });
    return success(res, stadium, 'Stadium created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const stadium = await Stadium.findByPk(req.params.id);
    if (!stadium) return error(res, 'Not found', 404);

    const patch = {};
    if (req.body.name !== undefined) patch.name = cleanString(req.body.name, 150);
    if (req.body.city !== undefined) patch.city = cleanString(req.body.city, 100);
    if (req.body.capacity !== undefined) patch.capacity = toInt(req.body.capacity);
    if (req.body.address !== undefined) patch.address = cleanString(req.body.address, 255);
    if (req.file) patch.image = `/uploads/stadiums/${req.file.filename}`;

    await stadium.update(patch);
    return success(res, stadium, 'Stadium updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const stadium = await Stadium.findByPk(req.params.id);
    if (!stadium) return error(res, 'Not found', 404);
    await stadium.destroy();
    return success(res, null, 'Stadium deleted');
  } catch (err) { next(err); }
};

const listPaginated = async (req, res, next) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const { count, rows } = await Stadium.findAndCountAll({
      order: [['id','DESC']], limit, offset
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove, listPaginated };