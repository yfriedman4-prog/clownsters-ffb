import { useEffect, useMemo, useState } from 'react'
import { validateSeason } from '../utils/playoffs/seasonState.js'
import { rankTeams } from '../utils/playoffs/ranking.js'
import { playoffRules } from '../config/playoffs2026.js'
import './PlayoffScenarios.css'
import PlayoffRaceInsights from './PlayoffRaceInsights.jsx'
const pct = n => `${(100 * n).toFixed(1)}%`
const range = (a, b, format = pct) => Math.abs(a - b) < 1e-10 ? format(a) : `${format(a)}–${format(b)}`
export default function PlayoffScenarios({ season }) {
  const [iterations, setIterations] = useState(10000)
  const [simulation, setSimulation] = useState(null)
  const [error, setError] = useState('')
  const [insights, setInsights] = useState(null)
  const [progress, setProgress] = useState(null)
  const state = useMemo(() => { try { return { data: validateSeason(season) } } catch (e) { return { error: e.message } } }, [season])
  useEffect(() => {
    if (state.error) return
    const worker = new Worker(new URL('../workers/playoffScenarios.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      if (data.result) setSimulation(data.result)
      if (data.insights) setInsights(data.insights)
      if (data.progress) setProgress(data.progress)
      if (data.error) setError(data.error)
    }
    worker.onerror = () => setError('Simulation could not run. Please reload or choose another simulation count.')
    worker.postMessage({ season, options: { iterations, seed: 202610 } })
    return () => worker.terminate()
  }, [season, iterations, state.error])
  if (state.error) return <section className="playoff-page"><h1>Playoff Race</h1><p role="alert">Data needs review: {state.error}</p></section>
  const rows = rankTeams(state.data.teams)
  const estimates = Object.fromEntries((simulation?.results ?? []).map(t => [t.managerId, t]))
  const names = Object.fromEntries(rows.map(t => [t.managerId, t.teamName]))
  const weeks = [...new Set(state.data.remaining.map(g => g.week))]
  const cutline = rows[5].wins
  return <section className="playoff-page">
    <header className="playoff-cover"><span className="playoff-kicker">2026 • THROUGH WEEK {state.data.throughWeek}</span><h1>Playoff Race<span>Fourteen weeks. Six tickets.</span></h1><p>The road to the postseason, one matchup at a time.</p><div className="playoff-summary"><div><strong>6 / 12</strong><span>Playoff berths</span></div><div><strong>{14 - state.data.throughWeek}</strong><span>Weeks remaining</span></div><div><strong>2</strong><span>First-round byes</span></div><div><strong>15–17</strong><span>Playoff weeks</span></div></div></header>
    <PlayoffRaceInsights key={`${season.completedThroughWeek}-${iterations}`} rows={rows} simulation={simulation} insights={insights} progress={progress} error={error} />
    <div className="playoff-controls"><h2>Qualification Picture</h2><label>Simulations <select value={iterations} onChange={e => { setSimulation(null); setInsights(null); setProgress(null); setError(''); setIterations(Number(e.target.value)) }}><option value={1000}>1,000</option><option value={10000}>10,000</option><option value={25000}>25,000</option></select></label></div>
    <p className="playoff-note" aria-live="polite">{error || (simulation ? `${simulation.metadata.iterations.toLocaleString()} simulations • seed ${simulation.metadata.seed} • estimated probabilities, not clinching guarantees.` : 'Calculating probabilities in the background…')}</p>
    {error && <p role="alert">{error}</p>}
    <div className="playoff-race">{rows.map((t, i) => {
      const s = estimates[t.managerId], above = t.seedMax <= 6, boundary = t.seedMin <= 6 && t.seedMax > 6
      return <div key={t.managerId}>{i === 6 && <div className="playoff-cutline">PLAYOFF CUTLINE • TOP SIX QUALIFY</div>}<article className={`playoff-card ${above ? 'inside' : 'outside'}`}>
        <div className="playoff-identity"><span className="playoff-rank">{t.seedMin === t.seedMax ? `#${t.seedMin}` : `#${t.seedMin}–${t.seedMax}`}</span><h3>{t.teamName}</h3><span className="playoff-position">{boundary ? 'Cutline tied' : above ? 'Currently top six' : 'Chasing the cutline'}</span></div>
        <div className="playoff-record"><span><strong>{t.wins}–{t.losses}</strong> W–L</span><span>{t.pointsFor.toFixed(2)} PF</span><span>{state.data.remaining.filter(g => g.home === t.managerId || g.away === t.managerId).length} games left</span><span>{t.wins > cutline ? 'Above cutline' : `${cutline - t.wins} wins behind sixth`}</span></div>
        <div className="playoff-probability"><span>Estimated playoff chance</span><strong>{s ? range(s.playoffLower, s.playoffUpper) : '…'}</strong></div><div className="playoff-track" role="img" aria-label={s ? `Playoff probability ${range(s.playoffLower, s.playoffUpper)}` : 'Probability pending'}><div style={{ width: `${100 * (s?.playoffLower ?? 0)}%` }} /></div>
        <div className="playoff-projections"><span>Projected seed <strong>{s ? range(s.expectedSeedMin, s.expectedSeedMax, n => n.toFixed(1)) : '…'}</strong> <small>(average)</small></span><span>Bye chance <strong>{s ? range(s.byeLower, s.byeUpper) : '…'}</strong></span><span>Expected wins <strong>{s?.expectedWins.toFixed(1) ?? '…'}</strong></span></div>
        {s && <details className="playoff-seeds"><summary>Final seed distribution</summary><div>{s.seedLower.map((p, j) => <span key={j}>#{j + 1}: {range(p, s.seedUpper[j])}</span>)}</div></details>}
      </article></div>
    })}</div>
    <section className="playoff-schedule"><h2>Complete Remaining Schedule</h2><div className="playoff-weeks">{weeks.map(week => <div key={week}><h3>Week {week}</h3>{state.data.remaining.filter(g => g.week === week).map(g => <p key={g.home}><strong>{names[g.home]}</strong><span>vs</span><strong>{names[g.away]}</strong></p>)}</div>)}</div>{!weeks.length && <p>Regular-season schedule complete.</p>}</section>
    <details className="playoff-method"><summary>Probability Methodology</summary><p>Each team’s scoring model uses only completed 2026 games: a positive lognormal distribution matched to its scoring mean and sample variance, with a 12-point minimum standard deviation. Independent future scores are drawn for the actual remaining schedule. Final standings use wins, then total regular-season PF. Six teams qualify; the top two receive byes. No divisions apply.</p><p>Model v1 uses continuous, unrounded scores; official precision and matchup-tie treatment remain unconfirmed. A completed tied game blocks the calculation. An exactly tied simulated game also stops calculation rather than inventing standings credit. Equal final wins/PF retain seed and probability bounds. No name or ID decides a berth.</p><p>Sampling uncertainty can be about ±1 percentage point at 10,000 runs (95%, near a 50% estimate). Small samples, injuries, roster moves, shared-player correlations and scoring changes limit the model. Zero or 100% estimates are not mathematical elimination or clinching.</p><p>Seed: 202610. Model: {simulation?.metadata.modelVersion ?? 'lognormal-completed-2026-v1'}. Unresolved final-ranking frequency: {simulation ? pct(simulation.metadata.unresolvedTiebreakFrequency) : 'pending'}. Ranges reflect unresolved ranking, not sampling confidence intervals.</p><p>Unresolved official rules: {playoffRules.unresolved.join('; ')}. Playoff reseeding is outside this regular-season forecast. Games behind uses wins only; PF still separates equal-win teams.</p></details>
  </section>
}
