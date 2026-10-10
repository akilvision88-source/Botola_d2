/* =========================================================
   BOTOLA D2 — services/adminNotifier.js
   Create admin notifications for important events
   ========================================================= */

const { AdminNotification } = require('../models');

/* =========================================================
   BASE — create a notification
   ========================================================= */
async function notify(type, title, message, data = null, priority = 'normal') {
  try {
    const notification = await AdminNotification.create({
      type,
      title,
      message,
      data,
      priority,
      user_id: data?.user_id || null
    });

    console.log(`[AdminNotifier] 🔔 ${type}: ${title}`);
    return notification;
  } catch (err) {
    console.error('[AdminNotifier] Error:', err.message);
    return null;
  }
}

/* =========================================================
   1. NEW USER REGISTERED
   ========================================================= */
async function notifyNewUser(user) {
  return notify(
    'new_user',
    '👤 Nouvel utilisateur inscrit',
    `${user.full_name} (${user.email}) vient de s'inscrire.`,
    {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      plan: user.plan?.name || 'Free',
      plan_slug: user.plan?.slug || 'free',
      language: user.language,
      registered_at: new Date().toISOString()
    },
    'normal'
  );
}

/* =========================================================
   2. NEW SUBSCRIPTION
   ========================================================= */
async function notifyNewSubscription(user, plan, subscription) {
  return notify(
    'new_subscription',
    '⭐ Nouvel abonnement',
    `${user.full_name} a souscrit au forfait ${plan.name} (${Number(plan.price).toFixed(2)} ${plan.currency}).`,
    {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      plan_id: plan.id,
      plan_name: plan.name,
      plan_slug: plan.slug,
      amount: Number(plan.price),
      currency: plan.currency,
      duration_days: plan.duration_days,
      subscription_id: subscription?.id,
      start_date: subscription?.start_date,
      end_date: subscription?.end_date
    },
    'high'
  );
}

/* =========================================================
   3. NEW PAYMENT INITIATED
   ========================================================= */
async function notifyNewPayment(user, plan, payment) {
  const methodNames = {
    visa: '💳 Carte Visa',
    mastercard: '💳 Mastercard',
    paypal: '🅿️ PayPal',
    wafacash: '💵 Wafacash',
    cashplus: '💵 Cash Plus'
  };

  const method = methodNames[payment.payment_method] || payment.payment_method;

  return notify(
    'new_payment',
    `💰 Paiement initié — ${method}`,
    `${user.full_name} a initié un paiement de ${Number(payment.amount).toFixed(2)} ${payment.currency} pour le forfait ${plan.name}.`,
    {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      payment_id: payment.id,
      invoice_number: payment.invoice_number,
      plan_name: plan.name,
      plan_slug: plan.slug,
      amount: Number(payment.amount),
      currency: payment.currency,
      payment_method: payment.payment_method,
      payment_method_name: method,
      payment_reference: payment.payment_reference,
      status: payment.status
    },
    payment.payment_method === 'wafacash' || payment.payment_method === 'cashplus'
      ? 'high'
      : 'normal'
  );
}

/* =========================================================
   4. PAYMENT COMPLETED
   ========================================================= */
async function notifyPaymentCompleted(user, plan, payment) {
  return notify(
    'payment_completed',
    '✅ Paiement confirmé',
    `${user.full_name} a complété le paiement de ${Number(payment.amount).toFixed(2)} ${payment.currency}.`,
    {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      payment_id: payment.id,
      invoice_number: payment.invoice_number,
      plan_name: plan.name,
      amount: Number(payment.amount),
      currency: payment.currency,
      payment_method: payment.payment_method,
      paid_at: payment.paid_at
    },
    'high'
  );
}

/* =========================================================
   5. NEW CONTACT MESSAGE
   ========================================================= */
async function notifyNewMessage(msg) {
  return notify(
    'new_message',
    '📧 Nouveau message de contact',
    `${msg.name} (${msg.email}) : "${msg.subject}"`,
    {
      message_id: msg.id,
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      subject: msg.subject,
      message_preview: msg.message?.substring(0, 200)
    },
    'normal'
  );
}

/* =========================================================
   6. NEW REPLAY PUBLISHED
   ========================================================= */
async function notifyNewReplay(replay) {
  return notify(
    'new_replay',
    '🎬 Nouvelle rediffusion',
    `La rediffusion "${replay.title}" a été publiée.`,
    {
      replay_id: replay.id,
      title: replay.title,
      replay_date: replay.replay_date
    },
    'low'
  );
}

module.exports = {
  notify,
  notifyNewUser,
  notifyNewSubscription,
  notifyNewPayment,
  notifyPaymentCompleted,
  notifyNewMessage,
  notifyNewReplay
};