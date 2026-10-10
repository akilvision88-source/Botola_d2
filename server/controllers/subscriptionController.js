/* =========================================================
   BOTOLA D2 — subscriptionController.js (v3)
   Plans + Subscribe + Admin notifications
   ========================================================= */

const { SubscriptionPlan, Subscription, User } = require('../models');
const { success, error, paginated } = require('../utils/response');
const { cleanString, toInt, toFloat } = require('../utils/validators');
const { notifyNewSubscription } = require('../services/adminNotifier');

/* ═══════════════════════════════════════════════════════
   PUBLIC — List plans
   ═══════════════════════════════════════════════════════ */
const listPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['display_order','ASC'], ['price','ASC']]
    });
    return success(res, plans);
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   ADMIN — List all plans
   ═══════════════════════════════════════════════════════ */
const listPlansAdmin = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [['display_order','ASC'], ['id','ASC']]
    });
    return success(res, plans);
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   ADMIN — Create plan
   ═══════════════════════════════════════════════════════ */
const createPlan = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return error(res, 'Name and slug required', 400);

    const plan = await SubscriptionPlan.create({
      name: cleanString(name, 60),
      slug: cleanString(slug, 60),
      description: cleanString(req.body.description, 255),
      price: toFloat(req.body.price, 0),
      currency: cleanString(req.body.currency, 10) || 'MAD',
      duration_days: toInt(req.body.duration_days, 30),
      features: Array.isArray(req.body.features) ? req.body.features : [],
      is_active: true,
      live_access: true,
      replay_access: true,
      download_access: false,
      hd_access: true,
      display_order: toInt(req.body.display_order, 0)
    });
    return success(res, plan, 'Plan created', 201);
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   ADMIN — Update plan
   ═══════════════════════════════════════════════════════ */
const updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return error(res, 'Plan not found', 404);
    const patch = {};
    ['name','description','currency'].forEach(k => {
      if (req.body[k] !== undefined) patch[k] = cleanString(req.body[k], 200);
    });
    ['price'].forEach(k => { if (req.body[k] !== undefined) patch[k] = toFloat(req.body[k]); });
    ['duration_days','display_order'].forEach(k => { if (req.body[k] !== undefined) patch[k] = toInt(req.body[k]); });
    if (Array.isArray(req.body.features)) patch.features = req.body.features;

    await plan.update(patch);
    return success(res, plan, 'Plan updated');
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   ADMIN — Deactivate plan
   ═══════════════════════════════════════════════════════ */
const removePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return error(res, 'Plan not found', 404);
    if (plan.slug === 'free') return error(res, 'Cannot delete the Free plan', 400);
    await plan.update({ is_active: false });
    return success(res, null, 'Plan deactivated');
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   PUBLIC — Subscribe (with admin notification)
   ═══════════════════════════════════════════════════════ */
const subscribe = async (req, res, next) => {
  try {
    const plan_id = toInt(req.body.plan_id);
    if (!plan_id) return error(res, 'plan_id is required', 400);

    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan || !plan.is_active) return error(res, 'Plan unavailable', 404);

    const now = new Date();
    const end = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    const sub = await Subscription.create({
      user_id: req.user.id,
      plan_id: plan.id,
      amount: plan.price,
      currency: plan.currency,
      payment_method: req.body.payment_method || 'simulated',
      payment_reference: req.body.payment_reference || null,
      status: 'active',
      start_date: now,
      end_date: end
    });

    await User.update({
      subscription_plan_id: plan.id,
      subscription_start: now,
      subscription_end: end,
      subscription_status: 'active'
    }, { where: { id: req.user.id } });

    // ✅ Notify admin
    try {
      const user = await User.findByPk(req.user.id);
      notifyNewSubscription(user, plan, sub).catch(() => {});
    } catch (_) {}

    return success(res, sub, 'Subscription activated', 201);
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   SELF — My subscription
   ═══════════════════════════════════════════════════════ */
const mySubscription = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });
    return success(res, {
      plan: user.plan,
      start: user.subscription_start,
      end: user.subscription_end,
      status: user.subscription_status
    });
  } catch (err) { next(err); }
};

/* ═══════════════════════════════════════════════════════
   ADMIN — List subscriptions
   ═══════════════════════════════════════════════════════ */
const listSubscriptionsAdmin = async (req, res, next) => {
  try {
    const { Subscription: Sub, User: U, SubscriptionPlan: Plan } = require('../models');
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const { count, rows } = await Sub.findAndCountAll({
      include: [
        { model: U, as: 'user', attributes: ['id','full_name','email'] },
        { model: Plan, as: 'plan', attributes: ['id','name','slug','price'] }
      ],
      order: [['id','DESC']], limit, offset, distinct: true
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

module.exports = {
  listPlans, listPlansAdmin, createPlan, updatePlan, removePlan,
  subscribe, mySubscription, listSubscriptionsAdmin
};