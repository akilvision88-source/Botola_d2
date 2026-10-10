module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    EDITOR: 'editor',
    MODERATOR: 'moderator',
    USER: 'user'
  },

  MATCH_STATUS: {
    UPCOMING: 'upcoming',
    LIVE: 'live',
    HALFTIME: 'halftime',
    FINISHED: 'finished',
    POSTPONED: 'postponed',
    CANCELLED: 'cancelled'
  },

  SUBSCRIPTION_STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  },

  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive'
  },

  LANGUAGES: ['fr', 'en', 'ar'],
  DEFAULT_LANGUAGE: 'fr'
};