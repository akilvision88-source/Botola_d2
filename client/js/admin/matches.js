/* =========================================================
   BOTOLA D2 Admin — matches.js (v4 — with Pre-roll Ad)
   Shared controller for live & upcoming matches pages.
   Supports: card_background + ad_video_url + ad_duration + ad_skip_after
   Set window.ADMIN_MATCH_MODE = 'live' | 'upcoming' (default: 'live').
   ========================================================= */

(function () {
  const MODE = window.ADMIN_MATCH_MODE || 'live';

  let page = 1;
  const LIMIT = 15;
  let teamsCache = [];
  let stadiumsCache = [];
  let filterTimer = null;

  /* =========================================================
     INIT
     ========================================================= */
  document.addEventListener('DOMContentLoaded', async () => {
    const title = MODE === 'upcoming' ? 'Upcoming Matches' : 'Live Matches';
    const user = await AdminShell.mount(MODE === 'upcoming' ? 'upcoming' : 'live', title);
    if (!user) return;

    await Promise.all([loadTeams(), loadStadiums()]);
    populateSelects();

    bindUI();
    loadMatches();
  });

  /* =========================================================
     UI BINDINGS
     ========================================================= */
  function bindUI() {
    document.getElementById('addBtn')?.addEventListener('click', () => openModal(null));
    document.getElementById('refreshBtn')?.addEventListener('click', () => loadMatches(page));

    const search = document.getElementById('filterSearch');
    if (search) search.addEventListener('input', () => {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(() => { page = 1; loadMatches(1); }, 350);
    });

    const statusSel = document.getElementById('filterStatus');
    if (statusSel) statusSel.addEventListener('change', () => { page = 1; loadMatches(1); });

    const dateFilter = document.getElementById('filterDate');
    if (dateFilter) dateFilter.addEventListener('change', () => { page = 1; loadMatches(1); });

    document.getElementById('matchForm')?.addEventListener('submit', onSave);

    // Background preview
    bindBackgroundPreview();

    // Clear background button
    document.getElementById('clearBgBtn')?.addEventListener('click', () => {
      const form = document.getElementById('matchForm');
      if (!form) return;
      const bgUrl = form.elements['card_background'];
      const bgInput = document.getElementById('bgInput');
      const bgPreview = document.getElementById('bgPreview');

      if (bgUrl) bgUrl.value = '';
      if (bgInput) bgInput.value = '';
      if (bgPreview) bgPreview.innerHTML = `<i class="fa-regular fa-image"></i>`;

      AdToast.info('Background cleared. Save to apply.');
    });
  }

  /* =========================================================
     BACKGROUND PREVIEW
     ========================================================= */
  function bindBackgroundPreview() {
    const form = document.getElementById('matchForm');
    if (!form) return;

    const bgUrl = form.elements['card_background'];
    const bgInput = document.getElementById('bgInput');
    const bgPreview = document.getElementById('bgPreview');
    const clearBtn = document.getElementById('clearBgBtn');

    if (bgUrl) {
      bgUrl.addEventListener('input', () => {
        const v = bgUrl.value.trim();
        if (v && bgPreview) {
          bgPreview.innerHTML = `<img src="${AdUtil.esc(v)}" alt=""
            onerror="this.parentElement.innerHTML='<i class=\\'fa-regular fa-image\\'></i>'">`;
          if (clearBtn) clearBtn.style.display = '';
        } else if (bgPreview) {
          bgPreview.innerHTML = `<i class="fa-regular fa-image"></i>`;
          if (clearBtn && !bgInput?.files?.[0]) clearBtn.style.display = 'none';
        }
      });
    }

    if (bgInput) {
      bgInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (bgPreview) bgPreview.innerHTML = `<img src="${url}" alt="">`;
        if (clearBtn) clearBtn.style.display = '';
      });
    }
  }

  /* =========================================================
     DATA FETCH
     ========================================================= */
  async function loadTeams() {
    try {
      const res = await AdminAPI.teamsList({ limit: 200 });
      teamsCache = res?.data?.items || res?.data || [];
    } catch (_) { teamsCache = []; }
  }

  async function loadStadiums() {
    try {
      const res = await AdminAPI.stadiumsList({ limit: 200 });
      stadiumsCache = res?.data?.items || res?.data || [];
    } catch (_) { stadiumsCache = []; }
  }

  function populateSelects() {
    const home = document.getElementById('teamHome');
    const away = document.getElementById('teamAway');
    const stadium = document.getElementById('stadiumSelect');

    if (home) home.innerHTML = `<option value="">— Select team —</option>` +
      teamsCache.map(t => `<option value="${t.id}">${AdUtil.esc(t.name)}</option>`).join('');

    if (away) away.innerHTML = `<option value="">— Select team —</option>` +
      teamsCache.map(t => `<option value="${t.id}">${AdUtil.esc(t.name)}</option>`).join('');

    if (stadium) stadium.innerHTML = `<option value="">— None —</option>` +
      stadiumsCache.map(s => `<option value="${s.id}">${AdUtil.esc(s.name)} — ${AdUtil.esc(s.city)}</option>`).join('');
  }

  /* =========================================================
     LIST
     ========================================================= */
  async function loadMatches(p = 1) {
    page = p;
    const tbody = document.getElementById('matchesBody');
    if (!tbody) return;

    const cols = MODE === 'upcoming' ? 6 : 8;
    AdUtil.showTableSkeleton(tbody, cols, 6);

    const params = { page: p, limit: LIMIT };

    if (MODE === 'live') {
      const s = document.getElementById('filterStatus')?.value || 'live,halftime';
      params.status = s;
    } else {
      params.status = 'upcoming';
      const d = document.getElementById('filterDate')?.value;
      if (d) params.date = d;
    }

    try {
      const res = await AdminAPI.matchesList(params);
      const items = res?.data?.items || [];
      const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

      const countLabel = document.getElementById('countLabel');
      if (countLabel) countLabel.textContent = `${pagination.total} total`;

      const q = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
      const filtered = q
        ? items.filter(m =>
            (m.competition || '').toLowerCase().includes(q) ||
            (m.city || '').toLowerCase().includes(q) ||
            (m.homeTeam?.name || '').toLowerCase().includes(q) ||
            (m.awayTeam?.name || '').toLowerCase().includes(q)
          )
        : items;

      if (!filtered.length) {
        tbody.innerHTML = AdUtil.emptyRow(cols, 'No matches found');
        AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
        return;
      }

      tbody.innerHTML = filtered
        .map(m => MODE === 'upcoming' ? renderUpcomingRow(m) : renderLiveRow(m))
        .join('');

      bindRowActions();
      AdUtil.paginate(document.getElementById('pagination'), pagination, loadMatches);
    } catch (err) {
      tbody.innerHTML = AdUtil.emptyRow(cols, 'Failed to load: ' + (err.message || ''));
    }
  }

  /* =========================================================
     RENDER ROWS
     ========================================================= */

  function bgCell(bg) {
    if (!bg) {
      return `<span style="color:var(--bd-text-dim);font-size:11px">—</span>`;
    }
    const url = bg.startsWith('http')
      ? bg
      : (window.BD_CONFIG.ASSETS_BASE + bg);
    return `
      <div style="width:48px;height:32px;border-radius:6px;overflow:hidden;border:1px solid var(--ad-border);background:#0F0F0F">
        <img src="${AdUtil.esc(url)}" alt="" style="width:100%;height:100%;object-fit:cover"
             onerror="this.parentElement.innerHTML='<i class=\\'fa-regular fa-image\\' style=\\'color:var(--bd-text-dim);font-size:14px;display:flex;align-items:center;justify-content:center;height:100%\\'></i>'">
      </div>
    `;
  }

  function adCell(adUrl) {
    if (!adUrl) return `<span style="color:var(--bd-text-dim);font-size:11px">—</span>`;
    return `<span class="ad-pill" style="background:rgba(255,200,87,0.15);color:var(--bd-gold);font-size:10px">
      <i class="fa-solid fa-rectangle-ad"></i> AD
    </span>`;
  }

  function renderLiveRow(m) {
    const home = m.homeTeam || {};
    const away = m.awayTeam || {};

    return `
      <tr>
        <td>${bgCell(m.card_background)}</td>
        <td>${AdUtil.esc(m.competition || '')}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="ad-logo-cell">${AdUtil.teamLogo(home)}</span>
            <strong style="font-size:12.5px">${AdUtil.esc(home.name || '—')}</strong>
            <span style="color:var(--bd-text-dim)">vs</span>
            <strong style="font-size:12.5px">${AdUtil.esc(away.name || '—')}</strong>
            <span class="ad-logo-cell">${AdUtil.teamLogo(away)}</span>
          </div>
        </td>
        <td>
          <span style="font-weight:900;font-size:15px;color:#fff;letter-spacing:1px">
            ${m.score_home ?? 0} - ${m.score_away ?? 0}
          </span>
        </td>
        <td>
          ${m.status === 'halftime'
            ? `<span class="ad-pill live">HT</span>`
            : `<span class="ad-pill live">
                 <span style="width:6px;height:6px;background:#fff;border-radius:50%;display:inline-block;margin-right:4px;animation:pulse 1.4s infinite"></span>
                 ${m.match_minute}'
               </span>`}
        </td>
        <td>
          ${AdUtil.esc(m.stadium?.name || '—')}<br>
          <small style="color:var(--bd-text-dim)">${AdUtil.esc(m.city || '')}</small>
        </td>
        <td>
          ${AdUtil.fmtDate(m.match_date)}<br>
          <small style="color:var(--bd-text-dim)">${AdUtil.fmtTime(m.match_time)}</small>
        </td>
        <td>
          <div class="ad-row-actions">
            <button class="ad-row-btn" data-action="edit" data-id="${m.id}" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="ad-row-btn danger" data-action="delete" data-id="${m.id}" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderUpcomingRow(m) {
    const home = m.homeTeam || {};
    const away = m.awayTeam || {};

    return `
      <tr>
        <td>${bgCell(m.card_background)}</td>
        <td>${AdUtil.fmtDate(m.match_date)}</td>
        <td><strong>${AdUtil.fmtTime(m.match_time)}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="ad-logo-cell">${AdUtil.teamLogo(home)}</span>
            <strong style="font-size:12.5px">${AdUtil.esc(home.name || '—')}</strong>
            <span style="color:var(--bd-text-dim)">vs</span>
            <strong style="font-size:12.5px">${AdUtil.esc(away.name || '—')}</strong>
            <span class="ad-logo-cell">${AdUtil.teamLogo(away)}</span>
          </div>
        </td>
        <td>
          ${AdUtil.esc(m.stadium?.name || '—')}<br>
          <small style="color:var(--bd-text-dim)">${AdUtil.esc(m.city || '')}</small>
        </td>
        <td>
          <div class="ad-row-actions">
            <button class="ad-row-btn" data-action="edit" data-id="${m.id}" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="ad-row-btn danger" data-action="delete" data-id="${m.id}" title="Delete">
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
    document.querySelectorAll('[data-action="edit"]').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-id');
        try {
          const res = await AdminAPI.matchGet(id);
          openModal(res.data);
        } catch (err) {
          AdToast.error(err.message || 'Could not load match');
        }
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-id');
        const ok = await AdUtil.confirmDialog('Delete match?', 'This action cannot be undone.', 'Delete');
        if (!ok) return;
        try {
          await AdminAPI.matchDelete(id);
          AdToast.success('Match deleted');
          loadMatches(page);
        } catch (err) {
          AdToast.error(err.message || 'Delete failed');
        }
      });
    });
  }

  /* =========================================================
     MODAL — Open
     ========================================================= */
  function openModal(match) {
    const form = document.getElementById('matchForm');
    if (!form) return;

    try { form.reset(); } catch (_) {}

    // Reset previews
    const bgPreview = document.getElementById('bgPreview');
    if (bgPreview) bgPreview.innerHTML = `<i class="fa-regular fa-image"></i>`;
    const bgInput = document.getElementById('bgInput');
    if (bgInput) bgInput.value = '';
    const clearBtn = document.getElementById('clearBgBtn');
    if (clearBtn) clearBtn.style.display = 'none';

    const title = document.getElementById('modalTitle');
    const isEdit = !!match;
    if (title) {
      title.textContent = isEdit
        ? (MODE === 'upcoming' ? 'Edit Upcoming Match' : 'Edit Live Match')
        : (MODE === 'upcoming' ? 'Add Upcoming Match' : 'Add Live Match');
    }

    const setVal = (name, value) => {
      const f = form.elements[name];
      if (!f) return;
      f.value = value != null ? String(value) : '';
    };

    if (isEdit && match) {
      // Basic
      setVal('id', match.id);
      setVal('competition', match.competition || 'Botola D2');
      setVal('round', match.round || '');
      setVal('team_home_id', match.team_home_id || match.homeTeam?.id || '');
      setVal('team_away_id', match.team_away_id || match.awayTeam?.id || '');
      setVal('score_home', match.score_home ?? 0);
      setVal('score_away', match.score_away ?? 0);
      setVal('match_minute', match.match_minute ?? 0);
      setVal('status', match.status || (MODE === 'upcoming' ? 'upcoming' : 'live'));
      setVal('match_date', match.match_date || '');
      setVal('match_time', (match.match_time || '').slice(0, 5));
      setVal('stadium_id', match.stadium_id || match.stadium?.id || '');
      setVal('city', match.city || '');
      setVal('referee', match.referee || '');
      setVal('attendance', match.attendance || '');
      setVal('stream_url', match.stream_url || '');
      setVal('thumbnail', match.thumbnail || '');

      // ✅ card_background
      const bg = match.card_background || '';
      setVal('card_background', bg);
      if (bg && bgPreview) {
        const url = bg.startsWith('http')
          ? bg
          : (window.BD_CONFIG.ASSETS_BASE + bg);
        bgPreview.innerHTML = `<img src="${AdUtil.esc(url)}" alt=""
          onerror="this.parentElement.innerHTML='<i class=\\'fa-regular fa-image\\'></i>'">`;
        if (clearBtn) clearBtn.style.display = '';
      }

      // ✅ PRE-ROLL AD
      setVal('ad_video_url', match.ad_video_url || '');
      setVal('ad_duration', match.ad_duration ?? 15);
      setVal('ad_skip_after', match.ad_skip_after ?? 5);

    } else {
      // New
      setVal('id', '');
      setVal('competition', 'Botola D2');
      setVal('status', MODE === 'upcoming' ? 'upcoming' : 'live');
      setVal('score_home', 0);
      setVal('score_away', 0);
      setVal('match_minute', 0);
      setVal('card_background', '');

      // ✅ Ad defaults
      setVal('ad_video_url', '');
      setVal('ad_duration', 15);
      setVal('ad_skip_after', 5);

      const now = new Date();
      setVal('match_date', now.toISOString().slice(0, 10));
      setVal('match_time', now.toTimeString().slice(0, 5));
    }

    AdUtil.openModal('matchModal');
  }

  /* =========================================================
     SAVE — FormData
     ========================================================= */
  async function onSave(e) {
    e.preventDefault();
    const form = e.currentTarget;

    const getVal = (name) => {
      const f = form.elements[name];
      if (!f) return '';
      return String(f.value || '').trim();
    };

    // ✅ Use FormData (for potential file upload)
    const fd = new FormData();

    // Basic
    fd.append('competition', getVal('competition') || 'Botola D2');
    fd.append('round', getVal('round'));
    fd.append('team_home_id', getVal('team_home_id'));
    fd.append('team_away_id', getVal('team_away_id'));
    fd.append('score_home', getVal('score_home') || '0');
    fd.append('score_away', getVal('score_away') || '0');
    fd.append('match_minute', getVal('match_minute') || '0');
    fd.append('status', getVal('status') || 'live');
    fd.append('match_date', getVal('match_date'));
    fd.append('match_time', getVal('match_time'));
    fd.append('stadium_id', getVal('stadium_id'));
    fd.append('city', getVal('city'));
    fd.append('referee', getVal('referee'));
    fd.append('attendance', getVal('attendance'));
    fd.append('stream_url', getVal('stream_url'));
    fd.append('thumbnail', getVal('thumbnail'));

    // ✅ Card Background — URL
    fd.append('card_background', getVal('card_background'));

    // ✅ Card Background — File
    const bgInput = document.getElementById('bgInput');
    if (bgInput?.files?.[0] && bgInput.files[0].size > 0) {
      fd.append('card_background_file', bgInput.files[0]);
    }

    // ✅ PRE-ROLL AD
    fd.append('ad_video_url', getVal('ad_video_url'));
    fd.append('ad_duration', getVal('ad_duration') || '15');
    fd.append('ad_skip_after', getVal('ad_skip_after') || '5');

    // ===== DEBUG =====
    console.log('===== ON SAVE — MATCH =====');
    for (let [k, v] of fd.entries()) {
      if (v instanceof File) {
        console.log('  ' + k + ':', '[File]', v.name, '(' + v.size + ' bytes)');
      } else {
        console.log('  ' + k + ':', JSON.stringify(v));
      }
    }
    console.log('===========================');

    // Validation
    const homeId = parseInt(getVal('team_home_id'), 10);
    const awayId = parseInt(getVal('team_away_id'), 10);
    if (!homeId || !awayId) { AdToast.error('Please select both teams'); return; }
    if (homeId === awayId) { AdToast.error('Home and away teams must be different'); return; }
    if (!getVal('match_date') || !getVal('match_time')) {
      AdToast.error('Date and time are required');
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
        response = await AdminAPI.matchUpdate(id, fd);
      } else {
        response = await AdminAPI.matchCreate(fd);
      }

      console.log('[onSave] Server returned:', response?.data);

      AdToast.success(id ? 'Match updated' : 'Match created');
      AdUtil.closeModal('matchModal');
      loadMatches(id ? page : 1);
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
})();