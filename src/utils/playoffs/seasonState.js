import { playoffRules } from '../../config/playoffs2026.js'
export function validateSeason(season, rules = playoffRules) {
  const fail = (message) => { throw new Error(message) }
  if (season.season !== 2026 || season.regularSeasonEndWeek !== rules.regularSeasonEnd || season.regularSeasonStartWeek !== 1 || !Number.isInteger(season.completedThroughWeek) || season.completedThroughWeek < 1 || season.completedThroughWeek > rules.regularSeasonEnd) fail('Invalid season boundaries')
  const teams = season.seasonTeams
  if (teams?.length !== rules.teams || new Set(teams.map(t => t.managerId)).size !== rules.teams || teams.some(t => !t.managerId || !t.teamName)) fail('Invalid team identities')
  const totals = Object.fromEntries(teams.map(t => [t.managerId, { ...t, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, scores: [] }]))
  if (season.matchups?.length !== rules.regularSeasonEnd * rules.teams / 2) fail('Incomplete schedule')
  for (let week = 1; week <= rules.regularSeasonEnd; week++) {
    const games = season.matchups.filter(g => g.week === week)
    const ids = games.flatMap(g => [g.home?.managerId, g.away?.managerId])
    if (games.length !== rules.teams / 2 || new Set(ids).size !== rules.teams || ids.some(id => !totals[id])) fail(`Invalid schedule in Week ${week}`)
    if (week > season.completedThroughWeek) continue // Zero placeholders are not results.
    for (const { home, away } of games) {
      if (![home.score, away.score].every(n => Number.isFinite(n) && n >= 0)) fail('Missing or invalid completed score')
      if (home.score === away.score) fail('Completed matchup tie requires commissioner ruling')
      for (const [a, b] of [[home, away], [away, home]]) {
        const t = totals[a.managerId]
        t.wins += Number(a.score > b.score); t.losses += Number(a.score < b.score)
        t.pointsFor += a.score; t.pointsAgainst += b.score; t.scores.push(a.score)
      }
    }
  }
  if (season.standings?.length !== rules.teams || new Set(season.standings.map(t => t.managerId)).size !== rules.teams) fail('Invalid standings identities')
  for (const row of season.standings) {
    const t = totals[row.managerId]
    if (!t || t.wins !== row.wins || t.losses !== row.losses || Math.abs(t.pointsFor - row.pointsFor) > 0.000001 || Math.abs(t.pointsAgainst - row.pointsAgainst) > 0.000001) fail('Standings do not reconcile with completed scores')
    // Keep recorded decimal totals; do not impose an official rounding policy.
    t.pointsFor = row.pointsFor; t.pointsAgainst = row.pointsAgainst
  }
  return { teams: Object.values(totals), throughWeek: season.completedThroughWeek, remaining: season.matchups.filter(g => g.week > season.completedThroughWeek).map(g => ({ week: g.week, home: g.home.managerId, away: g.away.managerId })) }
}
