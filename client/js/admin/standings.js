/* =========================================================
   BOTOLA D2 Admin — standings.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('standings', 'Standings');
  if (!user) return;

  document.getElementById('refreshBtn')?.addEventListener('click', loadStandings);
  loadStandings();
});

async function loadStandings() {
  const tbody = document.getElementById('standingsBody');
  AdUtil.showTableSkeleton(tbody, 10, 8);

  try {
    const res = await fetch(window.BD_CONFIG.API_BASE + '/standings').then(r => r.json());
    const rows = res?.data || [];

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${rows.length} teams`;

    if (!rows.length) {
      tbody.innerHTML = AdUtil.emptyRow(10, 'No standings data yet');
      return;
    }

    tbody.innerHTML = rows.map(r => {
      const posClass = r.position === 1 ? 'gold' : r.position <= 2 ? 'standard' : '';
      const gdClass = r.gd > 0 ? 'color:var(--bd-success)' : r.gd < 0 ? 'color:var(--bd-danger)' : '';
      return `
        <tr>
          <td style="text-align:center">
            <span class="ad-pill ${posClass}">${r.position}</span>
          </td>
          <td>
            <div class="ad-logo-cell">
              ${r.team_logo
                ? `<img src="${AdUtil.esc(r.team_logo.startsWith('http') ? r.team_logo : window.BD_CONFIG.ASSETS_BASE + r.team_logo)}" alt="">`
                : AdUtil.teamLogo({ name: r.team_name })}
              <span class="name">${AdUtil.esc(r.team_name)}</span>
            </div>
          </td>
          <td>${r.played}</td>
          <td>${r.wins}</td>
          <td>${r.draws}</td>
          <td>${r.losses}</td>
          <td>${r.gf}</td>
          <td>${r.ga}</td>
          <td style="${gdClass};font-weight:700">${r.gd > 0 ? '+' : ''}${r.gd}</td>
          <td style="text-align:right;font-weight:900;color:var(--bd-primary);font-size:15px">${r.points}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(10, 'Failed to load: ' + (err.message || ''));
  }
}