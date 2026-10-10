/* =========================================================
   BOTOLA D2 — upcoming.js (v2 — with Card Background)
   Public upcoming matches page.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  loadUpcoming();
  I18N.onChange(() => loadUpcoming());
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

/* =========================================================
   LOAD
   ========================================================= */
async function loadUpcoming() {
  const grid = document.getElementById('upcomingGrid');
  if (!grid) return;

  grid.innerHTML = BD.skeletonCards(6);

  try {
    const res = await API.upcomingMatches();
    const items = res?.data || [];

    if (!items.length) {
      grid.innerHTML = BD.emptyState(
        'fa-calendar',
        I18N.t('empty.no_upcoming_title','No upcoming matches.'),
        I18N.t('empty.no_upcoming_text','New fixtures will appear here soon.')
      );
      return;
    }

    // Group by date
    const grouped = groupByDate(items);
    let html = '';
    for (const [dateKey, matches] of Object.entries(grouped)) {
      html += `
        <div class="bd-date-group" style="grid-column: 1 / -1;">
          <h3 class="bd-date-heading">
            <i class="fa-regular fa-calendar-check"></i>
            ${BD.formatDate(dateKey, I18N.getLang())}
            <span class="bd-date-count">${matches.length}</span>
          </h3>
        </div>
      `;
      html += matches.map(renderUpcomingCard).join('');
    }
    grid.innerHTML = html;
    bindNotify();
  } catch (e) {
    console.error('[upcoming.js] Load failed:', e);
    grid.innerHTML = BD.emptyState(
      'fa-triangle-exclamation',
      I18N.t('errors.load_failed','Could not load upcoming matches.')
    );
  }
}

/* =========================================================
   GROUP BY DATE
   ========================================================= */
function groupByDate(items) {
  const out = {};
  items.forEach(m => {
    const d = m.match_date;
    if (!out[d]) out[d] = [];
    out[d].push(m);
  });
  // Sort ascending
  return Object.keys(out).sort().reduce((acc, k) => {
    acc[k] = out[k];
    return acc;
  }, {});
}

/* =========================================================
   RENDER CARD — with Card Background support
   ========================================================= */
function renderUpcomingCard(m) {
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};

  // ✅ Card Background
  const bg = m.card_background
    ? (m.card_background.startsWith('http')
        ? m.card_background
        : (window.BD_CONFIG.ASSETS_BASE + m.card_background))
    : '';

  const bgStyle = bg ? `--card-bg:url('${BD.escapeHtml(bg)}');` : '';

  const shareUrl = `${window.BD_CONFIG.SHARE_SITE}/match/${m.id}`;
  const shareTitle = `${home.name || 'Team A'} vs ${away.name || 'Team B'}`;

  return `
    <article class="match-card match-card-compact ${bg ? 'has-bg' : ''}"
      data-id="${m.id}"
      data-share-url="${shareUrl}"
      data-share-title="${BD.escapeHtml(shareTitle)}"
      style="${bgStyle}">

      ${bg ? '<div class="card-bg-overlay"></div>' : ''}

      <div class="card-content">
        <div class="match-card-head">
          <span class="match-competition">
            <i class="fa-solid fa-trophy"></i> ${BD.escapeHtml(m.competition || 'Botola D2')}
          </span>
          <span class="match-upcoming-badge">${I18N.t('status.upcoming','UPCOMING')}</span>
        </div>

        <div class="match-teams">
          <div class="match-team">
            <div class="match-team-logo">${BD.teamLogoOrPlaceholder(home)}</div>
            <div class="match-team-name" title="${BD.escapeHtml(home.name || '')}">
              ${BD.escapeHtml(home.short_name || home.name || '—')}
            </div>
          </div>
          <div class="match-score">
            <div class="match-date-small">${BD.formatDate(m.match_date, I18N.getLang())}</div>
            <div class="match-minutes-upcoming">${BD.formatTime(m.match_time)}</div>
            ${m.round ? `<div class="match-date-small" style="margin-top:6px">${BD.escapeHtml(m.round)}</div>` : ''}
          </div>
          <div class="match-team">
            <div class="match-team-logo">${BD.teamLogoOrPlaceholder(away)}</div>
            <div class="match-team-name" title="${BD.escapeHtml(away.name || '')}">
              ${BD.escapeHtml(away.short_name || away.name || '—')}
            </div>
          </div>
        </div>

        <div class="match-meta">
          ${m.stadium?.name ? `<span><i class="fa-solid fa-location-dot"></i> ${BD.escapeHtml(m.stadium.name)}</span>` : ''}
          ${m.city ? `<span><i class="fa-solid fa-map-pin"></i> ${BD.escapeHtml(m.city)}</span>` : ''}
        </div>

        <div class="match-actions">
          <button class="btn-bd btn-bd-primary js-notify" data-id="${m.id}">
            <i class="fa-regular fa-bell"></i> ${I18N.t('actions.notify_me','NOTIFY ME')}
          </button>
          <a href="/match/${m.id}" class="btn-bd btn-bd-ghost">
            <i class="fa-solid fa-circle-info"></i> ${I18N.t('actions.details','DETAILS')}
          </a>
          <button class="btn-bd btn-bd-ghost btn-bd-icon"
            data-share
            data-share-url="${shareUrl}"
            data-share-title="${BD.escapeHtml(shareTitle)}"
            aria-label="Share">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   NOTIFY
   ========================================================= */
function bindNotify() {
  document.querySelectorAll('.js-notify').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      if (!Auth.isLoggedIn()) {
        Toast.info(I18N.t('auth.login_required','Please log in to set notifications'));
        setTimeout(() => {
          window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
        }, 800);
        return;
      }

      const id = btn.getAttribute('data-id');
      btn.disabled = true;

      try {
        await API.notifyMatch(id);
        Toast.success(I18N.t('toast.notify_saved','Notification set. We\'ll remind you before kickoff.'));
        btn.innerHTML = `<i class="fa-solid fa-check"></i> ${I18N.t('actions.notified','NOTIFIED')}`;
      } catch (err) {
        Toast.error(err.message || I18N.t('errors.generic','Something went wrong'));
        btn.disabled = false;
      }
    });
  });
}