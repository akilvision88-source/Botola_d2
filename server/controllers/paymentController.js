/* =========================================================
   BOTOLA D2 — paymentController.js (v3)
   Payments + Invoices + Devis + Admin notifications
   ========================================================= */

const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Payment, SubscriptionPlan, Subscription, User } = require('../models');
const { success, error } = require('../utils/response');
const { cleanString, toInt } = require('../utils/validators');
const { notifyNewPayment, notifyPaymentCompleted } = require('../services/adminNotifier');

/* =========================================================
   HELPERS
   ========================================================= */
function generateInvoiceNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `INV-${y}${m}-${rand}`;
}

function generateAgencyCode(method) {
  const prefix = method === 'wafacash' ? 'WF' : 'CP';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

/* =========================================================
   POST /api/payments/initiate
   ========================================================= */
const initiate = async (req, res, next) => {
  try {
    const plan_id = toInt(req.body.plan_id);
    const payment_method = req.body.payment_method;

    if (!plan_id || !payment_method) {
      return error(res, 'plan_id et payment_method requis', 400);
    }

    const validMethods = ['visa', 'mastercard', 'paypal', 'wafacash', 'cashplus'];
    if (!validMethods.includes(payment_method)) {
      return error(res, 'Méthode de paiement invalide', 400);
    }

    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan || !plan.is_active) return error(res, 'Forfait indisponible', 404);

    const invoiceNumber = generateInvoiceNumber();

    const payment = await Payment.create({
      user_id: req.user.id,
      plan_id: plan.id,
      amount: plan.price,
      currency: plan.currency || 'MAD',
      payment_method,
      status: 'pending',
      invoice_number: invoiceNumber,
      payment_reference: req.body.payment_token || null
    });

    // ✅ Notify admin
    try {
      const user = await User.findByPk(req.user.id);
      notifyNewPayment(user, plan, payment).catch(() => {});
    } catch (_) {}

    /* PayPal */
    if (payment_method === 'paypal') {
      const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=SIMULATED_${payment.id}`;
      return success(res, {
        payment_id: payment.id,
        approval_url: approvalUrl,
        invoice_number: invoiceNumber
      }, 'PayPal order created');
    }

    /* Cards */
    if (payment_method === 'visa' || payment_method === 'mastercard') {
      return success(res, {
        payment_id: payment.id,
        invoice_number: invoiceNumber,
        status: 'pending_confirmation'
      }, 'Carte traitée');
    }

    /* Cash */
    return success(res, {
      payment_id: payment.id,
      invoice_number: invoiceNumber,
      payment_token: req.body.payment_token,
      status: 'pending_cash',
      instructions: `Présentez le code ${req.body.payment_token} en agence`
    }, 'En attente du paiement en agence');
  } catch (err) { next(err); }
};

/* =========================================================
   POST /api/payments/complete
   ========================================================= */
const complete = async (req, res, next) => {
  try {
    const payment_id = toInt(req.body.payment_id);
    if (!payment_id) return error(res, 'payment_id requis', 400);

    const payment = await Payment.findByPk(payment_id, {
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    if (!payment) return error(res, 'Paiement introuvable', 404);
    if (payment.user_id !== req.user.id && !['super_admin', 'admin'].includes(req.user.role?.slug)) {
      return error(res, 'Accès refusé', 403);
    }
    if (payment.status === 'completed') {
      return success(res, { invoice_number: payment.invoice_number }, 'Déjà complété');
    }

    await payment.update({
      status: 'completed',
      paid_at: new Date()
    });

    const now = new Date();
    const end = new Date(now.getTime() + payment.plan.duration_days * 24 * 60 * 60 * 1000);

    await Subscription.create({
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      payment_reference: payment.payment_reference,
      status: 'active',
      start_date: now,
      end_date: end
    });

    await User.update({
      subscription_plan_id: payment.plan_id,
      subscription_start: now,
      subscription_end: end,
      subscription_status: 'active'
    }, { where: { id: payment.user_id } });

    // ✅ Notify admin
    try {
      const user = await User.findByPk(payment.user_id);
      notifyPaymentCompleted(user, payment.plan, payment).catch(() => {});
    } catch (_) {}

    return success(res, {
      invoice_number: payment.invoice_number,
      payment_id: payment.id
    }, 'Paiement complété');
  } catch (err) { next(err); }
};

/* =========================================================
   GET /api/payments/invoice/:invoiceNumber
   ========================================================= */
const downloadInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = req.params.invoiceNumber;

    const payment = await Payment.findOne({
      where: { invoice_number: invoiceNumber },
      include: [
        { model: SubscriptionPlan, as: 'plan' },
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone', 'created_at'] }
      ]
    });

    if (!payment) return error(res, 'Facture introuvable', 404);

    if (req.user.id !== payment.user_id && !['super_admin', 'admin'].includes(req.user.role?.slug)) {
      return error(res, 'Accès refusé', 403);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${invoiceNumber}.pdf`);

    doc.pipe(res);
    generateInvoicePDF(doc, payment);
    doc.end();
  } catch (err) { next(err); }
};

/* =========================================================
   GET /api/payments/devis/:invoiceNumber
   ========================================================= */
const downloadDevis = async (req, res, next) => {
  try {
    const invoiceNumber = req.params.invoiceNumber;

    const payment = await Payment.findOne({
      where: { invoice_number: invoiceNumber },
      include: [
        { model: SubscriptionPlan, as: 'plan' },
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone', 'created_at'] }
      ]
    });

    if (!payment) return error(res, 'Paiement introuvable', 404);

    if (req.user.id !== payment.user_id && !['super_admin', 'admin'].includes(req.user.role?.slug)) {
      return error(res, 'Accès refusé', 403);
    }

    if (!['wafacash', 'cashplus'].includes(payment.payment_method)) {
      return error(res, 'Ce bon de paiement est réservé aux paiements en espèces', 400);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=devis-${invoiceNumber}.pdf`);

    doc.pipe(res);
    generateDevisPDF(doc, payment);
    doc.end();
  } catch (err) { next(err); }
};

/* =========================================================
   GET /api/payments/my-invoices
   ========================================================= */
const myInvoices = async (req, res, next) => {
  try {
    const payments = await Payment.findAll({
      where: { user_id: req.user.id, status: 'completed' },
      include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name', 'slug'] }],
      order: [['created_at', 'DESC']],
      limit: 50
    });
    return success(res, payments);
  } catch (err) { next(err); }
};

/* =========================================================
   GENERATE INVOICE PDF
   ========================================================= */
function generateInvoicePDF(doc, payment) {
  const PRIMARY = '#A200C7';
  const DARK = '#1a1a1a';
  const MUTED = '#666666';

  const logoPath = path.join(__dirname, '..', '..', 'client', 'assets', 'images', 'logo.png');
  try {
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 45, { width: 55 });
  } catch (_) {}

  doc.fillColor(PRIMARY).fontSize(24).font('Helvetica-Bold').text('BOTOLA D2', 115, 50);
  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text('Plateforme de streaming football', 115, 78)
    .text('contact@botolad2.com | +212 600 000 000', 115, 91)
    .text('Casablanca, Maroc', 115, 104);

  doc.fillColor(DARK).fontSize(22).font('Helvetica-Bold')
    .text('FACTURE', 400, 50, { align: 'right', width: 145 });
  doc.fillColor(MUTED).fontSize(10).font('Helvetica')
    .text(`N° ${payment.invoice_number}`, 400, 85, { align: 'right', width: 145 })
    .text(`Date: ${new Date(payment.created_at).toLocaleDateString('fr-FR')}`, 400, 100, { align: 'right', width: 145 });

  doc.moveTo(50, 140).lineTo(545, 140).strokeColor(PRIMARY).lineWidth(2).stroke();

  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Facturé à :', 50, 170);
  doc.fillColor(MUTED).fontSize(11).font('Helvetica')
    .text(payment.user.full_name || '—', 50, 192)
    .text(payment.user.email || '—', 50, 208)
    .text(payment.user.phone || '', 50, 224);

  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Paiement :', 350, 170);
  doc.fillColor(MUTED).fontSize(11).font('Helvetica')
    .text(`Méthode: ${payment.payment_method.toUpperCase()}`, 350, 192)
    .text(`Statut: ${payment.status}`, 350, 208)
    .text(`Réf: ${payment.payment_reference || payment.invoice_number}`, 350, 224);

  const tableTop = 280;
  doc.fillColor(PRIMARY).rect(50, tableTop, 495, 26).fill();
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
    .text('Description', 60, tableTop + 8)
    .text('Durée', 320, tableTop + 8)
    .text('Montant', 430, tableTop + 8, { width: 100, align: 'right' });

  const rowY = tableTop + 40;
  const durationText = payment.plan.duration_days >= 3650 ? 'Lifetime' : `${payment.plan.duration_days} jours`;

  doc.fillColor(DARK).fontSize(11).font('Helvetica')
    .text(`Abonnement ${payment.plan.name}`, 60, rowY)
    .text(durationText, 320, rowY)
    .text(`${Number(payment.amount).toFixed(2)} ${payment.currency}`, 430, rowY, { width: 100, align: 'right' });

  const totalY = rowY + 50;
  doc.moveTo(350, totalY).lineTo(545, totalY).strokeColor('#cccccc').lineWidth(1).stroke();
  doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold').text('TOTAL', 350, totalY + 12);
  doc.fillColor(PRIMARY).fontSize(18)
    .text(`${Number(payment.amount).toFixed(2)} ${payment.currency}`, 420, totalY + 8, { width: 125, align: 'right' });

  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text('Merci pour votre confiance — BOTOLA D2', 50, 750, { align: 'center', width: 495 })
    .text('Cette facture est générée automatiquement et fait foi de paiement.', 50, 765, { align: 'center', width: 495 });
}

/* =========================================================
   GENERATE DEVIS PDF
   ========================================================= */
function generateDevisPDF(doc, payment) {
  const PRIMARY = '#A200C7';
  const DARK = '#1a1a1a';
  const MUTED = '#666666';
  const BG_LIGHT = '#F5F5F5';

  const isWafacash = payment.payment_method === 'wafacash';
  const methodName = isWafacash ? 'WAFACASH' : 'CASH PLUS';
  const methodColor = isWafacash ? '#00A651' : '#FF6B00';

  const logoPath = path.join(__dirname, '..', '..', 'client', 'assets', 'images', 'logo.png');
  try {
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 45, { width: 55 });
  } catch (_) {}

  doc.fillColor(PRIMARY).fontSize(24).font('Helvetica-Bold').text('BOTOLA D2', 115, 50);
  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text('Plateforme de streaming football', 115, 78)
    .text('contact@botolad2.com | +212 600 000 000', 115, 91)
    .text('Casablanca, Maroc', 115, 104);

  doc.fillColor(methodColor).fontSize(18).font('Helvetica-Bold')
    .text('BON DE PAIEMENT', 350, 50, { align: 'right', width: 195 });
  doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold')
    .text(methodName, 350, 78, { align: 'right', width: 195 });
  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text(`N° ${payment.invoice_number}`, 350, 98, { align: 'right', width: 195 })
    .text(`Date: ${new Date(payment.created_at).toLocaleDateString('fr-FR')}`, 350, 111, { align: 'right', width: 195 });

  doc.moveTo(50, 130).lineTo(545, 130).strokeColor(PRIMARY).lineWidth(3).stroke();

  doc.fillColor(BG_LIGHT).rect(50, 150, 495, 140).fill();
  doc.fillColor(methodColor).rect(50, 150, 495, 32).fill();
  doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold')
    .text('RÉFÉRENCE DE PAIEMENT', 50, 160, { align: 'center', width: 495 });
  doc.fillColor(DARK).fontSize(30).font('Helvetica-Bold')
    .text(payment.payment_reference || payment.invoice_number, 50, 198, { align: 'center', width: 495 });
  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text('Code Agence', 50, 240, { align: 'center', width: 495 });
  doc.fillColor(methodColor).fontSize(16).font('Helvetica-Bold')
    .text(generateAgencyCode(payment.payment_method), 50, 254, { align: 'center', width: 495 });

  let yPos = 320;
  doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold').text('INFORMATIONS CLIENT', 50, yPos);
  doc.moveTo(50, yPos + 18).lineTo(250, yPos + 18).strokeColor(PRIMARY).lineWidth(1).stroke();
  yPos += 30;

  doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('Nom complet :', 50, yPos);
  doc.fillColor(DARK).font('Helvetica').text(payment.user.full_name || '—', 160, yPos);
  yPos += 17;
  doc.fillColor(MUTED).font('Helvetica-Bold').text('Email :', 50, yPos);
  doc.fillColor(DARK).font('Helvetica').text(payment.user.email || '—', 160, yPos);
  yPos += 17;
  doc.fillColor(MUTED).font('Helvetica-Bold').text('Téléphone :', 50, yPos);
  doc.fillColor(DARK).font('Helvetica').text(payment.user.phone || '—', 160, yPos);
  yPos += 17;
  doc.fillColor(MUTED).font('Helvetica-Bold').text("Date d'inscription :", 50, yPos);
  doc.fillColor(DARK).font('Helvetica').text(new Date(payment.user.created_at || Date.now()).toLocaleDateString('fr-FR'), 160, yPos);

  yPos += 40;
  doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold').text('DÉTAILS DU FORFAIT', 50, yPos);
  doc.moveTo(50, yPos + 18).lineTo(250, yPos + 18).strokeColor(PRIMARY).lineWidth(1).stroke();
  yPos += 30;

  doc.fillColor(MUTED).fontSize(10).font('Helvetica-Bold').text('Forfait :', 50, yPos);
  doc.fillColor(DARK).font('Helvetica').text(payment.plan.name || '—', 160, yPos);
  yPos += 17;
  const durationText = payment.plan.duration_days >= 3650 ? 'Lifetime' : `${payment.plan.duration_days} jours`;
  doc.fillColor(MUTED).font('Helvetica-Bold').text('Durée :', 50, yPos);
  doc.fillColor(DARK).font('Helvetica').text(durationText, 160, yPos);

  const totalBoxY = yPos - 65;
  doc.fillColor(BG_LIGHT).rect(320, totalBoxY, 225, 105).fill();
  doc.fillColor(PRIMARY).rect(320, totalBoxY, 225, 28).fill();
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
    .text('MONTANT À PAYER', 320, totalBoxY + 8, { align: 'center', width: 225 });
  doc.fillColor(PRIMARY).fontSize(30).font('Helvetica-Bold')
    .text(`${Number(payment.amount).toFixed(2)}`, 320, totalBoxY + 42, { align: 'center', width: 225 });
  doc.fillColor(MUTED).fontSize(11).font('Helvetica')
    .text(payment.currency || 'MAD', 320, totalBoxY + 78, { align: 'center', width: 225 });

  yPos += 60;
  doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold').text('CONDITIONS & DROITS DU CLIENT', 50, yPos);
  doc.moveTo(50, yPos + 18).lineTo(250, yPos + 18).strokeColor(PRIMARY).lineWidth(1).stroke();
  yPos += 30;

  const terms = [
    "Ce bon de paiement est valable pendant 48 heures à compter de sa date d'émission.",
    "Présentez ce document avec le numéro de référence ci-dessus à n'importe quelle agence " + methodName + ".",
    "Le paiement doit être effectué en espèces uniquement.",
    "Une fois le paiement validé en agence, votre abonnement sera activé automatiquement dans les 30 minutes.",
    "Conservez ce reçu comme preuve de paiement jusqu'à l'activation de votre abonnement.",
    "Pour toute question, contactez notre support : contact@botolad2.com",
    "Droit de rétractation : vous disposez de 14 jours pour annuler votre abonnement."
  ];

  terms.forEach((term, i) => {
    doc.fillColor(MUTED).fontSize(9).font('Helvetica')
      .text(`• ${term}`, 55, yPos + (i * 15), { width: 480, lineGap: 2 });
  });

  doc.fillColor(MUTED).fontSize(8).font('Helvetica')
    .text('Ce document est généré automatiquement par BOTOLA D2 — Fait foi de bon de paiement.',
      50, 745, { align: 'center', width: 495 });
  doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold')
    .text('© ' + new Date().getFullYear() + ' BOTOLA D2 — Tous droits réservés',
      50, 762, { align: 'center', width: 495 });
}

module.exports = {
  initiate,
  complete,
  downloadInvoice,
  downloadDevis,
  myInvoices
};