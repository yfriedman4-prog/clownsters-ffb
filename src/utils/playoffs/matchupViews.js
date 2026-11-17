/** Presentation metrics only. No simulation calls or official ranking rules. */
export const matchupViews = [
  { id: 'playoff', label: 'Playoff Chase', metric: 'Half the sum of absolute league-wide playoff-qualification probability changes between the two possible winners.' },
  { id: 'bye', label: 'Bye Battle', metric: 'Half the sum of absolute league-wide top-two bye probability changes between the two possible winners.' },
  { id: 'combined', label: 'All Key Matchups', metric: 'Approved combined impact: qualification impact plus half-weighted bye impact (calculated in the existing worker).' },
]
export function leagueEffects(game, kind) {
  const away = new Map(game.awayWin.results.map(t => [t.managerId, t]))
  return game.homeWin.results.map(home => {
    const other = away.get(home.managerId)
    const lower = home[`${kind}Lower`] - other[`${kind}Upper`]
    const upper = home[`${kind}Upper`] - other[`${kind}Lower`]
    return { managerId: home.managerId, home, away: other, lower, upper,
      swing: Math.abs(home[`${kind}Lower`] - other[`${kind}Lower`]) }
  })
}
export function rankMatchups(games, view) {
  if (!matchupViews.some(v => v.id === view)) throw new Error('Unknown matchup view')
  return games.map((g, index) => ({ ...g, presentationIndex: index,
    viewImpact: view === 'combined' ? g.impact : leagueEffects(g, view).reduce((n,t) => n + t.swing, 0) / 2,
  })).sort((a,b) => b.viewImpact - a.viewImpact || a.week - b.week ||
    // Preserve approved combined tie ordering; other views use identity for display only.
    (view === 'combined' ? a.presentationIndex - b.presentationIndex : a.home.localeCompare(b.home) || a.away.localeCompare(b.away)))
}
export const percent = p => `${(100 * p).toFixed(1)}%`
export const probabilityRange = (a,b) => Math.abs(a-b) < 1e-10 ? percent(a) : `${percent(a)}–${percent(b)}`
export const points = p => { const n = Number((100 * p).toFixed(1)); return `${n > 0 ? '+' : ''}${n.toFixed(1)}` }
export function probabilityChange(row, base, kind) {
  const a = row[`${kind}Lower`] - base[`${kind}Upper`], b = row[`${kind}Upper`] - base[`${kind}Lower`]
  return `${Math.abs(a-b) < 1e-10 ? points(a) : `${points(a)} to ${points(b)}`} pp`
}
export function matchupExplanation(game, byId, view) {
  const kind = view === 'bye' ? 'bye' : 'playoff'
  const metric = kind === 'bye' ? 'top-two bye' : 'playoff qualification'
  const effects = leagueEffects(game, kind).sort((a,b) => b.swing-a.swing || a.managerId.localeCompare(b.managerId))
  const biggest = effects[0]
  const relevant = effects.find(t => ![game.home, game.away].includes(t.managerId) && Number((100*t.swing).toFixed(1)) > 0)
  const across = byId[game.home].seedMax<=6 && byId[game.away].seedMin>6 || byId[game.away].seedMax<=6 && byId[game.home].seedMin>6
  const byeSwing = Math.max(...leagueEffects(game,'bye').filter(t => [game.home,game.away].includes(t.managerId)).map(t=>t.swing))
  const playoffSwing = Math.max(...effects.filter(t => [game.home,game.away].includes(t.managerId)).map(t=>t.swing))
  const label = view === 'bye' ? 'Top-two seed stakes' : view === 'combined' && byeSwing>playoffSwing ? 'First-round bye race' : across ? 'Cutline showdown' : byId[game.home].seedMin>6 && byId[game.away].seedMin>6 ? 'Playoff chase' : 'Qualification race'
  const combinedSummary = `Changing the winner shifts a participant’s estimated qualification chance by up to ${(playoffSwing*100).toFixed(1)} percentage points.${byeSwing > playoffSwing ? ` Top-two bye odds move by up to ${(byeSwing*100).toFixed(1)} points.` : ''} ${across ? 'A current top-six team faces a team chasing the cutline.' : 'Both results also affect the surrounding playoff race.'}`
  const summary = view === 'combined' ? combinedSummary : biggest && Number((100*biggest.swing).toFixed(1)) > 0
    ? `${byId[biggest.managerId].teamName} has the largest estimated ${metric} swing: ${(100*biggest.swing).toFixed(1)} percentage points between winner scenarios.`
    : `No ${metric} swing is visible at the displayed precision in these simulations.`
  // Only claim a directional benefit if it holds across unresolved ranking bounds.
  const favored = relevant?.lower > 0 ? game.home : relevant?.upper < 0 ? game.away : null
  return { label, summary, other: view !== 'combined' && relevant ? `${byId[relevant.managerId].teamName}, not playing in this game, has ${probabilityRange(relevant.home[`${kind}Lower`],relevant.home[`${kind}Upper`])} ${metric} odds if ${byId[game.home].teamName} wins, versus ${probabilityRange(relevant.away[`${kind}Lower`],relevant.away[`${kind}Upper`])} if ${byId[game.away].teamName} wins.${favored ? ` The estimate favors a ${byId[favored].teamName} win for this team.` : ''}` : null }
}
