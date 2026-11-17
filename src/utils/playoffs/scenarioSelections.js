import { validateSeason } from './seasonState.js'
import { rankTeams } from './ranking.js'
export const matchupKey = g => `${g.week}:${g.home}:${g.away}`
export function remainingScenarioState(season) {
  const state = validateSeason(season)
  return { ...state, standings: rankTeams(state.teams) }
}
export function validateSelections(season, selections) {
  if (!Array.isArray(selections)) throw new Error('Scenario selections must be an array')
  const remaining = new Map(remainingScenarioState(season).remaining.map(g => [matchupKey(g),g]))
  const seen = new Set()
  return selections.map(s => {
    if (!s || !remaining.has(matchupKey(s)) || ![s.home,s.away].includes(s.winner)) throw new Error('Each selected winner must belong to a remaining matchup; completed games cannot be overridden')
    const key=matchupKey(s)
    if (seen.has(key)) throw new Error('Duplicate or conflicting winners for the same matchup')
    seen.add(key)
    return { ...remaining.get(key), winner:s.winner }
  }).sort((a,b)=>a.week-b.week || a.home.localeCompare(b.home) || a.away.localeCompare(b.away))
}
// UI-only reconciliation after an import: completed/changed games no longer have picks.
export function reconcileSelections(season, selections) {
  const remaining = new Set(remainingScenarioState(season).remaining.map(matchupKey))
  return selections.filter(s=>remaining.has(matchupKey(s)) && [s.home,s.away].includes(s.winner))
}
export function toggleSelection(selections, game, winner) {
  if (![game.home,game.away].includes(winner)) throw new Error('Winner must participate in matchup')
  const existing=selections.find(s=>matchupKey(s)===matchupKey(game))
  const rest=selections.filter(s=>matchupKey(s)!==matchupKey(game))
  return existing?.winner===winner ? rest : [...rest,{...game,winner}]
}
export const presetPolicies = {
  current:'Current Forecast clears every pick; all games remain simulated.',
  top:'Hypothetical: the currently higher-ranked team wins each remaining matchup.',
  bubble:'Hypothetical: current positions 5–8 win their remaining games. If two bubble teams meet, the lower-ranked team wins; each conflict is listed. Other games remain unselected.',
  chaos:'Hypothetical: the currently lower-ranked team wins each remaining matchup.',
}
export function scenarioPreset(season, preset) {
  if (!Object.hasOwn(presetPolicies,preset)) throw new Error('Unknown scenario preset')
  if (preset==='current') return { selections:[], conflicts:[] }
  const { remaining,standings }=remainingScenarioState(season)
  const byId=Object.fromEntries(standings.map(t=>[t.managerId,t])), conflicts=[], selections=[]
  for (const g of remaining) {
    const h=byId[g.home],a=byId[g.away]
    const hb=h.seedMin<=8 && h.seedMax>=5,ab=a.seedMin<=8 && a.seedMax>=5
    if (preset==='bubble' && !hb && !ab) continue
    if (h.seedMin===a.seedMin || (preset==='bubble' && ((hb && h.seedMin!==h.seedMax) || (ab && a.seedMin!==a.seedMax)))) throw new Error('Preset cannot resolve tied current standings without an official tiebreaker; choose these winners manually')
    let winner
    if (preset==='bubble') {
      winner=hb && ab ? (h.seedMin>a.seedMin ? g.home:g.away) : hb ? g.home:g.away
      if (hb && ab) conflicts.push(`Week ${g.week}: ${h.teamName} vs ${a.teamName} — both are bubble teams; ${byId[winner].teamName} selected because it is currently lower-ranked.`)
    } else winner=(preset==='top')===(h.seedMin<a.seedMin) ? g.home:g.away
    selections.push({...g,winner})
  }
  return { selections:validateSelections(season,selections), conflicts }
}
