/* =========================================================
   BOTOLA D2 Admin — subscriptions.js (v3 FIXED)
   ========================================================= */

let plansCache = [];
let historyPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('subscriptions', 'Subscriptions');
  if (!user) return;

  bindUI();
  loadPlans();
  loadHistory(1);
});

function bindUI() {
  document.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.sub-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.sub-panel').forEach(p => {
        p.style.display = p.getAttribute('data-panel') === target ? '' : 'none';
      });
    });
  });

  document.getElementById('addPlanBtn')?.addEventListener('click', () => openModal(null));
  document.getElementById('planForm')?.addEventListener('submit', onSave);
}

/* ============ PLANS ============ */
async function loadPlans() {
  try {
    const res = await AdminAPI.plansList();
    plansCache = res?.data || [];
    renderPlans();
  } catch (err) {
    document.getElementById('plansGrid').innerHTML =
      `<div class="ad-empty" style="grid-column:1/-1"><i class="fa-solid fa-triangle-exclamation"></i><h3>Failed to load plans</h3></div>`;
  }
}

function renderPlans() {
  const grid = document.getElementById('plansGrid');
  if (!plansCache.length) {
    grid.innerHTML = `<div class="ad-empty" style="grid-column:1/-1"><i class="fa-solid fa-star"></i><h3>No plans yet</h3></div>`;
    return;
  }

  grid.innerHTML = plansCache.map(p => {
    const features = Array.isArray(p.features) ? p.features : [];
    const tierCls = p.slug === 'gold' ? 'gold' : p.slug === 'standard' ? 'standard' : 'free';
    return `
      <div class="ad-stat-card" style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
          <div class="ad-stat-icon ${tierCls === 'gold' ? 'gold' : tierCls === 'standard' ? '' : 'blue'}">
            <i class="fa-solid ${tierCls === 'gold' ? 'fa-crown' : tierCls === 'standard' ? 'fa-star' : 'fa-seedling'}"></i>
          </div>
          ${AdUtil.pillFor(tierCls)}
        </div>
        <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:6px">${AdUtil.esc(p.name)}</div>
        <div style="font-size:22px;font-weight:900;color:${tierCls === 'gold' ? '#FFC857' : '#fff'};letter-spacing:-1px;margin-bottom:6px">
          ${Number(p.price) === 0 ? 'FREE' : `${Number(p.price).toFixed(2)} ${p.currency || 'MAD'}`}
        </div>
        <div style="color:var(--bd-text-dim);font-size:12px;margin-bottom:14px">
          ${p.duration_days >= 3650 ? 'Lifetime' : `${p.duration_days} days`}
        </div>

        <ul style="list-style:none;padding:0;margin:0 0 18px;display:flex;flex-direction:column;gap:6px;min-height:60px">
          ${features.slice(0, 5).map(f => `
            <li style="color:var(--bd-text-muted);font-size:12.5px;display:flex;gap:8px;align-items:flex-start">
              <i class="fa-solid fa-check" style="color:var(--bd-success);margin-top:2px;font-size:11px"></i>
              <span>${AdUtil.esc(f)}</span>
            </li>`).join('')}
          ${features.length === 0 ? `<li style="color:var(--bd-text-dim);font-size:12px">No features listed</li>` : ''}
        </ul>

        <div style="display:flex;gap:6px;margin-top:auto">
          <button class="ad-btn ad-btn-ghost ad-btn-sm" style="flex:1" data-plan-edit="${p.id}">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          ${p.slug !== 'free' ? `
            <button class="ad-row-btn danger" data-plan-delete="${p.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('[data-plan-edit]').forEach(b => {
    b.addEventListener('click', () => {
      const p = plansCache.find(x => String(x.id) === b.getAttribute('data-plan-edit'));
      if (p) openModal(p);
    });
  });

  grid.querySelectorAll('[data-plan-delete]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-plan-delete');
      const ok = await AdUtil.confirmDialog('Deactivate plan?', 'Existing subscribers stay unaffected.', 'Deactivate');
      if (!ok) return;
      try {
        await AdminAPI.planDelete(id);
        AdToast.success('Plan deactivated');
        loadPlans();
      } catch (err) { AdToast.error(err.message || 'Failed'); }
    });
  });
}

/* ============ MODAL ============ */
function openModal(p) {
  const form = document.getElementById('planForm');
  form.reset();

  const isEdit = !!p;
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Plan' : 'Add Plan';

  if (isEdit) {
    // ✅ حقول موجودة فقط
    form.id.value = p.id;
    form.name.value = p.name || '';
    form.slug.value = p.slug || '';
    form.slug.disabled = true;
    form.description.value = p.description || '';
    form.price.value = p.price || 0;
    form.currency.value = p.currency || 'MAD';
    form.duration_days.value = p.duration_days || 30;
    form.features.value = (Array.isArray(p.features) ? p.features : []).join('\n');
    form.display_order.value = p.display_order || 0;
    // ❌ لا نلمس live_access/replay_access/... (غير موجودة)
  } else {
    form.slug.disabled = false;
    form.price.value = 0;
    form.currency.value = 'MAD';
    form.duration_days.value = 30;
    form.display_order.value = 0;
  }

  AdUtil.openModal('planModal');
}

/* ============ SAVE ============ */
async function onSave(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const isEdit = !!form.id.value;

  const featuresRaw = form.features.value.trim();
  const features = featuresRaw
    ? featuresRaw.split('\n').map(s => s.trim()).filter(Boolean)
    : [];

  const payload = {
    name: form.name.value.trim(),
    slug: form.slug.value.trim().toLowerCase(),
    description: form.description.value.trim() || null,
    price: parseFloat(form.price.value) || 0,
    currency: form.currency.value.trim() || 'MAD',
    duration_days: parseInt(form.duration_days.value, 10) || 30,
    features,
    display_order: parseInt(form.display_order.value, 10) || 0
    // ❌ لا نرسل live_access/replay_access/...
  };

  if (!payload.name || (!isEdit && !payload.slug)) {
    AdToast.error('Name and slug are required');
    return;
  }

  const btn = document.getElementById('saveBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  try {
    if (isEdit) {
      delete payload.slug;
      await AdminAPI.planUpdate(form.id.value, payload);
      AdToast.success('Plan updated');
    } else {
      await AdminAPI.planCreate(payload);
      AdToast.success('Plan created');
    }
    AdUtil.closeModal('planModal');
    loadPlans();
  } catch (err) {
    AdToast.error(err.message || 'Save failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ============ HISTORY ============ */
async function loadHistory(p = 1) {
  historyPage = p;
  const tbody = document.getElementById('subsBody');
  AdUtil.showTableSkeleton(tbody, 7, 6);

  try {
    const res = await AdminAPI.subscriptionsList({ page: p, limit: 20 });
    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    if (!items.length) {
      tbody.innerHTML = AdUtil.emptyRow(7, 'No subscriptions yet');
      AdUtil.paginate(document.getElementById('subsPagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = items.map(s => `
      <tr>
        <td>
          <div class="ad-avatar-cell">
            ${AdUtil.avatar(s.user || {})}
            <div>
              <div class="name">${AdUtil.esc(s.user?.full_name || '—')}</div>
              <div class="sub">${AdUtil.esc(s.user?.email || '')}</div>
            </div>
          </div>
        </td>
        <td>${AdUtil.pillFor(s.plan?.slug || 'free')} ${AdUtil.esc(s.plan?.name || '')}</td>
        <td><strong>${Number(s.amount).toFixed(2)} ${AdUtil.esc(s.currency || 'MAD')}</strong></td>
        <td>${AdUtil.statusPill(s.status)}</td>
        <td>${AdUtil.fmtDate(s.start_date)}</td>
        <td>${AdUtil.fmtDate(s.end_date)}</td>
        <td>${AdUtil.fmtDate(s.created_at)}</td>
      </tr>
    `).join('');

    AdUtil.paginate(document.getElementById('subsPagination'), pagination, loadHistory);
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(7, 'Failed to load: ' + (err.message || ''));
  }
}