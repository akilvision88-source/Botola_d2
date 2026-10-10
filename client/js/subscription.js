/* =========================================================
   BOTOLA D2 — subscription.js (v2)
   Plans + redirect to payment page
   ========================================================= */

let plansCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  loadPlans();
  loadMySubscription();
  I18N.onChange(() => { renderPlans(plansCache); renderBanner(); });
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
   LOAD PLANS
   ========================================================= */
async function loadPlans() {
  const grid = document.getElementById('plansGrid');
  if (!grid) return;
  try {
    const res = await API.plans();
    plansCache = res?.data || [];
    renderPlans(plansCache);
  } catch (e) {
    grid.innerHTML = BD.emptyState('fa-triangle-exclamation', I18N.t('errors.load_failed','Could not load plans.'));
  }
}

/* =========================================================
   RENDER PLANS
   ========================================================= */
function renderPlans(plans) {
  const grid = document.getElementById('plansGrid');
  if (!grid) return;

  if (!plans.length) {
    grid.innerHTML = BD.emptyState('fa-crown', I18N.t('subscription.no_plans','No plans available.'));
    return;
  }

  // Sort by price ascending
  const sorted = [...plans].sort((a, b) => Number(a.price) - Number(b.price));
  const currentPlanId = Auth.getUser()?.subscription_plan_id || null;

  grid.innerHTML = sorted.map(p => renderPlanCard(p, currentPlanId)).join('');
  bindSubscribe();
}

function renderPlanCard(p, currentPlanId) {
  const isCurrent = currentPlanId === p.id;
  const slug = p.slug || '';
  const isGold = slug === 'gold';
  const isStd  = slug === 'standard';
  const isFree = slug === 'free';

  const cardCls = isGold ? 'plan-gold' : isStd ? 'plan-standard' : 'plan-free';

  const features = Array.isArray(p.features) ? p.features : [];
  const isPopular = isGold;

  const priceLabel = Number(p.price) === 0
    ? I18N.t('subscription.free', 'Free')
    : `${Number(p.price).toFixed(2)} ${p.currency || 'MAD'}`;

  const durationLabel = p.duration_days >= 3650
    ? I18N.t('subscription.lifetime','Lifetime')
    : `/${p.duration_days} ${I18N.t('subscription.days','days')}`;

  return `
    <div class="plan-card ${cardCls} ${isCurrent ? 'plan-current' : ''}">
      ${isPopular ? `<div class="plan-ribbon">${I18N.t('subscription.most_popular','MOST POPULAR')}</div>` : ''}
      ${isCurrent ? `<div class="plan-current-badge"><i class="fa-solid fa-check"></i> ${I18N.t('subscription.current','Current plan')}</div>` : ''}

      <div class="plan-head">
        <div class="plan-icon ${cardCls}">
          <i class="fa-solid ${isGold ? 'fa-crown' : isStd ? 'fa-star' : 'fa-seedling'}"></i>
        </div>
        <h3 class="plan-name">${BD.escapeHtml(p.name)}</h3>
        ${p.description ? `<p class="plan-desc">${BD.escapeHtml(p.description)}</p>` : ''}
      </div>

      <div class="plan-price">
        <span class="plan-price-num">${priceLabel}</span>
        ${Number(p.price) > 0 ? `<span class="plan-price-period">${durationLabel}</span>` : ''}
      </div>

      <ul class="plan-features">
        ${features.map(f => `
          <li><i class="fa-solid fa-circle-check"></i> <span>${BD.escapeHtml(f)}</span></li>
        `).join('')}
      </ul>

      <div class="plan-cta">
        ${isCurrent
          ? `<button class="btn-bd btn-bd-ghost btn-bd-block" disabled>
               <i class="fa-solid fa-check"></i> ${I18N.t('subscription.active','Active')}
             </button>`
          : isFree
            ? `<button class="btn-bd btn-bd-outline btn-bd-block" disabled>
                 ${I18N.t('subscription.default_plan','Default plan')}
               </button>`
            : `<button class="btn-bd ${isGold ? 'btn-bd-gold' : 'btn-bd-primary'} btn-bd-block js-subscribe" data-id="${p.id}" data-slug="${slug}">
                 <i class="fa-solid fa-credit-card"></i> ${I18N.t('actions.subscribe_now','SUBSCRIBE NOW')}
               </button>`
        }
      </div>
    </div>
  `;
}

/* =========================================================
   BIND SUBSCRIBE → Redirect to payment page
   ========================================================= */
function bindSubscribe() {
  document.querySelectorAll('.js-subscribe').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = parseInt(btn.getAttribute('data-id'), 10);
      const slug = btn.getAttribute('data-slug');

      if (!Auth.isLoggedIn()) {
        Toast.info(I18N.t('auth.login_required','Please log in first'));
        setTimeout(() => {
          window.location.href = '/login?next=' + encodeURIComponent('/subscription');
        }, 800);
        return;
      }

      // ✅ Redirect to payment page with selected plan
      window.location.href = '/payment?plan=' + id;
    });
  });
}

/* =========================================================
   LOAD MY SUBSCRIPTION
   ========================================================= */
async function loadMySubscription() {
  if (!Auth.isLoggedIn()) return;
  try {
    const res = await API.mySubscription();
    window.__mySub = res?.data || null;
    renderBanner();
  } catch (_) {}
}

/* =========================================================
   RENDER CURRENT SUBSCRIPTION BANNER
   ========================================================= */
function renderBanner() {
  const box = document.getElementById('currentSubBanner');
  if (!box) return;
  const sub = window.__mySub;
  if (!sub || !sub.plan) { box.style.display = 'none'; return; }

  const endDate = sub.end ? BD.formatDate(sub.end, I18N.getLang()) : '—';
  const statusKey = 'subscription.status_' + (sub.status || 'pending');

  box.style.display = '';
  box.innerHTML = `
    <div class="current-sub-banner">
      <div class="current-sub-left">
        <div class="current-sub-icon"><i class="fa-solid fa-crown"></i></div>
        <div>
          <div class="current-sub-title">
            ${I18N.t('subscription.current_plan','Current plan')}: <strong>${BD.escapeHtml(sub.plan.name || '')}</strong>
          </div>
          <div class="current-sub-meta">
            ${I18N.t('subscription.status','Status')}: <span class="status-${sub.status}">${I18N.t(statusKey, sub.status)}</span>
            · ${I18N.t('subscription.ends_on','Ends on')}: ${endDate}
          </div>
        </div>
      </div>
      <a href="/account#subscription" class="btn-bd btn-bd-ghost btn-bd-sm">
        ${I18N.t('subscription.manage','Manage')} <i class="fa-solid fa-arrow-right"></i>
      </a>
    </div>
  `;
}