import { probabilityRange as bounds, points } from '../../utils/playoffs/matchupViews.js'
import { projectedScenarioOrder,scenarioTakeaways } from '../../utils/playoffs/scenarioPresentation.js'
const seed=t=>Math.abs(t.expectedSeedMin-t.expectedSeedMax)<1e-9 ? t.expectedSeedMin.toFixed(1) : `${t.expectedSeedMin.toFixed(1)}–${t.expectedSeedMax.toFixed(1)}`
const samplingBounds=(a,b)=>`${(100*a).toFixed(2)}%–${(100*b).toFixed(2)}%`
const delta=xs=>`${Math.abs(xs[0]-xs[1])<1e-9 ? points(xs[0]) : `${points(xs[0])} to ${points(xs[1])}`} pp`
export default function ScenarioResults({ report, state }) {
  const teams=Object.fromEntries(state.teams.map(t=>[t.managerId,t]))
  const rows=projectedScenarioOrder(report.comparisons),takeaways=scenarioTakeaways(report.comparisons)
  const cut=rows[5],baselineSixth=[...rows].sort((a,b)=>a.baseline.expectedSeedMin-b.baseline.expectedSeedMin||a.managerId.localeCompare(b.managerId))[5]
  return <>
    <div className="whatif-summary"><div><span>Current Scenario</span><strong>{report.selections.length} selected outcomes</strong></div><div><span>Projected sixth-place wins</span><strong>{cut.scenario.expectedWins.toFixed(1)}</strong><small>Current Forecast: {baselineSixth.baseline.expectedWins.toFixed(1)}</small></div></div>
    <p className="whatif-caption">Current Scenario vs Current Forecast. Ordered by average projected seed; the cutline is a projection, not an official final standing.</p>
    <div className="whatif-results-list">{rows.map((t,i)=>{
      const team=teams[t.managerId],s=t.scenario,b=t.baseline
      return <div key={t.managerId}>{i===6 && <div className="playoff-cutline">PROJECTED PLAYOFF CUTLINE · SIX BERTHS</div>}<article className="whatif-team"><div className="whatif-team-title"><h4>{team.teamName}</h4><span>{team.wins}–{team.losses} now · Avg. seed {seed(s)}</span></div>
        <div className="whatif-probability"><span>Playoff chance</span><strong>{bounds(s.playoffLower,s.playoffUpper)}</strong><span className="whatif-change">{delta(t.playoffChange)}</span></div>
        <div className="whatif-bar" role="img" aria-label={`${team.teamName} scenario playoff probability ${bounds(s.playoffLower,s.playoffUpper)}`}><span style={{width:`${100*s.playoffLower}%`}}/></div>
        <p className="whatif-baseline">Current Forecast {bounds(b.playoffLower,b.playoffUpper)} · 95% scenario sampling range {samplingBounds(...t.playoffUncertainty.scenario)}</p>
        <div className="whatif-team-metrics"><span>Bye <strong>{bounds(s.byeLower,s.byeUpper)}</strong> ({delta(t.byeChange)})<small>Forecast {bounds(b.byeLower,b.byeUpper)}</small></span><span>Expected wins <strong>{s.expectedWins.toFixed(1)}</strong><small>Forecast {b.expectedWins.toFixed(1)}</small></span><span>Avg. seed <strong>{seed(s)}</strong><small>Forecast {seed(b)}</small></span></div>
        <details className="whatif-seed-distribution"><summary>Final seeds and sampling uncertainty</summary><div className="whatif-seed-grid">{s.seedLower.map((n,j)=><span key={j}>#{j+1}: {bounds(n,s.seedUpper[j])}</span>)}</div><p>Bye sampling range: {samplingBounds(...t.byeUncertainty.scenario)}. Playoff change range: {delta(t.playoffUncertainty.change)}. Bye change range: {delta(t.byeUncertainty.change)}.</p><p>Change ranges subtract marginal sampling intervals conservatively; they are not joint 95% confidence intervals. Probability bounds retain unresolved ranking uncertainty.</p></details>
      </article></div>
    })}</div>
    <section className="whatif-takeaways"><h4>Key Takeaways</h4>{takeaways.length ? takeaways.map(t=><article key={`${t.type}-${t.managerId}-${t.kind}`}><span>{t.type}</span><strong>{teams[t.managerId].teamName}</strong><p>Estimated {t.kind==='bye'?'first-round bye':'playoff qualification'} chance changes by {delta(t.change)} in this hypothetical scenario.</p></article>) : <p>No probability change stands out beyond the conservative sampling ranges. Current Forecast has zero scenario changes.</p>}</section>
    <details className="whatif-method"><summary>Scenario methodology and metadata</summary><p>{report.metadata.iterations.toLocaleString()} simulations · seed {report.metadata.seed} · {report.metadata.modelVersion}. {report.metadata.selectedOutcomes} hypothetical outcomes. Unresolved-ranking frequency: {bounds(report.metadata.unresolvedTiebreakFrequency,report.metadata.unresolvedTiebreakFrequency)}.</p><p>Selected winners use score pairs drawn from the existing scoring model until the selected team wins. Both scores count toward PF. Unselected games are simulated normally. No recorded result is changed.</p><p>{report.metadata.randomness} {report.metadata.changeUncertainty}</p><p>Unresolved rules: {report.metadata.unresolvedRules.join('; ')}. No estimate establishes mathematical qualification or elimination. The projected cutline uses the team sixth in average projected seed, not an exact wins threshold.</p><p>Takeaways require a displayed probability change and a conservative difference range excluding zero. These are editorial criteria, not league rules.</p></details>
  </>
}
