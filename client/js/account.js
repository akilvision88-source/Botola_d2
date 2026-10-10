/* =========================================================
   BOTOLA D2 — account.js
   User account dashboard: profile, subscription, saved,
   notifications, downloads, security.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);

  if (!Auth.requireAuth('/login')) return;

  await loadAccount();
  bindNav();
  bindForms();
  bindAvatarUpload();

  // Handle hash
  const hash = (window.location.hash || '').replace('#','');
  if (hash) switchSection(hash);
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

/* ============ DATA LOAD ============ */
async function loadAccount() {
  try {
    const res = await API.admin ? null : null; // placeholder to avoid unused warning
  } catch (_) {}

  try {
    const res = await fetch(window.BD_CONFIG.API_BASE + '/users/me', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY) }
    }).then(r => r.json());

    const u = res?.data;
    if (!u) throw new Error('No user');

    // Profile
    document.getElementById('accountName').textContent = u.full_name || '—';
    document.getElementById('accountEmail').textContent = u.email || '—';
    const avatar = document.getElementById('accountAvatar');
    if (avatar) avatar.src = u.avatar ? (window.BD_CONFIG.ASSETS_BASE + u.avatar) : '/assets/images/avatar-default.svg';

    // Plan badge
    const badge = document.getElementById('accountPlanBadge');
    if (badge && u.plan) {
      const slug = u.plan.slug || 'free';
      badge.className = 'account-user-badge plan-' + slug;
      const icon = slug === 'gold' ? 'fa-crown' : slug === 'standard' ? 'fa-star' : 'fa-seedling';
      badge.innerHTML = `<i class="fa-solid ${icon}"></i> ${BD.escapeHtml(u.plan.name || slug.toUpperCase())}`;
    }

    // Fill form
    const form = document.getElementById('profileForm');
    if (form) {
      form.full_name.value = u.full_name || '';
      form.phone.value = u.phone || '';
      form.email.value = u.email || '';
      form.language.value = u.language || 'fr';
    }

    // Subscription box
    renderSubscription(u);

    // Saved matches
    loadSavedMatches();

    // Notifications
    loadNotifications();

    // Downloads
    loadDownloads();
  } catch (err) {
    console.warn('loadAccount error:', err);
  }
}

function renderSubscription(u) {
  const box = document.getElementById('subInfoBox');
  if (!box) return;

  if (!u.plan) {
    box.innerHTML = BD.emptyState('fa-crown', I18N.t('account.no_sub','No active subscription.'));
    return;
  }

  const start = u.subscription_start ? BD.formatDate(u.subscription_start, I18N.getLang()) : '—';
  const end   = u.subscription_end ? BD.formatDate(u.subscription_end, I18N.getLang()) : '—';
  const status = u.subscription_status || 'pending';

  box.innerHTML = `
    <div class="account-sub-card plan-${BD.escapeHtml(u.plan.slug || 'free')}">
      <div class="account-sub-head">
        <div class="account-sub-icon"><i class="fa-solid fa-crown"></i></div>
        <div>
          <div class="account-sub-name">${BD.escapeHtml(u.plan.name || '')}</div>
          <div class="account-sub-price">
            ${Number(u.plan.price) === 0 ? I18N.t('subscription.free','Free') : `${Number(u.plan.price).toFixed(2)} ${u.plan.currency || 'MAD'}`}
          </div>
        </div>
        <div class="account-sub-status status-${status}">${I18N.t('subscription.status_' + status, status)}</div>
      </div>
      <div class="account-sub-grid">
        <div class="account-sub-info">
          <span class="account-sub-label">${I18N.t('account.started_on','Started on')}</span>
          <span class="account-sub-val">${start}</span>
        </div>
        <div class="account-sub-info">
          <span class="account-sub-label">${I18N.t('account.ends_on','Ends on')}</span>
          <span class="account-sub-val">${end}</span>
        </div>
      </div>
      <div class="account-sub-actions">
        <a href="/subscription" class="btn-bd btn-bd-primary">
          <i class="fa-solid fa-arrow-up"></i>
          ${u.plan.slug === 'gold' ? I18N.t('account.renew','Renew') : I18N.t('account.upgrade','Upgrade')}
        </a>
      </div>
    </div>
  `;
}

async function loadSavedMatches() {
  const box = document.getElementById('savedMatchesBox');
  if (!box) return;
  box.innerHTML = `<div class="skeleton skel-card" style="height:120px"></div>`;

  try {
    // Saved matches can be fetched from /users/me saved matches; but our API
    // doesn't expose it directly. Fetch from notifications with type match_reminder.
    const res = await API.myNotifications();
    const items = (res?.data || []).filter(n => n.type === 'match_reminder');

    if (!items.length) {
      box.innerHTML = BD.emptyState('fa-bookmark', I18N.t('account.no_saved','No saved matches yet.'));
      return;
    }
    box.innerHTML = items.map(n => `
      <div class="account-list-item">
        <div class="account-list-icon"><i class="fa-regular fa-bell"></i></div>
        <div class="account-list-body">
          <div class="account-list-title">${BD.escapeHtml(n.title)}</div>
          <div class="account-list-meta">${BD.escapeHtml(n.message || '')}</div>
        </div>
        ${n.match_id ? `<a href="/match/${n.match_id}" class="btn-bd btn-bd-ghost btn-bd-sm">
          <i class="fa-solid fa-arrow-right"></i>
        </a>` : ''}
      </div>
    `).join('');
  } catch (e) {
    box.innerHTML = BD.emptyState('fa-triangle-exclamation', I18N.t('errors.load_failed','Could not load.'));
  }
}

async function loadNotifications() {
  const box = document.getElementById('notificationsBox');
  if (!box) return;
  box.innerHTML = `<div class="skeleton skel-card" style="height:100px"></div>`;

  try {
    const res = await API.myNotifications();
    const items = res?.data || [];

    if (!items.length) {
      box.innerHTML = BD.emptyState('fa-bell', I18N.t('account.no_notifications','No notifications.'));
      return;
    }
    box.innerHTML = items.map(n => `
      <div class="account-list-item ${n.is_read ? 'is-read' : ''}">
        <div class="account-list-icon ${n.is_read ? 'muted' : ''}"><i class="fa-solid fa-bell"></i></div>
        <div class="account-list-body">
          <div class="account-list-title">${BD.escapeHtml(n.title)}</div>
          <div class="account-list-meta">${BD.escapeHtml(n.message || '')}</div>
          <div class="account-list-date">${BD.formatDate(n.created_at, I18N.getLang())}</div>
        </div>
        ${!n.is_read ? `<button class="btn-bd btn-bd-ghost btn-bd-sm js-mark-read" data-id="${n.id}">
          <i class="fa-solid fa-check"></i>
        </button>` : ''}
      </div>
    `).join('');

    bindMarkRead();
  } catch (e) {
    box.innerHTML = BD.emptyState('fa-triangle-exclamation', I18N.t('errors.load_failed','Could not load.'));
  }
}

function bindMarkRead() {
  document.querySelectorAll('.js-mark-read').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      try {
        await API.markRead(id);
        btn.closest('.account-list-item').classList.add('is-read');
        btn.remove();
      } catch (_) {}
    });
  });
}

async function loadDownloads() {
  const box = document.getElementById('downloadsBox');
  if (!box) return;
  // Backend doesn't expose downloads list per user in our current API,
  // fallback to a friendly empty state.
  box.innerHTML = BD.emptyState('fa-download', I18N.t('account.no_downloads','No downloads yet.'));
}

/* ============ NAV ============ */
function bindNav() {
  document.querySelectorAll('.account-nav-link').forEach(link => {
    link.addEventListener('click', () => switchSection(link.getAttribute('data-section')));
  });
  window.addEventListener('hashchange', () => {
    const h = (window.location.hash || '').replace('#','');
    if (h) switchSection(h);
  });
}

function switchSection(name) {
  document.querySelectorAll('.account-nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-section') === name);
  });
  document.querySelectorAll('.account-panel').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-panel') === name);
  });
  history.replaceState(null, '', '#' + name);
}

/* ============ FORMS ============ */
function bindForms() {
  // Profile
  const pform = document.getElementById('profileForm');
  pform?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      full_name: pform.full_name.value.trim(),
      phone: pform.phone.value.trim(),
      language: pform.language.value
    };
    if (!payload.full_name || payload.full_name.length < 2) {
      Toast.error(I18N.t('auth.err_name','Enter your full name'));
      return;
    }
    const btn = document.getElementById('profileSubmit');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${I18N.t('common.loading','Saving...')}`;

    try {
      await API.updateMe(payload);
      Toast.success(I18N.t('account.profile_updated','Profile updated'));
      await Auth.refreshMe();
      if (payload.language !== I18N.getLang()) {
        await I18N.setLang(payload.language);
      }
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Error'));
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

  // Password
  const pwdForm = document.getElementById('passwordForm');
  pwdForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cur = pwdForm.current_password.value;
    const nw  = pwdForm.new_password.value;
    const cf  = pwdForm.confirm_password.value;

    if (!cur || !nw) { Toast.error(I18N.t('account.fill_passwords','Please fill all password fields')); return; }
    if (nw.length < 8) { Toast.error(I18N.t('auth.err_password_short','Password must be at least 8 characters')); return; }
    if (nw !== cf) { Toast.error(I18N.t('auth.err_password_match','Passwords do not match')); return; }

    const btn = document.getElementById('passwordSubmit');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${I18N.t('common.loading','Updating...')}`;

    try {
      await API.changePassword({ current_password: cur, new_password: nw });
      Toast.success(I18N.t('account.password_updated','Password updated'));
      pwdForm.reset();
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Error'));
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

  // Toggles
  bindPasswordToggles();

  // Mark all read
  document.getElementById('markAllReadBtn')?.addEventListener('click', async () => {
    try {
      await API.markAllRead();
      Toast.success(I18N.t('account.all_read','All marked as read'));
      loadNotifications();
    } catch (_) {}
  });
}

function bindPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-toggle-password'));
      if (!input) return;
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.innerHTML = `<i class="fa-regular ${isPwd ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
    });
  });
}

function bindAvatarUpload() {
  const input = document.getElementById('avatarInput');
  if (!input) return;
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { Toast.error(I18N.t('account.file_too_big','File too large (max 5MB)')); return; }

    const fd = new FormData();
    fd.append('avatar', file);

    try {
      await API.uploadAvatar(fd);
      Toast.success(I18N.t('account.avatar_updated','Avatar updated'));
      await Auth.refreshMe();
      const res = await fetch(window.BD_CONFIG.API_BASE + '/users/me', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY) }
      }).then(r => r.json());
      if (res?.data?.avatar) {
        document.getElementById('accountAvatar').src = window.BD_CONFIG.ASSETS_BASE + res.data.avatar;
      }
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Error'));
    }
  });
}