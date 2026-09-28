import { useState } from 'react'
import { aggregateHistory } from '../../utils/historyAnalytics'

function HistoryOverview({
  availableSeasons,
  historicalSeasons,
  getManagerName,
}) {
  const firstSeason = Math.min(...availableSeasons)
  const lastSeason = Math.max(...availableSeasons)

  const [startSeason, setStartSeason] = useState(firstSeason)
  const [endSeason, setEndSeason] = useState(lastSeason)

  const historyStats = aggregateHistory(
    historicalSeasons,
    startSeason,
    endSeason
  )

  const winPercentageLeader = [...historyStats.managers]
    .sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage
      }

      return b.wins - a.wins
    })[0]
  const handleStartChange = (event) => {
    const year = Number(event.target.value)
    setStartSeason(Math.min(year, endSeason))
  }

  const handleEndChange = (event) => {
    const year = Number(event.target.value)
    setEndSeason(Math.max(year, startSeason))
  }

  return (
    <section className="history-overview">
      <div className="history-header">
        <div>
          <div className="eyebrow">CLOWNSTERS FFB</div>
          <h1>League Overview</h1>
          <p>
            All-time records, championships, and manager performance
            across league history.
          </p>
        </div>

        <div className="history-era">
          {startSeason}–{endSeason}
        </div>
      </div>

      <div className="history-range-panel">
        <div className="history-range-header">
          <div>
            <div className="eyebrow">TIMEFRAME</div>
            <h2>League Era</h2>
          </div>

          <strong>
            {startSeason}–{endSeason}
          </strong>
        </div>

        <div className="history-range-controls">
          <div className="history-range-control">
            <label htmlFor="history-start-season">
              START
            </label>

            <select
              id="history-start-season"
              value={startSeason}
              onChange={handleStartChange}
            >
              {availableSeasons.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="history-range-track">
            <span>{firstSeason}</span>
            <div className="history-range-line" />
            <span>{lastSeason}</span>
          </div>

          <div className="history-range-control">
            <label htmlFor="history-end-season">
              END
            </label>

            <select
              id="history-end-season"
              value={endSeason}
              onChange={handleEndChange}
            >
              {availableSeasons.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

     <div className="history-overview-placeholder">
  <div className="eyebrow">SELECTED HISTORY</div>

  <h2>
    {historyStats.seasonCount} Seasons
  </h2>

  <p>
    {historyStats.managers.length} managers participated from{' '}
    {startSeason} through {endSeason}.
  </p>

  {winPercentageLeader && (
    <div className="history-overview-preview">
      <span>WIN % LEADER</span>

      <strong>
        {getManagerName(winPercentageLeader.managerId)}
      </strong>

   <div>
  {winPercentageLeader.wins}-{winPercentageLeader.losses}
  {' · '}
  {winPercentageLeader.winPercentage.toFixed(1)}%
  {' · '}
  {winPercentageLeader.seasons}{' '}
  {winPercentageLeader.seasons === 1 ? 'season' : 'seasons'}
</div>
    </div>
  )}
</div>
    </section>
  )
}

export default HistoryOverview