import { useMemo, useState } from 'react'
import { buildHeadToHeadMatrix } from '../../utils/headToHeadAnalytics'

export default function HeadToHeadMatrix({ historicalSeasons, getManagerName, onSelectManager }) {
  const years = useMemo(() => Object.values(historicalSeasons).map((s) => s.season).sort((a, b) => a - b), [historicalSeasons])
  const [start, setStart] = useState(years[0])
  const [end, setEnd] = useState(years[years.length - 1])
  const [focused, setFocused] = useState('all')
  const { managerIds, matrix, matchupCount } = useMemo(
    () => buildHeadToHeadMatrix(historicalSeasons, start, end),
    [historicalSeasons, start, end]
  )
  const ids = useMemo(() => [...managerIds].sort((a, b) => getManagerName(a).localeCompare(getManagerName(b))), [managerIds, getManagerName])
  const visibleRows = focused === 'all' ? ids : ids.filter((id) => id === focused)

  return (
    <section className="h2h-section" aria-label="Head-to-head matrix">
      <div className="h2h-controls">
        <div>
          <h2>Head-to-Head Matrix</h2>
          <p>Regular-season results, including completed 2026 games. Each cell shows the row manager’s wins–losses–ties against the column manager.</p>
        </div>
        <div className="h2h-filters">
          <label>From
            <select value={start} onChange={(e) => { const year = Number(e.target.value); setStart(year); if (year > end) setEnd(year) }}>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label>Through
            <select value={end} onChange={(e) => { const year = Number(e.target.value); setEnd(year); if (year < start) setStart(year) }}>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label>Focus manager
            <select value={focused} onChange={(e) => setFocused(e.target.value)}>
              <option value="all">All managers</option>
              {ids.map((id) => <option key={id} value={id}>{getManagerName(id)}</option>)}
            </select>
          </label>
        </div>
      </div>
      <p className="h2h-summary">{matchupCount.toLocaleString()} matchups · {ids.length} managers · Green = winning record, red = losing record, neutral = tied or no games</p>
      <div className="h2h-scroll" role="region" aria-label="Scrollable manager head-to-head matrix" tabIndex={0}>
        <table className="h2h-table">
          <thead><tr><th scope="col" className="h2h-corner">Manager ↓ / Opponent →</th>
            {ids.map((id) => <th scope="col" key={id} title={getManagerName(id)}><button type="button" onClick={() => onSelectManager(id)}>{getManagerName(id)}</button></th>)}
          </tr></thead>
          <tbody>{visibleRows.map((rowId) => <tr key={rowId}>
            <th scope="row"><button type="button" onClick={() => onSelectManager(rowId)}>{getManagerName(rowId)}</button></th>
            {ids.map((colId) => {
              const record = matrix[rowId]?.[colId]
              const label = rowId === colId ? 'Same manager' : !record?.games ? 'No games' : `${record.wins} wins, ${record.losses} losses, ${record.ties} ties in ${record.games} games`
              const tone = rowId === colId ? 'self' : !record?.games ? 'empty' : record.wins > record.losses ? 'positive' : record.wins < record.losses ? 'negative' : 'even'
              return <td key={colId} className={`h2h-cell h2h-${tone}`} title={`${getManagerName(rowId)} vs ${getManagerName(colId)}: ${label}`} aria-label={`${getManagerName(rowId)} against ${getManagerName(colId)}: ${label}`}>
                {rowId === colId ? '—' : record?.games ? `${record.wins}–${record.losses}${record.ties ? `–${record.ties}` : ''}` : '·'}
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <p className="h2h-footnote">Select a manager name to open their existing profile. Rivalry details will follow in Milestone 2C.</p>
    </section>
  )
}
