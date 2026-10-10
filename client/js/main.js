/* =========================================================
   BOTOLA D2 — main.js
   Global initializer: header, mobile menu, toast, utils.
   ========================================================= */

window.Toast = (function () {
  const wrap = () => document.getElementById('toastWrap');

  const show = (message, type = 'info', duration = 3200) => {
    const el = document.createElement('div');
    el.className = 'bd-toast ' + type;
    const icon = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warn: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    }[type] || 'fa-circle-info';
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    wrap()?.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      setTimeout(() => el.remove(), 250);
    }, duration);
  };

  return {
    info:    (m, d) => show(m, 'info', d),
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d),
    warn:    (m, d) => show(m, 'warn', d)
  };
})();

window.BD = (function () {

  const formatDate = (date, lang) => {
    try {
      const d = (typeof date === 'string') ? new Date(date) : date;
      return new Intl.DateTimeFormat(
        lang === 'ar' ? 'ar-MA' : lang === 'en' ? 'en-GB' : 'fr-FR',
        { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }
      ).format(d);
    } catch (_) { return date; }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return String(time).substring(0, 5);
  };

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const teamLogoOrPlaceholder = (team, size = 56) => {
    if (team?.logo) {
      const src = team.logo.startsWith('http') ? team.logo : (window.BD_CONFIG.ASSETS_BASE + team.logo);
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(team.name || '')}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'placeholder',textContent:'${escapeHtml((team.short_name || team.name || '?').slice(0,3))}'}))">`;
    }
    const initials = (team?.short_name || team?.name || '?').slice(0, 3).toUpperCase();
    return `<span class="placeholder">${escapeHtml(initials)}</span>`;
  };

  const emptyState = (icon, title, text) => `
    <div class="empty-state">
      <div class="empty-state-icon"><i class="fa-solid ${icon}"></i></div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text || '')}</p>
    </div>
  `;

  const skeletonCards = (count = 3, cls = 'skel-card') => {
    let out = '';
    for (let i = 0; i < count; i++) out += `<div class="${cls} skeleton"></div>`;
    return out;
  };

  const statusLabel = (status) => {
    const map = {
      live:      { key: 'status.live',      fallback: 'LIVE' },
      halftime:  { key: 'status.halftime',  fallback: 'HT' },
      upcoming:  { key: 'status.upcoming',  fallback: 'UPCOMING' },
      finished:  { key: 'status.finished',  fallback: 'FINISHED' },
      postponed: { key: 'status.postponed', fallback: 'POSTPONED' },
      cancelled: { key: 'status.cancelled', fallback: 'CANCELLED' }
    };
    const m = map[status] || map.upcoming;
    return I18N.t(m.key, m.fallback);
  };

  return { formatDate, formatTime, escapeHtml, teamLogoOrPlaceholder, emptyState, skeletonCards, statusLabel };
})();

/* Global app init */
document.addEventListener('DOMContentLoaded', async () => {
  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Init i18n first
  await I18N.init();

  // Then auth header
  await Auth.init();

  

  

  // Header scrolled state
  const header = document.getElementById('bdHeader');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Share binding
  Share.bindAll();
});