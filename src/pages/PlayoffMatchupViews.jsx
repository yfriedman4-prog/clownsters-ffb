import { useMemo, useState } from 'react'
import { matchupStakes, viewIntroductions } from '../utils/playoffs/matchupPresentation.js'
import { probabilityUncertainty } from '../utils/playoffs/sampling.js'
import { matchupViews, rankMatchups, leagueEffects, matchupExplanation, percent, probabilityRange as bounds, probabilityChange, points } from '../utils/playoffs/matchupViews.js'

function Outcome({ run, team, baseline, iterations, kind }) {
  const row = run.results.find(t => t.managerId === team.managerId)
  const ci = row[`${kind}Interval`], baseCI = probabilityUncertainty(baseline, iterations, kind)
  return <div className="playoff-outcome"><strong>{bounds(row[`${kind}Lower`],row[`${kind}Upper`])}</strong><span>{probabilityChange(row,baseline,kind)} from baseline</span><small>95% sampling range {bounds(...ci)}</small><small>Change range {points(ci[0]-baseCI[1])} to {points(ci[1]-baseCI[0])} pp*</small></div>
}
function ConditionalTeam({ team, game, baseline, iterations, kind }) {
  return <section className="playoff-team-scenarios"><h4>{team.teamName} <span>{team.wins}–{team.losses} · current #{team.seedMin}</span></h4><p>Baseline {kind === 'bye' ? 'first-round bye' : 'playoff qualification'} <strong>{bounds(baseline[`${kind}Lower`],baseline[`${kind}Upper`])}</strong></p><div className="playoff-outcome-grid">{['home','away'].map(side => <div key={side}><h5>If {game.names[side]} wins</h5><Outcome run={game[`${side}Win`]} team={team} baseline={baseline} iterations={iterations} kind={kind}/></div>)}</div></section>
}
function StakeProbabilities({ effect, game, byId }) {
  return <div className="playoff-stake-scenarios">{['home','away'].map(side => <div key={side}><span>If {byId[game[side]].teamName} wins</span><strong>{bounds(effect[side][`${effect.kind}Lower`],effect[side][`${effect.kind}Upper`])}</strong></div>)}</div>
}
function MatchupStakes({ game, byId, view }) {
  const { highlight, beneficiary } = matchupStakes(game,view)
  const metric = kind => kind==='bye' ? 'first-round bye' : 'playoff qualification'
  return <>
    {highlight ? <section className="playoff-stakes" aria-label="Largest estimated probability swing">
      <div className="playoff-stakes-heading"><div><span>BIGGEST ESTIMATED SWING · {metric(highlight.kind).toUpperCase()}</span><h4>{byId[highlight.managerId].teamName}</h4></div><strong className="playoff-swing-value">{(100*highlight.swing).toFixed(1)}<small>percentage points</small></strong></div>
      <StakeProbabilities effect={highlight} game={game} byId={byId}/>
      <p>Estimated {metric(highlight.kind)} chance under each result.{view==='combined' ? ' Highlight shows the largest individual probability swing; the combined matchup ranking is unchanged.' : ''} {highlight.lower !== highlight.upper ? 'Swing compares lower probability bounds; unresolved-ranking ranges are shown.' : ''}</p>
    </section> : <p className="playoff-game-why">No probability swing is visible at the displayed precision in these simulations.</p>}
    {beneficiary && <aside className="playoff-beneficiary" aria-label="Who else benefits?">
      <div><h4>Who else benefits?</h4><strong>{byId[beneficiary.managerId].teamName}</strong><span className="playoff-benefit-result">Benefits from a {byId[beneficiary.favored].teamName} win</span></div>
      <StakeProbabilities effect={beneficiary} game={game} byId={byId}/><small>Estimated {metric(beneficiary.kind)} chance · not participating in this matchup.</small>
    </aside>}
  </>
}
export default function PlayoffMatchupViews({ rows, simulation, insights, progress, error }) {
  const [view, setView] = useState('playoff')
  const [expanded, setExpanded] = useState({})
  const games = useMemo(() => rankMatchups(insights?.games ?? [],view),[insights,view])
  const byId = Object.fromEntries(rows.map(t => [t.managerId,t]))
  const baseline = Object.fromEntries((simulation?.results ?? []).map(t => [t.managerId,t]))
  const kind = view === 'bye' ? 'bye' : 'playoff'
  const definition = matchupViews.find(v => v.id === view)
  const label = kind === 'bye' ? 'first-round bye' : 'playoff qualification'
  return <section className="playoff-key-games" aria-labelledby="playoff-games-title"><span className="playoff-kicker">THE MATCHUPS THAT MOVE THE RACE</span><h2 id="playoff-games-title">Games That Matter</h2>
    <div className="playoff-view-control" role="group" aria-label="Matchup impact view">{matchupViews.map(v => <button key={v.id} type="button" aria-pressed={view===v.id} onClick={()=>setView(v.id)}>{v.label}</button>)}</div>
    <p className="playoff-view-description">{viewIntroductions[view]}</p>
    {!insights && <p role="status">{error ? `Key matchup analysis unavailable: ${error}` : progress ? `Conditional simulations loading: ${progress.done} of ${progress.total} matchups analyzed…` : 'Conditional simulations loading in the background…'}</p>}
    {insights && <><p className="playoff-note">{insights.metadata.iterations.toLocaleString()} runs per winner scenario · seed {insights.metadata.seed}. Estimates are not mathematical guarantees; close rankings include sampling noise.</p><div id="playoff-ranked-games" aria-label={`${definition.label} matchups`}>
      {(expanded[view] ? games : games.slice(0,3)).map((g,i) => {
        const home=byId[g.home], away=byId[g.away], explanation=matchupExplanation(g,byId,view)
        const game={...g,names:{home:home.teamName,away:away.teamName}}
        const otherContenders=leagueEffects(g,kind).filter(t=>![g.home,g.away].includes(t.managerId)).sort((a,b)=>b.swing-a.swing || a.managerId.localeCompare(b.managerId)).slice(0,3)
        return <article className="playoff-key-game" key={`${view}-${g.week}-${g.home}-${g.away}`} data-week={g.week} data-home={g.home} data-away={g.away}>
          <div className="playoff-game-heading"><span>#{i+1} · WEEK {g.week}</span><strong className="playoff-significance">{explanation.label}</strong></div><h3>{home.teamName} <span>vs</span> {away.teamName}</h3><MatchupStakes game={g} byId={byId} view={view}/>
          <div className="playoff-game-baseline">{[home,away].map(t=><span key={t.managerId}><strong>{t.teamName}</strong> {t.wins}–{t.losses} · {bounds(baseline[t.managerId][`${kind}Lower`],baseline[t.managerId][`${kind}Upper`])} baseline {label} chance</span>)}</div>
          {view !== 'combined' && <div className="playoff-compact-odds" aria-label={`Conditional ${label} probabilities`}>
            {[home,away].map(t=><div key={t.managerId}><strong>{t.teamName}</strong>{['home','away'].map(side=>{const r=g[`${side}Win`].results.find(r=>r.managerId===t.managerId);return <span key={side}>If {game.names[side]} wins: <b>{bounds(r[`${kind}Lower`],r[`${kind}Upper`])}</b> <em>({probabilityChange(r,baseline[t.managerId],kind)})</em></span>})}</div>)}
          </div>}
          <details className="playoff-game-details"><summary>Advanced Analysis — conditional odds and details</summary>
            {[home,away].map(t=><ConditionalTeam key={t.managerId} team={t} game={game} baseline={baseline[t.managerId]} iterations={simulation.metadata.iterations} kind={kind}/>)}
            {view==='combined' && <><h4>First-round bye implications</h4>{[home,away].map(t=><ConditionalTeam key={t.managerId} team={t} game={game} baseline={baseline[t.managerId]} iterations={simulation.metadata.iterations} kind="bye"/>)}</>}
            <details><summary>Other contenders — league-wide conditional odds</summary>{otherContenders.map(t=><ConditionalTeam key={t.managerId} team={byId[t.managerId]} game={game} baseline={baseline[t.managerId]} iterations={simulation.metadata.iterations} kind={kind}/>)}</details>
            <details><summary>Scenario metadata</summary><p>View impact {g.viewImpact.toFixed(3)}; approved combined impact {g.impact.toFixed(3)}. Model {g.homeWin.metadata.modelVersion}; {g.homeWin.metadata.iterations.toLocaleString()} runs per winner, seed {g.homeWin.metadata.seed}. Unresolved-ranking frequency: {percent(g.homeWin.metadata.unresolvedTiebreakFrequency)} / {percent(g.awayWin.metadata.unresolvedTiebreakFrequency)}. Rejected score draws: {g.homeWin.metadata.rejectedDraws.toLocaleString()} / {g.awayWin.metadata.rejectedDraws.toLocaleString()}.</p></details>
          </details>
        </article>
      })}
    </div>{games.length>3 && <button className="playoff-expand-games" type="button" aria-expanded={!!expanded[view]} aria-controls="playoff-ranked-games" onClick={()=>setExpanded({...expanded,[view]:!expanded[view]})}>{expanded[view] ? 'Show Top Three Matchups' : `View All Key Matchups (${games.length})`}</button>}{!games.length && <p>No remaining regular-season matchups.</p>}
    <details className="playoff-impact-method"><summary>Impact metrics and conditional uncertainty</summary>{matchupViews.map(v=><p key={v.id}><strong>{v.label}:</strong> {v.metric}</p>)}<p>Metrics include every team, not only the participants. Lower probability bounds are used when final-ranking ties are unresolved. Highlight callouts select the largest individual probability swing within the selected view; combined highlights compare both qualification and bye swings. Third-party callouts require a visible swing and a directional benefit across unresolved-ranking bounds; they describe estimates, not statistically proven effects. Exact impact ties are ordered by week and team identity for presentation; the combined view retains the approved ordering. This does not decide official seeds. A displayed 0.0 percentage-point swing can reflect rounding. No view starts additional simulations.</p><p>{insights.metric} This measures sensitivity to the winner, not causal influence or the likelihood of an upset. Rankings include Monte Carlo noise; close impact scores should be treated as effectively tied.</p><p>Each specified winner is conditioned by rejection-sampling both scores from the same scoring distributions until that winner wins. Accepted scores remain positive and update final PF; all other games are simulated normally. No fixed margin or invented completed score is used.</p><p>95% Wilson intervals describe marginal Monte Carlo sampling uncertainty, including nonzero uncertainty at observed 0% and 100%. *Change ranges subtract marginal interval endpoints conservatively; they are not calibrated joint 95% confidence intervals. Official-tiebreak probability bounds remain separate from sampling uncertainty. Extreme winner conditions stop with an explicit error if sampling cannot finish reliably. No estimate proves clinching or elimination.</p></details></>}
  </section>
}
