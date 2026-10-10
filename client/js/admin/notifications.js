/* =========================================================
   BOTOLA D2 Admin — notifications.js (v4 FINAL)
   Admin notifications list
   ========================================================= */

let page = 1;
const LIMIT = 20;
let filterTimer = null;
let currentId = null;

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('notifications', 'Notifications');
  if (!user) return;

  bindUI();
  loadNotifications();
});

/* =========================================================
   UI BINDINGS
   ========================================================= */
function bindUI() {
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadNotifications(page));

  document.getElementById('filterType')?.addEventListener('change', () => {
    page = 1;
    loadNotifications(1);
  });

  document.getElementById('filterStatus')?.addEventListener('change', () => {
    page = 1;
    loadNotifications(1);
  });

  document.getElementById('filterPriority')?.addEventListener('change', () => {
    page = 1;
    loadNotifications(1);
  });

  // Mark all read
  document.getElementById('markAllBtn')?.addEventListener('click', async () => {
    const ok = await AdUtil.confirmDialog(
      'Marquer toutes comme lues?',
      'Toutes les notifications seront marquées comme lues.',
      'Confirmer'
    );
    if (!ok) return;

    try {
      const token = localStorage.getItem(window.BD_CONFIG.TOKEN_KEY);
      await fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      AdToast.success('Toutes marquées comme lues');
      loadNotifications(page);
    } catch (err) {
      AdToast.error(err.message || 'Erreur');
    }
  });

  // Clear all
  document.getElementById('clearAllBtn')?.addEventListener('click', async () => {
    const ok = await AdUtil.confirmDialog(
      'Effacer toutes les notifications?',
      'Cette action est irréversible.',
      'Tout effacer'
    );
    if (!ok) return;

    try {
      const token = localStorage.getItem(window.BD_CONFIG.TOKEN_KEY);
      await fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/clear-all`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      AdToast.success('Toutes supprimées');
      loadNotifications(1);
    } catch (err) {
      AdToast.error(err.message || 'Erreur');
    }
  });
}

/* =========================================================
   LOAD NOTIFICATIONS
   ========================================================= */
async function loadNotifications(p = 1) {
  page = p;
  const tbody = document.getElementById('notifBody');
  if (!tbody) {
    console.warn('[notifications.js] #notifBody not found');
    return;
  }

  AdUtil.showTableSkeleton(tbody, 6, 8);

  const token = localStorage.getItem(window.BD_CONFIG.TOKEN_KEY);

  const params = { page: p, limit: LIMIT };
  const type = document.getElementById('filterType')?.value;
  const isRead = document.getElementById('filterStatus')?.value;
  const priority = document.getElementById('filterPriority')?.value;

  if (type) params.type = type;
  if (isRead !== '' && isRead !== undefined) params.is_read = isRead;
  if (priority) params.priority = priority;

  try {
    const res = await fetch(
      `${window.BD_CONFIG.API_BASE}/admin-notifications?${AdUtil.qs(params)}&_t=${Date.now()}`,
      { headers: { 'Authorization': 'Bearer ' + token } }
    ).then(r => r.json());

    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    if (!items.length) {
      tbody.innerHTML = AdUtil.emptyRow(6, 'Aucune notification');
      AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = items.map(renderRow).join('');
    bindRowActions();
    AdUtil.paginate(document.getElementById('pagination'), pagination, loadNotifications);
  } catch (err) {
    console.error('[notifications.js] Load error:', err);
    tbody.innerHTML = AdUtil.emptyRow(6, 'Erreur: ' + (err.message || ''));
  }
}

/* =========================================================
   RENDER ROW
   ========================================================= */
function renderRow(n) {
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

  const priorityMap = {
    urgent: { cls: 'urgent', label: '🔴 Urgent' },
    high: { cls: 'high', label: '🟠 Haute' },
    normal: { cls: 'normal', label: '🟡 Normale' },
    low: { cls: 'low', label: '⚪ Basse' }
  };

  const color = colorMap[n.type] || '#A200C7';
  const icon = iconMap[n.type] || 'fa-bell';
  const priority = priorityMap[n.priority] || priorityMap.normal;

  const userCell = n.user
    ? `<div class="ad-avatar-cell">
         ${AdUtil.avatar(n.user)}
         <div>
           <div class="name">${AdUtil.esc(n.user.full_name || '—')}</div>
           <div class="sub">${AdUtil.esc(n.user.email || '')}</div>
         </div>
       </div>`
    : '<span style="color:var(--bd-text-dim)">—</span>';

  return `
    <tr class="${n.is_read ? 'notif-read' : ''}" data-id="${n.id}">
      <td>
        <div class="ad-stat-icon" style="background:${color}22;color:${color};width:38px;height:38px;font-size:15px">
          <i class="fa-solid ${icon}"></i>
        </div>
      </td>
      <td>
        <div style="color:#fff;font-weight:700;font-size:13.5px;margin-bottom:4px">
          ${n.is_read ? '' : '<span style="display:inline-block;width:8px;height:8px;background:#A200C7;border-radius:50%;margin-right:8px"></span>'}
          ${AdUtil.esc(n.title)}
        </div>
        <div style="color:var(--bd-text-muted);font-size:12.5px;line-height:1.5">
          ${AdUtil.esc(n.message)}
        </div>
      </td>
      <td>${userCell}</td>
      <td>
        <span class="ad-pill ${priority.cls}" style="font-size:10px">
          ${priority.label}
        </span>
      </td>
      <td>
        <div style="color:#fff;font-size:12.5px">${AdUtil.fmtDateTime(n.created_at)}</div>
        <div style="color:var(--bd-text-dim);font-size:11px">${getTimeAgo(n.created_at)}</div>
      </td>
      <td>
        <div class="ad-row-actions">
          <button class="ad-row-btn" data-action="view" data-id="${n.id}" title="Voir">
            <i class="fa-solid fa-eye"></i>
          </button>
          ${!n.is_read ? `
            <button class="ad-row-btn" data-action="read" data-id="${n.id}" title="Marquer comme lu">
              <i class="fa-solid fa-check"></i>
            </button>
          ` : ''}
          <button class="ad-row-btn danger" data-action="delete" data-id="${n.id}" title="Supprimer">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

/* =========================================================
   ROW ACTIONS
   ========================================================= */
function bindRowActions() {
  const token = localStorage.getItem(window.BD_CONFIG.TOKEN_KEY);

  // View details
  document.querySelectorAll('[data-action="view"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      try {
        const res = await fetch(
          `${window.BD_CONFIG.API_BASE}/admin-notifications?page=1&limit=100&_t=${Date.now()}`,
          { headers: { 'Authorization': 'Bearer ' + token } }
        ).then(r => r.json());

        const item = (res?.data?.items || []).find(x => String(x.id) === String(id));
        if (item) openDetailModal(item);
      } catch (err) {
        AdToast.error(err.message);
      }
    });
  });

  // Mark as read
  document.querySelectorAll('[data-action="read"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      try {
        await fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/${id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        AdToast.success('Marquée comme lue');
        loadNotifications(page);
      } catch (err) {
        AdToast.error(err.message);
      }
    });
  });

  // Delete
  document.querySelectorAll('[data-action="delete"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const ok = await AdUtil.confirmDialog('Supprimer?', 'Cette action est irréversible.', 'Supprimer');
      if (!ok) return;
      try {
        await fetch(`${window.BD_CONFIG.API_BASE}/admin-notifications/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        AdToast.success('Supprimée');
        loadNotifications(page);
      } catch (err) {
        AdToast.error(err.message);
      }
    });
  });
}

/* =========================================================
   DETAIL MODAL
   ========================================================= */
function openDetailModal(n) {
  currentId = n.id;

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

  const color = colorMap[n.type] || '#A200C7';
  const icon = iconMap[n.type] || 'fa-bell';

  const titleEl = document.getElementById('detailTitle');
  const bodyEl = document.getElementById('detailBody');

  if (!titleEl || !bodyEl) {
    console.warn('[notifications.js] Detail modal elements not found');
    return;
  }

  titleEl.textContent = n.title;

  const data = n.data || {};

  let dataHtml = '';
  if (data && typeof data === 'object') {
    dataHtml = Object.entries(data).map(([key, val]) => {
      if (val === null || val === undefined || val === '') return '';
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const value = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `
        <div class="details-row">
          <i class="fa-solid fa-circle"></i>
          <span class="details-label">${AdUtil.esc(label)}</span>
          <span class="details-value">${AdUtil.esc(value)}</span>
        </div>
      `;
    }).join('');
  }

  bodyEl.innerHTML = `
    <div style="display:flex;gap:14px;align-items:flex-start;padding:18px;background:var(--ad-bg-2);border-radius:12px;margin-bottom:20px">
      <div class="ad-stat-icon" style="background:${color}22;color:${color};width:48px;height:48px;font-size:20px;flex-shrink:0">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div style="flex:1">
        <div style="color:#fff;font-weight:700;font-size:15px;margin-bottom:6px">${AdUtil.esc(n.title)}</div>
        <div style="color:var(--bd-text-muted);font-size:13.5px;line-height:1.5">${AdUtil.esc(n.message)}</div>
        <div style="color:var(--bd-text-dim);font-size:12px;margin-top:8px">
          <i class="fa-regular fa-clock"></i> ${AdUtil.fmtDateTime(n.created_at)}
        </div>
      </div>
    </div>

    ${dataHtml ? `
      <div style="font-size:12px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">
        Détails
      </div>
      <div class="details-info">${dataHtml}</div>
    ` : ''}
  `;

  AdUtil.openModal('detailModal');
}

/* =========================================================
   HELPERS
   ========================================================= */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'À l\'instant';
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
  return new Date(date).toLocaleDateString('fr-FR');
}