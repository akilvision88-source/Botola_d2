/* =========================================================
   BOTOLA D2 — paymentRoutes.js
   ========================================================= */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

/* ✅ Initiate payment */
router.post('/initiate', authenticate, ctrl.initiate);

/* ✅ Complete payment */
router.post('/complete', authenticate, ctrl.complete);

/* ✅ My invoices list */
router.get('/my-invoices', authenticate, ctrl.myInvoices);

/* ✅ Download invoice PDF (cards + paypal) */
router.get('/invoice/:invoiceNumber', authenticate, ctrl.downloadInvoice);

/* ✅ Download devis PDF (Wafacash / Cash Plus) */
router.get('/devis/:invoiceNumber', authenticate, ctrl.downloadDevis);

module.exports = router;