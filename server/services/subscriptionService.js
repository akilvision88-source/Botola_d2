const { Op } = require('sequelize');
const { User, SubscriptionPlan } = require('../models');

/**
 * Check if a user has access to a given resource level.
 * level: 'free' | 'standard' | 'gold'
 */
const planRank = { free: 0, standard: 1, gold: 2 };

const userRank = (user) => {
  const planSlug = user.plan?.slug;
  if (!planSlug) return 0;
  return planRank[planSlug] ?? 0;
};

const hasAccess = (user, required) => {
  if (!user) return required === 'free';
  if (user.role && ['super_admin', 'admin'].includes(user.role.slug)) return true;
  return userRank(user) >= (planRank[required] ?? 0);
};

const expireOutdatedSubscriptions = async () => {
  const now = new Date();
  await User.update(
    { subscription_status: 'expired' },
    {
      where: {
        subscription_status: 'active',
        subscription_end: { [Op.lt]: now }
      }
    }
  );
};

module.exports = { hasAccess, expireOutdatedSubscriptions };