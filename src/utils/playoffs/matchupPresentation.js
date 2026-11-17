import { leagueEffects } from './matchupViews.js'

export const viewIntroductions = {
  playoff: 'The games that could have the biggest impact on who makes the playoffs.',
  bye: 'Discover which remaining games could shake up the race for a first-round bye.',
  combined: 'The most consequential remaining games across the playoff and bye races.',
}
/** Select display callouts only; never changes game ranking or simulation outputs. */
export function matchupStakes(game, view) {
  const kinds = view === 'combined' ? ['playoff', 'bye'] : [view]
  const effects = kinds.flatMap(kind => leagueEffects(game, kind).map(t => ({ ...t, kind })))
    .sort((a,b) => b.swing - a.swing || a.managerId.localeCompare(b.managerId) || a.kind.localeCompare(b.kind))
  const visible = t => Number((100 * t.swing).toFixed(1)) > 0
  const highlight = effects.find(visible) ?? null
  const other = effects.find(t => visible(t) && ![game.home,game.away].includes(t.managerId) && (t.lower > 0 || t.upper < 0))
  const beneficiary = other ? { ...other, favored: other.lower > 0 ? game.home : game.away } : null
  return { highlight, beneficiary }
}
