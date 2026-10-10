/* =========================================================
   BOTOLA D2 — live.js (v6 — with Ad support)
   Live matches page — compact cards + video modal + share menu.
   ========================================================= */

let refreshTimer = null;
const REFRESH_MS = 30000;

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  loadLive();
  startAutoRefresh();
  I18N.onChange(() => loadLive());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoRefresh();
    else { loadLive(); startAutoRefresh(); }
  });

  document.addEventListener('click', onCardAction);
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

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(loadLive, REFRESH_MS);
}
function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

/* =========================================================
   LOAD LIVE MATCHES
   ========================================================= */
async function loadLive() {
  const grid = document.getElementById('liveGrid');
  if (!grid) return;

  if (!grid.dataset.loaded) grid.innerHTML = BD.skeletonCards(6);

  try {
    const url = `${window.BD_CONFIG.API_BASE}/matches/live?_t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    const res = await response.json();
    const items = res?.data || [];

    updateCounter(items.length);

    if (!items.length) {
      grid.innerHTML = BD.emptyState(
        'fa-tv',
        I18N.t('empty.no_live_title', 'No live matches at the moment.'),
        I18N.t('empty.no_live_text', 'Check the upcoming matches and set a reminder.')
      );
      grid.dataset.loaded = '1';
      return;
    }

    grid.innerHTML = items.map(renderLiveCard).join('');
    grid.dataset.loaded = '1';
  } catch (e) {
    console.error('[live.js] Load failed:', e);
    if (!grid.dataset.loaded) {
      grid.innerHTML = BD.emptyState('fa-triangle-exclamation', I18N.t('errors.load_failed', 'Could not load matches.'));
    }
  }
}

function updateCounter(n) {
  const num = document.getElementById('liveCountNum');
  if (num) num.textContent = n;
  const box = document.getElementById('liveCounter');
  if (box) box.style.display = n > 0 ? '' : 'none';
}

/* =========================================================
   RENDER LIVE CARD
   ========================================================= */
function renderLiveCard(m) {
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};
  const minute = m.status === 'halftime' ? 'HT' : `${m.match_minute}'`;

  const homeLabel = home.short_name || home.name || '—';
  const awayLabel = away.short_name || away.name || '—';

  const bg = m.card_background
    ? (m.card_background.startsWith('http')
        ? m.card_background
        : (window.BD_CONFIG.ASSETS_BASE + m.card_background))
    : '';

  const bgStyle = bg ? `--card-bg:url('${BD.escapeHtml(bg)}');` : '';

  return `
    <article class="match-card match-card-compact is-live ${bg ? 'has-bg' : ''}"
      data-id="${m.id}"
      data-share-url="${window.BD_CONFIG.SHARE_SITE}/match/${m.id}"
      data-share-title="${BD.escapeHtml((home.name || 'Team A') + ' vs ' + (away.name || 'Team B'))}"
      style="${bgStyle}">

      ${bg ? '<div class="card-bg-overlay"></div>' : ''}

      <div class="card-content">
        <div class="match-card-head">
          <span class="match-competition">
            <i class="fa-solid fa-trophy"></i> ${BD.escapeHtml(m.competition || 'Botola D2')}
          </span>
          <span class="match-live-badge">
            <span class="live-dot"></span> LIVE
          </span>
        </div>

        <div class="match-teams">
          <div class="match-team">
            <div class="match-team-logo">${BD.teamLogoOrPlaceholder(home)}</div>
            <div class="match-team-name" title="${BD.escapeHtml(home.name || '')}">${BD.escapeHtml(homeLabel)}</div>
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
            <div class="match-team-name" title="${BD.escapeHtml(away.name || '')}">${BD.escapeHtml(awayLabel)}</div>
          </div>
        </div>

        <div class="match-meta">
          ${m.stadium?.name ? `<span><i class="fa-solid fa-location-dot"></i> ${BD.escapeHtml(m.stadium.name)}</span>` : ''}
          ${m.city ? `<span><i class="fa-solid fa-map-pin"></i> ${BD.escapeHtml(m.city)}</span>` : ''}
        </div>

        <div class="match-actions">
          <button class="btn-bd btn-bd-primary" data-watch="${m.id}">
            <i class="fa-solid fa-play"></i> WATCH LIVE
          </button>
          <button class="btn-bd btn-bd-ghost" data-details="${m.id}">
            <i class="fa-solid fa-circle-info"></i> DETAILS
          </button>
          <button class="btn-bd btn-bd-ghost btn-bd-icon" data-share-menu aria-label="Share">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   CARD ACTIONS
   ========================================================= */
function onCardAction(e) {
  const watchBtn = e.target.closest('[data-watch]');
  if (watchBtn) {
    e.preventDefault();
    const id = parseInt(watchBtn.getAttribute('data-watch'), 10);
    openLiveVideo(id);
    return;
  }

  const detailsBtn = e.target.closest('[data-details]');
  if (detailsBtn) {
    e.preventDefault();
    const id = parseInt(detailsBtn.getAttribute('data-details'), 10);
    openDetails(id);
    return;
  }

  const shareBtn = e.target.closest('[data-share-menu]');
  if (shareBtn) {
    e.preventDefault();
    const card = shareBtn.closest('.match-card');
    if (card) openShareMenu(shareBtn, {
      url: card.dataset.shareUrl,
      title: card.dataset.shareTitle
    });
  }
}

/* =========================================================
   WATCH LIVE — with Pre-roll Ad
   ========================================================= */
async function openLiveVideo(id) {
  const modal = document.getElementById('liveModal');
  if (!modal) return;

  const title = modal.querySelector('#liveModalTitle');
  const meta = modal.querySelector('#liveModalMeta');
  const video = modal.querySelector('#liveVideo');
  const lock = modal.querySelector('#liveVideoLock');

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  title.textContent = I18N.t('common.loading', 'Loading...');
  meta.innerHTML = '';
  if (lock) lock.style.display = 'none';

  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/matches/${id}?_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());

    const m = res?.data;
    if (!m) throw new Error('Match not found');

    const home = m.homeTeam || {};
    const away = m.awayTeam || {};

    title.textContent = `${home.name || ''} vs ${away.name || ''}`;
    meta.innerHTML = `
      <span class="match-live-badge"><span class="live-dot"></span> LIVE · ${m.match_minute}'</span>
      <span style="font-weight:900;color:#fff">${m.score_home ?? 0} - ${m.score_away ?? 0}</span>
      ${m.stadium?.name ? `<span><i class="fa-solid fa-location-dot"></i> ${BD.escapeHtml(m.stadium.name)}</span>` : ''}
    `;

    // ✅ Check stream
    if (!m.stream_url) {
      if (lock) {
        lock.style.display = '';
        const h3 = lock.querySelector('h3');
        const p = lock.querySelector('p');
        if (h3) h3.textContent = 'Stream unavailable';
        if (p) p.textContent = 'No stream URL configured for this match yet.';
      }
      return;
    }

    // ✅ Load stream with Ad support
    if (typeof BDPlayer !== 'undefined' && BDPlayer.load) {
      BDPlayer.load(m.stream_url, {
        autoplay: true,
        ad: m.ad_video_url ? {
          ad_video_url: m.ad_video_url,
          ad_duration: m.ad_duration || 15,
          ad_skip_after: m.ad_skip_after || 5
        } : null
      });
    } else if (video) {
      video.src = m.stream_url;
      video.play().catch(() => {});
    }
  } catch (err) {
    title.textContent = 'Error';
    meta.innerHTML = `<span>${BD.escapeHtml(err.message || '')}</span>`;
  }
}

/* =========================================================
   DETAILS MODAL
   ========================================================= */
async function openDetails(id) {
  const modal = document.getElementById('detailsModal');
  if (!modal) return;

  const body = modal.querySelector('#detailsBody');
  body.innerHTML = `<div class="skeleton" style="height:200px;border-radius:12px"></div>`;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(`${window.BD_CONFIG.API_BASE}/matches/${id}?_t=${Date.now()}`, {
      cache: 'no-store'
    }).then(r => r.json());

    const m = res?.data;
    if (!m) throw new Error('Match not found');

    const home = m.homeTeam || {};
    const away = m.awayTeam || {};

    body.innerHTML = `
      <div class="details-header">
        <div class="details-team">
          <div class="details-logo">${BD.teamLogoOrPlaceholder(home)}</div>
          <div class="details-name">${BD.escapeHtml(home.name || '—')}</div>
        </div>

        <div class="details-center">
          <div class="details-score">${m.score_home ?? 0} - ${m.score_away ?? 0}</div>
          <div class="details-minute"><span class="live-dot"></span> ${m.match_minute}'</div>
        </div>

        <div class="details-team">
          <div class="details-logo">${BD.teamLogoOrPlaceholder(away)}</div>
          <div class="details-name">${BD.escapeHtml(away.name || '—')}</div>
        </div>
      </div>

      <div class="details-info">
        <div class="details-row">
          <i class="fa-solid fa-trophy"></i>
          <span class="details-label">Competition</span>
          <span class="details-value">${BD.escapeHtml(m.competition || 'Botola D2')}</span>
        </div>
        ${m.round ? `
        <div class="details-row">
          <i class="fa-solid fa-list-ol"></i>
          <span class="details-label">Round</span>
          <span class="details-value">${BD.escapeHtml(m.round)}</span>
        </div>` : ''}
        ${m.stadium?.name ? `
        <div class="details-row">
          <i class="fa-solid fa-location-dot"></i>
          <span class="details-label">Stadium</span>
          <span class="details-value">${BD.escapeHtml(m.stadium.name)}</span>
        </div>` : ''}
        ${m.city ? `
        <div class="details-row">
          <i class="fa-solid fa-map-pin"></i>
          <span class="details-label">City</span>
          <span class="details-value">${BD.escapeHtml(m.city)}</span>
        </div>` : ''}
        ${m.referee ? `
        <div class="details-row">
          <i class="fa-solid fa-whistle"></i>
          <span class="details-label">Referee</span>
          <span class="details-value">${BD.escapeHtml(m.referee)}</span>
        </div>` : ''}
        <div class="details-row">
          <i class="fa-regular fa-calendar"></i>
          <span class="details-label">Date</span>
          <span class="details-value">${BD.formatDate(m.match_date, I18N.getLang())}</span>
        </div>
        <div class="details-row">
          <i class="fa-regular fa-clock"></i>
          <span class="details-label">Time</span>
          <span class="details-value">${BD.formatTime(m.match_time)}</span>
        </div>
        ${m.attendance ? `
        <div class="details-row">
          <i class="fa-solid fa-users"></i>
          <span class="details-label">Attendance</span>
          <span class="details-value">${Number(m.attendance).toLocaleString()}</span>
        </div>` : ''}
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div class="empty-state" style="padding:30px 10px">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:24px;color:var(--bd-danger)"></i>
      <p style="color:var(--bd-text-muted);margin-top:12px">${BD.escapeHtml(err.message || 'Error')}</p>
    </div>`;
  }
}

/* =========================================================
   SHARE MENU
   ========================================================= */
function openShareMenu(anchorEl, opts) {
  document.querySelectorAll('.share-pop-menu').forEach(el => el.remove());

  const url = opts.url || window.location.href;
  const title = opts.title || 'Check this match on BOTOLA D2';

  const menu = document.createElement('div');
  menu.className = 'share-pop-menu';
  menu.innerHTML = `
    <a href="https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}"
       target="_blank" rel="noopener" title="WhatsApp">
      <i class="fa-brands fa-whatsapp"></i>
    </a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}"
       target="_blank" rel="noopener" title="Facebook">
      <i class="fa-brands fa-facebook-f"></i>
    </a>
    <a href="#" data-instagram title="Instagram">
      <i class="fa-brands fa-instagram"></i>
    </a>
    <a href="mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check this match: ' + url)}"
       title="Email">
      <i class="fa-regular fa-envelope"></i>
    </a>
    <button type="button" data-copy title="Copy link">
      <i class="fa-solid fa-link"></i>
    </button>
  `;

  document.body.appendChild(menu);

  const rect = anchorEl.getBoundingClientRect();
  const menuW = 260;
  let left = rect.left + window.scrollX - menuW / 2 + rect.width / 2;
  let top = rect.bottom + window.scrollY + 8;

  if (left < 8) left = 8;
  if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;

  menu.style.position = 'absolute';
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';

  menu.querySelector('[data-copy]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      if (window.Toast) Toast.success(I18N.t('toast.link_copied', 'Link copied'));
    } catch (_) {
      const tmp = document.createElement('textarea');
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
      if (window.Toast) Toast.success(I18N.t('toast.link_copied', 'Link copied'));
    }
    menu.remove();
  });

  menu.querySelector('[data-instagram]')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(url);
      if (window.Toast) Toast.info('Link copied — paste it on Instagram');
    } catch (_) {}
    window.open('https://www.instagram.com/', '_blank', 'noopener');
    menu.remove();
  });

  setTimeout(() => {
    const close = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', close);
      }
    };
    document.addEventListener('click', close);
  }, 50);
}

/* =========================================================
   CLOSE MODALS
   ========================================================= */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-live-modal]')) {
    closeLiveModal();
  }
  if (e.target.closest('[data-close-details-modal]')) {
    closeDetailsModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLiveModal();
    closeDetailsModal();
    document.querySelectorAll('.share-pop-menu').forEach(el => el.remove());
  }
});

function closeLiveModal() {
  const modal = document.getElementById('liveModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  if (typeof BDPlayer !== 'undefined' && BDPlayer.destroy) BDPlayer.destroy();
  const video = modal.querySelector('#liveVideo');
  if (video) {
    try { video.pause(); video.removeAttribute('src'); video.load(); } catch (_) {}
  }
}

function closeDetailsModal() {
  const modal = document.getElementById('detailsModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}