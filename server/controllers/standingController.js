const { StandingAdjustment, Team, sequelize } = require('../models');
const { computeStandings } = require('../services/standingService');
const { success, error } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');

/**
 * GET /api/standings
 * Public — computed standings (with adjustments applied).
 */
const getStandings = async (req, res, next) => {
  try {
    const standings = await computeStandings();
    return success(res, standings);
  } catch (err) { next(err); }
};

/**
 * GET /api/standings/admin
 * Admin — computed standings + adjustments info.
 */
const getAdminStandings = async (req, res, next) => {
  try {
    const standings = await computeStandings();
    const adjustments = await StandingAdjustment.findAll({
      include: [{ model: Team, as: 'team', attributes: ['id', 'name', 'short_name'] }]
    });

    const adjMap = {};
    adjustments.forEach(a => { adjMap[a.team_id] = a; });

    const enriched = standings.map(row => ({
      ...row,
      adjustment: adjMap[row.team_id] || null
    }));

    return success(res, enriched);
  } catch (err) { next(err); }
};

/**
 * PUT /api/standings/adjustments/:teamId
 * Admin — upsert an adjustment for a team.
 * Body: { points_adjustment, played_adjustment, gf_adjustment, ga_adjustment, notes }
 */
const upsertAdjustment = async (req, res, next) => {
  try {
    const teamId = toInt(req.params.teamId);
    if (!teamId) return error(res, 'Invalid team id', 400);

    const team = await Team.findByPk(teamId);
    if (!team) return error(res, 'Team not found', 404);

    const payload = {
      points_adjustment: toInt(req.body.points_adjustment, 0),
      played_adjustment: toInt(req.body.played_adjustment, 0),
      wins_adjustment: toInt(req.body.wins_adjustment, 0),
      draws_adjustment: toInt(req.body.draws_adjustment, 0),
      losses_adjustment: toInt(req.body.losses_adjustment, 0),
      gf_adjustment: toInt(req.body.gf_adjustment, 0),
      ga_adjustment: toInt(req.body.ga_adjustment, 0),
      notes: cleanString(req.body.notes, 255) || null,
      updated_by: req.user.id
    };

    const [adjustment, created] = await StandingAdjustment.findOrCreate({
      where: { team_id: teamId },
      defaults: { ...payload, team_id: teamId }
    });

    if (!created) {
      await adjustment.update(payload);
    }

    await adjustment.reload({
      include: [{ model: Team, as: 'team', attributes: ['id', 'name', 'short_name'] }]
    });

    return success(res, adjustment, created ? 'Adjustment created' : 'Adjustment updated');
  } catch (err) { next(err); }
};

/**
 * DELETE /api/standings/adjustments/:teamId
 * Admin — clear adjustment for a team (back to auto-computed).
 */
const clearAdjustment = async (req, res, next) => {
  try {
    const teamId = toInt(req.params.teamId);
    if (!teamId) return error(res, 'Invalid team id', 400);

    await StandingAdjustment.destroy({ where: { team_id: teamId } });
    return success(res, null, 'Adjustment cleared');
  } catch (err) { next(err); }
};

module.exports = {
  getStandings,
  getAdminStandings,
  upsertAdjustment,
  clearAdjustment
};