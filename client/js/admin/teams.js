/* =========================================================
   BOTOLA D2 Admin — teams.js
   ========================================================= */

let page = 1;
const LIMIT = 200;
let stadiumsCache = [];
let filterTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('teams', 'Teams');
  if (!user) return;

  await loadStadiums();
  populateStadiumSelect();

  bindUI();
  loadTeams();
});

/* ============ UI ============ */
function bindUI() {
  document.getElementById('addBtn')?.addEventListener('click', () => openModal(null));
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadTeams(page));

  const search = document.getElementById('filterSearch');
  if (search) search.addEventListener('input', () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => { page = 1; loadTeams(1); }, 350);
  });

  document.getElementById('teamForm')?.addEventListener('submit', onSave);

  document.getElementById('logoInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    document.getElementById('logoPreview').innerHTML = `<img src="${url}" alt="" style="object-fit:contain;padding:8px">`;
  });
}

/* ============ DATA ============ */
async function loadStadiums() {
  try {
    const res = await AdminAPI.stadiumsList({ limit: 200 });
    stadiumsCache = res?.data?.items || res?.data || [];
  } catch (_) { stadiumsCache = []; }
}

function populateStadiumSelect() {
  const sel = document.getElementById('stadiumSelect');
  if (!sel) return;
  sel.innerHTML = `<option value="">— None —</option>` +
    stadiumsCache.map(s => `<option value="${s.id}">${AdUtil.esc(s.name)} — ${AdUtil.esc(s.city)}</option>`).join('');
}

/* ============ LIST ============ */
async function loadTeams(p = 1) {
  page = p;
  const tbody = document.getElementById('teamsBody');
  AdUtil.showTableSkeleton(tbody, 8, 6);

  try {
    const res = await AdminAPI.teamsList({ page: p, limit: LIMIT });
    const items = res?.data?.items || res?.data || [];
    const pagination = res?.data?.pagination || { total: items.length, page: 1, totalPages: 1 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    const q = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
    const filtered = q ? items.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.city || '').toLowerCase().includes(q) ||
      (t.short_name || '').toLowerCase().includes(q)
    ) : items;

    if (!filtered.length) {
      tbody.innerHTML = AdUtil.emptyRow(8, 'No teams found');
      AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = filtered.map(t => `
      <tr>
        <td>
          <div class="ad-logo-cell">
            ${t.logo ? `<img src="${AdUtil.esc(t.logo.startsWith('http') ? t.logo : window.BD_CONFIG.ASSETS_BASE + t.logo)}" alt="">` : AdUtil.teamLogo(t)}
          </div>
        </td>
        <td><strong>${AdUtil.esc(t.name)}</strong></td>
        <td>${AdUtil.esc(t.short_name || '—')}</td>
        <td>${AdUtil.esc(t.city || '—')}</td>
        <td>${AdUtil.esc(t.stadium?.name || '—')}</td>
        <td>${t.founded_year || '—'}</td>
        <td>${AdUtil.statusPill(t.status || 'active')}</td>
        <td>
          <div class="ad-row-actions">
            <button class="ad-row-btn" data-action="edit" data-id="${t.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="ad-row-btn danger" data-action="delete" data-id="${t.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    bindRowActions();
    AdUtil.paginate(document.getElementById('pagination'), pagination, loadTeams);
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(8, 'Failed to load: ' + (err.message || ''));
  }
}

function bindRowActions() {
  document.querySelectorAll('[data-action="edit"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      try {
        const res = await AdminAPI.teamGet(id);
        openModal(res.data);
      } catch (err) { AdToast.error(err.message || 'Could not load'); }
    });
  });
  document.querySelectorAll('[data-action="delete"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const ok = await AdUtil.confirmDialog('Delete team?', 'Matches using this team may be affected.', 'Delete');
      if (!ok) return;
      try {
        await AdminAPI.teamDelete(id);
        AdToast.success('Team deleted');
        loadTeams(page);
      } catch (err) { AdToast.error(err.message || 'Delete failed'); }
    });
  });
}

/* ============ MODAL ============ */
function openModal(t) {
  const form = document.getElementById('teamForm');
  form.reset();
  document.getElementById('logoPreview').innerHTML = `<i class="fa-regular fa-image"></i>`;

  const title = document.getElementById('modalTitle');
  const isEdit = !!t;
  title.textContent = isEdit ? 'Edit Team' : 'Add Team';

  if (isEdit) {
    form.id.value = t.id;
    form.name.value = t.name || '';
    form.short_name.value = t.short_name || '';
    form.city.value = t.city || '';
    form.founded_year.value = t.founded_year || '';
    form.stadium_id.value = t.stadium_id || '';
    form.description.value = t.description || '';
    form.status.value = t.status || 'active';

    if (t.logo) {
      const url = t.logo.startsWith('http') ? t.logo : (window.BD_CONFIG.ASSETS_BASE + t.logo);
      document.getElementById('logoPreview').innerHTML = `<img src="${AdUtil.esc(url)}" alt="" style="object-fit:contain;padding:8px">`;
    }
  } else {
    form.status.value = 'active';
  }

  AdUtil.openModal('teamModal');
}

/* ============ SAVE ============ */
async function onSave(e) {
  e.preventDefault();
  const form = e.currentTarget;

  if (!form.name.value.trim()) { AdToast.error('Team name is required'); return; }

  const fd = new FormData();
  fd.append('name', form.name.value.trim());
  if (form.short_name.value.trim())   fd.append('short_name', form.short_name.value.trim());
  if (form.city.value.trim())         fd.append('city', form.city.value.trim());
  if (form.founded_year.value)        fd.append('founded_year', form.founded_year.value);
  if (form.stadium_id.value)          fd.append('stadium_id', form.stadium_id.value);
  if (form.description.value.trim())  fd.append('description', form.description.value.trim());
  fd.append('status', form.status.value);

  const logoFile = document.getElementById('logoInput').files[0];
  if (logoFile) fd.append('logo', logoFile);

  const btn = document.getElementById('saveBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  const id = form.id.value;
  try {
    if (id) await AdminAPI.teamUpdate(id, fd);
    else    await AdminAPI.teamCreate(fd);
    AdToast.success(id ? 'Team updated' : 'Team created');
    AdUtil.closeModal('teamModal');
    loadTeams(id ? page : 1);
  } catch (err) {
    AdToast.error(err.message || 'Save failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}