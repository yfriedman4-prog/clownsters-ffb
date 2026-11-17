import { playoffRules } from '../../config/playoffs2026.js'
import { validateSeason } from './seasonState.js'
import { rankTeams } from './ranking.js'
import { probabilityUncertainty } from './sampling.js'
import { validateSelections } from './scenarioSelections.js'
export function simulatePlayoffs(season, { iterations = 10000, seed = 202610, forcedWinner = null, forcedWinners = null } = {}) {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 100000) throw new Error('Iterations must be between 1 and 100,000')
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Seed must be an unsigned 32-bit integer')
  const state = validateSeason(season)
  if (forcedWinner && !state.remaining.some(g => g.week === forcedWinner.week && g.home === forcedWinner.home && g.away === forcedWinner.away && [g.home, g.away].includes(forcedWinner.winner))) throw new Error('Forced winner must identify a remaining matchup and participating team')
  if (forcedWinner && forcedWinners !== null) throw new Error('Use either forcedWinner or forcedWinners, not both')
  const selections = forcedWinners === null ? [] : validateSelections(season,forcedWinners)
  // The legacy single-winner path remains byte-for-byte equivalent in its draws/results.
  if (!forcedWinner && selections.length===1) forcedWinner=selections[0]
  const multiple=selections.length>1
  const conditional=Boolean(forcedWinner)||multiple
  let rejectedDraws = 0
  let rng = seed >>> 0
  const random = () => { rng = (Math.imul(1664525, rng) + 1013904223) >>> 0; return rng / 4294967296 }
  // Continuous lognormal model: positive scores, moment-matched to completed games.
  const models = Object.fromEntries(state.teams.map(t => {
    const mean = t.scores.reduce((a, b) => a + b, 0) / t.scores.length
    const variance = t.scores.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, t.scores.length - 1)
    const sigma = Math.sqrt(Math.log(1 + Math.max(144, variance) / Math.max(1, mean) ** 2))
    return [t.managerId, { mu: Math.log(Math.max(1, mean)) - sigma ** 2 / 2, sigma }]
  }))
  const score = id => { const m = models[id]; return Math.exp(m.mu + m.sigma * Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, random()))) * Math.cos(2 * Math.PI * random())) }
  const counts = Object.fromEntries(state.teams.map(t => [t.managerId, { managerId: t.managerId, playoffLower: 0, playoffUpper: 0, byeLower: 0, byeUpper: 0, seedLower: Array(12).fill(0), seedUpper: Array(12).fill(0), expectedWins: 0, expectedSeedMin: 0, expectedSeedMax: 0 }]))
  if (conditional) for (const c of Object.values(counts)) c.expectedFinalPF = 0
  if (multiple) for (const c of Object.values(counts)) { c.expectedLosses=0; c.expectedFinalPA=0 }
  let unresolved = 0
  for (let iteration = 0; iteration < iterations; iteration++) {
    const rows = Object.fromEntries(state.teams.map(t => [t.managerId, { managerId: t.managerId, wins: t.wins, losses: t.losses, pointsFor: t.pointsFor }]))
    if (multiple) for (const t of state.teams) rows[t.managerId].pointsAgainst=t.pointsAgainst
    let tiedGame = false
    for (const g of state.remaining) {
      const a = rows[g.home], b = rows[g.away]
      let x = score(g.home), y = score(g.away)
      const forced = multiple ? selections.find(s=>s.week===g.week && s.home===g.home && s.away===g.away) : forcedWinner
      if (forced && g.week === forced.week && g.home === forced.home && g.away === forced.away) {
        let attempts = 0
        while (x === y || (x > y ? g.home : g.away) !== forced.winner) {
          if (++attempts > 100000) throw new Error('Conditional winner too rare to sample reliably')
          rejectedDraws++; x = score(g.home); y = score(g.away)
        }
      }
      a.pointsFor += x; b.pointsFor += y
      if (multiple) { a.pointsAgainst += y; b.pointsAgainst += x }
      if (x === y) { tiedGame = true; break }
      a.wins += Number(x > y); a.losses += Number(x < y); b.wins += Number(y > x); b.losses += Number(y < x)
    }
    // No guessed tie weighting: reject a model draw that needs unknown rules.
    if (tiedGame) throw new Error('Simulated matchup tie requires an official tie policy')
    const ranked = rankTeams(Object.values(rows))
    unresolved += Number(ranked.some(t => t.seedMin !== t.seedMax))
    for (const t of ranked) {
      const c = counts[t.managerId]
      c.playoffLower += Number(t.seedMax <= playoffRules.berths); c.playoffUpper += Number(t.seedMin <= playoffRules.berths)
      c.byeLower += Number(t.seedMax <= playoffRules.byes); c.byeUpper += Number(t.seedMin <= playoffRules.byes)
      for (let s = t.seedMin; s <= t.seedMax; s++) { c.seedUpper[s - 1]++; if (t.seedMin === t.seedMax) c.seedLower[s - 1]++ }
      if (conditional) c.expectedFinalPF += t.pointsFor
      if (multiple) { c.expectedLosses += t.losses; c.expectedFinalPA += t.pointsAgainst }
      c.expectedWins += t.wins; c.expectedSeedMin += t.seedMin; c.expectedSeedMax += t.seedMax
    }
  }
  const results = Object.values(counts).map(c => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, typeof v === 'number' ? v / iterations : Array.isArray(v) ? v.map(n => n / iterations) : v])))
  if (multiple) return { results: results.map(t=>({...t,playoffInterval:probabilityUncertainty(t,iterations),byeInterval:probabilityUncertainty(t,iterations,'bye')})), metadata: { iterations,seed,modelVersion:'lognormal-completed-2026-v1',unresolvedTiebreakFrequency:unresolved/iterations,throughWeek:state.throughWeek,unresolvedRules:[...playoffRules.unresolved],forcedWinners:selections,rejectedDraws,conditioning:'Independent score-pair rejection sampling for every selected matchup',sampling:'95% Wilson marginal intervals; separate from unresolved-tiebreak bounds' } }
  if (forcedWinner) return { results: results.map(t => ({ ...t, playoffInterval: probabilityUncertainty(t, iterations), byeInterval: probabilityUncertainty(t, iterations, 'bye') })), metadata: { iterations, seed, modelVersion: 'lognormal-completed-2026-v1', unresolvedTiebreakFrequency: unresolved / iterations, throughWeek: state.throughWeek, unresolvedRules: [...playoffRules.unresolved], forcedWinner: { ...forcedWinner }, rejectedDraws, conditioning: 'rejection-sampled score pairs given specified winner', sampling: '95% Wilson marginal intervals; separate from unresolved-tiebreak bounds' } }
  return { results, metadata: { iterations, seed, modelVersion: 'lognormal-completed-2026-v1', unresolvedTiebreakFrequency: unresolved / iterations, throughWeek: state.throughWeek, unresolvedRules: [...playoffRules.unresolved] } }
}
