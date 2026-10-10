/* =========================================================
   BOTOLA D2 — matchController.js (v2 — with Pre-roll Ad)
   Matches CRUD + Goals / Cards / Stats + Ad support.
   Supports: card_background + ad_video_url + ad_duration + ad_skip_after
   ========================================================= */

const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const {
  Match,
  Team,
  Stadium,
  MatchGoal,
  MatchCard,
  MatchEvent,
  MatchStatistic
} = require('../models');

const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Safe URL cleaner — keeps :// intact, rejects obvious XSS.
 */
const cleanUrl = (v, max = 500) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s.length === 0) return null;
  if (/<script|javascript:|data:text\/html|on\w+\s*=/i.test(s)) return null;
  return s.length > max ? s.slice(0, max) : s;
};

/**
 * Delete an uploaded file from disk (best-effort).
 */
const safeUnlink = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) { /* silent */ }
};

/**
 * Base includes for lists.
 */
const baseInclude = [
  { model: Team, as: 'homeTeam', attributes: ['id', 'name', 'short_name', 'logo', 'city'] },
  { model: Team, as: 'awayTeam', attributes: ['id', 'name', 'short_name', 'logo', 'city'] },
  { model: Stadium, as: 'stadium', attributes: ['id', 'name', 'city'] }
];

/* =========================================================
   PUBLIC — Get matches
   ========================================================= */

const getLive = async (req, res, next) => {
  try {
    const matches = await Match.findAll({
      where: { status: { [Op.in]: ['live', 'halftime'] } },
      include: baseInclude,
      order: [['match_date', 'ASC'], ['match_time', 'ASC']]
    });
    return success(res, matches);
  } catch (err) { next(err); }
};

const getUpcoming = async (req, res, next) => {
  try {
    const matches = await Match.findAll({
      where: { status: 'upcoming' },
      include: baseInclude,
      order: [['match_date', 'ASC'], ['match_time', 'ASC']],
      limit: 50
    });
    return success(res, matches);
  } catch (err) { next(err); }
};

const getResults = async (req, res, next) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;

    const { count, rows } = await Match.findAndCountAll({
      where: { status: 'finished' },
      include: [
        ...baseInclude,
        {
          model: MatchGoal,
          as: 'goals',
          include: [{ model: Team, as: 'team', attributes: ['id', 'name', 'short_name'] }]
        }
      ],
      order: [['match_date', 'DESC'], ['match_time', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    if (!id) return error(res, 'Invalid match id', 400);

    const match = await Match.findByPk(id, {
      include: [
        ...baseInclude,
        { model: MatchGoal, as: 'goals' },
        { model: MatchCard, as: 'cards' },
        { model: MatchEvent, as: 'events' },
        { model: MatchStatistic, as: 'statistics' }
      ]
    });
    if (!match) return error(res, 'Match not found', 404);
    return success(res, match);
  } catch (err) { next(err); }
};

const search = async (req, res, next) => {
  try {
    const q = cleanString(req.query.q, 60) || '';
    if (!q) return success(res, []);
    const like = `%${q}%`;

    const matches = await Match.findAll({
      where: {
        [Op.or]: [
          { competition: { [Op.like]: like } },
          { '$homeTeam.name$': { [Op.like]: like } },
          { '$awayTeam.name$': { [Op.like]: like } },
          { city: { [Op.like]: like } }
        ]
      },
      include: baseInclude,
      limit: 20
    });
    return success(res, matches);
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
    if (req.query.status) {
      const statuses = String(req.query.status).split(',').map(s => s.trim()).filter(Boolean);
      where.status = statuses.length > 1 ? { [Op.in]: statuses } : statuses[0];
    }
    if (req.query.date) {
      where.match_date = req.query.date;
    }

    const { count, rows } = await Match.findAndCountAll({
      where,
      include: baseInclude,
      order: [['match_date', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

/* =========================================================
   NORMALIZE PAYLOAD — with Ad fields
   ========================================================= */

function normalizeMatchPayload(body, partial = false) {
  const payload = {};
  const set = (k, v) => { if (v !== undefined) payload[k] = v; };

  if (!partial) {
    if (!body.team_home_id || !body.team_away_id) {
      const e = new Error('Both teams are required');
      e.status = 400;
      throw e;
    }
    if (!body.match_date || !body.match_time) {
      const e = new Error('Match date & time are required');
      e.status = 400;
      throw e;
    }
  }

  set('competition', body.competition ? cleanString(body.competition, 120) : undefined);
  set('team_home_id', body.team_home_id ? toInt(body.team_home_id) : undefined);
  set('team_away_id', body.team_away_id ? toInt(body.team_away_id) : undefined);
  set('score_home', body.score_home !== undefined ? toInt(body.score_home, 0) : undefined);
  set('score_away', body.score_away !== undefined ? toInt(body.score_away, 0) : undefined);
  set('match_minute', body.match_minute !== undefined ? toInt(body.match_minute, 0) : undefined);
  set('status', body.status);
  set('stadium_id', body.stadium_id ? toInt(body.stadium_id) : undefined);
  set('city', body.city ? cleanString(body.city, 100) : undefined);
  set('referee', body.referee ? cleanString(body.referee, 120) : undefined);
  set('match_date', body.match_date);
  set('match_time', body.match_time);
  set('stream_url', body.stream_url ? cleanUrl(body.stream_url, 500) : undefined);
  set('thumbnail', body.thumbnail ? cleanUrl(body.thumbnail, 255) : undefined);

  // ✅ card_background — URL only (upload handled separately in create/update)
  if (body.card_background !== undefined) {
    payload.card_background = cleanUrl(body.card_background, 500);
  }

  // ✅ PRE-ROLL AD — URL, duration, skip_after
  if (body.ad_video_url !== undefined) {
    payload.ad_video_url = cleanUrl(body.ad_video_url, 500);
  }
  if (body.ad_duration !== undefined) {
    const d = toInt(body.ad_duration, 15);
    payload.ad_duration = (d >= 5 && d <= 120) ? d : 15;
  }
  if (body.ad_skip_after !== undefined) {
    const s = toInt(body.ad_skip_after, 5);
    payload.ad_skip_after = (s >= 0 && s <= 60) ? s : 5;
  }

  set('round', body.round ? cleanString(body.round, 50) : undefined);

  return payload;
}

/* =========================================================
   ADMIN — Create
   ========================================================= */

const create = async (req, res, next) => {
  try {
    const payload = normalizeMatchPayload(req.body);

    // ✅ Uploaded card background (multipart) — priority over URL
    if (req.files?.card_background_file?.[0]) {
      payload.card_background = `/uploads/thumbnails/${req.files.card_background_file[0].filename}`;
    }

    const match = await Match.create({ ...payload, created_by: req.user.id });

    // Reload with relations
    const full = await Match.findByPk(match.id, { include: baseInclude });

    return success(res, full, 'Match created', 201);
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Update
   ========================================================= */

const update = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    const match = await Match.findByPk(id);
    if (!match) return error(res, 'Match not found', 404);

    const payload = normalizeMatchPayload(req.body, true);

    /* =====================================================
       CARD BACKGROUND — priority:
       1. Uploaded file → overrides everything
       2. Non-empty URL → keep as-is (already in payload)
       3. Empty string + no file → clear (null)
       ===================================================== */
    if (req.files?.card_background_file?.[0]) {
      const oldBg = match.card_background;
      payload.card_background = `/uploads/thumbnails/${req.files.card_background_file[0].filename}`;

      if (oldBg && oldBg.startsWith('/uploads/')) {
        safeUnlink(path.join(__dirname, '..', '..', oldBg));
      }
    } else if (req.body.card_background === '') {
      payload.card_background = null;
    }

    /* =====================================================
       PRE-ROLL AD — priority:
       1. Empty string → clear (null)
       2. Non-empty URL → keep
       ===================================================== */
    if (req.body.ad_video_url === '') {
      payload.ad_video_url = null;
    }

    await match.update(payload);

    // Reload fresh
    const fresh = await Match.findByPk(match.id, { include: baseInclude });

    return success(res, fresh, 'Match updated');
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Delete
   ========================================================= */

const remove = async (req, res, next) => {
  try {
    const id = toInt(req.params.id);
    const match = await Match.findByPk(id);
    if (!match) return error(res, 'Match not found', 404);

    // Delete local card_background file if exists
    if (match.card_background && match.card_background.startsWith('/uploads/')) {
      safeUnlink(path.join(__dirname, '..', '..', match.card_background));
    }

    await match.destroy();
    return success(res, null, 'Match deleted');
  } catch (err) { next(err); }
};

/* =========================================================
   GOALS / CARDS / STATS
   ========================================================= */

const addGoal = async (req, res, next) => {
  try {
    const matchId = toInt(req.params.id);
    const match = await Match.findByPk(matchId);
    if (!match) return error(res, 'Match not found', 404);

    const team_id = toInt(req.body.team_id);
    const player_name = cleanString(req.body.player_name, 120);
    const minute = toInt(req.body.minute);

    if (!team_id || !player_name || minute == null) {
      return error(res, 'team_id, player_name and minute are required', 400);
    }

    const goal = await MatchGoal.create({
      match_id: matchId,
      team_id,
      player_name,
      minute,
      is_penalty: !!req.body.is_penalty,
      is_own_goal: !!req.body.is_own_goal
    });

    return success(res, goal, 'Goal added', 201);
  } catch (err) { next(err); }
};

const deleteGoal = async (req, res, next) => {
  try {
    const matchId = toInt(req.params.id);
    const goalId = toInt(req.params.goalId);
    const goal = await MatchGoal.findOne({ where: { id: goalId, match_id: matchId } });
    if (!goal) return error(res, 'Goal not found', 404);
    await goal.destroy();
    return success(res, null, 'Goal deleted');
  } catch (err) { next(err); }
};

const addCard = async (req, res, next) => {
  try {
    const matchId = toInt(req.params.id);
    const match = await Match.findByPk(matchId);
    if (!match) return error(res, 'Match not found', 404);

    const team_id = toInt(req.body.team_id);
    const player_name = cleanString(req.body.player_name, 120);
    const card_type = req.body.card_type;
    const minute = toInt(req.body.minute);

    if (!team_id || !player_name || !card_type || minute == null) {
      return error(res, 'Missing required fields', 400);
    }
    if (!['yellow', 'red', 'second_yellow'].includes(card_type)) {
      return error(res, 'Invalid card_type', 400);
    }

    const card = await MatchCard.create({
      match_id: matchId,
      team_id,
      player_name,
      card_type,
      minute
    });
    return success(res, card, 'Card added', 201);
  } catch (err) { next(err); }
};

const deleteCard = async (req, res, next) => {
  try {
    const matchId = toInt(req.params.id);
    const cardId = toInt(req.params.cardId);
    const card = await MatchCard.findOne({ where: { id: cardId, match_id: matchId } });
    if (!card) return error(res, 'Card not found', 404);
    await card.destroy();
    return success(res, null, 'Card deleted');
  } catch (err) { next(err); }
};

const upsertStatistics = async (req, res, next) => {
  try {
    const matchId = toInt(req.params.id);
    const match = await Match.findByPk(matchId);
    if (!match) return error(res, 'Match not found', 404);

    const fields = [
      'possession_home', 'possession_away', 'shots_home', 'shots_away',
      'shots_on_target_home', 'shots_on_target_away', 'corners_home', 'corners_away',
      'fouls_home', 'fouls_away', 'offsides_home', 'offsides_away'
    ];
    const payload = {};
    fields.forEach(f => {
      if (req.body[f] !== undefined) payload[f] = toInt(req.body[f], 0);
    });

    const [stat, created] = await MatchStatistic.findOrCreate({
      where: { match_id: matchId },
      defaults: { ...payload, match_id: matchId }
    });
    if (!created) await stat.update(payload);

    return success(res, stat, 'Statistics saved');
  } catch (err) { next(err); }
};

/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  // Public
  getLive,
  getUpcoming,
  getResults,
  getById,
  search,

  // Admin
  listAdmin,
  create,
  update,
  remove,

  // Match details
  addGoal,
  deleteGoal,
  addCard,
  deleteCard,
  upsertStatistics
};