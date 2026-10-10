/* =========================================================
   BOTOLA D2 — models/index.js
   Sequelize models loader + all associations.
   ========================================================= */

const sequelize = require('../config/database');

/* =========================================================
   MODEL DEFINITIONS
   ========================================================= */

const User                = require('./User')(sequelize);
const Role                = require('./Role')(sequelize);
const Permission          = require('./Permission')(sequelize);
const RolePermission      = require('./RolePermission')(sequelize);
const Team                = require('./Team')(sequelize);
const Stadium             = require('./Stadium')(sequelize);
const Match               = require('./Match')(sequelize);
const MatchGoal           = require('./MatchGoal')(sequelize);
const MatchCard           = require('./MatchCard')(sequelize);
const MatchEvent          = require('./MatchEvent')(sequelize);
const MatchStatistic      = require('./MatchStatistic')(sequelize);
const Replay              = require('./Replay')(sequelize);
const SubscriptionPlan    = require('./SubscriptionPlan')(sequelize);
const Subscription        = require('./Subscription')(sequelize);
const Notification        = require('./Notification')(sequelize);
const SavedMatch          = require('./SavedMatch')(sequelize);
const Download            = require('./Download')(sequelize);
const ContactMessage      = require('./ContactMessage')(sequelize);
const Setting             = require('./Setting')(sequelize);
const StandingAdjustment  = require('./StandingAdjustment')(sequelize);
const NewsTicker          = require('./NewsTicker')(sequelize);
const HomeSection         = require('./HomeSection')(sequelize);
const Payment             = require('./Payment')(sequelize);
const AdminNotification   = require('./AdminNotification')(sequelize);   // ✅ جديد

/* =========================================================
   ASSOCIATIONS
   ========================================================= */

/* ---------- Roles <-> Permissions (many-to-many) ---------- */
Role.belongsToMany(Permission, {
  through: RolePermission,
  as: 'permissions',
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  onDelete: 'CASCADE'
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  as: 'roles',
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  onDelete: 'CASCADE'
});

RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });
Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'rolePermissions', onDelete: 'CASCADE' });
Permission.hasMany(RolePermission, { foreignKey: 'permission_id', as: 'rolePermissions', onDelete: 'CASCADE' });

/* ---------- Users <-> Roles ---------- */
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

/* ---------- Users <-> SubscriptionPlan ---------- */
SubscriptionPlan.hasMany(User, { foreignKey: 'subscription_plan_id', as: 'users' });
User.belongsTo(SubscriptionPlan, { foreignKey: 'subscription_plan_id', as: 'plan' });

/* ---------- Teams <-> Stadiums ---------- */
Stadium.hasMany(Team, { foreignKey: 'stadium_id', as: 'teams' });
Team.belongsTo(Stadium, { foreignKey: 'stadium_id', as: 'stadium' });

/* ---------- Teams <-> StandingAdjustment ---------- */
Team.hasOne(StandingAdjustment, {
  foreignKey: 'team_id',
  as: 'adjustment',
  onDelete: 'CASCADE'
});
StandingAdjustment.belongsTo(Team, {
  foreignKey: 'team_id',
  as: 'team'
});

/* ---------- Matches <-> Teams / Stadium ---------- */
Match.belongsTo(Team, { foreignKey: 'team_home_id', as: 'homeTeam' });
Match.belongsTo(Team, { foreignKey: 'team_away_id', as: 'awayTeam' });
Match.belongsTo(Stadium, { foreignKey: 'stadium_id', as: 'stadium' });

Team.hasMany(Match, { foreignKey: 'team_home_id', as: 'homeMatches' });
Team.hasMany(Match, { foreignKey: 'team_away_id', as: 'awayMatches' });
Stadium.hasMany(Match, { foreignKey: 'stadium_id', as: 'matches' });

/* ---------- Match children ---------- */
Match.hasMany(MatchGoal, {
  foreignKey: 'match_id', as: 'goals', onDelete: 'CASCADE'
});
MatchGoal.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
MatchGoal.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
Team.hasMany(MatchGoal, { foreignKey: 'team_id', as: 'goals' });

Match.hasMany(MatchCard, {
  foreignKey: 'match_id', as: 'cards', onDelete: 'CASCADE'
});
MatchCard.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
MatchCard.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
Team.hasMany(MatchCard, { foreignKey: 'team_id', as: 'cards' });

Match.hasMany(MatchEvent, {
  foreignKey: 'match_id', as: 'events', onDelete: 'CASCADE'
});
MatchEvent.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
MatchEvent.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Match.hasOne(MatchStatistic, {
  foreignKey: 'match_id', as: 'statistics', onDelete: 'CASCADE'
});
MatchStatistic.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });

/* ---------- Replays ---------- */
Match.hasOne(Replay, { foreignKey: 'match_id', as: 'replay', onDelete: 'SET NULL' });
Replay.belongsTo(Match, {
  foreignKey: 'match_id', as: 'match',
  onDelete: 'SET NULL'
});

/* ---------- Subscriptions ---------- */
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions', onDelete: 'CASCADE' });
SubscriptionPlan.hasMany(Subscription, { foreignKey: 'plan_id', as: 'subscriptions' });

/* ---------- Payments ---------- */
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Payment.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments', onDelete: 'CASCADE' });
SubscriptionPlan.hasMany(Payment, { foreignKey: 'plan_id', as: 'payments' });

/* ---------- Admin Notifications ---------- */
AdminNotification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AdminNotification, { foreignKey: 'user_id', as: 'adminNotifications', onDelete: 'SET NULL' });

/* ---------- Notifications ---------- */
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });

/* ---------- Saved Matches ---------- */
SavedMatch.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
SavedMatch.belongsTo(Match, { foreignKey: 'match_id', as: 'match' });
User.belongsToMany(Match, {
  through: SavedMatch,
  as: 'savedMatches',
  foreignKey: 'user_id',
  otherKey: 'match_id',
  onDelete: 'CASCADE'
});
Match.belongsToMany(User, {
  through: SavedMatch,
  as: 'savedByUsers',
  foreignKey: 'match_id',
  otherKey: 'user_id',
  onDelete: 'CASCADE'
});

/* ---------- Downloads ---------- */
Download.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Download.belongsTo(Replay, { foreignKey: 'replay_id', as: 'replay' });
User.hasMany(Download, { foreignKey: 'user_id', as: 'downloads', onDelete: 'CASCADE' });
Replay.hasMany(Download, { foreignKey: 'replay_id', as: 'downloads', onDelete: 'CASCADE' });

/* ---------- Contact messages (no relations) ---------- */
/* ---------- Settings (no relations) ---------- */
/* ---------- NewsTicker (no relations) ---------- */
/* ---------- HomeSection (no relations) ---------- */

/* =========================================================
   EXPORTS
   ========================================================= */

const db = {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  Team,
  Stadium,
  Match,
  MatchGoal,
  MatchCard,
  MatchEvent,
  MatchStatistic,
  Replay,
  Subscription,
  SubscriptionPlan,
  Notification,
  SavedMatch,
  Download,
  ContactMessage,
  Setting,
  StandingAdjustment,
  NewsTicker,
  HomeSection,
  Payment,
  AdminNotification    // ✅ جديد
};

module.exports = db;