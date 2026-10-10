/* =========================================================
   BOTOLA D2 — admin-shell.js (v2)
   Shared shell: sidebar, topbar, auth-guard, toast, helpers.
   + Notifications dropdown with polling
   ========================================================= */

window.AdToast = (function () {
  const wrap = () => document.getElementById('adToastWrap');
  const show = (msg, type = 'info', dur = 3200) => {
    const el = document.createElement('div');
    el.className = 'ad-toast ' + type;
    const icon = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warn: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    }[type] || 'fa-circle-info';
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${msg}</span>`;
    wrap()?.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      setTimeout(() => el.remove(), 250);
    }, dur);
  };
  return {
    info:    (m, d) => show(m, 'info', d),
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d),
    warn:    (m, d) => show(m, 'warn', d)
  };
})();

window.AdminShell = (function () {

  const NAV = [
    { group: 'main', items: [
      { key: 'dashboard',     href: '/admin/dashboard.html',      icon: 'fa-gauge-high',        label: 'Dashboard' },
      { key: 'home-sections', href: '/admin/home-sections.html',  icon: 'fa-layer-group',       label: 'Home Sections' },
      { key: 'news',          href: '/admin/news.html',           icon: 'fa-bullhorn',          label: 'News Ticker' }
    ]},
    { group: 'matches', items: [
      { key: 'live',      href: '/admin/live-matches.html',      icon: 'fa-tv',                label: 'Live Matches' },
      { key: 'upcoming',  href: '/admin/upcoming-matches.html',  icon: 'fa-calendar-day',      label: 'Upcoming Matches' },
      { key: 'results',   href: '/admin/results.html',           icon: 'fa-futbol',            label: 'Results' },
      { key: 'replays',   href: '/admin/replays.html',           icon: 'fa-clock-rotate-left', label: 'Replays' },
      { key: 'standings', href: '/admin/standings.html',         icon: 'fa-ranking-star',      label: 'Standings' }
    ]},
    { group: 'data', items: [
      { key: 'teams',     href: '/admin/teams.html',             icon: 'fa-shield-halved',     label: 'Teams' },
      { key: 'stadiums',  href: '/admin/stadiums.html',          icon: 'fa-location-dot',      label: 'Stadiums' }
    ]},
    { group: 'users', items: [
      { key: 'users',         href: '/admin/users.html',         icon: 'fa-users',             label: 'Users' },
      { key: 'subscriptions', href: '/admin/subscriptions.html', icon: 'fa-star',              label: 'Subscriptions' },
      { key: 'notifications', href: '/admin/notifications.html', icon: 'fa-bell',              label: 'Notifications' }
    ]},
    { group: 'system', items: [
      { key: 'messages',  href: '/admin/messages.html',          icon: 'fa-envelope',          label: 'Messages' },
      { key: 'settings',  href: '/admin/settings.html',          icon: 'fa-gear',              label: 'Settings' }
    ]}
  ];

  const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin:       'Admin',
    editor:      'Editor',
    moderator:   'Moderator',
    user:        'User'
  };

  const isAdminRole = (slug) => ['super_admin', 'admin', 'editor', 'moderator'].includes(slug);

  /* ============ Auth ============ */
  const getToken = () => localStorage.getItem(window.BD_CONFIG.TOKEN_KEY);
  const getUser  = () => JSON.parse(localStorage.getItem(window.BD_CONFIG.USER_KEY) || 'null');

  const guard = async () => {
    if (!getToken()) {
      window.location.href = '/admin/index.html';
      return false;
    }
    try {
      const res = await AdminAPI.me();
      if (!res?.success || !res?.data) {
        window.location.href = '/admin/index.html';
        return false;
      }
      const u = res.data;
      if (!u.role || !isAdminRole(u.role.slug)) {
        localStorage.removeItem(window.BD_CONFIG.TOKEN_KEY);
        localStorage.removeItem(window.BD_CONFIG.USER_KEY);
        window.location.href = '/admin/index.html';
        return false;
      }
      localStorage.setItem(window.BD_CONFIG.USER_KEY, JSON.stringify(u));
      return u;
    } catch (err) {
      window.location.href = '/admin/index.html';
      return false;
    }
  };

  /* ============ Sidebar ============ */
  const buildSidebar = (activeKey) => {
    let html = `
      <a href="/admin/dashboard.html" class="ad-sidebar-brand">
        <span class="dot"></span>
        BOTOLA <span class="d2">D2</span>
      </a>
      <div class="ad-sidebar-nav">`;

    NAV.forEach(group => {
      html += `<div class="ad-nav-group">
        <div class="ad-nav-group-title">${group.group}</div>`;
      group.items.forEach(item => {
        const active = item.key === activeKey ? 'active' : '';
        html += `<a href="${item.href}" class="ad-nav-item ${active}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>`;
      });
      html += `</div>`;
    });

    html += `
      </div>
      <div class="ad-sidebar-foot">
        BOTOLA D2 · v1.0
      </div>`;

    return html;
  };

  /* ============ Topbar ============ */
  const buildTopbar = (user, pageTitle) => {
    const name = (user?.full_name || 'Admin').split(' ')[0];
    const avatar = user?.avatar
      ? (window.BD_CONFIG.ASSETS_BASE + user.avatar)
      : '/assets/images/avatar-default.svg';

    return `
      <button class="ad-burger" id="adBurger" aria-label="Toggle sidebar">
        <i class="fa-solid fa-bars"></i>
      </button>

      <div class="ad-topbar-title">
        ${pageTitle || 'Dashboard'}
        <span class="ad-topbar-crumb">/ Admin</span>
      </div>

      <div class="ad-topbar-search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search..." id="adGlobalSearch" />
      </div>

      <div class="ad-topbar-actions">
        <a href="/" class="ad-icon-btn" title="View site" target="_blank" rel="noopener">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>

        <!-- ✅ Notifications Dropdown -->
        <div class="ad-notif-wrap" id="adNotifWrap">
          <button class="ad-icon-btn" id="adNotifBtn" title="Notifications">
            <i class="fa-regular fa-bell"></i>
            <span class="badge" id="adNotifBadge" style="display:none">0</span>
          </button>
          <div class="ad-notif-dropdown" id="adNotifDropdown">
            <div class="ad-notif-head">
              <span>Notifications</span>
              <div style="display:flex;gap:8px">
                <button class="ad-notif-action" id="adNotifMarkAll" title="Tout marquer comme lu">
                  <i class="fa-solid fa-check-double"></i>
                </button>
                <button class="ad-notif-action" id="adNotifClearAll" title="Tout effacer">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="ad-notif-list" id="adNotifList">
              <div class="ad-notif-empty">
                <i class="fa-regular fa-bell-slash"></i>
                <span>Chargement...</span>
              </div>
            </div>
            <div class="ad-notif-foot">
              <a href="/admin/notifications.html">Voir toutes les notifications</a>
            </div>
          </div>
        </div>

        <div class="ad-user-wrap" id="adUserWrap">
          <button class="ad-user-btn" id="adUserBtn">
            <img src="${avatar}" alt="${name}" />
            <span>${name}</span>
            <i class="fa-solid fa-chevron-down" style="font-size:10px;opacity:.6"></i>
          </button>
          <div class="ad-user-dropdown">
            <a href="/admin/settings.html"><i class="fa-solid fa-gear"></i> Settings</a>
            <a href="/account"><i class="fa-regular fa-user"></i> My Account</a>
            <a href="/" target="_blank" rel="noopener"><i class="fa-solid fa-house"></i> View Site</a>
            <hr />
            <button id="adLogoutBtn"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </div>
      </div>`;
  };

  /* ============ Notifications System ============ */
  let pollingInterval = null;

  const initNotifications = () => {
    const wrap = document.getElementById('adNotifWrap');
    const btn = document.getElementById('adNotifBtn');
    const list = document.getElementById('adNotifList');
    const badge = document.getElementById('adNotifBadge');
    const markAllBtn = document.getElementById('adNotifMarkAll');
    const clearAllBtn = document.getElementById('adNotifClearAll');

    if (!btn || !list) return;

    const getTokenHeader = () => ({
      'Authorization': 'Bearer ' + getToken(),
      'Accept': 'application/json'
    });

    const loadNotifications = async (silent = false) => {
      try {
        const [listRes, countsRes] = await Promise.all([
          fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/recent?_t=${Date.now()}`, {
            headers: getTokenHeader()
          }).then(r => r.json()).catch(() => null),
          fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/counts?_t=${Date.now()}`, {
            headers: getTokenHeader()
          }).then(r => r.json()).catch(() => null)
        ]);

        const items = listRes?.data || [];
        renderNotifications(items);

        const unseen = countsRes?.data?.unseen || 0;
        if (badge) {
          badge.textContent = unseen > 99 ? '99+' : unseen;
          badge.style.display = unseen > 0 ? '' : 'none';
        }

        // ✅ Sound for new notifications
        if (!silent) {
          const lastCount = parseInt(sessionStorage.getItem('bd_last_notif_count') || '0', 10);
          if (unseen > lastCount && lastCount > 0) {
            playNotificationSound();
          }
          sessionStorage.setItem('bd_last_notif_count', unseen);
        }
      } catch (err) {
        if (!silent) console.warn('[Notif] Error:', err.message);
      }
    };

    const renderNotifications = (items) => {
      if (!items.length) {
        list.innerHTML = `<div class="ad-notif-empty">
          <i class="fa-regular fa-bell-slash"></i>
          <span>Aucune notification</span>
        </div>`;
        return;
      }

      const iconMap = {
        new_user: 'fa-user-plus',
        new_subscription: 'fa-star',
        new_payment: 'fa-money-bill',
        payment_completed: 'fa-check-circle',
        new_message: 'fa-envelope',
        new_replay: 'fa-video',
        system: 'fa-cog'
      };

      const colorMap = {
        new_user: '#3b82f6',
        new_subscription: '#FFC857',
        new_payment: '#F59E0B',
        payment_completed: '#22C55E',
        new_message: '#A200C7',
        new_replay: '#EF4444',
        system: '#6e6e6e'
      };

      list.innerHTML = items.map(n => {
        const date = new Date(n.created_at);
        const timeAgo = getTimeAgo(date);
        const color = colorMap[n.type] || '#A200C7';
        const icon = iconMap[n.type] || 'fa-bell';

        return `
          <div class="ad-notif-item ${n.is_read ? 'is-read' : ''}" data-id="${n.id}">
            <div class="ad-notif-icon" style="background:${color}22;color:${color}">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div class="ad-notif-content">
              <div class="ad-notif-title">${escapeHtml(n.title)}</div>
              <div class="ad-notif-message">${escapeHtml(n.message)}</div>
              <div class="ad-notif-time">${timeAgo}</div>
            </div>
            ${!n.is_read ? '<div class="ad-notif-dot"></div>' : ''}
          </div>
        `;
      }).join('');

      list.querySelectorAll('.ad-notif-item').forEach(el => {
        el.addEventListener('click', async () => {
          const id = el.getAttribute('data-id');
          try {
            await fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/${id}/read`, {
              method: 'PUT',
              headers: getTokenHeader()
            });
            el.classList.add('is-read');
            el.querySelector('.ad-notif-dot')?.remove();
            loadNotifications(true);
          } catch (_) {}
        });
      });
    };

    const getTimeAgo = (date) => {
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return 'À l\'instant';
      if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
      if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
      return date.toLocaleDateString('fr-FR');
    };

    const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

    const playNotificationSound = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (_) {}
    };

    // ✅ Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.classList.toggle('open');
      if (wrap.classList.contains('open')) {
        loadNotifications();
        fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/mark-seen`, {
          method: 'PUT',
          headers: getTokenHeader()
        }).catch(() => {});
      }
    });

    document.addEventListener('click', () => wrap.classList.remove('open'));

    // ✅ Mark all read
    markAllBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/read-all`, {
          method: 'PUT',
          headers: getTokenHeader()
        });
        loadNotifications();
      } catch (_) {}
    });

    // ✅ Clear all
    clearAllBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Effacer toutes les notifications ?')) return;
      try {
        await fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/clear-all`, {
          method: 'DELETE',
          headers: getTokenHeader()
        });
        loadNotifications();
      } catch (_) {}
    });

    // ✅ Initial load
    loadNotifications();

    // ✅ Poll every 30s
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(() => loadNotifications(), 30000);
  };

  /* ============ Mount ============ */
  const mount = async (activeKey, pageTitle) => {
    const user = await guard();
    if (!user) return null;

    document.body.classList.add('ad-body');

    const layout = document.getElementById('adLayout');
    if (!layout) return user;

    const sidebarEl = document.getElementById('adSidebar');
    const topbarEl = document.getElementById('adTopbar');
    const overlayEl = document.getElementById('adSidebarOverlay');

    if (sidebarEl) sidebarEl.innerHTML = buildSidebar(activeKey);
    if (topbarEl) topbarEl.innerHTML = buildTopbar(user, pageTitle);

    // Burger
    const burger = document.getElementById('adBurger');
    const openSidebar = () => {
      sidebarEl?.classList.add('open');
      overlayEl?.classList.add('open');
    };
    const closeSidebar = () => {
      sidebarEl?.classList.remove('open');
      overlayEl?.classList.remove('open');
    };
    burger?.addEventListener('click', () => {
      sidebarEl?.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    overlayEl?.addEventListener('click', closeSidebar);

    // User dropdown
    const userWrap = document.getElementById('adUserWrap');
    const userBtn = document.getElementById('adUserBtn');
    userBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      userWrap?.classList.toggle('open');
    });
    document.addEventListener('click', () => userWrap?.classList.remove('open'));

    // Logout
    document.getElementById('adLogoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem(window.BD_CONFIG.TOKEN_KEY);
      localStorage.removeItem(window.BD_CONFIG.USER_KEY);
      window.location.href = '/admin/index.html';
    });

    // Global search
    document.getElementById('adGlobalSearch')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        window.location.href = `/admin/live-matches.html?q=${encodeURIComponent(e.target.value.trim())}`;
      }
    });

    // ✅ Init notifications
    initNotifications();

    return user;
  };

  return { mount, guard, isAdminRole, ROLE_LABELS };
})();

/* ============ Shared helpers ============ */
window.AdUtil = (function () {

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) { return d; }
  };

  const fmtDateTime = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_) { return d; }
  };

  const fmtTime = (t) => t ? String(t).slice(0, 5) : '—';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const statusPill = (status) => {
    const cls = {
      live: 'live', halftime: 'live', upcoming: 'upcoming',
      finished: 'finished', postponed: 'pending', cancelled: 'suspended',
      active: 'active', expired: 'expired', pending: 'pending',
      suspended: 'suspended', inactive: 'finished'
    }[status] || 'finished';
    return `<span class="ad-pill ${cls}">${esc(status || '')}</span>`;
  };

  const pillFor = (plan) => {
    const map = { free: 'free', standard: 'standard', gold: 'gold' };
    return `<span class="ad-pill ${map[plan] || 'free'}">${esc((plan || '').toUpperCase())}</span>`;
  };

  const teamLogo = (team) => {
    if (team?.logo) {
      const src = team.logo.startsWith('http') ? team.logo : (window.BD_CONFIG.ASSETS_BASE + team.logo);
      return `<img src="${esc(src)}" alt="" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex')"><span class="logo-ph" style="display:none">${esc((team.short_name || team.name || '?').slice(0,3).toUpperCase())}</span>`;
    }
    return `<span class="logo-ph">${esc((team?.short_name || team?.name || '?').slice(0, 3).toUpperCase())}</span>`;
  };

  const avatar = (user) => {
    if (user?.avatar) {
      const src = user.avatar.startsWith('http') ? user.avatar : (window.BD_CONFIG.ASSETS_BASE + user.avatar);
      return `<img src="${esc(src)}" alt="">`;
    }
    const initials = (user?.full_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `<span class="initials">${esc(initials)}</span>`;
  };

  const qs = (obj) => Object.keys(obj)
    .filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&');

  const confirmDialog = (title, message, confirmLabel = 'Delete') => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'ad-modal open';
      modal.innerHTML = `
        <div class="ad-modal-backdrop"></div>
        <div class="ad-modal-panel" style="max-width:420px">
          <div class="ad-modal-body" style="text-align:center;padding:30px 24px 8px">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,45,85,0.12);color:#ff4d6d;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:14px">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 style="font-size:17px;font-weight:800;color:#fff;margin:0 0 8px">${esc(title)}</h3>
            <p style="color:#a0a0a0;font-size:13.5px;margin:0;line-height:1.55">${esc(message)}</p>
          </div>
          <div class="ad-modal-foot" style="justify-content:center;border-top:0">
            <button class="ad-btn ad-btn-ghost" id="cfCancel">Cancel</button>
            <button class="ad-btn ad-btn-danger" id="cfConfirm">${esc(confirmLabel)}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('#cfCancel').onclick = () => { modal.remove(); resolve(false); };
      modal.querySelector('.ad-modal-backdrop').onclick = () => { modal.remove(); resolve(false); };
      modal.querySelector('#cfConfirm').onclick = () => { modal.remove(); resolve(true); };
    });
  };

  const openModal = (id) => document.getElementById(id)?.classList.add('open');
  const closeModal = (id) => document.getElementById(id)?.classList.remove('open');
  const closeAllModals = () => document.querySelectorAll('.ad-modal.open').forEach(m => m.classList.remove('open'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-modal-close]')) {
      const modal = e.target.closest('.ad-modal');
      modal?.classList.remove('open');
    }
  });

  const paginate = (container, p, onPage) => {
    if (!container) return;
    if (!p || !p.totalPages || p.totalPages <= 1) { container.innerHTML = ''; return; }

    const cur = p.page, total = p.totalPages;
    let html = '';
    html += `<button class="ad-pg-btn" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;

    const range = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - cur) <= 1) range.push(i);
      else if (range[range.length - 1] !== '...') range.push('...');
    }
    range.forEach(r => {
      if (r === '...') html += `<span class="ad-pg-dots">…</span>`;
      else html += `<button class="ad-pg-btn ${r === cur ? 'active' : ''}" data-page="${r}">${r}</button>`;
    });

    html += `<button class="ad-pg-btn" data-page="${cur + 1}" ${cur === total ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;

    container.innerHTML = html;
    container.querySelectorAll('.ad-pg-btn[data-page]').forEach(b => {
      b.addEventListener('click', () => {
        const pg = parseInt(b.getAttribute('data-page'), 10);
        if (!Number.isNaN(pg) && pg >= 1 && pg <= total && pg !== cur) onPage(pg);
      });
    });
  };

  const showTableSkeleton = (tbody, cols, rows = 5) => {
    if (!tbody) return;
    let html = '';
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        html += `<td><div class="ad-skeleton" style="height:16px;width:${60 + Math.random() * 30}%"></div></td>`;
      }
      html += '</tr>';
    }
    tbody.innerHTML = html;
  };

  const emptyRow = (cols, msg = 'No data') => {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:44px 20px;color:var(--bd-text-muted)">
      <i class="fa-regular fa-folder-open" style="font-size:30px;display:block;margin-bottom:12px;opacity:.5"></i>
      ${esc(msg)}
    </td></tr>`;
  };

  const readFormData = (form) => {
    const fd = new FormData(form);
    const out = {};
    for (const [k, v] of fd.entries()) {
      if (v instanceof File) {
        if (v.size > 0) out[k] = v;
      } else {
        if (v !== '' && v !== 'undefined') out[k] = v;
      }
    }
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      out[cb.name] = cb.checked;
    });
    return out;
  };

  return {
    fmtDate, fmtDateTime, fmtTime, esc,
    statusPill, pillFor, teamLogo, avatar,
    qs, confirmDialog, openModal, closeModal, closeAllModals,
    paginate, showTableSkeleton, emptyRow, readFormData
  };
})();