/* =========================================================
   BOTOLA D2 — home.js
   Home page: Section settings + News Ticker + Grids (no carousels)
   ========================================================= */

let SECTION_SETTINGS = {};

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  loadAll();
  I18N.onChange(() => loadAll());
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

async function loadAll() {
  await loadSectionSettings();
  loadNewsTicker();
  loadStats();
  loadLiveGrid();
  loadReplayGrid();
  loadUpcomingGrid();
  loadResults();
  loadStandings();
}

/* =========================================================
   SECTION SETTINGS
   ========================================================= */
async function loadSectionSettings() {
  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/home-sections/public?_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());

    SECTION_SETTINGS = {};
    (res?.data || []).forEach(s => { SECTION_SETTINGS[s.section_key] = s; });

    applySectionSettings();
  } catch (_) {}
}

function applySectionSettings() {
  // Live
  const live = SECTION_SETTINGS.live;
  if (live) {
    const sec = document.getElementById('liveSection');
    if (sec) sec.style.display = live.is_visible ? '' : 'none';
  }

  // Replay
  const replay = SECTION_SETTINGS.replay;
  if (replay) {
    const sec = document.getElementById('replaySection');
    if (sec) sec.style.display = replay.is_visible ? '' : 'none';
  }

  // Upcoming
  const upcoming = SECTION_SETTINGS.upcoming;
  if (upcoming) {
    const sec = document.getElementById('upcomingSection');
    if (sec) sec.style.display = upcoming.is_visible ? '' : 'none';
  }
}

/* =========================================================
   NEWS TICKER
   ========================================================= */
async function loadNewsTicker() {
  const ticker = document.getElementById('newsTicker');
  const track = document.getElementById('newsTickerTrack');
  if (!ticker || !track) return;

  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/news/public?_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());

    const items = res?.data || [];
    if (!items.length) {
      ticker.style.display = 'none';
      return;
    }

    const html = items.map(item => `
      <a href="${item.link_url || '#'}" class="news-ticker-item ${item.color}"
         ${item.link_url ? 'target="_blank" rel="noopener"' : ''}>
        <i class="fa-solid ${item.icon || 'fa-bullhorn'}"></i>
        <span>${BD.escapeHtml(item.message)}</span>
        ${item.link_text ? `<strong>${BD.escapeHtml(item.link_text)} →</strong>` : ''}
      </a>
    `).join('');

    // Duplicate for infinite loop
    track.innerHTML = html + html;
    ticker.style.display = '';
  } catch (_) {
    ticker.style.display = 'none';
  }
}

/* =========================================================
   HERO STATS
   ========================================================= */
async function loadStats() {
  try {
    const [live, upcoming, replays] = await Promise.all([
      fetch(`${window.BD_CONFIG.API_BASE}/matches/live`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`${window.BD_CONFIG.API_BASE}/matches/upcoming`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`${window.BD_CONFIG.API_BASE}/replays?limit=1`, { cache: 'no-store' }).then(r => r.json())
    ]);
    animateNum(document.getElementById('statLiveCount'), (live.data || []).length);
    animateNum(document.getElementById('statUpcomingCount'), (upcoming.data || []).length);
    animateNum(document.getElementById('statReplayCount'), replays?.data?.pagination?.total || 0);
  } catch (_) {}
}

function animateNum(el, target) {
  if (!el) return;
  const dur = 900;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* =========================================================
   LIVE GRID (5 cards)
   ========================================================= */
async function loadLiveGrid() {
  const grid = document.getElementById('liveGrid');
  if (!grid) return;

  grid.innerHTML = BD.skeletonCards(5);

  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/matches/live?_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());

    const limit = SECTION_SETTINGS.live?.items_limit || 5;
    const items = (res?.data || []).slice(0, limit);

    if (!items.length) {
      const sec = document.getElementById('liveSection');
      if (sec) sec.style.display = 'none';
      return;
    }

    grid.innerHTML = items.map(m => renderLiveCard(m)).join('');
  } catch (_) {
    const sec = document.getElementById('liveSection');
    if (sec) sec.style.display = 'none';
  }
}

function renderLiveCard(m) {
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};
  const minute = m.status === 'halftime' ? 'HT' : `${m.match_minute}'`;

  const bg = m.card_background
    ? (m.card_background.startsWith('http')
        ? m.card_background
        : (window.BD_CONFIG.ASSETS_BASE + m.card_background))
    : '';

  const shareUrl = `${window.BD_CONFIG.SHARE_SITE}/match/${m.id}`;
  const shareTitle = `${home.name || '?'} vs ${away.name || '?'}`;

  return `
    <article class="match-card match-card-compact is-live ${bg ? 'has-bg' : ''}"
      data-id="${m.id}"
      data-share-url="${shareUrl}"
      data-share-title="${BD.escapeHtml(shareTitle)}"
      style="${bg ? `--card-bg:url('${BD.escapeHtml(bg)}');` : ''}">

      ${bg ? '<div class="card-bg-overlay"></div>' : ''}

      <div class="card-content">
        <div class="match-card-head">
          <span class="match-competition">
            <i class="fa-solid fa-trophy"></i> ${BD.escapeHtml(m.competition || 'Botola D2')}
          </span>
          <span class="match-live-badge"><span class="live-dot"></span> LIVE</span>
        </div>

        <div class="match-teams">
          <div class="match-team">
            <div class="match-team-logo">${BD.teamLogoOrPlaceholder(home)}</div>
            <div class="match-team-name">${BD.escapeHtml(home.short_name || home.name || '—')}</div>
          </div>
          <div class="match-score">
            <div class="match-score-line">
              <span>${m.score_home ?? 0}</span>
              <span class="sep">-</span>
              <span>${m.score_away ?? 0}</span>
            </div>
            <div class="match-minute"><span class="live-dot"></span> ${minute}</div>
          </div>
          <div class="match-team">
            <div class="match-team-logo">${BD.teamLogoOrPlaceholder(away)}</div>
            <div class="match-team-name">${BD.escapeHtml(away.short_name || away.name || '—')}</div>
          </div>
        </div>

        <div class="match-meta">
          ${m.stadium?.name ? `<span><i class="fa-solid fa-location-dot"></i> ${BD.escapeHtml(m.stadium.name)}</span>` : ''}
          ${m.city ? `<span><i class="fa-solid fa-map-pin"></i> ${BD.escapeHtml(m.city)}</span>` : ''}
        </div>

        <div class="match-actions">
          <a href="/match/${m.id}" class="btn-bd btn-bd-primary btn-bd-sm">
            <i class="fa-solid fa-play"></i> WATCH LIVE
          </a>
          <button class="btn-bd btn-bd-ghost btn-bd-sm"
            data-share
            data-share-url="${shareUrl}"
            data-share-title="${BD.escapeHtml(shareTitle)}">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   REPLAY GRID (5 cards)
   ========================================================= */
async function loadReplayGrid() {
  const grid = document.getElementById('replayGridHome');
  if (!grid) return;

  grid.innerHTML = BD.skeletonCards(5);

  try {
    const limit = SECTION_SETTINGS.replay?.items_limit || 5;
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/replays?limit=${limit}&_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());

    const items = res?.data?.items || [];
    if (!items.length) {
      const sec = document.getElementById('replaySection');
      if (sec) sec.style.display = 'none';
      return;
    }

    grid.innerHTML = items.map(r => renderReplayCard(r)).join('');
    bindReplayActions(grid);
  } catch (_) {
    const sec = document.getElementById('replaySection');
    if (sec) sec.style.display = 'none';
  }
}

function renderReplayCard(r) {
  const m = r.match || {};
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};
  const hasSummary = !!(r.summary_video_url && r.summary_video_url.length > 3);
  const thumb = r.thumbnail
    ? (r.thumbnail.startsWith('http') ? r.thumbnail : (window.BD_CONFIG.ASSETS_BASE + r.thumbnail))
    : '';

  const requires = r.requires_subscription || 'standard';
  const badge = requires === 'gold'
    ? `<span class="replay-tier gold"><i class="fa-solid fa-crown"></i> GOLD</span>`
    : requires === 'standard'
      ? `<span class="replay-tier std">STD</span>`
      : `<span class="replay-tier free">FREE</span>`;

  return `
    <article class="replay-card" data-id="${r.id}">
      <div class="replay-thumb" style="${thumb ? `background-image:url('${BD.escapeHtml(thumb)}');` : ''}">
        <div class="replay-thumb-overlay">
          <button class="replay-play" data-play="${r.id}">
            <i class="fa-solid fa-play"></i>
          </button>
        </div>
        ${badge}
        ${r.duration ? `<span class="replay-duration"><i class="fa-regular fa-clock"></i> ${BD.escapeHtml(r.duration)}</span>` : ''}
        ${hasSummary ? `<span class="replay-summary-badge"><i class="fa-solid fa-film"></i> HLS</span>` : ''}
      </div>

      <div class="replay-body">
        <h3 class="replay-title">${BD.escapeHtml(r.title)}</h3>

        ${m.id ? `
          <div class="replay-teams">
            <span class="result-team-logo">${BD.teamLogoOrPlaceholder(home)}</span>
            <span class="replay-score">${m.score_home ?? '?'} - ${m.score_away ?? '?'}</span>
            <span class="result-team-logo">${BD.teamLogoOrPlaceholder(away)}</span>
          </div>
        ` : ''}

        <div class="replay-actions">
          <button class="btn-bd btn-bd-primary btn-bd-sm" data-play="${r.id}">
            <i class="fa-solid fa-play"></i> WATCH
          </button>
          ${hasSummary ? `<button class="btn-bd btn-bd-gold btn-bd-sm" data-resume="${r.id}">
            <i class="fa-solid fa-film"></i> RESUME
          </button>` : ''}
        </div>
      </div>
    </article>
  `;
}

function bindReplayActions(grid) {
  grid.querySelectorAll('[data-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-play');
      window.location.href = `/replay?open=${id}`;
    });
  });
  grid.querySelectorAll('[data-resume]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-resume');
      window.location.href = `/replay?open=${id}&type=summary`;
    });
  });
}

/* =========================================================
   UPCOMING GRID (5 cards)
   ========================================================= */
async function loadUpcomingGrid() {
  const grid = document.getElementById('upcomingGridHome');
  if (!grid) return;

  grid.innerHTML = BD.skeletonCards(5);

  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/matches/upcoming?_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());

    const limit = SECTION_SETTINGS.upcoming?.items_limit || 5;
    const items = (res?.data || []).slice(0, limit);

    if (!items.length) {
      const sec = document.getElementById('upcomingSection');
      if (sec) sec.style.display = 'none';
      return;
    }

    grid.innerHTML = items.map(m => renderUpcomingCard(m)).join('');
  } catch (_) {
    const sec = document.getElementById('upcomingSection');
    if (sec) sec.style.display = 'none';
  }
}

function renderUpcomingCard(m) {
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};

  const bg = m.card_background
    ? (m.card_background.startsWith('http')
        ? m.card_background
        : (window.BD_CONFIG.ASSETS_BASE + m.card_background))
    : '';

  const shareUrl = `${window.BD_CONFIG.SHARE_SITE}/match/${m.id}`;
  const shareTitle = `${home.name || '?'} vs ${away.name || '?'}`;

  return `
    <article class="match-card match-card-compact ${bg ? 'has-bg' : ''}"
      data-id="${m.id}"
      style="${bg ? `--card-bg:url('${BD.escapeHtml(bg)}');` : ''}">

      ${bg ? '<div class="card-bg-overlay"></div>' : ''}

      <div class="card-content">
        <div class="match-card-head">
          <span class="match-competition">
            <i class="fa-solid fa-trophy"></i> ${BD.escapeHtml(m.competition || 'Botola D2')}
          </span>
          <span class="match-upcoming-badge">UPCOMING</span>
        </div>

        <div class="match-teams">
          <div class="match-team">
            <div class="match-team-logo">${BD.teamLogoOrPlaceholder(home)}</div>
            <div class="match-team-name">${BD.escapeHtml(home.short_name || home.name || '—')}</div>
          </div>
          <div class="match-score">
            <div class="match-date-small">${BD.formatDate(m.match_date, I18N.getLang())}</div>
            <div class="match-minutes-upcoming">${BD.formatTime(m.match_time)}</div>
          </div>
          <div class="match-team">
            <div class="match-team-logo">${BD.teamLogoOrPlaceholder(away)}</div>
            <div class="match-team-name">${BD.escapeHtml(away.short_name || away.name || '—')}</div>
          </div>
        </div>

        <div class="match-meta">
          ${m.stadium?.name ? `<span><i class="fa-solid fa-location-dot"></i> ${BD.escapeHtml(m.stadium.name)}</span>` : ''}
          ${m.city ? `<span><i class="fa-solid fa-map-pin"></i> ${BD.escapeHtml(m.city)}</span>` : ''}
        </div>

        <div class="match-actions">
          <button class="btn-bd btn-bd-primary btn-bd-sm js-notify" data-id="${m.id}">
            <i class="fa-regular fa-bell"></i> NOTIFY
          </button>
          <a href="/match/${m.id}" class="btn-bd btn-bd-ghost btn-bd-sm">
            <i class="fa-solid fa-circle-info"></i> DETAILS
          </a>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   RESULTS + STANDINGS (same as before)
   ========================================================= */
async function loadResults() {
  const list = document.getElementById('resultsList');
  if (!list) return;
  list.innerHTML = BD.skeletonCards(4, 'skel-line');

  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/matches/results?page=1&limit=5&_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());
    const items = res?.data?.items || [];

    if (!items.length) {
      list.innerHTML = BD.emptyState('fa-futbol', I18N.t('empty.no_results_title', 'No results yet.'));
      return;
    }
    list.innerHTML = items.map(renderResultRow).join('');
  } catch (_) {
    list.innerHTML = BD.emptyState('fa-triangle-exclamation', I18N.t('errors.load_failed', 'Error'));
  }
}

function renderResultRow(m) {
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};
  return `
    <a href="/match/${m.id}" class="result-row">
      <span class="result-date">${BD.formatDate(m.match_date, I18N.getLang())}</span>
      <span class="result-team">
        <span class="result-team-logo">${BD.teamLogoOrPlaceholder(home)}</span>
        <span class="result-team-name">${BD.escapeHtml(home.short_name || home.name || '—')}</span>
      </span>
      <span class="result-score">${m.score_home ?? 0} <span style="color:var(--bd-primary)">-</span> ${m.score_away ?? 0}</span>
      <span></span>
      <span class="result-team right">
        <span class="result-team-logo">${BD.teamLogoOrPlaceholder(away)}</span>
        <span class="result-team-name">${BD.escapeHtml(away.short_name || away.name || '—')}</span>
      </span>
      <span class="btn-bd btn-bd-ghost btn-bd-sm"><i class="fa-solid fa-arrow-right"></i></span>
    </a>
  `;
}

async function loadStandings() {
  const box = document.getElementById('standingsPreview');
  if (!box) return;
  box.innerHTML = `<div style="padding:18px">${BD.skeletonCards(3,'skel-line')}</div>`;

  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/standings?_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());
    const rows = (res?.data || []).slice(0, 6);

    if (!rows.length) {
      box.innerHTML = BD.emptyState('fa-ranking-star', I18N.t('empty.no_standings_title', 'No standings yet.'));
      return;
    }
    box.innerHTML = rows.map(r => `
      <div class="standing-row">
        <span class="standing-pos ${posClass(r.position)}">${r.position}</span>
        <span class="standing-team">
          <span class="standing-logo">${BD.teamLogoOrPlaceholder({ name: r.team_name, logo: r.team_logo })}</span>
          <span class="standing-name">${BD.escapeHtml(r.team_name)}</span>
        </span>
        <span class="standing-gd">${r.gd >= 0 ? '+' : ''}${r.gd}</span>
        <span class="standing-pts">${r.points}</span>
      </div>
    `).join('');
  } catch (_) {
    box.innerHTML = BD.emptyState('fa-triangle-exclamation', I18N.t('errors.load_failed', 'Error'));
  }
}

function posClass(pos) {
  if (pos === 1) return 'pos-champion';
  if (pos <= 2)  return 'pos-promo';
  if (pos <= 6)  return 'pos-safe';
  return 'pos-releg';
}

/* =========================================================
   NOTIFY BUTTON
   ========================================================= */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.js-notify');
  if (!btn) return;
  if (!Auth.isLoggedIn()) {
    Toast.info(I18N.t('auth.login_required', 'Please log in'));
    setTimeout(() => {
      window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
    }, 800);
    return;
  }
  const id = btn.getAttribute('data-id');
  btn.disabled = true;
  try {
    await API.notifyMatch(id);
    Toast.success(I18N.t('toast.notify_saved', 'Notification set'));
    btn.innerHTML = `<i class="fa-solid fa-check"></i> NOTIFIED`;
  } catch (err) {
    Toast.error(err.message || 'Error');
    btn.disabled = false;
  }
});