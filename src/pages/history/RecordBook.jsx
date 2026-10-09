import { useState } from 'react'
import { buildRecordBook } from '../../utils/recordAnalytics'

const RECORD_SECTIONS = [
  {
    id: 'career',
    title: 'Career Records',
    subtitle: 'All-time achievements across league history.',
    records: [
      { id: 'wins', label: 'Most Wins', field: 'wins' },
      {
        id: 'winPercentage',
        label: 'Best Win %',
        field: 'winPercentage',
        suffix: '%',
      },
      {
        id: 'pointsFor',
        label: 'Most Points',
        field: 'pointsFor',
        decimals: 2,
      },
      {
        id: 'pointsPerGame',
        label: 'Best PPG',
        field: 'pointsPerGame',
        decimals: 1,
      },
      {
        id: 'championships',
        label: 'Most Championships',
        field: 'championships',
      },
      {
        id: 'playoffAppearances',
        label: 'Most Playoff Appearances',
        field: 'playoffAppearances',
      },
      {
        id: 'podiums',
        label: 'Most Podiums',
        field: 'podiums',
      },
    ],
  },
  {
    id: 'season',
    title: 'Single-Season Records',
    subtitle: 'The greatest individual seasons in league history.',
    records: [
      { id: 'wins', label: 'Most Wins', field: 'wins' },
      {
        id: 'winPercentage',
        label: 'Best Win %',
        field: 'winPercentage',
        suffix: '%',
      },
      {
        id: 'pointsFor',
        label: 'Most Points',
        field: 'pointsFor',
        decimals: 2,
      },
      {
        id: 'pointsPerGame',
        label: 'Best PPG',
        field: 'pointsPerGame',
        decimals: 1,
      },
    ],
  },
  {
    id: 'game',
    title: 'Single-Game Records',
    subtitle: 'The biggest performances and closest finishes.',
    records: [
      {
        id: 'highestScore',
        label: 'Highest Score',
        field: 'score',
        decimals: 2,
      },
      {
        id: 'lowestScore',
        label: 'Lowest Score',
        field: 'score',
        decimals: 2,
      },
      {
        id: 'largestVictory',
        label: 'Largest Victory',
        field: 'margin',
        decimals: 2,
      },
      {
        id: 'closestVictory',
        label: 'Closest Victory',
        field: 'margin',
        decimals: 2,
      },
    ],
  },
]

function formatValue(value, record) {
  if (value == null) return '—'

  const formatted =
    record.decimals != null
      ? Number(value).toLocaleString(undefined, {
          minimumFractionDigits: record.decimals,
          maximumFractionDigits: record.decimals,
        })
      : Number(value).toLocaleString()

  return `${formatted}${record.suffix ?? ''}`
}

function getCompetitionRanks(rows, field) {
  let previousValue = null
  let previousRank = 0

  return rows.map((row, index) => {
    const value = row[field]

    const rank =
      index > 0 && value === previousValue
        ? previousRank
        : index + 1

    previousValue = value
    previousRank = rank

    return {
      ...row,
      displayRank: rank,
    }
  })
}


const RECORD_ICONS = {
  wins: '🏆', championships: '🏆', winPercentage: 'target',
  pointsFor: 'bars', pointsPerGame: '★', playoffAppearances: 'pennant',
  podiums: '🥇', highestScore: '🏈', lowestScore: '⚠',
  largestVictory: 'bars', closestVictory: '🤝',
}

function RecordIcon({ record }) {
  const symbol = RECORD_ICONS[record.id] ?? '★'
  const tone = ['wins', 'championships', 'podiums'].includes(record.id) ? 'gold' : record.id === 'lowestScore' ? 'red' : 'blue'
  return <span className={`record-book-symbol record-book-symbol-${tone}`} aria-hidden="true">
    {symbol === 'target' ? <svg viewBox="0 0 48 48" width="45" height="45" fill="none" aria-hidden="true"><circle cx="22" cy="26" r="17" stroke="currentColor" strokeWidth="4"/><circle cx="22" cy="26" r="9" stroke="currentColor" strokeWidth="3"/><circle cx="22" cy="26" r="3" fill="currentColor"/><path d="M24 24L42 6M34 6h8v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg> : symbol === 'bars' ? <svg viewBox="0 0 48 48" width="45" height="45" fill="none" aria-hidden="true"><rect x="5" y="29" width="8" height="14" rx="1.5" fill="currentColor" opacity=".65"/><rect x="20" y="20" width="8" height="23" rx="1.5" fill="currentColor" opacity=".8"/><rect x="35" y="8" width="8" height="35" rx="1.5" fill="currentColor"/></svg> : symbol === 'pennant' ? <svg viewBox="0 0 56 64" width="48" height="52" fill="none" aria-hidden="true"><path d="M10 6H46V45L28 58L10 45V6Z" fill="currentColor" fillOpacity=".17" stroke="currentColor" strokeWidth="3"/><path d="M18 16H38M18 24H38M23 33H33" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg> : symbol}
  </span>
}

function RecordCard({ sectionId, record, holders, expanded, onToggle, getManagerName }) {
  const primary = holders[0]
  if (!primary) return null
  return (
    <article className={`record-book-card ${expanded ? 'record-book-card-active' : ''}`}>
      <div className="record-book-card-summary">
        <RecordIcon record={record} />
        <div className="record-book-card-label">{record.label}</div>
        <div className="record-book-card-value">{formatValue(primary[record.field], record)}</div>
        <div className="record-book-holders">
          {holders.map((holder) => (
            <div className="record-book-holder" key={`${holder.managerId}-${holder.season ?? 'career'}-${holder.week ?? ''}`}>
              <strong>{getManagerName(holder.managerId)}</strong>
              {sectionId === 'career' && <span>{holder.seasons} {holder.seasons === 1 ? 'season' : 'seasons'}</span>}
              {sectionId === 'season' && <span>{holder.season}{holder.teamName ? ` · ${holder.teamName}` : ''}</span>}
              {sectionId === 'game' && <>
                <span>{holder.season} · Week {holder.week}{holder.teamName ? ` · ${holder.teamName}` : ''}</span>
                <span className="record-book-opponent">vs {holder.opponentTeamName ?? getManagerName(holder.opponentManagerId)} · {Number(holder.opponentScore).toFixed(2)}</span>
              </>}
            </div>
          ))}
        </div>
        <button type="button" className="record-book-expand" aria-expanded={expanded} onClick={onToggle}>
          {expanded ? 'Hide Leaders' : 'View Leaders'} <span aria-hidden="true">{expanded ? '−' : '↗'}</span>
        </button>
      </div>
    </article>
  )
}

function RecordLeaderboard({ sectionId, record, leaderboard, getManagerName, onClose }) {
  const rankedRows = getCompetitionRanks(leaderboard, record.field)
  const values = rankedRows.map((row) => Number(row[record.field])).filter(Number.isFinite)
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(...values)
  const range = maximum - minimum
  return (
    <div className="record-book-inline-panel">
      <div className="record-book-inline-header">
        <div>
          <div className="record-book-inline-eyebrow">{sectionId === 'career' ? 'CAREER RECORD' : sectionId === 'season' ? 'SINGLE-SEASON RECORD' : 'SINGLE-GAME RECORD'}</div>
          <h3>{record.label} <span>· All-Time Leaders</span></h3>
        </div>
        <button type="button" className="record-book-inline-close" onClick={onClose} aria-label={`Close ${record.label} leaderboard`}>✕</button>
      </div>
      <div className="record-book-inline-list">
        {rankedRows.map((row, index) => {
          const value = Number(row[record.field])
          const width = range > 0 ? Math.max(3, ((value - minimum) / range) * 100) : 100
          return (
            <div className="record-book-inline-row" key={`${row.managerId}-${row.season ?? 'career'}-${row.week ?? ''}-${index}`}>
              <span className={`record-book-inline-rank ${row.displayRank <= 3 ? 'record-book-inline-medal' : ''}`}>{row.displayRank}</span>
              <div className="record-book-inline-person">
                <div className="record-book-inline-person-top">
                  <strong>{getManagerName(row.managerId)}</strong>
                  <strong className="record-book-inline-value">{formatValue(row[record.field], record)}</strong>
                </div>
                <div className="record-book-inline-track"><div className="record-book-inline-fill" style={{ width: `${width}%` }} /></div>
                <span className="record-book-inline-context">
                  {sectionId === 'career' ? `${row.seasons} ${row.seasons === 1 ? 'season' : 'seasons'}` : sectionId === 'season' ? `${row.season}${row.teamName ? ` · ${row.teamName}` : ''}` : `${row.season} · Week ${row.week} · vs ${row.opponentTeamName ?? getManagerName(row.opponentManagerId)}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecordSection({ section, records, getManagerName }) {
  const [openId, setOpenId] = useState(null)
  const rows = []
  for (let index = 0; index < section.records.length; index += 4) {
    const group = section.records.slice(index, index + 4)
    const openRecord = group.find((record) => record.id === openId)
    rows.push(
      <div className="record-book-row-group" key={`${section.id}-${index}`}>
        <div className="record-book-desktop">
        <div className="record-book-grid">
          {group.map((record) => (
            <RecordCard key={record.id} sectionId={section.id} record={record}
              holders={records[section.id][record.id]}
              expanded={openId === record.id}
              onToggle={() => setOpenId((current) => current === record.id ? null : record.id)}
              getManagerName={getManagerName} />
          ))}
        </div>
        {openRecord && <RecordLeaderboard sectionId={section.id} record={openRecord}
          leaderboard={records.leaderboards[section.id][openRecord.id]}
          getManagerName={getManagerName} onClose={() => setOpenId(null)} />}
        </div>
        <div className="record-book-mobile">
          {group.map((record) => (
            <div className="record-book-mobile-item" key={record.id}>
              <RecordCard sectionId={section.id} record={record}
                holders={records[section.id][record.id]}
                expanded={openId === record.id}
                onToggle={() => setOpenId((current) => current === record.id ? null : record.id)}
                getManagerName={getManagerName} />
              {openId === record.id && <RecordLeaderboard sectionId={section.id} record={record}
                leaderboard={records.leaderboards[section.id][record.id]}
                getManagerName={getManagerName} onClose={() => setOpenId(null)} />}
            </div>
          ))}
        </div>
      </div>
    )
  }
  return <section className="record-book-section">
    <div className="record-book-section-header"><h2>{section.title}</h2><p>{section.subtitle}</p></div>
    <div className="record-book-groups">{rows}</div>
  </section>
}

function RecordBook({
  historicalSeasons,
  getManagerName,
}) {
  const records = buildRecordBook(
    historicalSeasons
  )

  return (
    <section className="panel history-record-book">
      <div className="page-header">
        <div className="eyebrow">LEAGUE HISTORY</div>
        <h1>Record Book</h1>
        <p>
          The greatest career, season, and single-game
          performances in Clownsters history.
        </p>
      </div>

      {RECORD_SECTIONS.map((section) => (
        <RecordSection key={section.id} section={section} records={records} getManagerName={getManagerName} />
      ))}
    </section>
  )
}

export default RecordBook