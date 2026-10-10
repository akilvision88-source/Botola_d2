/* =========================================================
   BOTOLA D2 Admin — replays.js (v2 — with Pre-roll Ad)
   Manage replays: full + summary + pre-roll ad.
   ========================================================= */

let page = 1;
const LIMIT = 12;
let matchesCache = [];
let filterTimer = null;

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('replays', 'Replays');
  if (!user) return;

  await loadMatches();
  populateMatchSelect();

  bindUI();
  loadReplays();
});

/* =========================================================
   UI BINDINGS
   ========================================================= */
function bindUI() {
  document.getElementById('addBtn')?.addEventListener('click', () => openModal(null));
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadReplays(page));

  const search = document.getElementById('filterSearch');
  if (search) search.addEventListener('input', () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => { page = 1; loadReplays(1); }, 350);
  });

  document.getElementById('filterTier')?.addEventListener('change', () => {
    page = 1;
    loadReplays(1);
  });

  const form = document.getElementById('replayForm');
  if (form) form.addEventListener('submit', onSave);

  // Thumbnail preview
  document.getElementById('thumbInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const prev = document.getElementById('thumbPreview');
    if (prev) prev.innerHTML = `<img src="${url}" alt="">`;
  });
}

/* =========================================================
   DATA FETCH
   ========================================================= */
async function loadMatches() {
  try {
    const res = await AdminAPI.matchesList({ limit: 200, status: '' });
    matchesCache = res?.data?.items || [];
  } catch (_) { matchesCache = []; }
}

function populateMatchSelect() {
  const sel = document.getElementById('matchSelect');
  if (!sel) return;
  sel.innerHTML = `<option value="">— None —</option>` +
    matchesCache.map(m => {
      const home = m.homeTeam?.name || '?';
      const away = m.awayTeam?.name || '?';
      const date = m.match_date || '';
      return `<option value="${m.id}">${AdUtil.esc(`${home} vs ${away} (${date})`)}</option>`;
    }).join('');
}

/* =========================================================
   LIST
   ========================================================= */
async function loadReplays(p = 1) {
  page = p;
  const tbody = document.getElementById('replaysBody');
  AdUtil.showTableSkeleton(tbody, 8, 6);

  try {
    const params = { page: p, limit: LIMIT };
    const tier = document.getElementById('filterTier')?.value;
    if (tier) params.requires_subscription = tier;

    const res = await fetch(
      window.BD_CONFIG.API_BASE + '/replays?' + AdUtil.qs(params),
      { headers: { 'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY) } }
    ).then(r => r.json());

    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    const q = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
    const filtered = q
      ? items.filter(r =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.match?.homeTeam?.name || '').toLowerCase().includes(q) ||
          (r.match?.awayTeam?.name || '').toLowerCase().includes(q)
        )
      : items;

    if (!filtered.length) {
      tbody.innerHTML = AdUtil.emptyRow(8, 'No replays found');
      AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = filtered.map(r => renderRow(r)).join('');
    bindRowActions();
    AdUtil.paginate(document.getElementById('pagination'), pagination, loadReplays);
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(8, 'Failed to load: ' + (err.message || ''));
  }
}

function renderRow(r) {
  const m = r.match || {};
  const home = m.homeTeam?.name || '—';
  const away = m.awayTeam?.name || '—';
  const matchLabel = m.id ? `${AdUtil.esc(home)} vs ${AdUtil.esc(away)}` : '—';

  const tier = r.requires_subscription || 'standard';
  const tierCls = tier === 'gold' ? 'gold' : tier === 'standard' ? 'standard' : 'free';

  const thumbUrl = r.thumbnail
    ? (r.thumbnail.startsWith('http') ? r.thumbnail : (window.BD_CONFIG.ASSETS_BASE + r.thumbnail))
    : '';

  const hasSummary = !!(r.summary_video_url && r.summary_video_url.length > 3);
  const hasAd = !!(r.ad_video_url && r.ad_video_url.length > 3);

  return `
    <tr>
      <td>
        <div style="width:64px;height:40px;border-radius:8px;background:#0F0F0F;border:1px solid var(--ad-border);overflow:hidden;display:flex;align-items:center;justify-content:center">
          ${thumbUrl
            ? `<img src="${AdUtil.esc(thumbUrl)}" alt="" style="width:100%;height:100%;object-fit:cover">`
            : `<i class="fa-regular fa-image" style="color:var(--bd-text-dim)"></i>`}
        </div>
      </td>
      <td>
        <strong>${AdUtil.esc(r.title)}</strong>
        ${hasAd ? `<br><span class="ad-pill" style="background:rgba(255,200,87,0.15);color:var(--bd-gold);font-size:10px;margin-top:4px">
          <i class="fa-solid fa-rectangle-ad"></i> AD
        </span>` : ''}
      </td>
      <td>${matchLabel}</td>
      <td><span class="ad-pill ${tierCls}">${AdUtil.esc(tier.toUpperCase())}</span></td>
      <td>${AdUtil.esc(r.duration || '—')}</td>
      <td>
        ${hasSummary
          ? `<span class="ad-pill gold" style="font-size:10.5px"><i class="fa-solid fa-film"></i> ${AdUtil.esc(r.summary_duration || 'YES')}</span>`
          : `<span style="color:var(--bd-text-dim);font-size:11px">—</span>`}
      </td>
      <td>${AdUtil.fmtDate(r.replay_date)}</td>
      <td>
        <div class="ad-row-actions">
          <button class="ad-row-btn" data-action="edit" data-id="${r.id}" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="ad-row-btn danger" data-action="delete" data-id="${r.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function bindRowActions() {
  document.querySelectorAll('[data-action="edit"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      try {
        const res = await fetch(
          window.BD_CONFIG.API_BASE + '/replays/' + id,
          { headers: { 'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY) } }
        ).then(r => r.json());
        openModal(res.data);
      } catch (err) {
        AdToast.error(err.message || 'Could not load');
      }
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const ok = await AdUtil.confirmDialog('Delete replay?', 'This action cannot be undone.', 'Delete');
      if (!ok) return;
      try {
        await AdminAPI.replayDelete(id);
        AdToast.success('Replay deleted');
        loadReplays(page);
      } catch (err) {
        AdToast.error(err.message || 'Delete failed');
      }
    });
  });
}

/* =========================================================
   MODAL
   ========================================================= */
function openModal(r) {
  const form = document.getElementById('replayForm');
  if (!form) return;

  try { form.reset(); } catch (_) {}

  const preview = document.getElementById('thumbPreview');
  if (preview) preview.innerHTML = `<i class="fa-regular fa-image"></i>`;

  const title = document.getElementById('modalTitle');
  const isEdit = !!r;
  if (title) title.textContent = isEdit ? 'Edit Replay' : 'Add Replay';

  const setVal = (name, value) => {
    const f = form.elements[name];
    if (!f) return;
    f.value = value != null ? String(value) : '';
  };

  if (isEdit && r) {
    setVal('id', r.id);
    setVal('title', r.title || '');
    setVal('description', r.description || '');
    setVal('match_id', r.match_id || '');

    setVal('video_url', r.video_url || '');
    setVal('download_url', r.download_url || '');
    setVal('duration', r.duration || '');
    setVal('replay_date', r.replay_date || '');
    setVal('requires_subscription', r.requires_subscription || 'standard');

    // Summary
    setVal('summary_video_url', r.summary_video_url || '');
    setVal('summary_download_url', r.summary_download_url || '');
    setVal('summary_duration', r.summary_duration || '');

    // ✅ PRE-ROLL AD
    setVal('ad_video_url', r.ad_video_url || '');
    setVal('ad_duration', r.ad_duration ?? 15);
    setVal('ad_skip_after', r.ad_skip_after ?? 5);

    if (r.thumbnail && preview) {
      const url = r.thumbnail.startsWith('http')
        ? r.thumbnail
        : (window.BD_CONFIG.ASSETS_BASE + r.thumbnail);
      preview.innerHTML = `<img src="${AdUtil.esc(url)}" alt="">`;
    }
  } else {
    setVal('id', '');
    setVal('requires_subscription', 'standard');

    // ✅ Ad defaults
    setVal('ad_video_url', '');
    setVal('ad_duration', 15);
    setVal('ad_skip_after', 5);

    const now = new Date();
    setVal('replay_date', now.toISOString().slice(0, 10));
  }

  AdUtil.openModal('replayModal');
}

/* =========================================================
   SAVE — Always send ad fields (even when empty)
   ========================================================= */
async function onSave(e) {
  e.preventDefault();
  const form = e.currentTarget;

  const getVal = (name) => {
    const f = form.elements[name];
    if (!f) {
      console.warn('[onSave] Missing field:', name);
      return '';
    }
    return String(f.value || '').trim();
  };

  const fd = new FormData();

  // Basic
  fd.append('title', getVal('title'));
  fd.append('description', getVal('description'));
  if (getVal('match_id')) fd.append('match_id', getVal('match_id'));

  // Full replay
  fd.append('video_url', getVal('video_url'));
  fd.append('download_url', getVal('download_url'));
  fd.append('duration', getVal('duration'));

  // ✅ Summary — always send
  fd.append('summary_video_url', getVal('summary_video_url'));
  fd.append('summary_download_url', getVal('summary_download_url'));
  fd.append('summary_duration', getVal('summary_duration'));

  // ✅ PRE-ROLL AD — always send
  fd.append('ad_video_url', getVal('ad_video_url'));
  fd.append('ad_duration', getVal('ad_duration') || '15');
  fd.append('ad_skip_after', getVal('ad_skip_after') || '5');

  // Meta
  fd.append('replay_date', getVal('replay_date'));
  fd.append('requires_subscription', getVal('requires_subscription') || 'standard');

  // Thumbnail
  const thumbFile = form.elements['thumbnail']?.files?.[0];
  if (thumbFile && thumbFile.size > 0) fd.append('thumbnail', thumbFile);

  // ========== DEBUG ==========
  console.log('===== ON SAVE — REPLAY =====');
  for (let [k, v] of fd.entries()) {
    if (v instanceof File) {
      console.log('  ' + k + ':', '[File]', v.name, '(' + v.size + ' bytes)');
    } else {
      console.log('  ' + k + ':', JSON.stringify(v));
    }
  }
  console.log('============================');

  // Validate
  if (!fd.get('title') || !fd.get('video_url') || !fd.get('replay_date')) {
    AdToast.error('Title, video URL and replay date are required');
    return;
  }

  const btn = document.getElementById('saveBtn');
  const orig = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
  }

  const id = getVal('id');

  try {
    let response;
    if (id) {
      response = await AdminAPI.replayUpdate(id, fd);
    } else {
      response = await AdminAPI.replayCreate(fd);
    }

    console.log('[onSave] Server returned:', response?.data);

    AdToast.success(id ? 'Replay updated' : 'Replay created');
    AdUtil.closeModal('replayModal');
    loadReplays(id ? page : 1);
  } catch (err) {
    console.error('[onSave] Error:', err);
    AdToast.error(err.message || 'Save failed');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }
}