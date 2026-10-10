/* =========================================================
   BOTOLA D2 Admin — users.js
   ========================================================= */

let page = 1;
const LIMIT = 20;
let plansCache = [];
let filterTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('users', 'Users');
  if (!user) return;

  await loadPlans();
  populatePlanSelect();
  bindUI();
  loadUsers();
});

/* ============ UI ============ */
function bindUI() {
  document.getElementById('addBtn')?.addEventListener('click', () => openModal(null));
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadUsers(page));

  const search = document.getElementById('filterSearch');
  if (search) search.addEventListener('input', () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => { page = 1; loadUsers(1); }, 350);
  });

  document.getElementById('filterRole')?.addEventListener('change', () => { page = 1; loadUsers(1); });
  document.getElementById('filterStatus')?.addEventListener('change', () => { page = 1; loadUsers(1); });

  document.getElementById('userForm')?.addEventListener('submit', onSave);
}

/* ============ DATA ============ */
async function loadPlans() {
  try {
    const res = await AdminAPI.plansList();
    plansCache = res?.data || [];
  } catch (_) { plansCache = []; }
}
function populatePlanSelect() {
  const sel = document.getElementById('planSelect');
  if (!sel) return;
  sel.innerHTML = `<option value="">— None —</option>` +
    plansCache.map(p => `<option value="${p.id}">${AdUtil.esc(p.name)} (${p.price} ${p.currency || 'MAD'})</option>`).join('');
}

/* ============ LIST ============ */
async function loadUsers(p = 1) {
  page = p;
  const tbody = document.getElementById('usersBody');
  AdUtil.showTableSkeleton(tbody, 8, 6);

  try {
    const params = { page: p, limit: LIMIT };
    const role = document.getElementById('filterRole')?.value;
    const status = document.getElementById('filterStatus')?.value;
    if (role) params.role_id = role;
    if (status) params.status = status;

    const res = await AdminAPI.usersList(params);
    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    const q = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
    const filtered = q ? items.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    ) : items;

    if (!filtered.length) {
      tbody.innerHTML = AdUtil.emptyRow(8, 'No users found');
      AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const roleSlug = u.role?.slug || 'user';
      const roleName = AdminShell.ROLE_LABELS[roleSlug] || 'User';
      const planSlug = u.plan?.slug || 'free';
      const planName = u.plan?.name || 'Free';

      return `
        <tr>
          <td>
            <div class="ad-avatar-cell">
              ${AdUtil.avatar(u)}
              <div>
                <div class="name">${AdUtil.esc(u.full_name || '—')}</div>
                <div class="sub">ID #${u.id}</div>
              </div>
            </div>
          </td>
          <td>${AdUtil.esc(u.email || '—')}</td>
          <td>${AdUtil.esc(u.phone || '—')}</td>
          <td><span class="ad-pill finished">${AdUtil.esc(roleName)}</span></td>
          <td>${AdUtil.pillFor(planSlug)}</td>
          <td>${AdUtil.statusPill(u.status || 'active')}</td>
          <td>${AdUtil.fmtDate(u.created_at)}</td>
          <td>
            <div class="ad-row-actions">
              <button class="ad-row-btn" data-action="edit" data-id="${u.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
              ${u.status !== 'suspended'
                ? `<button class="ad-row-btn" data-action="suspend" data-id="${u.id}" title="Suspend"><i class="fa-solid fa-ban"></i></button>`
                : ''}
              <button class="ad-row-btn danger" data-action="delete" data-id="${u.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindRowActions();
    AdUtil.paginate(document.getElementById('pagination'), pagination, loadUsers);
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(8, 'Failed to load: ' + (err.message || ''));
  }
}

function bindRowActions() {
  document.querySelectorAll('[data-action="edit"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      try {
        const res = await AdminAPI.userGet(id);
        openModal(res.data);
      } catch (err) { AdToast.error(err.message || 'Could not load user'); }
    });
  });

  document.querySelectorAll('[data-action="suspend"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const ok = await AdUtil.confirmDialog('Suspend user?', 'This user will not be able to log in until reactivated.', 'Suspend');
      if (!ok) return;
      try {
        await AdminAPI.userSuspend(id);
        AdToast.success('User suspended');
        loadUsers(page);
      } catch (err) { AdToast.error(err.message || 'Suspend failed'); }
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const ok = await AdUtil.confirmDialog('Delete user?', 'This action cannot be undone.', 'Delete');
      if (!ok) return;
      try {
        await AdminAPI.userDelete(id);
        AdToast.success('User deleted');
        loadUsers(page);
      } catch (err) { AdToast.error(err.message || 'Delete failed'); }
    });
  });
}

/* ============ MODAL ============ */
function openModal(u) {
  const form = document.getElementById('userForm');
  form.reset();
  document.getElementById('userId').value = '';

  const title = document.getElementById('modalTitle');
  const isEdit = !!u;
  title.textContent = isEdit ? 'Edit User' : 'Add User';

  const pwHint = document.getElementById('pwHint');
  const pwRow = document.getElementById('passwordRow');

  if (isEdit) {
    pwHint.textContent = '(leave blank to keep current)';
    form.password.required = false;
    form.confirm_password.required = false;

    form.id.value = u.id;
    form.full_name.value = u.full_name || '';
    form.email.value = u.email || '';
    form.phone.value = u.phone || '';
    form.role_id.value = u.role_id || (u.role?.id) || 5;
    form.subscription_plan_id.value = u.subscription_plan_id || (u.plan?.id) || '';
    form.status.value = u.status || 'active';
    form.subscription_status.value = u.subscription_status || 'active';
    form.language.value = u.language || 'fr';
    form.email.disabled = true;
  } else {
    pwHint.textContent = '(min 8 chars)';
    form.password.required = true;
    form.confirm_password.required = true;
    form.role_id.value = 5;
    form.status.value = 'active';
    form.subscription_status.value = 'active';
    form.language.value = 'fr';
    form.email.disabled = false;
  }

  AdUtil.openModal('userModal');
}

/* ============ SAVE ============ */
async function onSave(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const isEdit = !!form.id.value;

  const payload = {
    full_name: form.full_name.value.trim(),
    email: form.email.value.trim().toLowerCase(),
    phone: form.phone.value.trim() || null,
    role_id: parseInt(form.role_id.value, 10),
    subscription_plan_id: form.subscription_plan_id.value ? parseInt(form.subscription_plan_id.value, 10) : null,
    status: form.status.value,
    subscription_status: form.subscription_status.value,
    language: form.language.value
  };

  if (!payload.full_name || !payload.email) {
    AdToast.error('Name and email are required');
    return;
  }

  const pwd = form.password.value;
  const confirm = form.confirm_password.value;

  if (!isEdit || pwd) {
    if (!pwd || pwd.length < 8) {
      AdToast.error('Password must be at least 8 characters');
      return;
    }
    if (pwd !== confirm) {
      AdToast.error('Passwords do not match');
      return;
    }
    payload.password = pwd;
    payload.confirm_password = confirm;
  }

  const btn = document.getElementById('saveBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  try {
    if (isEdit) {
      await AdminAPI.userUpdate(form.id.value, payload);
      // If role changed, use dedicated endpoint
      const roleId = parseInt(form.role_id.value, 10);
      try { await AdminAPI.userChangeRole(form.id.value, { role_id: roleId }); } catch (_) {}
      AdToast.success('User updated');
    } else {
      // Create via register endpoint? — Use custom admin create
      await fetch(window.BD_CONFIG.API_BASE + '/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY)
        },
        body: JSON.stringify(payload)
      }).then(async r => {
        if (!r.ok) throw { message: (await r.json().catch(() => ({})))?.message || 'Create failed' };
      });
      AdToast.success('User created');
    }
    AdUtil.closeModal('userModal');
    loadUsers(isEdit ? page : 1);
  } catch (err) {
    AdToast.error(err.message || 'Save failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}