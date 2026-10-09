import { buildScoringTrends } from './scoringAnalytics.js'

export const ERAS = [
  { id: 'high-school', label: 'High School', start: 2006, end: 2009, color: '#e7b654' },
  { id: 'revival', label: 'Revival', start: 2012, end: 2017, color: '#f07878' },
  { id: 'modern', label: 'Modern', start: 2018, end: 2025, color: '#579eff' },
]
const mean = (values) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
const round = (value) => value == null ? null : Math.round(value * 10) / 10

export function buildEraComparisons(history) {
  const trends = buildScoringTrends(history, 2006, 2025)
  return ERAS.map((era) => {
    const seasons = trends.filter((s) => s.season >= era.start && s.season <= era.end && Number.isFinite(s.leagueAverage))
    const scoring = seasons.map((s) => {
      const entries = Object.entries(s.managers).map(([managerId, row]) => ({ managerId, ...row })).filter((row) => Number.isFinite(row.ppg))
      const ppg = entries.map((row) => row.ppg).sort((a, b) => a - b)
      return { year: s.season, leagueAverage: s.leagueAverage, spread: ppg.length > 1 ? ppg.at(-1) - ppg[0] : null, teamPpg: entries }
    })
    const allTeamPpg = scoring.flatMap((s) => s.teamPpg.map((row) => row.ppg))
    const wins = new Map(), titles = new Map()
    for (const s of seasons) {
      const season = history[s.season]
      for (const row of season.standings ?? []) {
        if (!row.managerId) continue
        const prev = wins.get(row.managerId) ?? { wins: 0, games: 0, seasons: 0 }
        const games = (row.wins ?? 0) + (row.losses ?? 0) + (row.ties ?? 0)
        wins.set(row.managerId, { wins: prev.wins + (row.wins ?? 0) + (row.ties ?? 0) / 2, games: prev.games + games, seasons: prev.seasons + 1 })
      }
      const champion = season.podium?.champion?.managerId
      if (champion) titles.set(champion, (titles.get(champion) ?? 0) + 1)
    }
    const managerWins = [...wins].map(([id, row]) => ({ id, ...row, pct: row.games ? row.wins / row.games * 100 : 0 })).sort((a, b) => b.pct - a.pct)
    const champions = [...titles].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    return { ...era, seasons: seasons.length, scoring, ppg: round(mean(scoring.map((s) => s.leagueAverage))), spread: round(mean(scoring.map((s) => s.spread).filter(Number.isFinite))), highest: allTeamPpg.length ? round(Math.max(...allTeamPpg)) : null, lowest: allTeamPpg.length ? round(Math.min(...allTeamPpg)) : null, managers: managerWins, champions, championCount: champions.reduce((n, c) => n + c.count, 0) }
  })
}
