/* =========================================================
   BOTOLA D2 — payment.js (v2 FINAL)
   Payment page: plan selection + payment methods + invoice/devis
   ========================================================= */

let selectedPlan = null;
let selectedMethod = null;
let currentPayment = null;   // ✅ يُحفظ بعد initiate

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);

  if (!Auth.isLoggedIn()) {
    window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }

  const planId = new URLSearchParams(window.location.search).get('plan');
  if (!planId) {
    Toast.error('Aucun forfait sélectionné');
    setTimeout(() => window.location.href = '/subscription', 800);
    return;
  }

  loadPlan(parseInt(planId, 10));
});

function waitFor(cond, timeout = 3000) {
  return new Promise(resolve => {
    const start = Date.now();
    const loop = () => {
      if (cond()) return resolve(true);
      if (Date.now() - start > timeout) return resolve(false);
      setTimeout(loop, 60);
    };
    loop();
  });
}

/* =========================================================
   LOAD PLAN
   ========================================================= */
async function loadPlan(planId) {
  try {
    const res = await API.plans();
    const plans = res?.data || [];
    selectedPlan = plans.find(p => p.id === planId);

    if (!selectedPlan) throw new Error('Plan introuvable');

    document.getElementById('paymentLoading').style.display = 'none';
    document.getElementById('paymentContent').style.display = '';

    renderOrderSummary();
    bindMethods();
  } catch (err) {
    Toast.error(err.message || 'Erreur de chargement');
    setTimeout(() => window.location.href = '/subscription', 1000);
  }
}

/* =========================================================
   ORDER SUMMARY
   ========================================================= */
function renderOrderSummary() {
  const box = document.getElementById('orderSummary');
  const price = Number(selectedPlan.price);
  const durationText = selectedPlan.duration_days >= 3650
    ? 'Lifetime'
    : `${selectedPlan.duration_days} jours`;

  box.innerHTML = `
    <div class="summary-row">
      <span class="label">Forfait</span>
      <span class="value">${selectedPlan.name}</span>
    </div>
    <div class="summary-row">
      <span class="label">Durée</span>
      <span class="value">${durationText}</span>
    </div>
    <div class="summary-row">
      <span class="label">Prix</span>
      <span class="value">${price.toFixed(2)} ${selectedPlan.currency || 'MAD'}</span>
    </div>
    <div class="summary-total">
      <span class="label">Total à payer</span>
      <span class="value">${price.toFixed(2)} ${selectedPlan.currency || 'MAD'}</span>
    </div>
  `;
}

/* =========================================================
   BIND METHODS
   ========================================================= */
function bindMethods() {
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      selectedMethod = btn.getAttribute('data-method');
      renderMethodDetails(selectedMethod);

      const payBtn = document.getElementById('payBtn');
      payBtn.disabled = false;
    });
  });

  document.getElementById('payBtn').addEventListener('click', processPayment);
}

/* =========================================================
   METHOD DETAILS
   ========================================================= */
function renderMethodDetails(method) {
  const box = document.getElementById('paymentDetails');
  box.style.display = '';

  const methods = {
    visa: {
      title: 'Carte Visa',
      body: `
        <div class="form-field">
          <label>Numéro de carte</label>
          <input type="text" id="cardNumber" placeholder="4000 0000 0000 0000" maxlength="19" inputmode="numeric" />
        </div>
        <div class="form-field-row">
          <div class="form-field">
            <label>Expiration</label>
            <input type="text" id="cardExpiry" placeholder="MM/AA" maxlength="5" />
          </div>
          <div class="form-field">
            <label>CVV</label>
            <input type="text" id="cardCvv" placeholder="123" maxlength="4" inputmode="numeric" />
          </div>
        </div>
        <div class="form-field">
          <label>Nom sur la carte</label>
          <input type="text" id="cardName" placeholder="JOHN DOE" />
        </div>
      `
    },
    mastercard: {
      title: 'Carte Mastercard',
      body: `
        <div class="form-field">
          <label>Numéro de carte</label>
          <input type="text" id="cardNumber" placeholder="5453 0100 0006 6100" maxlength="19" inputmode="numeric" />
        </div>
        <div class="form-field-row">
          <div class="form-field">
            <label>Expiration</label>
            <input type="text" id="cardExpiry" placeholder="MM/AA" maxlength="5" />
          </div>
          <div class="form-field">
            <label>CVV</label>
            <input type="text" id="cardCvv" placeholder="123" maxlength="4" inputmode="numeric" />
          </div>
        </div>
        <div class="form-field">
          <label>Nom sur la carte</label>
          <input type="text" id="cardName" placeholder="JOHN DOE" />
        </div>
      `
    },
    paypal: {
      title: 'PayPal',
      body: `
        <div class="payment-info-text">
          <i class="fa-brands fa-cc-paypal"></i>
          Vous serez redirigé vers <strong>PayPal</strong> pour finaliser votre paiement en toute sécurité.
          <br><br>
          <small>Montant : <strong>${Number(selectedPlan.price).toFixed(2)} ${selectedPlan.currency || 'MAD'}</strong></small>
        </div>
      `
    },
    wafacash: {
      title: 'Wafacash',
      body: `
        <div class="payment-info-text">
          <i class="fa-solid fa-money-bill-wave"></i>
          Cliquez sur <strong>Payer maintenant</strong> pour générer votre bon de paiement.
          <br><br>
          Présentez ensuite ce bon dans une agence <strong>Wafacash</strong> pour effectuer le paiement en espèces.
          <span class="token-code" id="paymentToken">—</span>
          <small style="display:block;margin-top:10px">Le paiement sera validé par nos équipes sous 30 minutes.</small>
        </div>
      `
    },
    cashplus: {
      title: 'Cash Plus',
      body: `
        <div class="payment-info-text">
          <i class="fa-solid fa-building-columns"></i>
          Cliquez sur <strong>Payer maintenant</strong> pour générer votre bon de paiement.
          <br><br>
          Présentez ensuite ce bon dans une agence <strong>Cash Plus</strong> pour effectuer le paiement en espèces.
          <span class="token-code" id="paymentToken">—</span>
          <small style="display:block;margin-top:10px">Le paiement sera validé par nos équipes sous 30 minutes.</small>
        </div>
      `
    }
  };

  const m = methods[method];
  if (!m) { box.innerHTML = ''; return; }

  box.innerHTML = `
    <h4 style="font-size: 15px; font-weight: 800; color: #fff; margin: 0 0 18px;">${m.title}</h4>
    ${m.body}
  `;

  // Card formatting
  const cardNum = document.getElementById('cardNumber');
  if (cardNum) {
    cardNum.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
    });
  }

  const expiry = document.getElementById('cardExpiry');
  if (expiry) {
    expiry.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
      e.target.value = v;
    });
  }
}

/* =========================================================
   GENERATE PAYMENT TOKEN (12 digits)
   ========================================================= */
function generatePaymentToken() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

/* =========================================================
   PROCESS PAYMENT
   ========================================================= */
async function processPayment() {
  if (!selectedMethod) {
    Toast.error('Sélectionnez une méthode de paiement');
    return;
  }

  const btn = document.getElementById('payBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Traitement...`;

  // Build payload
  const payload = {
    plan_id: selectedPlan.id,
    payment_method: selectedMethod
  };

  // ✅ Cash methods — generate token
  if (selectedMethod === 'wafacash' || selectedMethod === 'cashplus') {
    const token = generatePaymentToken();
    payload.payment_token = token;

    // Update the token display
    const tokenEl = document.getElementById('paymentToken');
    if (tokenEl) tokenEl.textContent = token;
  }

  // ✅ Card methods — validate fields
  if (selectedMethod === 'visa' || selectedMethod === 'mastercard') {
    const cardNumber = document.getElementById('cardNumber')?.value?.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry')?.value;
    const cardCvv = document.getElementById('cardCvv')?.value;
    const cardName = document.getElementById('cardName')?.value;

    if (!cardNumber || cardNumber.length < 15) {
      Toast.error('Numéro de carte invalide');
      btn.disabled = false; btn.innerHTML = orig; return;
    }
    if (!cardExpiry || !cardCvv || !cardName) {
      Toast.error('Complétez les informations de la carte');
      btn.disabled = false; btn.innerHTML = orig; return;
    }

    payload.card_number = cardNumber;
    payload.card_expiry = cardExpiry;
    payload.card_cvv = cardCvv;
    payload.card_name = cardName;
  }

  try {
    // ✅ Initiate payment
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY)
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (!res.success) throw new Error(res.message || 'Erreur de paiement');

    // ✅ Save current payment
    currentPayment = {
      payment_id: res.data.payment_id,
      invoice_number: res.data.invoice_number,
      payment_method: selectedMethod,
      payment_token: res.data.payment_token
    };
    window.__currentPayment = currentPayment;

    /* =====================================================
       PayPal → redirect
       ===================================================== */
    if (selectedMethod === 'paypal' && res.data?.approval_url) {
      window.location.href = res.data.approval_url;
      return;
    }

    /* =====================================================
       Cash methods (Wafacash / Cash Plus)
       → Show Devis download button
       ===================================================== */
    if (selectedMethod === 'wafacash' || selectedMethod === 'cashplus') {
      // Update token display
      const tokenEl = document.getElementById('paymentToken');
      if (tokenEl) tokenEl.textContent = res.data.payment_token || payload.payment_token;

      Toast.success('Bon de paiement prêt !');

      // ✅ Transform pay button into "Download Devis"
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Télécharger le Bon de Paiement';
      btn.className = 'btn-bd btn-bd-gold btn-bd-lg btn-bd-block';
      btn.onclick = (e) => {
        e.preventDefault();
        downloadDevis();
      };

      // ✅ Add devis button in details box (as secondary)
      const infoBox = document.querySelector('#paymentDetails .payment-info-text');
      if (infoBox && !infoBox.querySelector('.devis-extra')) {
        const note = document.createElement('div');
        note.className = 'devis-extra';
        note.style.cssText = 'margin-top:14px;padding:12px;background:rgba(255,200,87,0.1);border:1px solid rgba(255,200,87,0.3);border-radius:10px;font-size:12px;color:#FFC857;line-height:1.5';
        note.innerHTML = `<i class="fa-solid fa-info-circle"></i> Votre bon est prêt. Téléchargez-le, imprimez-le et présentez-le à l'agence pour payer.`;
        infoBox.appendChild(note);
      }

      return;
    }

    /* =====================================================
       Cards (Visa / Mastercard) → Simulate instant success
       ===================================================== */
    Toast.success('Paiement effectué ! Génération de la facture...');

    const completeRes = await fetch(`${window.BD_CONFIG.API_BASE}/payments/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY)
      },
      body: JSON.stringify({
        payment_id: res.data.payment_id,
        status: 'completed'
      })
    }).then(r => r.json());

    if (completeRes.success) {
      Toast.success('Abonnement activé !');
      setTimeout(() => {
        window.location.href = `/payment-success?invoice=${completeRes.data.invoice_number}`;
      }, 1200);
    }

  } catch (err) {
    Toast.error(err.message || 'Erreur de paiement');
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* =========================================================
   DOWNLOAD DEVIS (Payment Voucher)
   ========================================================= */
async function downloadDevis() {
  const token = localStorage.getItem(window.BD_CONFIG.TOKEN_KEY);
  if (!token) {
    Toast.error('Veuillez vous connecter');
    return;
  }

  if (!currentPayment?.invoice_number) {
    Toast.info('Veuillez d\'abord initier le paiement');
    return;
  }

  const invoiceNumber = currentPayment.invoice_number;

  try {
    const url = `${window.BD_CONFIG.API_BASE}/payments/devis/${invoiceNumber}`;

    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Erreur lors du téléchargement');
    }

    const blob = await res.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `devis-${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);

    Toast.success('Bon de paiement téléchargé !');

    // Show next steps
    setTimeout(() => {
      Toast.info('Présentez ce bon dans une agence pour payer');
    }, 1000);
  } catch (err) {
    Toast.error(err.message || 'Erreur');
  }
}