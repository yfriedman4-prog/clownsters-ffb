import { useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { buildScoringTrends } from '../../utils/scoringAnalytics'

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
  const [selected, setSelected] = useState(['yaakov', 'jeremy', 'max', 'halpert'])
  const seasons = buildScoringTrends(historicalSeasons, start, end)
  const managers = [...new Set(Object.values(historicalSeasons).flatMap((season) => season.seasonTeams?.map((team) => team.managerId) ?? []))]
    .sort((a, b) => getManagerName(a).localeCompare(getManagerName(b)))
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
    </main>
  )
}
