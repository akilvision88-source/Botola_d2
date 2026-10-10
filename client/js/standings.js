/* =========================================================
   BOTOLA D2 — standings.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  loadStandings();
  I18N.onChange(() => loadStandings());
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

async function loadStandings() {
  const tbody = document.getElementById('standingsBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10"><div class="skeleton skel-line"></div></td></tr>`;

  try {
    const res = await API.standings();
    const rows = res?.data || [];

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--bd-text-muted)">
        ${I18N.t('empty.no_standings_title','Standings not available yet.')}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(r => `
      <tr class="st-row ${posClass(r.position)}">
        <td class="st-pos">
          <span class="st-pos-num">${r.position}</span>
        </td>
        <td class="st-team">
          <div class="st-team-inner">
            <span class="standing-logo">${BD.teamLogoOrPlaceholder({ name: r.team_name, logo: r.team_logo })}</span>
            <span class="st-team-name">${BD.escapeHtml(r.team_name)}</span>
          </div>
        </td>
        <td>${r.played}</td>
        <td>${r.wins}</td>
        <td>${r.draws}</td>
        <td>${r.losses}</td>
        <td>${r.gf}</td>
        <td>${r.ga}</td>
        <td class="${r.gd > 0 ? 'gd-pos' : r.gd < 0 ? 'gd-neg' : ''}">${r.gd > 0 ? '+' : ''}${r.gd}</td>
        <td class="st-pts">${r.points}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--bd-text-muted)">
      ${I18N.t('errors.load_failed','Could not load standings.')}
    </td></tr>`;
  }
}

function posClass(pos) {
  if (pos === 1) return 'pos-champion';
  if (pos <= 2)  return 'pos-promo';
  if (pos <= 6)  return 'pos-safe';
  return 'pos-releg';
}