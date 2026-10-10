const { Op, fn, col, literal } = require('sequelize');
const {
  User, Match, Replay, ContactMessage, Subscription,
  SubscriptionPlan, Team, Role
} = require('../models');
const { success } = require('../utils/response');

const dashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, activeSubscribers, goldSubscribers,
      liveMatches, upcomingMatches, replayCount,
      totalResults, messagesCount, newMessages
    ] = await Promise.all([
      User.count(),
      User.count({ where: { subscription_status: 'active' } }),
      User.count({
        include: [{ model: SubscriptionPlan, as: 'plan', where: { slug: 'gold' }, required: true }]
      }),
      Match.count({ where: { status: { [Op.in]: ['live','halftime'] } } }),
      Match.count({ where: { status: 'upcoming' } }),
      Replay.count(),
      Match.count({ where: { status: 'finished' } }),
      ContactMessage.count(),
      ContactMessage.count({ where: { status: 'new' } })
    ]);

    // Revenue = sum of active subscription amounts
    const revenueRow = await Subscription.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: { status: 'active' },
      raw: true
    });
    const revenue = Number(revenueRow?.total || 0);

    // Last 7 days new users
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: { created_at: { [Op.gte]: sevenDaysAgo } },
      group: [literal('DATE(created_at)')],
      order: [[literal('DATE(created_at)'), 'ASC']],
      raw: true
    });

    return success(res, {
      totalUsers,
      activeSubscribers,
      goldSubscribers,
      liveMatches,
      upcomingMatches,
      replayCount,
      totalResults,
      messagesCount,
      newMessages,
      revenue,
      recentUsers
    });
  } catch (err) { next(err); }
};

module.exports = { dashboardStats };