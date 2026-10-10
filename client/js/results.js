/* =========================================================
   BOTOLA D2 — results.js
   Results page — professional table layout.
   Columns: Date | Match (with score in middle) | Stadium | Referee | Actions
   ========================================================= */

let currentPage = 1;
const PAGE_LIMIT = 15;

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  loadResults(1);
  I18N.onChange(() => loadResults(currentPage));
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
   LOAD RESULTS
   ========================================================= */
async function loadResults(page = 1) {
  const list = document.getElementById('resultsList');
  const pag = document.getElementById('resultsPagination');
  if (!list) return;

  currentPage = page;
  list.innerHTML = BD.skeletonCards(5);
  if (pag) pag.innerHTML = '';

  try {
    // ✅ No-cache request
    const url = `${window.BD_CONFIG.API_BASE}/matches/results?page=${page}&limit=${PAGE_LIMIT}&_t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' }).then(r => r.json());

    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    if (!items.length) {
      list.innerHTML = BD.emptyState(
        'fa-futbol',
        I18N.t('empty.no_results_title', 'No results yet.'),
        I18N.t('empty.no_results_subtitle', 'Results will appear here once matches are finished.')
      );
      return;
    }

    // ✅ Build the table
    list.innerHTML = renderResultsTable(items);
    bindRowActions();
    if (pag) renderPagination(pag, pagination);
  } catch (e) {
    console.error('[results.js] Load failed:', e);
    list.innerHTML = BD.emptyState(
      'fa-triangle-exclamation',
      I18N.t('errors.load_failed', 'Could not load results.')
    );
  }
}

/* =========================================================
   RENDER TABLE — 5 columns (Score merged into Match)
   ========================================================= */
function renderResultsTable(matches) {
  return `
    <div class="results-table-wrap">
      <table class="results-table">
        <thead>
          <tr>
            <th style="width:120px">${I18N.t('results.th_date', 'Date')}</th>
            <th>${I18N.t('results.th_match', 'Match')}</th>
            <th style="width:180px">${I18N.t('results.th_venue', 'Stadium')}</th>
            <th style="width:150px">${I18N.t('results.th_referee', 'Referee')}</th>
            <th style="width:110px"></th>
          </tr>
        </thead>
        <tbody>
          ${matches.map(m => renderResultRow(m)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* =========================================================
   RENDER ROW — Score between teams
   ========================================================= */
function renderResultRow(m) {
  const home = m.homeTeam || {};
  const away = m.awayTeam || {};

  // Referee
  const referee = m.referee || '—';

  // Stadium / City
  const stadium = m.stadium?.name || '';
  const city = m.city || '';

  // Share
  const shareUrl = `${window.BD_CONFIG.SHARE_SITE}/match/${m.id}`;
  const shareTitle = `${home.name || '?'} ${m.score_home ?? 0} - ${m.score_away ?? 0} ${away.name || '?'}`;

  // Competition
  const competition = m.competition || 'Botola D2';
  const round = m.round || '';

  return `
    <tr class="result-tr">
      <td class="result-date-cell">
        <div class="rd-day">${formatDay(m.match_date)}</div>
        <div class="rd-time">${BD.formatTime(m.match_time)}</div>
      </td>

      <td class="result-match-cell">
        <div class="rm-competition">
          <i class="fa-solid fa-trophy"></i>
          ${BD.escapeHtml(competition)}
          ${round ? `<span class="rm-round">${BD.escapeHtml(round)}</span>` : ''}
        </div>

        <!-- ✅ الفريقان + النتيجة في المنتصف -->
        <div class="rm-row">
          <div class="rm-team-side home">
            <span class="rm-team-name" title="${BD.escapeHtml(home.name || '')}">
              ${BD.escapeHtml(home.short_name || home.name || '—')}
            </span>
            <span class="rm-team-logo">${BD.teamLogoOrPlaceholder(home)}</span>
          </div>

          <div class="rm-score-mid">
            <span class="rm-score-num">${m.score_home ?? 0}</span>
            <span class="rm-score-sep">:</span>
            <span class="rm-score-num">${m.score_away ?? 0}</span>
          </div>

          <div class="rm-team-side away">
            <span class="rm-team-logo">${BD.teamLogoOrPlaceholder(away)}</span>
            <span class="rm-team-name" title="${BD.escapeHtml(away.name || '')}">
              ${BD.escapeHtml(away.short_name || away.name || '—')}
            </span>
          </div>
        </div>
      </td>

      <td class="result-venue-cell">
        ${stadium ? `
          <div class="rv-line">
            <i class="fa-solid fa-location-dot"></i>
            <span>${BD.escapeHtml(stadium)}</span>
          </div>
        ` : ''}
        ${city ? `
          <div class="rv-line">
            <i class="fa-solid fa-map-pin"></i>
            <span>${BD.escapeHtml(city)}</span>
          </div>
        ` : ''}
        ${(!stadium && !city) ? '<span class="result-none">—</span>' : ''}
      </td>

      <td class="result-referee-cell">
        <i class="fa-solid fa-whistle"></i>
        <span>${BD.escapeHtml(referee)}</span>
      </td>

      <td class="result-actions-cell">
        <div class="result-actions">
          <a href="/match/${m.id}" class="result-action-btn primary" title="Details">
            <i class="fa-solid fa-circle-info"></i>
          </a>
          <button class="result-action-btn" data-share-result
            data-share-url="${shareUrl}"
            data-share-title="${BD.escapeHtml(shareTitle)}"
            title="Share">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

/* =========================================================
   DATE HELPER
   ========================================================= */
function formatDay(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const lang = I18N.getLang();
    const locale = lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-GB' : 'fr-FR';
    const month = d.toLocaleDateString(locale, { month: 'short' });
    return `${day} ${month}`;
  } catch (_) {
    return dateStr;
  }
}

/* =========================================================
   BIND ACTIONS
   ========================================================= */
function bindRowActions() {
  document.querySelectorAll('[data-share-result]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.getAttribute('data-share-url');
      const title = btn.getAttribute('data-share-title');

      // Use the global Share function (from share.js)
      if (window.Share && window.Share.share) {
        window.Share.share(btn, { url, title, text: title });
      } else {
        openSimpleShareMenu(btn, { url, title });
      }
    });
  });
}

/* =========================================================
   FALLBACK SHARE MENU
   ========================================================= */
function openSimpleShareMenu(anchorEl, opts) {
  document.querySelectorAll('.share-pop-menu').forEach(el => el.remove());

  const url = opts.url || window.location.href;
  const title = opts.title || 'BOTOLA D2';

  const menu = document.createElement('div');
  menu.className = 'share-pop-menu';
  menu.innerHTML = `
    <a href="https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}" target="_blank" rel="noopener" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
    <a href="#" data-instagram title="Instagram"><i class="fa-brands fa-instagram"></i></a>
    <a href="mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}" title="Email"><i class="fa-regular fa-envelope"></i></a>
    <button type="button" data-copy title="Copy link"><i class="fa-solid fa-link"></i></button>
  `;
  document.body.appendChild(menu);

  const rect = anchorEl.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = (rect.bottom + 8) + 'px';
  menu.style.left = Math.max(8, Math.min(rect.left - 100, window.innerWidth - 280)) + 'px';

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
    try { await navigator.clipboard.writeText(url); } catch (_) {}
    if (window.Toast) Toast.info('Link copied — paste it on Instagram');
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
   PAGINATION
   ========================================================= */
function renderPagination(container, p) {
  if (!p.totalPages || p.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  const cur = p.page;
  const total = p.totalPages;

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
        loadResults(pg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}