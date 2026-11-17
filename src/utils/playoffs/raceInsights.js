import { simulatePlayoffs } from './simulation.js'
import { validateSeason } from './seasonState.js'
import { rankTeams } from './ranking.js'

import { probabilityUncertainty } from './sampling.js'
export { samplingInterval, probabilityUncertainty } from './sampling.js'
export function selectStorylines(rows, results) {
  const candidates = rows.map(t => ({ ...t, estimate: results.find(r => r.managerId === t.managerId) })).filter(t => t.estimate)
  const bubble = candidates.filter(t => t.seedMin > 6).sort((a,b) => b.estimate.playoffLower - a.estimate.playoffLower)[0]
  const risk = candidates.filter(t => t.seedMax <= 6).sort((a,b) => a.estimate.playoffUpper - b.estimate.playoffUpper)[0]
  const riser = candidates.filter(t => t.estimate.expectedSeedMax < t.seedMin).sort((a,b) => (b.seedMin - b.estimate.expectedSeedMax) - (a.seedMin - a.estimate.expectedSeedMax))[0]
  return [{type:'Bubble Surge', team:bubble}, {type:'At Risk', team:risk}, {type:'Projected-Seed Riser', team:riser}].filter(s => s.team)
}
export function analyzeKeyMatchups(season, options = {}, onProgress = () => {}) {
  const state = validateSeason(season)
  const baseline = simulatePlayoffs(season, options)
  const iterations = options.iterations ?? 10000
  const games = state.remaining.map((g, index) => {
    const homeWin = simulatePlayoffs(season, { ...options, forcedWinner: { ...g, winner:g.home } })
    const awayWin = simulatePlayoffs(season, { ...options, forcedWinner: { ...g, winner:g.away } })
    // Expected number of league-wide qualification changes plus half-weighted bye changes.
    // Conservative lower bounds are used when official final rankings are unresolved.
    const impact = homeWin.results.reduce((sum, h) => {
      const a = awayWin.results.find(t => t.managerId === h.managerId)
      return sum + Math.abs(h.playoffLower - a.playoffLower) + 0.5 * Math.abs(h.byeLower - a.byeLower)
    }, 0) / 2
    const conditions = [homeWin, awayWin].map(run => ({
      ...run, results: run.results.map(t => ({...t, playoffInterval:probabilityUncertainty(t,iterations), byeInterval:probabilityUncertainty(t,iterations,'bye')})),
    }))
    onProgress(index + 1, state.remaining.length)
    return { ...g, impact, homeWin:conditions[0], awayWin:conditions[1] }
  }).sort((a,b) => b.impact - a.impact || a.week - b.week)
  return { games, baselineMetadata:baseline.metadata, current:rankTeams(state.teams), metric:'Half the league-wide absolute playoff-probability swing between winners, plus half-weighted bye swings; lower bounds used for unresolved rankings.', metadata: { iterations, seed:options.seed ?? 202610, sampling:'95% Wilson marginal intervals; ranking differences include Monte Carlo noise; not causal effects or guarantees' } }
}
