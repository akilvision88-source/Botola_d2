const { Setting } = require('../models');
const { success, error } = require('../utils/response');
const { cleanString } = require('../utils/validators');

const PUBLIC_KEYS = [
  'platform_name','platform_tagline','primary_color','secondary_color',
  'logo_url','favicon_url','contact_email','contact_phone',
  'facebook_url','instagram_url','youtube_url','tiktok_url','x_url',
  'about_text','footer_text','default_language'
];

const getPublic = async (req, res, next) => {
  try {
    const rows = await Setting.findAll({ where: { setting_key: PUBLIC_KEYS } });
    const out = {};
    rows.forEach(r => { out[r.setting_key] = r.setting_value; });
    return success(res, out);
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const rows = await Setting.findAll();
    const out = {};
    rows.forEach(r => { out[r.setting_key] = r.setting_value; });
    return success(res, out);
  } catch (err) { next(err); }
};

const updateMany = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const keys = Object.keys(payload);
    if (!keys.length) return error(res, 'Empty payload', 400);

    for (const key of keys) {
      const value = payload[key];
      const clean = value === null || value === undefined
        ? null
        : cleanString(value, 5000);
      const [row, created] = await Setting.findOrCreate({
        where: { setting_key: key },
        defaults: { setting_value: clean }
      });
      if (!created) await row.update({ setting_value: clean });
    }
    return success(res, null, 'Settings saved');
  } catch (err) { next(err); }
};

module.exports = { getPublic, getAll, updateMany };