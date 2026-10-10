/* =========================================================
   BOTOLA D2 — teamController.js
   Manage football teams.
   ✅ Cascade delete: removes related matches before deleting the team.
   ========================================================= */

const { Op } = require('sequelize');
const {
  Team,
  Stadium,
  Match,
  MatchGoal,
  MatchCard,
  MatchEvent,
  MatchStatistic,
  Replay,
  SavedMatch
} = require('../models');

const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');
const slugify = require('slugify');

/* =========================================================
   PUBLIC — List all active teams
   ========================================================= */
const getAll = async (req, res, next) => {
  try {
    const teams = await Team.findAll({
      where: { status: 'active' },
      include: [{ model: Stadium, as: 'stadium' }],
      order: [['name', 'ASC']]
    });
    return success(res, teams);
  } catch (err) { next(err); }
};

/* =========================================================
   PUBLIC — Get one team by ID
   ========================================================= */
const getById = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [{ model: Stadium, as: 'stadium' }]
    });
    if (!team) return error(res, 'Team not found', 404);
    return success(res, team);
  } catch (err) { next(err); }
};

/* =========================================================
   ADMIN — Create team
   ========================================================= */
const create = async (req, res, next) => {
  try {
    const name = cleanString(req.body.name, 120);
    if (!name) return error(res, 'Name required', 400);

    // ─── Generate unique slug ───
    let slug = slugify(name, { lower: true, strict: true });
    if (!slug || slug.length < 2) {
      slug = 'team-' + Date.now().toString(36);
    }

    let uniqueSlug = slug;
    let counter = 1;
    while (await Team.findOne({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
      if (counter > 100) {
        uniqueSlug = `${slug}-${Date.now().toString(36)}`;
        break;
      }
    }

    const team = await Team.create({
      name,
      short_name: cleanString(req.body.short_name, 20) || null,
      slug: uniqueSlug,
      logo: req.file
        ? `/uploads/teams/${req.file.filename}`
        : (cleanString(req.body.logo, 255) || null),
      city: cleanString(req.body.city, 100) || null,
      stadium_id: toInt(req.body.stadium_id) || null,
      description: cleanString(req.body.description, 2000) || null,
      founded_year: toInt(req.body.founded_year) || null,
      status: ['active', 'inactive'].includes(req.body.status) ? req.body.status : 'active'
    });

    return success(res, team, 'Team created', 201);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return error(
        res,
        'A team with this name or slug already exists. Try a slightly different name.',
        409
      );
    }
    next(err);
  }
};

/* =========================================================
   ADMIN — Update team
   ========================================================= */
const update = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return error(res, 'Team not found', 404);

    const patch = {};

    // Name change → regenerate unique slug
    if (req.body.name) {
      const newName = cleanString(req.body.name, 120);
      if (newName && newName !== team.name) {
        patch.name = newName;

        let newSlug = slugify(newName, { lower: true, strict: true })
          || `team-${Date.now().toString(36)}`;

        let uniqueSlug = newSlug;
        let counter = 1;
        while (await Team.findOne({
          where: { slug: uniqueSlug, id: { [Op.ne]: team.id } }
        })) {
          uniqueSlug = `${newSlug}-${counter}`;
          counter++;
          if (counter > 100) break;
        }
        patch.slug = uniqueSlug;
      }
    }

    if (req.body.short_name !== undefined)
      patch.short_name = cleanString(req.body.short_name, 20) || null;
    if (req.body.city !== undefined)
      patch.city = cleanString(req.body.city, 100) || null;
    if (req.body.stadium_id !== undefined)
      patch.stadium_id = toInt(req.body.stadium_id) || null;
    if (req.body.description !== undefined)
      patch.description = cleanString(req.body.description, 2000) || null;
    if (req.body.founded_year !== undefined)
      patch.founded_year = toInt(req.body.founded_year) || null;
    if (req.body.status !== undefined && ['active', 'inactive'].includes(req.body.status))
      patch.status = req.body.status;
    if (req.file)
      patch.logo = `/uploads/teams/${req.file.filename}`;

    await team.update(patch);
    return success(res, team, 'Team updated');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return error(res, 'Duplicate slug — please use a different name.', 409);
    }
    next(err);
  }
};

/* =========================================================
   ADMIN — Delete team (cascade: removes related matches)
   =========================================================
   When a team is deleted, all matches where this team is
   home OR away must be removed first (FK constraint).
   Also delete all match-related records (goals, cards, events,
   statistics, saved matches). Replays are unlinked (SET NULL).
   ========================================================= */
const remove = async (req, res, next) => {
  try {
    const teamId = toInt(req.params.id);
    if (!teamId) return error(res, 'Invalid team id', 400);

    const team = await Team.findByPk(teamId);
    if (!team) return error(res, 'Team not found', 404);

    /* ─── 1. Find all matches involving this team ─── */
    const relatedMatches = await Match.findAll({
      where: {
        [Op.or]: [
          { team_home_id: teamId },
          { team_away_id: teamId }
        ]
      },
      attributes: ['id']
    });

    const matchIds = relatedMatches.map(m => m.id);
    let deletedMatches = 0;

    if (matchIds.length > 0) {
      /* ─── 2. Delete match children ─── */
      await MatchGoal.destroy({ where: { match_id: { [Op.in]: matchIds } } });
      await MatchCard.destroy({ where: { match_id: { [Op.in]: matchIds } } });
      await MatchEvent.destroy({ where: { match_id: { [Op.in]: matchIds } } });
      await MatchStatistic.destroy({ where: { match_id: { [Op.in]: matchIds } } });
      await SavedMatch.destroy({ where: { match_id: { [Op.in]: matchIds } } });

      /* ─── 3. Unlink replays (keep video content, clear match link) ─── */
      try {
        await Replay.update(
          { match_id: null },
          { where: { match_id: { [Op.in]: matchIds } } }
        );
      } catch (_) { /* non-blocking */ }

      /* ─── 4. Delete the matches ─── */
      deletedMatches = await Match.destroy({
        where: { id: { [Op.in]: matchIds } }
      });
    }

    /* ─── 5. Now delete the team ─── */
    await team.destroy();

    return success(
      res,
      {
        team_id: teamId,
        deleted_matches: deletedMatches
      },
      `Team deleted${deletedMatches > 0 ? ` (and ${deletedMatches} related match${deletedMatches > 1 ? 'es' : ''})` : ''}`
    );
  } catch (err) {
    console.error('[teamController.remove] Error:', err);
    next(err);
  }
};

/* =========================================================
   ADMIN — Paginated list (up to 500 per page)
   ========================================================= */
const listPaginated = async (req, res, next) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(500, Math.max(1, toInt(req.query.limit, 200)));
    const offset = (page - 1) * limit;

    const { count, rows } = await Team.findAndCountAll({
      include: [{ model: Stadium, as: 'stadium' }],
      order: [['id', 'DESC']],
      limit,
      offset
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

/* =========================================================
   EXPORTS
   ========================================================= */
module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  listPaginated
};