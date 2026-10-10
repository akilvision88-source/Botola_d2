const { Notification, Match, Team } = require('../models');
const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');

const listMine = async (req, res, next) => {
  try {
    const items = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at','DESC']],
      limit: 50
    });
    return success(res, items);
  } catch (err) { next(err); }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false }
    });
    return success(res, { count });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!notif) return error(res, 'Not found', 404);
    await notif.update({ is_read: true });
    return success(res, notif, 'Marked as read');
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
    return success(res, null, 'All marked read');
  } catch (err) { next(err); }
};

// Admin broadcast
const broadcast = async (req, res, next) => {
  try {
    const title = cleanString(req.body.title, 180);
    const message = cleanString(req.body.message, 5000);
    if (!title || !message) return error(res, 'Title and message required', 400);

    const notif = await Notification.create({
      user_id: null,
      type: 'admin_broadcast',
      title, message,
      is_broadcast: true
    });
    return success(res, notif, 'Broadcast sent', 201);
  } catch (err) { next(err); }
};

// Notify me for an upcoming match
const notifyMatch = async (req, res, next) => {
  try {
    const { SavedMatch } = require('../models');
    const match_id = toInt(req.params.id);
    if (!match_id) return error(res, 'Invalid match id', 400);

    const match = await Match.findByPk(match_id, {
      include: [
        { model: Team, as: 'homeTeam', attributes: ['name'] },
        { model: Team, as: 'awayTeam', attributes: ['name'] }
      ]
    });
    if (!match) return error(res, 'Match not found', 404);

    await SavedMatch.findOrCreate({
      where: { user_id: req.user.id, match_id: match.id },
      defaults: { notify: true }
    });

    await Notification.create({
      user_id: req.user.id,
      match_id: match.id,
      type: 'match_reminder',
      title: `Reminder set: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`,
      message: `You will be notified before kickoff on ${match.match_date} at ${match.match_time}.`
    });

    return success(res, { match_id: match.id }, 'Notification set', 201);
  } catch (err) { next(err); }
};

module.exports = { listMine, unreadCount, markRead, markAllRead, broadcast, notifyMatch };