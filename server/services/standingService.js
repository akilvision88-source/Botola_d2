const { Match, Team, StandingAdjustment } = require('../models');

/**
 * Compute standings from finished matches + manual adjustments.
 */
const computeStandings = async () => {
  const teams = await Team.findAll({ where: { status: 'active' } });
  const matches = await Match.findAll({ where: { status: 'finished' } });
  const adjustments = await StandingAdjustment.findAll();
  const adjMap = {};
  adjustments.forEach(a => { adjMap[a.team_id] = a; });

  const table = new Map();
  teams.forEach(t => {
    table.set(t.id, {
      team_id: t.id,
      team_name: t.name,
      team_short_name: t.short_name,
      team_logo: t.logo,
      played: 0, wins: 0, draws: 0, losses: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
      has_adjustment: false
    });
  });

  matches.forEach(m => {
    const home = table.get(m.team_home_id);
    const away = table.get(m.team_away_id);
    if (!home || !away) return;

    const sh = Number(m.score_home);
    const sa = Number(m.score_away);

    home.played++; away.played++;
    home.gf += sh; home.ga += sa;
    away.gf += sa; away.ga += sh;

    if (sh > sa) { home.wins++; away.losses++; home.points += 3; }
    else if (sh < sa) { away.wins++; home.losses++; away.points += 3; }
    else { home.draws++; away.draws++; home.points += 1; away.points += 1; }
  });

  // ✅ Apply manual adjustments
  table.forEach(row => {
    const adj = adjMap[row.team_id];
    if (adj) {
      row.played += adj.played_adjustment || 0;
      row.wins += adj.wins_adjustment || 0;
      row.draws += adj.draws_adjustment || 0;
      row.losses += adj.losses_adjustment || 0;
      row.gf += adj.gf_adjustment || 0;
      row.ga += adj.ga_adjustment || 0;
      row.points += adj.points_adjustment || 0;
      row.has_adjustment = (
        adj.points_adjustment !== 0 ||
        adj.played_adjustment !== 0 ||
        adj.gf_adjustment !== 0 ||
        adj.ga_adjustment !== 0
      );
    }
    row.gd = row.gf - row.ga;
  });

  const ordered = Array.from(table.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team_name.localeCompare(b.team_name);
  });

  return ordered.map((row, i) => ({ position: i + 1, ...row }));
};

module.exports = { computeStandings };