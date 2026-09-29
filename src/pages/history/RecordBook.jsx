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

function RecordCard({
  sectionId,
  record,
  holders,
  leaderboard,
  getManagerName,
}) {
  const [expanded, setExpanded] = useState(false)

  const rankedRows = getCompetitionRanks(
    leaderboard,
    record.field
  )

  const primary = holders[0]

  if (!primary) {
    return null
  }

  return (
  <article className="record-book-card">
    <div className="record-book-card-summary">
      <div className="record-book-card-label">
        {record.label}
      </div>

      <div className="record-book-card-value">
        {formatValue(primary[record.field], record)}
      </div>

      <div className="record-book-holders">
        {holders.map((holder) => (
          <div
            className="record-book-holder"
            key={`${holder.managerId}-${holder.season ?? 'career'}-${holder.week ?? ''}`}
          >
            <strong>
              {getManagerName(holder.managerId)}
            </strong>

            {sectionId === 'career' && (
              <span>{holder.seasons} seasons</span>
            )}

            {sectionId === 'season' && (
              <span>
                {holder.season}
                {holder.teamName
                  ? ` · ${holder.teamName}`
                  : ''}
              </span>
            )}

            {sectionId === 'game' && (
              <span>
                {holder.season} · Week {holder.week}
                {holder.teamName
                  ? ` · ${holder.teamName}`
                  : ''}
              </span>
            )}

            {sectionId === 'game' && (
              <span className="record-book-opponent">
                vs{' '}
                {holder.opponentTeamName ??
                  getManagerName(
                    holder.opponentManagerId
                  )}
                {' · '}
                {Number(
                  holder.opponentScore
                ).toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="record-book-expand"
        onClick={() =>
          setExpanded((value) => !value)
        }
      >
        {expanded
          ? 'Hide Leaders'
          : 'View Leaders'}
      </button>
    </div>

    {expanded && (
      <div className="record-book-leaderboard">
          {rankedRows.map((row, index) => (
            <div
              className="record-book-leaderboard-row"
              key={`${row.managerId}-${row.season ?? 'career'}-${row.week ?? ''}-${index}`}
            >
              <div className="record-book-rank">
                {row.displayRank}
              </div>

              <div className="record-book-leaderboard-name">
                <strong>
                  {getManagerName(row.managerId)}
                </strong>

                {sectionId === 'career' && (
                  <span>{row.seasons} seasons</span>
                )}

                {sectionId === 'season' && (
                  <span>
                    {row.season}
                    {row.teamName
                      ? ` · ${row.teamName}`
                      : ''}
                  </span>
                )}

                {sectionId === 'game' && (
                  <span>
                    {row.season} · Week {row.week}
                    {' · '}
                    vs {row.opponentTeamName ??
                      getManagerName(
                        row.opponentManagerId
                      )}
                  </span>
                )}
              </div>

              <strong className="record-book-leaderboard-value">
                {formatValue(
                  row[record.field],
                  record
                )}
              </strong>
            </div>
          ))}
        </div>
      )}
    </article>
  )
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
        <section
          className="record-book-section"
          key={section.id}
        >
          <div className="record-book-section-header">
            <h2>{section.title}</h2>
            <p>{section.subtitle}</p>
          </div>

          <div className="record-book-grid">
            {section.records.map((record) => (
              <RecordCard
                key={`${section.id}-${record.id}`}
                sectionId={section.id}
                record={record}
                holders={
                  records[section.id][record.id]
                }
                leaderboard={
                  records.leaderboards[
                    section.id
                  ][record.id]
                }
                getManagerName={getManagerName}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}

export default RecordBook