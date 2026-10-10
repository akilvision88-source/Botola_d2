/* =========================================================
   BOTOLA D2 — replayController.js (v4 FINAL)
   Subscription tiers: free / standard / gold
   ========================================================= */

const { Op } = require('sequelize');
const { Replay, Match, Team } = require('../models');
const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');

/* =========================================================
   TIER HELPERS
   ========================================================= */
const planRank = { free: 0, standard: 1, gold: 2 };

const getUserRank = (user) => {
  if (!user) return 0; // زائر

  // Admin/Super Admin → أعلى صلاحية
  const roleSlug = user?.role?.slug;
  if (roleSlug && ['super_admin', 'admin'].includes(roleSlug)) return 2;

  // حسب الخطة
  const planSlug = user?.plan?.slug;
  return planRank[planSlug] ?? 0;
};

/* =========================================================
   SAFE URL
   ========================================================= */
const cleanUrl = (v, max = 500) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s.length === 0) return null;
  if (/<script|javascript:|data:text\/html|on\w+\s*=/i.test(s)) return null;
  return s.length > max ? s.slice(0, max) : s;
};

/* =========================================================
   PUBLIC — List
   ========================================================= */
const list = async (req, res, next) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 12)));
    const offset = (page - 1) * limit;

    const { count, rows } = await Replay.findAndCountAll({
      include: [{
        model: Match,
        as: 'match',
        include: [
          { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'short_name', 'logo'] },
          { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'short_name', 'logo'] }
        ]
      }],
      order: [['replay_date', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    // ✅ احسب has_access لكل إعادة
    const userRank = getUserRank(req.user);
    const items = rows.map(r => {
      const data = r.toJSON();
      data.has_access = userRank >= (planRank[r.requires_subscription] ?? 0);
      return data;
    });

    return paginated(res, items, count, page, limit);
  } catch (err) { next(err); }
};

/* =========================================================
   PUBLIC — Get by ID
   ========================================================= */
const getById = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return error(res, 'Invalid replay id', 400);

    const replay = await Replay.findByPk(id, {
      include: [{
        model: Match,
        as: 'match',
        include: [
          { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'short_name', 'logo'] },
          { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'short_name', 'logo'] }
        ]
      }]
    });

    if (!replay) return error(res, 'Replay not found', 404);

    // ✅ احسب has_access
    const userRank = getUserRank(req.user);
    const data = replay.toJSON();
    data.has_access = userRank >= (planRank[replay.requires_subscription] ?? 0);

    return success(res, data);
  } catch (err) { next(err); }
};

/* =========================================================
   ACCESS — check subscription
   ========================================================= */
const access = async (req, res, next) => {
  try {
    const replay = await Replay.findByPk(req.params.id);
    if (!replay) return error(res, 'Replay not found', 404);

    const userRank = getUserRank(req.user);
    const requiredRank = planRank[replay.requires_subscription] ?? 0;

    // ❌ ليس لديه صلاحية
    if (userRank < requiredRank) {
      return error(res, 'Subscription required', 403, {
        required: replay.requires_subscription,
        current: req.user?.plan?.slug || 'free',
        is_logged_in: !!req.user
      });
    }

    // ✅ لديه صلاحية → أرجع الروابط
    const payload = {
      video_url: replay.video_url,
      summary_video_url: replay.summary_video_url || null,
      download_url: replay.download_url || null,
      summary_download_url: replay.summary_download_url || null
    };

    return success(res, payload);
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Create
   ========================================================= */
const create = async (req, res, next) => {
  try {
    const title = cleanString(req.body.title, 200);
    const video_url = cleanUrl(req.body.video_url, 500);
    const replay_date = req.body.replay_date;

    if (!title || !video_url || !replay_date) {
      return error(res, 'Title, video_url and replay_date are required', 400);
    }

    const replay = await Replay.create({
      match_id: toInt(req.body.match_id),
      title,
      description: cleanString(req.body.description, 5000),
      thumbnail: req.file
        ? `/uploads/thumbnails/${req.file.filename}`
        : cleanUrl(req.body.thumbnail, 255),

      video_url,
      download_url: cleanUrl(req.body.download_url, 500),
      duration: cleanString(req.body.duration, 20) || null,

      summary_video_url:    cleanUrl(req.body.summary_video_url, 500),
      summary_download_url: cleanUrl(req.body.summary_download_url, 500),
      summary_duration:     cleanString(req.body.summary_duration, 20) || null,

      ad_video_url:  cleanUrl(req.body.ad_video_url, 500),
      ad_duration:   (() => {
        const d = toInt(req.body.ad_duration, 15);
        return (d >= 5 && d <= 120) ? d : 15;
      })(),
      ad_skip_after: (() => {
        const s = toInt(req.body.ad_skip_after, 5);
        return (s >= 0 && s <= 60) ? s : 5;
      })(),

      replay_date,
      requires_subscription: ['free', 'standard', 'gold'].includes(req.body.requires_subscription)
        ? req.body.requires_subscription
        : 'standard'
    });

    return success(res, replay, 'Replay created', 201);
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Update
   ========================================================= */
const update = async (req, res, next) => {
  try {
    const replay = await Replay.findByPk(req.params.id);
    if (!replay) return error(res, 'Replay not found', 404);

    const patch = {};

    if (req.body.title !== undefined)       patch.title = cleanString(req.body.title, 200);
    if (req.body.description !== undefined) patch.description = cleanString(req.body.description, 5000);
    if (req.body.match_id !== undefined) {
      const mid = toInt(req.body.match_id);
      patch.match_id = mid || null;
    }
    if (req.file) patch.thumbnail = `/uploads/thumbnails/${req.file.filename}`;

    if (req.body.video_url !== undefined)    patch.video_url = cleanUrl(req.body.video_url, 500);
    if (req.body.download_url !== undefined) patch.download_url = cleanUrl(req.body.download_url, 500);
    if (req.body.duration !== undefined)     patch.duration = cleanString(req.body.duration, 20) || null;

    if (req.body.summary_video_url !== undefined) {
      patch.summary_video_url = cleanUrl(req.body.summary_video_url, 500);
    }
    if (req.body.summary_download_url !== undefined) {
      patch.summary_download_url = cleanUrl(req.body.summary_download_url, 500);
    }
    if (req.body.summary_duration !== undefined) {
      patch.summary_duration = cleanString(req.body.summary_duration, 20) || null;
    }

    if (req.body.ad_video_url !== undefined) {
      patch.ad_video_url = cleanUrl(req.body.ad_video_url, 500);
    }
    if (req.body.ad_duration !== undefined) {
      const d = toInt(req.body.ad_duration, 15);
      patch.ad_duration = (d >= 5 && d <= 120) ? d : 15;
    }
    if (req.body.ad_skip_after !== undefined) {
      const s = toInt(req.body.ad_skip_after, 5);
      patch.ad_skip_after = (s >= 0 && s <= 60) ? s : 5;
    }

    if (req.body.replay_date !== undefined) patch.replay_date = req.body.replay_date;
    if (req.body.requires_subscription !== undefined) {
      if (['free', 'standard', 'gold'].includes(req.body.requires_subscription)) {
        patch.requires_subscription = req.body.requires_subscription;
      }
    }

    console.log('[replayController.update] Patch:', patch);

    await replay.update(patch);
    await replay.reload();

    return success(res, replay, 'Replay updated');
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Delete
   ========================================================= */
const remove = async (req, res, next) => {
  try {
    const replay = await Replay.findByPk(req.params.id);
    if (!replay) return error(res, 'Replay not found', 404);
    await replay.destroy();
    return success(res, null, 'Replay deleted');
  } catch (err) { next(err); }
};

/* =========================================================
   EXPORTS
   ========================================================= */
module.exports = {
  list,
  getById,
  access,
  create,
  update,
  remove
};