/* =========================================================
   BOTOLA D2 Admin — stadiums.js
   ========================================================= */

let page = 1;
const LIMIT = 20;
let filterTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('stadiums', 'Stadiums');
  if (!user) return;

  bindUI();
  loadStadiums();
});

/* ============ UI ============ */
function bindUI() {
  document.getElementById('addBtn')?.addEventListener('click', () => openModal(null));
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadStadiums(page));

  const search = document.getElementById('filterSearch');
  if (search) search.addEventListener('input', () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => { page = 1; loadStadiums(1); }, 350);
  });

  document.getElementById('stadiumForm')?.addEventListener('submit', onSave);

  document.getElementById('stadiumImageInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    document.getElementById('stadiumImagePreview').innerHTML = `<img src="${url}" alt="">`;
  });
}

/* ============ LIST ============ */
async function loadStadiums(p = 1) {
  page = p;
  const tbody = document.getElementById('stadiumsBody');
  AdUtil.showTableSkeleton(tbody, 6, 6);

  try {
    const res = await AdminAPI.stadiumsList({ page: p, limit: LIMIT });
    const items = res?.data?.items || res?.data || [];
    const pagination = res?.data?.pagination || { total: items.length, page: 1, totalPages: 1 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    const q = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
    const filtered = q ? items.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    ) : items;

    if (!filtered.length) {
      tbody.innerHTML = AdUtil.emptyRow(6, 'No stadiums found');
      AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const img = s.image
        ? (s.image.startsWith('http') ? s.image : window.BD_CONFIG.ASSETS_BASE + s.image)
        : '';
      return `
        <tr>
          <td>
            <div style="width:64px;height:40px;border-radius:8px;background:#0F0F0F;border:1px solid var(--ad-border);overflow:hidden;display:flex;align-items:center;justify-content:center">
              ${img
                ? `<img src="${AdUtil.esc(img)}" alt="" style="width:100%;height:100%;object-fit:cover">`
                : `<i class="fa-solid fa-location-dot" style="color:var(--bd-text-dim)"></i>`}
            </div>
          </td>
          <td><strong>${AdUtil.esc(s.name)}</strong></td>
          <td>${AdUtil.esc(s.city)}</td>
          <td>${s.capacity ? Number(s.capacity).toLocaleString('fr-FR') : '—'}</td>
          <td>${AdUtil.esc(s.address || '—')}</td>
          <td>
            <div class="ad-row-actions">
              <button class="ad-row-btn" data-action="edit" data-id="${s.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
              <button class="ad-row-btn danger" data-action="delete" data-id="${s.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindRowActions();
    AdUtil.paginate(document.getElementById('pagination'), pagination, loadStadiums);
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(6, 'Failed to load: ' + (err.message || ''));
  }
}

function bindRowActions() {
  document.querySelectorAll('[data-action="edit"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      // fetch single from cache list — or from API if available
      try {
        const res = await AdminAPI.stadiumsList({ limit: 200 });
        const all = res?.data?.items || res?.data || [];
        const s = all.find(x => String(x.id) === String(id));
        if (s) openModal(s);
        else AdToast.error('Not found');
      } catch (err) { AdToast.error(err.message || 'Could not load'); }
    });
  });
  document.querySelectorAll('[data-action="delete"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const ok = await AdUtil.confirmDialog('Delete stadium?', 'Matches using this stadium will lose their stadium link.', 'Delete');
      if (!ok) return;
      try {
        await AdminAPI.stadiumDelete(id);
        AdToast.success('Stadium deleted');
        loadStadiums(page);
      } catch (err) { AdToast.error(err.message || 'Delete failed'); }
    });
  });
}

/* ============ MODAL ============ */
function openModal(s) {
  const form = document.getElementById('stadiumForm');
  form.reset();
  document.getElementById('stadiumImagePreview').innerHTML = `<i class="fa-regular fa-image"></i>`;

  const title = document.getElementById('modalTitle');
  const isEdit = !!s;
  title.textContent = isEdit ? 'Edit Stadium' : 'Add Stadium';

  if (isEdit) {
    form.id.value = s.id;
    form.name.value = s.name || '';
    form.city.value = s.city || '';
    form.capacity.value = s.capacity || '';
    form.address.value = s.address || '';

    if (s.image) {
      const url = s.image.startsWith('http') ? s.image : (window.BD_CONFIG.ASSETS_BASE + s.image);
      document.getElementById('stadiumImagePreview').innerHTML = `<img src="${AdUtil.esc(url)}" alt="">`;
    }
  }

  AdUtil.openModal('stadiumModal');
}

/* ============ SAVE ============ */
async function onSave(e) {
  e.preventDefault();
  const form = e.currentTarget;

  if (!form.name.value.trim() || !form.city.value.trim()) {
    AdToast.error('Name and city are required');
    return;
  }

  const fd = new FormData();
  fd.append('name', form.name.value.trim());
  fd.append('city', form.city.value.trim());
  if (form.capacity.value) fd.append('capacity', form.capacity.value);
  if (form.address.value.trim()) fd.append('address', form.address.value.trim());

  const imgFile = document.getElementById('stadiumImageInput').files[0];
  if (imgFile) fd.append('image', imgFile);

  const btn = document.getElementById('saveBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  const id = form.id.value;
  try {
    if (id) await AdminAPI.stadiumUpdate(id, fd);
    else    await AdminAPI.stadiumCreate(fd);
    AdToast.success(id ? 'Stadium updated' : 'Stadium created');
    AdUtil.closeModal('stadiumModal');
    loadStadiums(id ? page : 1);
  } catch (err) {
    AdToast.error(err.message || 'Save failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}