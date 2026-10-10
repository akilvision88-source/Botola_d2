/* =========================================================
   BOTOLA D2 — match.js (v3 — with Ad support)
   Match details page: hero, timeline, statistics, events.
   ========================================================= */

let currentMatch = null;

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  const id = extractMatchId();
  if (!id) {
    document.getElementById('matchLoading').innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3>${I18N.t('match.not_found','Match not found')}</h3>
    </div>`;
    return;
  }
  loadMatch(id);
});

function extractMatchId() {
  const path = window.location.pathname;
  const pathMatch = path.match(/\/match\/(\d+)/);
  if (pathMatch) return parseInt(pathMatch[1], 10);
  const params = new URLSearchParams(window.location.search);
  const qid = params.get('id');
  return qid ? parseInt(qid, 10) : null;
}

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

async function loadMatch(id) {
  try {
    const res = await API.match(id);
    const m = res?.data;
    if (!m) throw new Error('Not found');

    currentMatch = m;
    document.getElementById('matchLoading').style.display = 'none';
    document.getElementById('matchContent').style.display = '';

    renderHero(m);
    renderStatusBadge(m);
    renderActions(m);
    renderTimeline(m);
    renderStatistics(m);
    renderEvents(m);
    bindTabs();

    const home = m.homeTeam?.name || '';
    const away = m.awayTeam?.name || '';
    if (home && away) {
      document.title = `${home} ${m.score_home ?? 0} - ${m.score_away ?? 0} ${away} — BOTOLA D2`;
      document.getElementById('crumbMatch').textContent = `${home} vs ${away}`;
    }
  } catch (e) {
    document.getElementById('matchLoading').innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3>${I18N.t('match.not_found','Match not found')}</h3>
      <p>${BD.escapeHtml(e.message || '')}</p>
      <a href="/results" class="btn-bd btn-bd-primary mt-3">${I18N.t('common.back','Back')}</a>
    </div>`;
  }
}

/* ============ HERO ============ */
function renderHero(m) {
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};

  document.getElementById('heroCompetition').textContent = m.competition || 'Botola D2';
  const roundEl = document.getElementById('heroRound');
  if (m.round) roundEl.textContent = ' · ' + m.round;

  document.getElementById('heroHomeLogo').innerHTML = BD.teamLogoOrPlaceholder(home);
  document.getElementById('heroHomeName').textContent = home.name || '—';
  document.getElementById('heroAwayLogo').innerHTML = BD.teamLogoOrPlaceholder(away);
  document.getElementById('heroAwayName').textContent = away.name || '—';

  const scoreEl = document.getElementById('heroScore');
  if (m.status === 'upcoming') {
    scoreEl.textContent = BD.formatTime(m.match_time);
    scoreEl.classList.add('upcoming');
  } else {
    scoreEl.innerHTML = `<span>${m.score_home ?? 0}</span><span class="sep">-</span><span>${m.score_away ?? 0}</span>`;
  }

  const dtEl = document.getElementById('heroDatetime');
  dtEl.textContent = `${BD.formatDate(m.match_date, I18N.getLang())} · ${BD.formatTime(m.match_time)}`;

  const meta = document.getElementById('heroMeta');
  const metaItems = [];
  if (m.stadium?.name) metaItems.push(`<span><i class="fa-solid fa-location-dot"></i> ${BD.escapeHtml(m.stadium.name)}</span>`);
  if (m.city) metaItems.push(`<span><i class="fa-solid fa-map-pin"></i> ${BD.escapeHtml(m.city)}</span>`);
  if (m.referee) metaItems.push(`<span><i class="fa-solid fa-whistle"></i> ${BD.escapeHtml(m.referee)}</span>`);
  if (m.attendance) metaItems.push(`<span><i class="fa-solid fa-users"></i> ${m.attendance.toLocaleString()}</span>`);
  meta.innerHTML = metaItems.join('');

  // ✅ Show player with Ad support
  if (m.stream_url && (m.status === 'live' || m.status === 'halftime')) {
    showPlayer(m);
  }
}

function renderStatusBadge(m) {
  const el = document.getElementById('heroStatus');
  if (!el) return;
  const map = {
    live:      { cls: 'live', html: `<span class="live-dot"></span> ${I18N.t('status.live','LIVE')} · ${m.match_minute}'` },
    halftime:  { cls: 'live', html: `<span class="live-dot"></span> ${I18N.t('status.halftime','HT')}` },
    upcoming:  { cls: 'upcoming', html: I18N.t('status.upcoming','UPCOMING') },
    finished:  { cls: 'finished', html: I18N.t('status.finished','FINISHED') },
    postponed: { cls: 'muted', html: I18N.t('status.postponed','POSTPONED') },
    cancelled: { cls: 'muted', html: I18N.t('status.cancelled','CANCELLED') }
  };
  const c = map[m.status] || map.upcoming;
  el.className = 'match-hero-status ' + c.cls;
  el.innerHTML = c.html;
}

function renderActions(m) {
  const box = document.getElementById('heroActions');
  if (!box) return;
  const shareUrl = `${window.BD_CONFIG.SHARE_SITE}/match/${m.id}`;
  const shareTitle = `${m.homeTeam?.name} vs ${m.awayTeam?.name}`;

  let html = '';

  if (m.status === 'upcoming') {
    html += `
      <button class="btn-bd btn-bd-primary js-notify" data-id="${m.id}">
        <i class="fa-regular fa-bell"></i> ${I18N.t('actions.notify_me','NOTIFY ME')}
      </button>
    `;
  } else if (m.stream_url && (m.status === 'live' || m.status === 'halftime')) {
    html += `
      <a href="#playerSection" class="btn-bd btn-bd-primary">
        <i class="fa-solid fa-play"></i> ${I18N.t('actions.watch_live','WATCH LIVE')}
      </a>
    `;
  }

  html += `
    <button class="btn-bd btn-bd-ghost"
      data-share
      data-share-url="${shareUrl}"
      data-share-title="${BD.escapeHtml(shareTitle)}">
      <i class="fa-solid fa-share-nodes"></i> ${I18N.t('actions.share','SHARE')}
    </button>
  `;

  box.innerHTML = html;

  box.querySelector('.js-notify')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!Auth.isLoggedIn()) {
      Toast.info(I18N.t('auth.login_required','Please log in'));
      setTimeout(() => {
        window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
      }, 800);
      return;
    }
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await API.notifyMatch(m.id);
      Toast.success(I18N.t('toast.notify_saved','Notification set'));
      btn.innerHTML = `<i class="fa-solid fa-check"></i> ${I18N.t('actions.notified','NOTIFIED')}`;
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Error'));
      btn.disabled = false;
    }
  });
}

/* =========================================================
   SHOW PLAYER — with Pre-roll Ad support
   ========================================================= */
function showPlayer(m) {
  const section = document.getElementById('playerSection');
  if (section) section.style.display = '';

  try {
    BDPlayer.hideLock();

    // ✅ Load with Ad support
    BDPlayer.load(m.stream_url, {
      autoplay: false,
      ad: m.ad_video_url ? {
        ad_video_url: m.ad_video_url,
        ad_duration: m.ad_duration || 15,
        ad_skip_after: m.ad_skip_after || 5
      } : null
    });
  } catch (e) {
    BDPlayer.showLock(
      I18N.t('match.stream_unavailable','Stream unavailable'),
      e.message || ''
    );
  }
}

/* ============ TIMELINE ============ */
function renderTimeline(m) {
  const box = document.getElementById('matchTimeline');
  if (!box) return;

  const events = (m.events || []).slice().sort((a, b) => a.minute - b.minute);
  if (!events.length) {
    box.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-regular fa-clock"></i></div>
      <h3>${I18N.t('match.no_events','No events yet.')}</h3>
      <p>${I18N.t('match.timeline_will_appear','The timeline will appear during the match.')}</p></div>`;
    return;
  }

  const homeId = m.homeTeam?.id;
  const awayId = m.awayTeam?.id;

  box.innerHTML = `
    <div class="timeline-wrap">
      <div class="timeline-line"></div>
      ${events.map(ev => {
        const side = (ev.team_id === homeId) ? 'left' : (ev.team_id === awayId ? 'right' : 'center');
        return renderTimelineEvent(ev, side);
      }).join('')}
    </div>
  `;
}

function renderTimelineEvent(ev, side) {
  const iconMap = {
    goal: 'fa-futbol',
    penalty: 'fa-circle-dot',
    own_goal: 'fa-futbol',
    yellow_card: 'fa-square',
    red_card: 'fa-square',
    second_yellow: 'fa-square',
    substitution: 'fa-right-left',
    var: 'fa-tv',
    kickoff: 'fa-play',
    halftime: 'fa-pause',
    fulltime: 'fa-flag-checkered'
  };
  const colorMap = {
    goal: 'ev-goal',
    penalty: 'ev-goal',
    own_goal: 'ev-own',
    yellow_card: 'ev-yellow',
    red_card: 'ev-red',
    second_yellow: 'ev-red',
    substitution: 'ev-sub',
    var: 'ev-var',
    kickoff: 'ev-neutral',
    halftime: 'ev-neutral',
    fulltime: 'ev-neutral'
  };

  const icon = iconMap[ev.event_type] || 'fa-circle';
  const cls  = colorMap[ev.event_type] || 'ev-neutral';

  let label = '';
  if (ev.event_type === 'goal') label = I18N.t('events.goal','Goal');
  else if (ev.event_type === 'penalty') label = I18N.t('events.penalty','Penalty');
  else if (ev.event_type === 'own_goal') label = I18N.t('events.own_goal','Own goal');
  else if (ev.event_type === 'yellow_card') label = I18N.t('events.yellow','Yellow card');
  else if (ev.event_type === 'red_card') label = I18N.t('events.red','Red card');
  else if (ev.event_type === 'second_yellow') label = I18N.t('events.second_yellow','Second yellow');
  else if (ev.event_type === 'substitution') label = I18N.t('events.substitution','Substitution');
  else if (ev.event_type === 'var') label = 'VAR';
  else if (ev.event_type === 'kickoff') label = I18N.t('events.kickoff','Kick-off');
  else if (ev.event_type === 'halftime') label = I18N.t('events.halftime','Half-time');
  else if (ev.event_type === 'fulltime') label = I18N.t('events.fulltime','Full-time');

  return `
    <div class="timeline-item ${side}">
      <div class="timeline-side">
        <span class="timeline-minute">${ev.minute}'</span>
        <span class="timeline-icon ${cls}"><i class="fa-solid ${icon}"></i></span>
      </div>
      <div class="timeline-content">
        <div class="timeline-type">${label}</div>
        ${ev.player_name ? `<div class="timeline-player">${BD.escapeHtml(ev.player_name)}${ev.player_secondary ? ` <span class="timeline-sub">→ ${BD.escapeHtml(ev.player_secondary)}</span>` : ''}</div>` : ''}
        ${ev.description ? `<div class="timeline-desc">${BD.escapeHtml(ev.description)}</div>` : ''}
      </div>
    </div>
  `;
}

/* ============ STATS ============ */
function renderStatistics(m) {
  const box = document.getElementById('matchStats');
  if (!box) return;

  const s = m.statistics;
  if (!s) {
    box.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-chart-simple"></i></div>
      <h3>${I18N.t('match.no_stats','Statistics not available.')}</h3></div>`;
    return;
  }

  const rows = [
    { key: 'possession',        home: s.possession_home,        away: s.possession_away,        label: I18N.t('stats.possession','Possession'), pct: true },
    { key: 'shots',             home: s.shots_home,             away: s.shots_away,             label: I18N.t('stats.shots','Shots') },
    { key: 'shots_on_target',   home: s.shots_on_target_home,   away: s.shots_on_target_away,   label: I18N.t('stats.shots_on_target','Shots on target') },
    { key: 'corners',           home: s.corners_home,           away: s.corners_away,           label: I18N.t('stats.corners','Corners') },
    { key: 'fouls',             home: s.fouls_home,             away: s.fouls_away,             label: I18N.t('stats.fouls','Fouls') },
    { key: 'offsides',          home: s.offsides_home,          away: s.offsides_away,          label: I18N.t('stats.offsides','Offsides') }
  ];

  box.innerHTML = `
    <div class="stats-head">
      <span>${BD.escapeHtml(m.homeTeam?.name || '')}</span>
      <span></span>
      <span>${BD.escapeHtml(m.awayTeam?.name || '')}</span>
    </div>
    ${rows.map(r => renderStatRow(r)).join('')}
  `;
}

function renderStatRow(r) {
  const total = (Number(r.home) || 0) + (Number(r.away) || 0);
  const homePct = total ? (Number(r.home) / total) * 100 : 50;
  const awayPct = 100 - homePct;

  const homeLabel = r.pct ? `${r.home}%` : r.home;
  const awayLabel = r.pct ? `${r.away}%` : r.away;

  return `
    <div class="stat-row">
      <div class="stat-row-num left">${homeLabel}</div>
      <div class="stat-row-bar">
        <div class="stat-bar-fill left" style="width:${homePct}%"></div>
        <div class="stat-bar-fill right" style="width:${awayPct}%"></div>
      </div>
      <div class="stat-row-num right">${awayLabel}</div>
      <div class="stat-row-label">${r.label}</div>
    </div>
  `;
}

/* ============ EVENTS (Goals & Cards) ============ */
function renderEvents(m) {
  const box = document.getElementById('matchEvents');
  if (!box) return;

  const home = m.homeTeam || {};
  const away = m.awayTeam || {};
  const goals = m.goals || [];
  const cards = m.cards || [];

  const homeGoals = goals.filter(g => g.team_id === home.id);
  const awayGoals = goals.filter(g => g.team_id === away.id);
  const homeCards = cards.filter(c => c.team_id === home.id);
  const awayCards = cards.filter(c => c.team_id === away.id);

  if (!goals.length && !cards.length) {
    box.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-futbol"></i></div>
      <h3>${I18N.t('match.no_goals_cards','No goals or cards recorded.')}</h3></div>`;
    return;
  }

  box.innerHTML = `
    <div class="events-grid">
      <div class="events-side">
        <div class="events-side-head">
          <span class="standing-logo">${BD.teamLogoOrPlaceholder(home)}</span>
          <span>${BD.escapeHtml(home.name || '')}</span>
        </div>
        <div class="events-group">
          <h4><i class="fa-solid fa-futbol"></i> ${I18N.t('match.goals','Goals')}</h4>
          ${homeGoals.length ? homeGoals.map(g => `
            <div class="event-line goal">
              <span class="ev-min">${g.minute}'</span>
              <span class="ev-name">${BD.escapeHtml(g.player_name)}${g.is_penalty ? ' <small>(P)</small>' : ''}${g.is_own_goal ? ' <small>(OG)</small>' : ''}</span>
            </div>
          `).join('') : `<div class="event-empty">—</div>`}
        </div>
        <div class="events-group">
          <h4><i class="fa-solid fa-square" style="color:var(--bd-warning)"></i> ${I18N.t('match.cards','Cards')}</h4>
          ${homeCards.length ? homeCards.map(c => `
            <div class="event-line card-${c.card_type}">
              <span class="ev-min">${c.minute}'</span>
              <span class="ev-card card-${c.card_type}"></span>
              <span class="ev-name">${BD.escapeHtml(c.player_name)}</span>
            </div>
          `).join('') : `<div class="event-empty">—</div>`}
        </div>
      </div>

      <div class="events-side">
        <div class="events-side-head">
          <span class="standing-logo">${BD.teamLogoOrPlaceholder(away)}</span>
          <span>${BD.escapeHtml(away.name || '')}</span>
        </div>
        <div class="events-group">
          <h4><i class="fa-solid fa-futbol"></i> ${I18N.t('match.goals','Goals')}</h4>
          ${awayGoals.length ? awayGoals.map(g => `
            <div class="event-line goal">
              <span class="ev-min">${g.minute}'</span>
              <span class="ev-name">${BD.escapeHtml(g.player_name)}${g.is_penalty ? ' <small>(P)</small>' : ''}${g.is_own_goal ? ' <small>(OG)</small>' : ''}</span>
            </div>
          `).join('') : `<div class="event-empty">—</div>`}
        </div>
        <div class="events-group">
          <h4><i class="fa-solid fa-square" style="color:var(--bd-warning)"></i> ${I18N.t('match.cards','Cards')}</h4>
          ${awayCards.length ? awayCards.map(c => `
            <div class="event-line card-${c.card_type}">
              <span class="ev-min">${c.minute}'</span>
              <span class="ev-card card-${c.card_type}"></span>
              <span class="ev-name">${BD.escapeHtml(c.player_name)}</span>
            </div>
          `).join('') : `<div class="event-empty">—</div>`}
        </div>
      </div>
    </div>
  `;
}

/* ============ TABS ============ */
function bindTabs() {
  document.querySelectorAll('.match-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.match-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.match-tab-panel').forEach(p => {
        p.style.display = p.getAttribute('data-panel') === target ? '' : 'none';
      });
    });
  });
}