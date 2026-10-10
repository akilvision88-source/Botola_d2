/* =========================================================
   BOTOLA D2 Admin — results.js
   Manage finished matches + goals + cards + statistics.
   ========================================================= */

let page = 1;
const LIMIT = 15;
let teamsCache = [];
let stadiumsCache = [];
let currentMatch = null;
let filterTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('results', 'Results');
  if (!user) return;

  await Promise.all([loadTeams(), loadStadiums()]);
  populateSelects();

  bindUI();
  loadResults();
});

/* ============ UI ============ */
function bindUI() {
  document.getElementById('addBtn')?.addEventListener('click', () => openResultModal(null));
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadResults(page));

  const search = document.getElementById('filterSearch');
  if (search) search.addEventListener('input', () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => { page = 1; loadResults(1); }, 350);
  });
  document.getElementById('filterDate')?.addEventListener('change', () => { page = 1; loadResults(1); });

  document.getElementById('resultForm')?.addEventListener('submit', onSaveResult);
  document.getElementById('goalForm')?.addEventListener('submit', onAddGoal);
  document.getElementById('cardForm')?.addEventListener('submit', onAddCard);
  document.getElementById('statsForm')?.addEventListener('submit', onSaveStats);

  document.querySelectorAll('.result-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.result-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.result-panel').forEach(p => {
        p.style.display = p.getAttribute('data-panel') === target ? '' : 'none';
      });
      if (target === 'goals') loadGoals();
      if (target === 'cards') loadCards();
      if (target === 'stats') loadStats();
    });
  });
}

/* ============ DATA ============ */
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
  const ids = ['resTeamHome', 'resTeamAway', 'goalTeam', 'cardTeam'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<option value="">— Select —</option>` +
      teamsCache.map(t => `<option value="${t.id}">${AdUtil.esc(t.name)}</option>`).join('');
  });
  const stadium = document.getElementById('resStadium');
  if (stadium) stadium.innerHTML = `<option value="">— None —</option>` +
    stadiumsCache.map(s => `<option value="${s.id}">${AdUtil.esc(s.name)} — ${AdUtil.esc(s.city)}</option>`).join('');
}

/* ============ LIST ============ */
async function loadResults(p = 1) {
  page = p;
  const tbody = document.getElementById('resultsBody');
  AdUtil.showTableSkeleton(tbody, 6, 6);

  try {
    const params = { page: p, limit: LIMIT, status: 'finished' };
    const dateF = document.getElementById('filterDate')?.value;
    if (dateF) params.date = dateF;

    const res = await AdminAPI.matchesList(params);
    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    const q = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
    const filtered = q ? items.filter(m =>
      (m.competition || '').toLowerCase().includes(q) ||
      (m.city || '').toLowerCase().includes(q) ||
      (m.homeTeam?.name || '').toLowerCase().includes(q) ||
      (m.awayTeam?.name || '').toLowerCase().includes(q)
    ) : items;

    if (!filtered.length) {
      tbody.innerHTML = AdUtil.emptyRow(6, 'No results found');
      AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = filtered.map(m => {
      const home = m.homeTeam || {};
      const away = m.awayTeam || {};
      const goalsCount = (m.goals || []).length;
      return `
        <tr>
          <td>${AdUtil.fmtDate(m.match_date)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="ad-logo-cell">${AdUtil.teamLogo(home)}</span>
              <strong style="font-size:12.5px">${AdUtil.esc(home.name || '—')}</strong>
              <span style="color:var(--bd-text-dim)">vs</span>
              <strong style="font-size:12.5px">${AdUtil.esc(away.name || '—')}</strong>
              <span class="ad-logo-cell">${AdUtil.teamLogo(away)}</span>
            </div>
          </td>
          <td><span style="font-weight:900;font-size:15px;color:#fff">${m.score_home ?? 0} - ${m.score_away ?? 0}</span></td>
          <td><span class="ad-pill finished">${goalsCount} goals</span></td>
          <td>${AdUtil.esc(m.competition || '')}</td>
          <td>
            <div class="ad-row-actions">
              <button class="ad-row-btn" data-action="edit" data-id="${m.id}" title="Edit result"><i class="fa-solid fa-pen"></i></button>
              <button class="ad-row-btn danger" data-action="delete" data-id="${m.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindRowActions();
    AdUtil.paginate(document.getElementById('pagination'), pagination, loadResults);
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(6, 'Failed to load: ' + (err.message || ''));
  }
}

function bindRowActions() {
  document.querySelectorAll('[data-action="edit"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      try {
        const res = await AdminAPI.matchGet(id);
        openResultModal(res.data);
      } catch (err) { AdToast.error(err.message || 'Could not load match'); }
    });
  });
  document.querySelectorAll('[data-action="delete"]').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const ok = await AdUtil.confirmDialog('Delete result?', 'This will remove the match and all its data.', 'Delete');
      if (!ok) return;
      try {
        await AdminAPI.matchDelete(id);
        AdToast.success('Deleted');
        loadResults(page);
      } catch (err) { AdToast.error(err.message || 'Delete failed'); }
    });
  });
}

/* ============ MODAL ============ */
function openResultModal(match) {
  currentMatch = match || null;
  const form = document.getElementById('resultForm');
  form.reset();

  if (match) {
    document.getElementById('resultModalTitle').textContent =
      `${match.homeTeam?.name || '?'} ${match.score_home ?? 0} - ${match.score_away ?? 0} ${match.awayTeam?.name || '?'}`;

    form.id.value = match.id;
    form.competition.value = match.competition || 'Botola D2';
    form.round.value = match.round || '';
    form.team_home_id.value = match.team_home_id || match.homeTeam?.id || '';
    form.team_away_id.value = match.team_away_id || match.awayTeam?.id || '';
    form.score_home.value = match.score_home ?? 0;
    form.score_away.value = match.score_away ?? 0;
    form.status.value = match.status || 'finished';
    form.match_date.value = match.match_date || '';
    form.match_time.value = (match.match_time || '').slice(0, 5);
    form.match_minute.value = match.match_minute ?? 90;
    form.stadium_id.value = match.stadium_id || match.stadium?.id || '';
    form.city.value = match.city || '';
    form.referee.value = match.referee || '';
    form.attendance.value = match.attendance || '';

    // Stats
    const st = match.statistics || {};
    const sf = document.getElementById('statsForm');
    ['possession_home','possession_away','shots_home','shots_away','shots_on_target_home','shots_on_target_away',
     'corners_home','corners_away','fouls_home','fouls_away','offsides_home','offsides_away'].forEach(k => {
      if (sf[k]) sf[k].value = st[k] ?? 0;
    });
    document.getElementById('statsMatchId').value = match.id;
  } else {
    document.getElementById('resultModalTitle').textContent = 'Add Result';
    form.status.value = 'finished';
    form.score_home.value = 0;
    form.score_away.value = 0;
    form.match_minute.value = 90;
    const now = new Date();
    form.match_date.value = now.toISOString().slice(0, 10);
    form.match_time.value = '20:00';
    document.getElementById('statsMatchId').value = '';
  }

  // Reset tabs to Info
  document.querySelectorAll('.result-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === 'info'));
  document.querySelectorAll('.result-panel').forEach(p => {
    p.style.display = p.getAttribute('data-panel') === 'info' ? '' : 'none';
  });

  AdUtil.openModal('resultModal');
  if (match) {
    loadGoals();
    loadCards();
  } else {
    document.getElementById('goalsList').innerHTML = `<div style="color:var(--bd-text-dim);text-align:center;padding:30px">Save the match first to add goals</div>`;
    document.getElementById('cardsList').innerHTML = `<div style="color:var(--bd-text-dim);text-align:center;padding:30px">Save the match first to add cards</div>`;
  }
}

/* ============ SAVE RESULT ============ */
async function onSaveResult(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = {
    competition: form.competition.value.trim(),
    round: form.round.value.trim() || null,
    team_home_id: parseInt(form.team_home_id.value, 10),
    team_away_id: parseInt(form.team_away_id.value, 10),
    score_home: parseInt(form.score_home.value, 10) || 0,
    score_away: parseInt(form.score_away.value, 10) || 0,
    match_minute: parseInt(form.match_minute.value, 10) || 90,
    status: form.status.value,
    match_date: form.match_date.value,
    match_time: form.match_time.value + ':00',
    stadium_id: form.stadium_id.value ? parseInt(form.stadium_id.value, 10) : null,
    city: form.city.value.trim() || null,
    referee: form.referee.value.trim() || null,
    attendance: form.attendance.value ? parseInt(form.attendance.value, 10) : null
  };

  if (!payload.team_home_id || !payload.team_away_id) { AdToast.error('Select both teams'); return; }
  if (payload.team_home_id === payload.team_away_id) { AdToast.error('Teams must be different'); return; }

  const btn = document.getElementById('saveResultBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  try {
    const id = form.id.value;
    if (id) {
      await AdminAPI.matchUpdate(id, payload);
      AdToast.success('Result updated');
      // reload detail
      const r = await AdminAPI.matchGet(id);
      currentMatch = r.data;
      document.getElementById('statsMatchId').value = id;
    } else {
      const r = await AdminAPI.matchCreate(payload);
      AdToast.success('Result created');
      // Set id so tabs work
      const newId = r?.data?.id;
      if (newId) {
        form.id.value = newId;
        document.getElementById('statsMatchId').value = newId;
        const full = await AdminAPI.matchGet(newId);
        currentMatch = full.data;
      }
    }
    loadResults(page);
  } catch (err) {
    AdToast.error(err.message || 'Save failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ============ GOALS ============ */
async function loadGoals() {
  const box = document.getElementById('goalsList');
  if (!box) return;
  const id = document.getElementById('resultMatchId').value;
  if (!id) {
    box.innerHTML = `<div style="color:var(--bd-text-dim);text-align:center;padding:30px">Save the match first to add goals</div>`;
    return;
  }
  box.innerHTML = `<div class="ad-skeleton" style="height:60px;margin-bottom:8px"></div>`;

  try {
    const res = await AdminAPI.matchGet(id);
    const match = res.data;
    currentMatch = match;
    const goals = match.goals || [];

    // Populate team selects
    const teamSel = document.getElementById('goalTeam');
    if (teamSel) {
      teamSel.innerHTML = `
        <option value="${match.team_home_id}">${AdUtil.esc(match.homeTeam?.name || 'Home')}</option>
        <option value="${match.team_away_id}">${AdUtil.esc(match.awayTeam?.name || 'Away')}</option>
      `;
    }

    if (!goals.length) {
      box.innerHTML = `<div style="color:var(--bd-text-dim);text-align:center;padding:30px">No goals recorded</div>`;
      return;
    }

    const teamName = (tid) => {
      if (tid === match.team_home_id) return match.homeTeam?.name || 'Home';
      if (tid === match.team_away_id) return match.awayTeam?.name || 'Away';
      return 'Team';
    };

    box.innerHTML = goals.map(g => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 14px;background:var(--ad-bg-2);border:1px solid var(--ad-border);border-radius:10px;margin-bottom:8px">
        <span style="font-weight:800;color:var(--bd-primary);min-width:44px;font-size:14px">${g.minute}'</span>
        <i class="fa-solid fa-futbol" style="color:var(--bd-primary)"></i>
        <div style="flex:1">
          <div style="color:#fff;font-weight:600;font-size:13.5px">${AdUtil.esc(g.player_name)}${g.is_penalty ? ' <small style="color:var(--bd-text-dim)">(P)</small>' : ''}${g.is_own_goal ? ' <small style="color:var(--bd-text-dim)">(OG)</small>' : ''}</div>
          <div style="color:var(--bd-text-dim);font-size:11.5px;margin-top:2px">${AdUtil.esc(teamName(g.team_id))}</div>
        </div>
        <button class="ad-row-btn danger" data-delete-goal="${g.id}" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');

    box.querySelectorAll('[data-delete-goal]').forEach(b => {
      b.addEventListener('click', async () => {
        const gid = b.getAttribute('data-delete-goal');
        const ok = await AdUtil.confirmDialog('Delete goal?', 'This action cannot be undone.', 'Delete');
        if (!ok) return;
        try {
          await AdminAPI.matchUpdate(currentMatch.id, { goals: goals.filter(x => x.id !== Number(gid)) });
          AdToast.success('Goal deleted');
          loadGoals();
          loadResults(page);
        } catch (err) {
          // Backend may not support goals update via matchUpdate; try alternate
          AdToast.error(err.message || 'Delete failed');
        }
      });
    });
  } catch (err) {
    box.innerHTML = `<div style="color:var(--bd-danger);text-align:center;padding:30px">${AdUtil.esc(err.message || 'Failed to load goals')}</div>`;
  }
}

async function onAddGoal(e) {
  e.preventDefault();
  const id = document.getElementById('resultMatchId').value;
  if (!id) { AdToast.error('Save the match first'); return; }

  const form = e.currentTarget;
  const payload = {
    team_id: parseInt(form.team_id.value, 10),
    player_name: form.player_name.value.trim(),
    minute: parseInt(form.minute.value, 10),
    is_penalty: form.is_penalty.checked,
    is_own_goal: form.is_own_goal.checked
  };
  if (!payload.team_id || !payload.player_name || !payload.minute) {
    AdToast.error('All fields required'); return;
  }

  try {
    await fetch(window.BD_CONFIG.API_BASE + `/matches/${id}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY)
      },
      body: JSON.stringify(payload)
    }).then(async r => {
      if (!r.ok) throw { message: (await r.json().catch(() => ({})))?.message || 'Error' };
      return r.json();
    });
    AdToast.success('Goal added');
    form.reset();
    loadGoals();
    loadResults(page);
  } catch (err) {
    AdToast.error(err.message || 'Failed to add goal');
  }
}

/* ============ CARDS ============ */
async function loadCards() {
  const box = document.getElementById('cardsList');
  if (!box) return;
  const id = document.getElementById('resultMatchId').value;
  if (!id) {
    box.innerHTML = `<div style="color:var(--bd-text-dim);text-align:center;padding:30px">Save the match first to add cards</div>`;
    return;
  }
  box.innerHTML = `<div class="ad-skeleton" style="height:60px;margin-bottom:8px"></div>`;

  try {
    const res = await AdminAPI.matchGet(id);
    const match = res.data;
    currentMatch = match;
    const cards = match.cards || [];

    const teamSel = document.getElementById('cardTeam');
    if (teamSel) {
      teamSel.innerHTML = `
        <option value="${match.team_home_id}">${AdUtil.esc(match.homeTeam?.name || 'Home')}</option>
        <option value="${match.team_away_id}">${AdUtil.esc(match.awayTeam?.name || 'Away')}</option>
      `;
    }

    if (!cards.length) {
      box.innerHTML = `<div style="color:var(--bd-text-dim);text-align:center;padding:30px">No cards recorded</div>`;
      return;
    }

    const teamName = (tid) => {
      if (tid === match.team_home_id) return match.homeTeam?.name || 'Home';
      if (tid === match.team_away_id) return match.awayTeam?.name || 'Away';
      return 'Team';
    };
    const cardColor = (t) => t === 'yellow' ? '#F59E0B' : t === 'red' ? '#EF4444' : '#EF4444';
    const cardLabel = (t) => t === 'yellow' ? 'Yellow' : t === 'red' ? 'Red' : '2nd Yellow';

    box.innerHTML = cards.map(c => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 14px;background:var(--ad-bg-2);border:1px solid var(--ad-border);border-radius:10px;margin-bottom:8px">
        <span style="font-weight:800;color:var(--bd-primary);min-width:44px;font-size:14px">${c.minute}'</span>
        <span style="width:14px;height:18px;background:${cardColor(c.card_type)};border-radius:2px"></span>
        <div style="flex:1">
          <div style="color:#fff;font-weight:600;font-size:13.5px">${AdUtil.esc(c.player_name)}</div>
          <div style="color:var(--bd-text-dim);font-size:11.5px;margin-top:2px">${AdUtil.esc(teamName(c.team_id))} · ${cardLabel(c.card_type)}</div>
        </div>
        <button class="ad-row-btn danger" data-delete-card="${c.id}" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');

    box.querySelectorAll('[data-delete-card]').forEach(b => {
      b.addEventListener('click', async () => {
        const cid = b.getAttribute('data-delete-card');
        const ok = await AdUtil.confirmDialog('Delete card?', 'This action cannot be undone.', 'Delete');
        if (!ok) return;
        try {
          await fetch(window.BD_CONFIG.API_BASE + `/matches/${currentMatch.id}/cards/${cid}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY) }
          }).then(async r => { if (!r.ok) throw { message: (await r.json().catch(() => ({})))?.message || 'Error' }; });
          AdToast.success('Card deleted');
          loadCards();
        } catch (err) {
          AdToast.error(err.message || 'Delete failed');
        }
      });
    });
  } catch (err) {
    box.innerHTML = `<div style="color:var(--bd-danger);text-align:center;padding:30px">${AdUtil.esc(err.message || 'Failed to load cards')}</div>`;
  }
}

async function onAddCard(e) {
  e.preventDefault();
  const id = document.getElementById('resultMatchId').value;
  if (!id) { AdToast.error('Save the match first'); return; }

  const form = e.currentTarget;
  const payload = {
    team_id: parseInt(form.team_id.value, 10),
    player_name: form.player_name.value.trim(),
    card_type: form.card_type.value,
    minute: parseInt(form.minute.value, 10)
  };
  if (!payload.team_id || !payload.player_name || !payload.minute) {
    AdToast.error('All fields required'); return;
  }

  try {
    await fetch(window.BD_CONFIG.API_BASE + `/matches/${id}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY)
      },
      body: JSON.stringify(payload)
    }).then(async r => {
      if (!r.ok) throw { message: (await r.json().catch(() => ({})))?.message || 'Error' };
      return r.json();
    });
    AdToast.success('Card added');
    form.reset();
    loadCards();
    loadResults(page);
  } catch (err) {
    AdToast.error(err.message || 'Failed to add card');
  }
}

/* ============ STATS ============ */
async function loadStats() {
  const id = document.getElementById('resultMatchId').value;
  if (!id) return;
  try {
    const res = await AdminAPI.matchGet(id);
    const match = res.data;
    const st = match.statistics || {};
    const sf = document.getElementById('statsForm');
    ['possession_home','possession_away','shots_home','shots_away','shots_on_target_home','shots_on_target_away',
     'corners_home','corners_away','fouls_home','fouls_away','offsides_home','offsides_away'].forEach(k => {
      if (sf[k]) sf[k].value = st[k] ?? 0;
    });
    document.getElementById('statsMatchId').value = id;
  } catch (_) {}
}

async function onSaveStats(e) {
  e.preventDefault();
  const id = document.getElementById('statsMatchId').value;
  if (!id) { AdToast.error('Save the match first'); return; }

  const form = e.currentTarget;
  const payload = {};
  ['possession_home','possession_away','shots_home','shots_away','shots_on_target_home','shots_on_target_away',
   'corners_home','corners_away','fouls_home','fouls_away','offsides_home','offsides_away'].forEach(k => {
    payload[k] = parseInt(form[k].value, 10) || 0;
  });

  const btn = document.getElementById('saveStatsBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  try {
    await fetch(window.BD_CONFIG.API_BASE + `/matches/${id}/statistics`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem(window.BD_CONFIG.TOKEN_KEY)
      },
      body: JSON.stringify(payload)
    }).then(async r => {
      if (!r.ok) throw { message: (await r.json().catch(() => ({})))?.message || 'Error' };
      return r.json();
    });
    AdToast.success('Statistics saved');
  } catch (err) {
    AdToast.error(err.message || 'Save failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}