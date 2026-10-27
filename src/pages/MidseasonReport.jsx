import { useMemo, useState } from 'react'
import snapshot from '../data/midseason/2026-week7.json'
import { forecastPlayoffs } from '../utils/midseasonPlayoffForecast.mjs'
import './MidseasonReport.css'

const WEEKS = 7
const playoffForecast = forecastPlayoffs(snapshot)
const teams = snapshot.standings.map((row) => row.teamName)
const games = snapshot.matchups
const scores = Object.fromEntries(teams.map((name) => [name, Array.from({ length: WEEKS }, (_, i) => {
  const game = games.find((g) => g.week === i + 1 && (g.home.teamName === name || g.away.teamName === name))
  return game ? (game.home.teamName === name ? game.home.score : game.away.score) : null
})]))
const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
const safeScores = (xs) => xs.filter((x) => Number.isFinite(x))
const teamStats = teams.map((name) => {
  const row = snapshot.standings.find((s) => s.teamName === name)
  const points = safeScores(scores[name])
  const first = avg(safeScores(points.slice(0, 3)))
  const recent = avg(safeScores(points.slice(3, 7)))
  const allPlay = games.filter((g) => g.week <= WEEKS).reduce((total, g) => total, 0)
  void allPlay
  const allPlayWins = points.reduce((sum, score, i) => sum + teams.filter((other) => other !== name && Number.isFinite(scores[other][i]) && score > scores[other][i]).length, 0)
  const allPlayTies = points.reduce((sum, score, i) => sum + teams.filter((other) => other !== name && scores[other][i] === score).length, 0)
  return { ...row, name, first, recent, delta: recent - first, ppg: avg(points), allPlayPct: (allPlayWins + 0.5 * allPlayTies) / (WEEKS * (teams.length - 1)) }
})
const normalized = (key, stats) => {
  const values = stats.map((t) => t[key]); const lo = Math.min(...values); const hi = Math.max(...values)
  return Object.fromEntries(stats.map((t) => [t.name, hi === lo ? 50 : 100 * (t[key] - lo) / (hi - lo)]))
}
const ppgIndex = normalized('ppg', teamStats)
const allPlayIndex = normalized('allPlayPct', teamStats)
const recentIndex = normalized('recent', teamStats)
const strength = Object.fromEntries(teams.map((name) => [name, .35 * ppgIndex[name] + .35 * allPlayIndex[name] + .30 * recentIndex[name]]))
const road = teamStats.map((t) => {
  const opponents = games.filter((g) => g.week > WEEKS && (g.home.teamName === t.name || g.away.teamName === t.name)).map((g) => ({ week: g.week, name: g.home.teamName === t.name ? g.away.teamName : g.home.teamName }))
  return { ...t, opponents, difficulty: avg(opponents.map((o) => strength[o.name])) }
}).sort((a, b) => b.difficulty - a.difficulty)

export default function MidseasonReport() {
  const [expanded, setExpanded] = useState(null)
  const [momentumSort, setMomentumSort] = useState('recent')
  const momentum = useMemo(() => [...teamStats].sort((a, b) =>
    b[momentumSort] - a[momentumSort] || a.name.localeCompare(b.name)
  ), [momentumSort])
  const momentumScale = Math.max(1, ...teamStats.flatMap((t) => [t.first, t.recent]))
  return <div className="midseason-report">
    <section className="midseason-cover">
      <div className="midseason-kicker">CLOWNSTERS FFB · SPECIAL EDITION</div>
      <h1>HALFTIME<br /><span>REPORT</span></h1>
      <p>2026 Season · A frozen snapshot after Week 7</p>
      <div className="midseason-stamp">7 WEEKS DOWN <span>·</span> 7 TO GO</div>
    </section>
    <section className="midseason-section">
      <div className="midseason-section-label">01 / THE POWER PICTURE</div>
      <h2>Halfway standings</h2>
      <p>Where the league stood after seven completed weeks. This report will not change when new weeks are imported.</p>
      <div className="midseason-table-wrap"><table><thead><tr><th>Rank</th><th>Team</th><th>Record</th><th>Points For</th><th>PPG</th></tr></thead><tbody>
        {[...teamStats].sort((a,b)=>b.wins-a.wins || b.pointsFor-a.pointsFor).map((t,i)=><tr key={t.name}><td>{i+1}</td><td>{t.name}</td><td>{t.wins}–{t.losses}</td><td>{t.pointsFor.toFixed(1)}</td><td>{t.ppg.toFixed(1)}</td></tr>)}
      </tbody></table></div>
    </section>
    <section className="midseason-section">
      <div className="midseason-section-label">02 / WHO'S HOT, WHO'S NOT</div>
      <h2>The momentum meter</h2>
      <p>Scoring pace in Weeks 1–3 compared with Weeks 4–7. Both bars use the same PPG scale; the change shows recent minus early scoring.</p>
      <div className="midseason-momentum-controls">
        <div className="midseason-momentum-legend" aria-label="Bar colors">
          <span><i className="midseason-momentum-swatch early" /> Weeks 1–3</span>
          <span><i className="midseason-momentum-swatch recent" /> Weeks 4–7</span>
        </div>
        <label className="midseason-momentum-sort">Sort by
          <select value={momentumSort} onChange={(event) => setMomentumSort(event.target.value)}>
            <option value="recent">Recent PPG (W4–7)</option>
            <option value="delta">PPG Change (improvement)</option>
            <option value="first">Early PPG (W1–3)</option>
          </select>
        </label>
      </div>
      <div className="midseason-momentum-list">
        {momentum.map((t) => <div className="midseason-momentum-entry" key={t.name}>
          <div className="midseason-momentum-heading">
            <span className="midseason-momentum-team">{t.name}</span>
            <strong className={t.delta >= 0 ? 'midseason-momentum-up' : 'midseason-momentum-down'}>
              {t.delta > 0 ? '+' : ''}{t.delta.toFixed(1)} PPG
            </strong>
          </div>
          <div className="midseason-momentum-series">
            <div className="midseason-momentum-track"><div className="midseason-momentum-fill early" style={{ width: `${t.first / momentumScale * 100}%` }} /></div>
            <span className="midseason-momentum-value">{t.first.toFixed(1)}</span>
            <div className="midseason-momentum-track"><div className="midseason-momentum-fill recent" style={{ width: `${t.recent / momentumScale * 100}%` }} /></div>
            <span className="midseason-momentum-value">{t.recent.toFixed(1)}</span>
          </div>
        </div>)}
      </div>
    </section>
    <section className="midseason-section">
      <div className="midseason-section-label">03 / THE ROAD AHEAD</div>
      <h2>Remaining schedule difficulty</h2>
      <p>Opponent strength combines season scoring (35%), all-play performance (35%), and Weeks 4–7 scoring (30%). All components are normalized across the league. Higher means harder.</p>
      <div className="midseason-bars">{road.map((t,i)=><div key={t.name} className="midseason-road-entry"><button className="midseason-bar-row midseason-expand" onClick={()=>setExpanded(expanded===t.name?null:t.name)} aria-expanded={expanded===t.name}><span>{i+1}. {t.name}</span><div className="midseason-bar-track"><div className="midseason-bar-fill difficulty" style={{width:`${t.difficulty}%`}} /></div><strong>{t.difficulty.toFixed(1)} ▾</strong></button>{expanded===t.name&&<div className="midseason-opponents">{t.opponents.map((o)=><span key={o.week}>W{o.week}: {o.name} ({strength[o.name].toFixed(1)})</span>)}</div>}</div>)}</div>
    </section>
    <section className="midseason-section midseason-playoff-section">
      <div className="midseason-section-label">04 / PLAYOFF CRYSTAL BALL</div>
      <h2>The playoff picture</h2>
      <p>20,000 simulated finishes of Weeks 8–14, based only on the frozen Week 7 snapshot. Six teams qualify; standings use wins, then Points For. Percentages are model estimates, not guarantees.</p>
      <div className="midseason-playoff-key"><span><i className="midseason-playoff-dot likely" /> 75%+ likely</span><span><i className="midseason-playoff-dot bubble" /> 25–75% bubble</span><span><i className="midseason-playoff-dot longshot" /> Under 25% long shot</span></div>
      <div className="midseason-playoff-list">
        {playoffForecast.map((t, i) => {
          const pct = t.playoffProbability * 100
          const tier = pct >= 75 ? 'likely' : pct >= 25 ? 'bubble' : 'longshot'
          return <div className="midseason-playoff-entry" key={t.teamName}>
            <div className="midseason-playoff-top">
              <span className="midseason-playoff-rank">{String(i + 1).padStart(2, '0')}</span>
              <strong className="midseason-playoff-team">{t.teamName}</strong>
              <strong className="midseason-playoff-pct">{pct.toFixed(1)}%</strong>
            </div>
            <div className="midseason-playoff-track" role="meter" aria-label={`${t.teamName} playoff probability`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(pct.toFixed(1))}>
              <div className={`midseason-playoff-fill ${tier}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="midseason-playoff-detail"><span>Current: {t.currentWins}–{t.currentLosses}</span><span>Projected wins: {t.projectedWins.toFixed(1)}</span><span>Avg. finish: #{t.expectedFinish.toFixed(1)}</span></div>
          </div>
        })}
      </div>
      <p className="midseason-playoff-method">Model: 70% full-season scoring + 30% recent scoring, with team-specific weekly volatility. Simulation seed is fixed so this report stays reproducible.</p>
    </section>
    <section className="midseason-section midseason-coming"><div className="midseason-section-label">COMING NEXT</div><h2>Contenders, wild cards & midseason awards</h2><p>These editorial sections will be added after we validate the core report metrics and layout.</p></section>
  </div>
}
