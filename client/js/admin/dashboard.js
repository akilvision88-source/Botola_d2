/* =========================================================
   BOTOLA D2 Admin — dashboard.js (v2)
   ========================================================= */

let usersChart, subsChart;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('dashboard', 'Dashboard');
  if (!user) return;

  document.getElementById('refreshBtn')?.addEventListener('click', loadDashboard);

  await loadDashboard();

  // ✅ Auto-refresh every 60 seconds
  setInterval(() => {
    loadDashboard(true);
  }, 60000);
});

async function loadDashboard(silent = false) {
  try {
    const res = await AdminAPI.dashboard();
    const d = res?.data || {};

    renderStats(d);
    renderCharts(d);
    await loadRecent();

    if (!silent) {
      console.log('[Dashboard] Stats loaded:', d);
    }
  } catch (err) {
    if (!silent) AdToast.error(err.message || 'Could not load dashboard');
  }
}

/* ============ STATS ============ */
function renderStats(d) {
  const set = (id, value, label, icon, tone, options = {}) => {
    const pulse = options.pulse && value > 0 ? ' animation: pulse 1.5s infinite;' : '';
    return `
      <div class="ad-stat-card">
        <div class="ad-stat-icon ${tone || ''}"><i class="fa-solid ${icon}"></i></div>
        <div class="ad-stat-value" style="${pulse}">${value}</div>
        <div class="ad-stat-label">${label}</div>
      </div>`;
  };

  /* ---------- Grid 1: Users & Money ---------- */
  const grid1 = document.getElementById('statsGrid');
  if (grid1) {
    grid1.innerHTML =
      set('u',  d.totalUsers ?? 0,          'Total Users',          'fa-users',       'blue') +
      set('s',  d.activeSubscribers ?? 0,   'Active Subscribers',   'fa-star',        'green') +
      set('g',  d.goldSubscribers ?? 0,     'Gold Subscribers',     'fa-crown',       'gold') +
      set('r',  formatMoney(d.revenue),     'Revenue',              'fa-coins',       'gold');
  }

  /* ---------- Grid 2: Content & Messages ---------- */
  const grid2 = document.getElementById('statsGrid2');
  if (grid2) {
    grid2.innerHTML =
      set('l', d.liveMatches ?? 0,       'Live Matches',       'fa-tv',                'red',   { pulse: true }) +
      set('u', d.upcomingMatches ?? 0,   'Upcoming Matches',   'fa-calendar-day',      'blue') +
      set('p', d.replayCount ?? 0,       'Replays',            'fa-clock-rotate-left', '') +
      set('m', d.newMessages ?? 0,       'New Messages',       'fa-envelope',          'red',   { pulse: true });
  }

  /* ---------- Grid 3: Extra stats (optional) ---------- */
  const grid3 = document.getElementById('statsGrid3');
  if (grid3) {
    grid3.innerHTML =
      set('r', d.totalResults ?? 0,      'Total Results',      'fa-futbol',            '') +
      set('n', d.unreadNotifs ?? 0,      'Unread Notifications', 'fa-bell',            'gold') +
      set('a', d.messagesCount ?? 0,     'Total Messages',     'fa-inbox',             'blue') +
      set('c', '',                       '',                   '',                     '');
  }
}

function formatMoney(v) {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' MAD';
}

/* ============ CHARTS ============ */
function renderCharts(d) {
  // Users chart
  const users = d.recentUsers || [];
  const labels = [];
  const values = [];

  const days = {};
  users.forEach(u => { days[u.date] = Number(u.count); });

  for (let i = 6; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    labels.push(dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
    values.push(days[key] || 0);
  }

  const canvas1 = document.getElementById('usersChart');
  if (canvas1) {
    if (usersChart) usersChart.destroy();
    const ctx = canvas1.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(162, 0, 199, 0.35)');
    gradient.addColorStop(1, 'rgba(162, 0, 199, 0.0)');

    usersChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'New Users',
          data: values,
          borderColor: '#A200C7',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#A200C7',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#a0a0a0',
            padding: 10,
            cornerRadius: 8,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6e6e6e', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#6e6e6e', font: { size: 11 }, precision: 0 },
            beginAtZero: true
          }
        }
      }
    });

    const range = document.getElementById('chartRange');
    if (range) range.textContent = `${labels[0]} → ${labels[labels.length - 1]}`;
  }

  // Subscriptions chart
  const canvas2 = document.getElementById('subsChart');
  if (canvas2) {
    if (subsChart) subsChart.destroy();

    const gold = d.goldSubscribers || 0;
    const total = d.totalUsers || 0;
    const standard = Math.max(0, (d.activeSubscribers || 0) - gold);
    const free = Math.max(0, total - gold - standard);

    subsChart = new Chart(canvas2.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Gold', 'Standard', 'Free'],
        datasets: [{
          data: [gold, standard, free],
          backgroundColor: ['#FFC857', '#A200C7', 'rgba(255,255,255,0.1)'],
          borderColor: ['#0A0A0A', '#0A0A0A', '#0A0A0A'],
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a0a0a0',
              font: { size: 12, weight: 600 },
              usePointStyle: true,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: '#111',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8
          }
        }
      }
    });
  }
}

/* ============ RECENT ACTIVITY ============ */
async function loadRecent() {
  const tbody = document.getElementById('activityBody');
  if (!tbody) return;

  try {
    const [live, upcoming, msgs] = await Promise.all([
      AdminAPI.matchesList({ status: 'live', limit: 3 }).catch(() => null),
      AdminAPI.matchesList({ status: 'upcoming', limit: 3 }).catch(() => null),
      AdminAPI.messagesList({ limit: 4 }).catch(() => null)
    ]);

    const rows = [];

    (live?.data?.items || []).forEach(m => rows.push({
      type: 'Live Match', icon: 'fa-tv', tone: 'red',
      title: `${m.homeTeam?.name || '?'} vs ${m.awayTeam?.name || '?'}`,
      status: 'live', date: m.match_date, link: `/admin/live-matches.html`
    }));
    (upcoming?.data?.items || []).forEach(m => rows.push({
      type: 'Upcoming', icon: 'fa-calendar-day', tone: 'blue',
      title: `${m.homeTeam?.name || '?'} vs ${m.awayTeam?.name || '?'}`,
      status: 'upcoming', date: m.match_date, link: `/admin/upcoming-matches.html`
    }));
    (msgs?.data?.items || []).forEach(msg => rows.push({
      type: 'Message', icon: 'fa-envelope', tone: 'gold',
      title: `${msg.name} — ${msg.subject}`,
      status: msg.status, date: msg.created_at, link: `/admin/messages.html`
    }));

    rows.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!rows.length) {
      tbody.innerHTML = AdUtil.emptyRow(5, 'No recent activity');
      return;
    }

    tbody.innerHTML = rows.slice(0, 8).map(r => `
      <tr>
        <td>
          <span class="ad-pill finished" style="gap:6px">
            <i class="fa-solid ${r.icon}"></i> ${AdUtil.esc(r.type)}
          </span>
        </td>
        <td><strong>${AdUtil.esc(r.title)}</strong></td>
        <td>${AdUtil.statusPill(r.status)}</td>
        <td>${AdUtil.fmtDate(r.date)}</td>
        <td>
          <div class="ad-row-actions">
            <a href="${r.link}" class="ad-row-btn" title="Open"><i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (_) {
    tbody.innerHTML = AdUtil.emptyRow(5, 'Could not load activity');
  }
}