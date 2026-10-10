/* =========================================================
   BOTOLA D2 — replay.js (v8 FINAL)
   - Subscription tiers: free / standard / gold
   - has_access from backend
   - Auto-refresh user data on every load
   - Pre-roll Ad + Share Menu
   ========================================================= */

let replayPage = 1;
let currentReplay = null;
const REPLAY_LIMIT = 12;

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  loadReplays(1);
  I18N.onChange(() => loadReplays(replayPage));
  bindPlayerControls();

  window.addEventListener('bd:user-changed', () => {
    loadReplays(replayPage);
  });
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
   FETCH — with auth header (no-cache)
   ========================================================= */
async function fetchNoCache(url) {
  const headers = {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  };

  const token = localStorage.getItem(window.BD_CONFIG.TOKEN_KEY);
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(url, {
    cache: 'no-store',
    headers
  });
  return res.json();
}

/* =========================================================
   LOAD LIST
   ========================================================= */
async function loadReplays(page = 1) {
  const grid = document.getElementById('replayGrid');
  const pag = document.getElementById('replayPagination');
  if (!grid) return;

  replayPage = page;

  // ✅ تحديث بيانات المستخدم من الباكند قبل كل تحميل
  if (window.Auth && Auth.isLoggedIn && Auth.isLoggedIn() && Auth.refreshMe) {
    try {
      await Auth.refreshMe();
    } catch (_) { /* ignore */ }
  }

  grid.innerHTML = BD.skeletonCards(6);

  try {
    const url = `${window.BD_CONFIG.API_BASE}/replays?page=${page}&limit=${REPLAY_LIMIT}&_t=${Date.now()}`;
    const res = await fetchNoCache(url);

    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    if (!items.length) {
      grid.innerHTML = BD.emptyState(
        'fa-clock-rotate-left',
        I18N.t('empty.no_replays_title', 'No replays available.'),
        I18N.t('empty.no_replays_text', 'Replays will be published after each match.')
      );
      if (pag) pag.innerHTML = '';
      return;
    }

    grid.innerHTML = items.map(renderReplayCard).join('');
    if (pag) renderPagination(pag, pagination);
    bindReplayCards();
  } catch (e) {
    console.error('[replay.js] Load failed:', e);
    grid.innerHTML = BD.emptyState(
      'fa-triangle-exclamation',
      I18N.t('errors.load_failed', 'Could not load replays.')
    );
  }
}

/* =========================================================
   RENDER CARD — with has_access from backend
   ========================================================= */
function renderReplayCard(r) {
  const m = r.match || {};
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};
  const requires = r.requires_subscription || 'standard';
  const hasAccess = r.has_access === true;   // ✅ من الباكند

  const badge = requires === 'gold'
    ? `<span class="replay-tier gold"><i class="fa-solid fa-crown"></i> GOLD</span>`
    : requires === 'standard'
      ? `<span class="replay-tier std">STANDARD</span>`
      : `<span class="replay-tier free">FREE</span>`;

  const thumb = r.thumbnail
    ? (r.thumbnail.startsWith('http') ? r.thumbnail : (window.BD_CONFIG.ASSETS_BASE + r.thumbnail))
    : '';

  const scoreText = m.id
    ? `${m.score_home ?? '?'} - ${m.score_away ?? '?'}`
    : '';

  const hasSummary = !!(r.summary_video_url && r.summary_video_url.length > 3);

  return `
    <article class="replay-card ${hasAccess ? '' : 'replay-locked'}" data-id="${r.id}">
      <div class="replay-thumb" style="${thumb ? `background-image:url('${BD.escapeHtml(thumb)}');` : ''}">
        <div class="replay-thumb-overlay">
          ${hasAccess
            ? `<button class="replay-play" data-play="${r.id}" aria-label="Play replay">
                 <i class="fa-solid fa-play"></i>
               </button>`
            : `<button class="replay-play replay-play-locked" data-upgrade="1" aria-label="Upgrade">
                 <i class="fa-solid fa-lock"></i>
               </button>`
          }
        </div>
        ${badge}
        ${r.duration ? `<span class="replay-duration"><i class="fa-regular fa-clock"></i> ${BD.escapeHtml(r.duration)}</span>` : ''}
        ${hasSummary ? `<span class="replay-summary-badge"><i class="fa-solid fa-film"></i> HIGHLIGHTS</span>` : ''}
      </div>

      <div class="replay-body">
        <h3 class="replay-title">${BD.escapeHtml(r.title)}</h3>

        ${m.id ? `
          <div class="replay-teams">
            <span class="replay-team">
              <span class="result-team-logo">${BD.teamLogoOrPlaceholder(home)}</span>
              <span class="replay-team-name">${BD.escapeHtml(home.name || '—')}</span>
            </span>
            <span class="replay-score">${BD.escapeHtml(scoreText)}</span>
            <span class="replay-team right">
              <span class="result-team-logo">${BD.teamLogoOrPlaceholder(away)}</span>
              <span class="replay-team-name">${BD.escapeHtml(away.name || '—')}</span>
            </span>
          </div>
        ` : ''}

        <div class="replay-meta">
          <span><i class="fa-regular fa-calendar"></i> ${BD.formatDate(r.replay_date, I18N.getLang())}</span>
          ${m.stadium?.name ? `<span><i class="fa-solid fa-location-dot"></i> ${BD.escapeHtml(m.stadium.name)}</span>` : ''}
          ${m.city ? `<span><i class="fa-solid fa-map-pin"></i> ${BD.escapeHtml(m.city)}</span>` : ''}
        </div>

        <div class="replay-actions">
          ${hasAccess
            ? `<button class="btn-bd btn-bd-primary" data-play="${r.id}">
                 <i class="fa-solid fa-play"></i> ${I18N.t('actions.watch_replay', 'WATCH')}
               </button>`
            : `<a href="/subscription" class="btn-bd btn-bd-gold">
                 <i class="fa-solid fa-crown"></i> UPGRADE
               </a>`
          }

          ${hasSummary && hasAccess ? `
            <button class="btn-bd btn-bd-gold js-resume" data-resume="${r.id}">
              <i class="fa-solid fa-film"></i> RESUME
            </button>
          ` : ''}

          ${hasAccess ? `
            <button class="btn-bd btn-bd-ghost btn-bd-icon js-download-btn"
                    data-id="${r.id}"
                    data-tier="${requires}"
                    title="Download">
              <i class="fa-solid fa-download"></i>
            </button>
          ` : ''}

          <button class="btn-bd btn-bd-ghost btn-bd-icon js-share-btn"
            data-share-id="${r.id}"
            data-share-url="${window.BD_CONFIG.SHARE_SITE}/replay?open=${r.id}"
            data-share-title="${BD.escapeHtml(r.title)}"
            aria-label="Share">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   PAGINATION
   ========================================================= */
function renderPagination(container, p) {
  if (!p.totalPages || p.totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  const cur = p.page, total = p.totalPages;

  html += `<button class="pg-btn" data-page="${cur - 1}" ${cur === 1 ? 'disabled' : ''}>
    <i class="fa-solid fa-chevron-left"></i>
  </button>`;

  const range = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - cur) <= 1) range.push(i);
    else if (range[range.length - 1] !== '...') range.push('...');
  }
  range.forEach(r => {
    if (r === '...') html += `<span class="pg-dots">…</span>`;
    else html += `<button class="pg-btn ${r === cur ? 'active' : ''}" data-page="${r}">${r}</button>`;
  });

  html += `<button class="pg-btn" data-page="${cur + 1}" ${cur === total ? 'disabled' : ''}>
    <i class="fa-solid fa-chevron-right"></i>
  </button>`;

  container.innerHTML = html;

  container.querySelectorAll('.pg-btn[data-page]').forEach(b => {
    b.addEventListener('click', () => {
      const pg = parseInt(b.getAttribute('data-page'), 10);
      if (!Number.isNaN(pg) && pg >= 1 && pg <= total && pg !== cur) {
        loadReplays(pg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

/* =========================================================
   BIND ACTIONS
   ========================================================= */
function bindReplayCards() {
  document.querySelectorAll('[data-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-play'), 10);
      if (id) openReplay(id, 'full');
    });
  });

  document.querySelectorAll('[data-resume]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-resume'), 10);
      if (id) openReplay(id, 'summary');
    });
  });

  document.querySelectorAll('[data-upgrade]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = '/subscription';
    });
  });

  document.querySelectorAll('.js-download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      attemptDownload(parseInt(btn.getAttribute('data-id'), 10));
    });
  });

  document.querySelectorAll('.js-share-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.getAttribute('data-share-url') || window.location.href;
      const title = btn.getAttribute('data-share-title') || 'Check this replay on BOTOLA D2';
      openShareMenu(btn, { url, title });
    });
  });
}

/* =========================================================
   SHARE MENU
   ========================================================= */
function openShareMenu(anchorEl, opts) {
  document.querySelectorAll('.share-pop-menu').forEach(el => el.remove());

  const url = opts.url || window.location.href;
  const title = opts.title || 'Check this on BOTOLA D2';

  const menu = document.createElement('div');
  menu.className = 'share-pop-menu';
  menu.innerHTML = `
    <a href="https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}" target="_blank" rel="noopener" title="WhatsApp">
      <i class="fa-brands fa-whatsapp"></i>
    </a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" title="Facebook">
      <i class="fa-brands fa-facebook-f"></i>
    </a>
    <a href="#" data-instagram title="Instagram">
      <i class="fa-brands fa-instagram"></i>
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

  menu.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    e.preventDefault();
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
   OPEN REPLAY
   ========================================================= */
async function openReplay(id, type = 'full') {
  if (!id) return;

  const modal = document.getElementById('playerModal');
  const title = document.getElementById('playerTitle');
  const meta  = document.getElementById('playerMeta');
  const dl    = document.getElementById('playerDownload');
  const sh    = document.getElementById('playerShare');
  if (!modal) return;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  title.textContent = I18N.t('common.loading', 'Loading...');
  meta.innerHTML = '';
  BDPlayer.hideLock();

  try {
    const detail = await fetchNoCache(`${window.BD_CONFIG.API_BASE}/replays/${id}?_t=${Date.now()}`);
    const r = detail?.data;
    if (!r) throw new Error('Not found');

    currentReplay = r;

    const isSummary = type === 'summary';
    const videoUrl    = isSummary ? r.summary_video_url    : r.video_url;
    const downloadUrl = isSummary ? r.summary_download_url : r.download_url;
    const duration    = isSummary ? r.summary_duration     : r.duration;

    title.textContent = isSummary
      ? `${r.title} — RESUME (Highlights)`
      : r.title;

    const m = r.match || {};
    meta.innerHTML = `
      ${isSummary ? `<span class="replay-tier-badge gold"><i class="fa-solid fa-film"></i> RESUME</span>` : ''}
      ${m.homeTeam ? `<span><i class="fa-solid fa-shield-halved"></i> ${BD.escapeHtml(m.homeTeam.name)} vs ${BD.escapeHtml(m.awayTeam?.name || '')}</span>` : ''}
      <span><i class="fa-regular fa-calendar"></i> ${BD.formatDate(r.replay_date, I18N.getLang())}</span>
      ${duration ? `<span><i class="fa-regular fa-clock"></i> ${BD.escapeHtml(duration)}</span>` : ''}
      <span class="replay-tier-badge ${r.requires_subscription}">${r.requires_subscription.toUpperCase()}</span>
    `;

    if (sh) {
      const shareUrl = isSummary
        ? `${window.BD_CONFIG.SHARE_SITE}/replay?open=${r.id}&type=summary`
        : `${window.BD_CONFIG.SHARE_SITE}/replay?open=${r.id}`;
      sh.setAttribute('data-share-url', shareUrl);
      sh.setAttribute('data-share-title', r.title);
    }

    if (isSummary && !videoUrl) {
      BDPlayer.showLock(
        'No summary available',
        'This match has no summary video yet. Try the full replay instead.'
      );
      if (dl) dl.style.display = 'none';
      return;
    }

    if (!videoUrl) {
      BDPlayer.showLock('Video unavailable', 'The video URL for this replay is missing.');
      if (dl) dl.style.display = 'none';
      return;
    }

    // ✅ تحقق من access من الباكند
    try {
      const accessRes = await fetchNoCache(`${window.BD_CONFIG.API_BASE}/replays/${id}/access?_t=${Date.now()}`);

      if (!accessRes.success) {
        const required = accessRes?.errors?.required || r.requires_subscription;
        const isLoggedIn = accessRes?.errors?.is_logged_in;

        BDPlayer.showLock(
          isLoggedIn
            ? I18N.t('replay.upgrade_title', 'Subscription required')
            : I18N.t('replay.login_required_title', 'Login required'),
          isLoggedIn
            ? `${I18N.t('replay.upgrade_text', 'This replay is available for')} ${String(required).toUpperCase()} ${I18N.t('replay.subscribers', 'subscribers')}.`
            : I18N.t('replay.login_required_text', 'Please log in to watch this replay.')
        );
        if (dl) dl.style.display = 'none';
        return;
      }

      const allowed = accessRes.data || {};

      const finalVideoUrl = isSummary
        ? (r.summary_video_url || allowed.summary_video_url || videoUrl)
        : (allowed.video_url || videoUrl);

      BDPlayer.load(finalVideoUrl, {
        autoplay: true,
        ad: r.ad_video_url ? {
          ad_video_url: r.ad_video_url,
          ad_duration: r.ad_duration || 15,
          ad_skip_after: r.ad_skip_after || 5
        } : null
      });

      const dlUrl = isSummary
        ? (allowed.summary_download_url || downloadUrl)
        : (allowed.download_url || downloadUrl);

      if (dlUrl && dl) {
        dl.style.display = '';
        dl.onclick = () => window.open(dlUrl, '_blank', 'noopener');
      } else if (dl) {
        dl.style.display = 'none';
      }

    } catch (err) {
      console.error('[replay.js] Access check failed:', err);
      BDPlayer.showLock(I18N.t('errors.generic', 'Something went wrong'), err.message || '');
      if (dl) dl.style.display = 'none';
    }

  } catch (err) {
    console.error('[replay.js] openReplay error:', err);
    title.textContent = 'Error';
    meta.innerHTML = `<span>${BD.escapeHtml(err.message || 'Could not load replay')}</span>`;
  }
}

/* =========================================================
   CLOSE MODAL
   ========================================================= */
function closeReplayModal() {
  const modal = document.getElementById('playerModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  BDPlayer.destroy();
  currentReplay = null;
}

function bindPlayerControls() {
  document.querySelectorAll('[data-close-player]').forEach(el => {
    el.addEventListener('click', closeReplayModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReplayModal();
  });

  const playerShare = document.getElementById('playerShare');
  if (playerShare) {
    playerShare.addEventListener('click', (e) => {
      e.preventDefault();
      const url = playerShare.getAttribute('data-share-url') || window.location.href;
      const title = playerShare.getAttribute('data-share-title') || 'Check this replay on BOTOLA D2';
      openShareMenu(playerShare, { url, title });
    });
  }
}

/* =========================================================
   DOWNLOAD
   ========================================================= */
async function attemptDownload(id) {
  try {
    const res = await fetchNoCache(`${window.BD_CONFIG.API_BASE}/replays/${id}/access?_t=${Date.now()}`);

    if (!res.success) {
      if (res?.errors?.is_logged_in === false) {
        Toast.info(I18N.t('auth.login_required', 'Please log in'));
        setTimeout(() => {
          window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
        }, 800);
      } else {
        Toast.warn(I18N.t('replay.upgrade_required', 'Available for subscribers'));
        setTimeout(() => { window.location.href = '/subscription'; }, 900);
      }
      return;
    }

    const d = res.data || {};
    if (d.download_url) {
      window.open(d.download_url, '_blank', 'noopener');
    } else {
      Toast.warn(I18N.t('replay.no_download', 'Download not available for this replay'));
    }
  } catch (err) {
    Toast.error(err.message || I18N.t('errors.generic', 'Something went wrong'));
  }
}

/* =========================================================
   DEEP LINK
   ========================================================= */
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const openId = params.get('open');
  const type = params.get('type') === 'summary' ? 'summary' : 'full';

  if (openId) {
    setTimeout(() => openReplay(parseInt(openId, 10), type), 500);
  }
});