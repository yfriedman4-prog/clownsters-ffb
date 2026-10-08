import { useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { buildScoringTrends, buildScoringDistributions, buildTopScoringSeasons } from '../../utils/scoringAnalytics'

const COLORS = ['#e7b654', '#f46c78', '#4d9eff', '#39bd89']
const ERAS = [
  ['All Time', 2006, 2025],
  ['High School', 2006, 2009],
  ['Revival', 2012, 2017],
  ['Modern', 2018, 2025],
]

export default function ScoringAnalytics({ historicalSeasons, getManagerName }) {
  const years = Object.values(historicalSeasons).map((season) => season.season).sort((a, b) => a - b)
  const [start, setStart] = useState(years[0])
  const [end, setEnd] = useState(years[years.length - 1])
  const [mode, setMode] = useState('relative')
  const [distributionManager, setDistributionManager] = useState('all')
  const [topMetric, setTopMetric] = useState('ppg')
  const [showAllTop, setShowAllTop] = useState(false)
  const [selected, setSelected] = useState(['yaakov', 'jeremy', 'max', 'halpert'])
  const seasons = buildScoringTrends(historicalSeasons, start, end)
  const managers = [...new Set(Object.values(historicalSeasons).flatMap((season) => season.seasonTeams?.map((team) => team.managerId) ?? []))]
    .sort((a, b) => getManagerName(a).localeCompare(getManagerName(b)))
  const distributions = buildScoringDistributions(historicalSeasons, start, end, distributionManager)
  const topSeasons = buildTopScoringSeasons(historicalSeasons, start, end)
    .filter((row) => topMetric !== 'relative' || Number.isFinite(row.relative))
    .sort((a, b) => (b[topMetric] - a[topMetric]) || (b.points - a.points) || (a.season - b.season) || a.managerId.localeCompare(b.managerId))
  const visibleTopSeasons = showAllTop ? topSeasons : topSeasons.slice(0, 10)
  const topMaximum = Math.max(0, ...visibleTopSeasons.map((row) => row[topMetric]))
  const chartData = seasons.map((season) => ({
    season: String(season.season),
    baseline: mode === 'relative' ? 100 : season.leagueAverage,
    ...Object.fromEntries(selected.filter(Boolean).map((id) => [id, season.managers[id]?.[mode === 'relative' ? 'relative' : 'ppg'] ?? null])),
  }))
  const format = (value) => value == null ? '—' : mode === 'relative' ? `${value.toFixed(1)}%` : value.toFixed(1)
  return (
    <main className="scoring-analytics-page">
      <div className="scoring-heading"><div><h1>Scoring Analytics</h1><p>Compare regular-season offensive performance across league history.</p></div><strong>{start}–{end}</strong></div>
      <div className="scoring-era-buttons">{ERAS.map(([label, from, to]) => <button key={label} className={start === from && end === to ? 'active' : ''} onClick={() => { setStart(from); setEnd(to) }}>{label}</button>)}</div>
      <section className="scoring-panel">
        <div className="scoring-panel-header"><div><h2>Manager Scoring Trends</h2><p>Compare up to four managers. Gaps indicate seasons without participation.</p></div><div className="scoring-mode-buttons"><button className={mode === 'relative' ? 'active' : ''} onClick={() => setMode('relative')}>Relative to League Average</button><button className={mode === 'ppg' ? 'active' : ''} onClick={() => setMode('ppg')}>Raw Points / Game</button></div></div>
        <div className="scoring-range"><label>From <select value={start} onChange={(e) => setStart(Math.min(Number(e.target.value), end))}>{years.filter((year) => year <= end).map((year) => <option key={year}>{year}</option>)}</select></label><label>Through <select value={end} onChange={(e) => setEnd(Math.max(Number(e.target.value), start))}>{years.filter((year) => year >= start).map((year) => <option key={year}>{year}</option>)}</select></label></div>
        <div className="scoring-manager-selectors">{selected.map((id, index) => <label key={index}><span style={{ color: COLORS[index] }}>●</span> Manager {index + 1}<select value={id} onChange={(e) => setSelected((old) => old.map((item, i) => i === index ? e.target.value : item))}><option value="">None</option>{managers.filter((candidate) => candidate === id || !selected.includes(candidate)).map((candidate) => <option key={candidate} value={candidate}>{getManagerName(candidate)}</option>)}</select></label>)}</div>
        <div className="scoring-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 15, right: 20, bottom: 10, left: 4 }}><CartesianGrid stroke="#26384e" strokeDasharray="3 4"/><XAxis dataKey="season" stroke="#a9bad0" tick={{ fontSize: 11 }}/><YAxis stroke="#a9bad0" width={52} tickFormatter={(value) => mode === 'relative' ? `${value}%` : value.toFixed(0)} domain={['auto', 'auto']}/><Tooltip contentStyle={{ background: '#142338', border: '1px solid #496078', borderRadius: 8 }} formatter={(value, name) => [format(value), name === 'baseline' ? 'League Average' : getManagerName(name)]}/><Line type="monotone" dataKey="baseline" stroke="#a4b1c3" strokeDasharray="5 5" dot={false} strokeWidth={2} connectNulls={false}/>{selected.filter(Boolean).map((id) => <Line key={id} type="monotone" dataKey={id} stroke={COLORS[selected.indexOf(id)]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} connectNulls={false}/>)}</LineChart></ResponsiveContainer></div>
        <div className="scoring-custom-legend" aria-label="Chart legend"><div className="scoring-legend-baseline"><span className="scoring-legend-line" style={{ borderColor: '#a4b1c3', borderTopStyle: 'dashed' }} />League Average</div><div className="scoring-legend-managers">{selected.filter(Boolean).map((id) => <div key={id} className="scoring-legend-manager"><span className="scoring-legend-line" style={{ borderColor: COLORS[selected.indexOf(id)] }} />{getManagerName(id)}</div>)}</div></div>
        <div className="scoring-summary-grid">{selected.filter(Boolean).map((id) => { const entries = seasons.map((season) => season.managers[id] ? { ...season.managers[id], leagueAverage: season.leagueAverage } : null).filter(Boolean); const games = entries.reduce((sum, entry) => sum + entry.games, 0); const points = entries.reduce((sum, entry) => sum + entry.points, 0); const expected = entries.reduce((sum, entry) => sum + entry.leagueAverage * entry.games, 0); return <div className="scoring-summary" key={id} style={{ borderColor: COLORS[selected.indexOf(id)] }}><h3>{getManagerName(id)}</h3><strong>{mode === 'relative' ? (expected ? `${(points / expected * 100).toFixed(1)}%` : '—') : (games ? (points / games).toFixed(1) : '—')}</strong><p>{entries.length} seasons · {games} games</p><small>{points.toLocaleString(undefined, { maximumFractionDigits: 1 })} total PF</small></div> })}</div>
      </section>
      <section className="scoring-panel scoring-distribution-panel">
        <div className="scoring-panel-header"><div><h2>Scoring Distribution</h2><p>Regular-season team scores by year. Boxes show the middle 50%; the center line is the median, and whiskers show the lowest and highest scores.</p></div><label className="scoring-distribution-select">Scores from <select value={distributionManager} onChange={(e) => setDistributionManager(e.target.value)}><option value="all">All Managers</option>{managers.map((id) => <option key={id} value={id}>{getManagerName(id)}</option>)}</select></label></div>
        <div className="scoring-distribution-scroll"><div className="scoring-distribution-chart" style={{ minWidth: `${Math.max(620, distributions.length * 54 + 75)}px` }}>
          <DistributionPlot data={distributions} />
        </div></div>
        <p className="scoring-distribution-note">Hover or tap a box for minimum, lower quartile, median, upper quartile, maximum, and sample size. Seasons without eligible scores are omitted.</p>
      </section>
      <section className="scoring-panel scoring-top-seasons">
        <div className="scoring-panel-header"><div><h2>Top Scoring Seasons</h2><p>Greatest individual manager-seasons, ranked by regular-season offense.</p></div></div>
        <div className="scoring-top-tabs" aria-label="Scoring season ranking metric">
          {[['ppg', 'Highest PPG'], ['points', 'Most Total PF'], ['relative', 'Best Relative to League']].map(([key, label]) => <button key={key} className={topMetric === key ? 'active' : ''} onClick={() => { setTopMetric(key); setShowAllTop(false) }}>{label}</button>)}
        </div>
        <div className="scoring-top-list">
          {visibleTopSeasons.map((row, index) => <div className="scoring-top-row" key={`${row.season}-${row.managerId}`}>
            <div className="scoring-top-person"><span className="scoring-top-rank">{index + 1}.</span><div><strong>{getManagerName(row.managerId)}</strong><small>{row.season} · {row.teamName}</small></div></div>
            <div className="scoring-top-bar-track"><div className="scoring-top-bar" style={{ width: `${topMaximum ? row[topMetric] / topMaximum * 100 : 0}%` }}/></div>
            <strong className="scoring-top-value">{topMetric === 'relative' ? `${row.relative.toFixed(1)}%` : row[topMetric].toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</strong>
            <div className="scoring-top-stats">{row.games} games · {row.ppg.toFixed(1)} PPG · {row.points.toFixed(1)} PF · League {row.leagueAverage?.toFixed(1) ?? '—'} PPG · {row.aboveLeague >= 0 ? '+' : ''}{row.aboveLeague?.toFixed(1) ?? '—'} vs league</div>
          </div>)}
          {!visibleTopSeasons.length && <p>No eligible scoring seasons in this range.</p>}
        </div>
        {topSeasons.length > 10 && <button className="scoring-top-expand" onClick={() => setShowAllTop((value) => !value)}>{showAllTop ? 'Show Top 10' : `Show All ${topSeasons.length} Manager-Seasons`}</button>}
      </section>
    </main>
  )
}

function DistributionPlot({ data }) {
  const [active, setActive] = useState(null)
  const width = Math.max(620, data.length * 54 + 75)
  const height = 320
  const left = 52, right = 18, top = 18, bottom = 42
  const values = data.flatMap((d) => [d.min, d.max])
  const lower = Math.max(0, Math.floor((Math.min(...values, 0) - 10) / 25) * 25)
  const upper = Math.max(lower + 25, Math.ceil((Math.max(...values, 0) + 10) / 25) * 25)
  const y = (v) => top + (upper - v) / (upper - lower) * (height - top - bottom)
  const x = (i) => left + (i + 0.5) * (width - left - right) / Math.max(1, data.length)
  const ticks = Array.from({ length: 5 }, (_, i) => lower + i * (upper - lower) / 4)
  return <>
    <svg className="scoring-boxplot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Season-by-season scoring box plots">
      {ticks.map((v) => <g key={v}><line x1={left} x2={width-right} y1={y(v)} y2={y(v)} stroke="#293b52" strokeDasharray="3 4"/><text x={left-9} y={y(v)+4} textAnchor="end" fill="#b6c6d9" fontSize="11">{v.toFixed(0)}</text></g>)}
      {data.map((d,i) => {const cx=x(i);const highlighted=active===d.season;return <g key={d.season} onMouseEnter={() => setActive(d.season)} onMouseLeave={() => setActive(null)} onClick={() => setActive(active===d.season?null:d.season)} tabIndex={0} onFocus={() => setActive(d.season)} onBlur={() => setActive(null)} aria-label={`${d.season}: median ${d.median.toFixed(1)} points, ${d.count} scores`}>
        <line x1={cx} x2={cx} y1={y(d.max)} y2={y(d.min)} stroke="#a4c5e9" strokeWidth="2"/>
        <line x1={cx-9} x2={cx+9} y1={y(d.max)} y2={y(d.max)} stroke="#a4c5e9" strokeWidth="2"/><line x1={cx-9} x2={cx+9} y1={y(d.min)} y2={y(d.min)} stroke="#a4c5e9" strokeWidth="2"/>
        <rect x={cx-15} y={y(d.q3)} width="30" height={Math.max(1,y(d.q1)-y(d.q3))} rx="3" fill={highlighted?'#e7b654':'#4d9eff'} fillOpacity="0.85" stroke="#b7d9ff"/>
        <line x1={cx-15} x2={cx+15} y1={y(d.median)} y2={y(d.median)} stroke="#111c2d" strokeWidth="3"/>
        <text x={cx} y={height-17} textAnchor="middle" fill="#bdcde0" fontSize="11">{d.season}</text>
      </g>})}
    </svg>
    {active != null && (() => {const d=data.find((item)=>item.season===active);return d ? <div className="scoring-boxplot-detail" role="status"><strong>{d.season}</strong><span>{d.count} scores</span><span>Min {d.min.toFixed(1)}</span><span>Q1 {d.q1.toFixed(1)}</span><span>Median {d.median.toFixed(1)}</span><span>Q3 {d.q3.toFixed(1)}</span><span>Max {d.max.toFixed(1)}</span></div> : null})()}
  </>
}
