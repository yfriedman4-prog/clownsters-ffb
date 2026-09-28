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
const managerStandings = [...historyStats.managers].sort((a, b) => {
  if (b.winPercentage !== a.winPercentage) {
    return b.winPercentage - a.winPercentage
  }

  return b.wins - a.wins
})
 const winPercentageLeader =
  historyStats.leaders.winPercentage[0]
  const handleStartChange = (event) => {
    const year = Number(event.target.value)
    setStartSeason(Math.min(year, endSeason))
  }
  const winsLeaders = historyStats.leaders.wins
const championshipLeaders = historyStats.leaders.championships
const podiumLeaders = historyStats.leaders.podiums

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

     <div className="history-overview-records">
  <div className="history-overview-record-card">
    <span>MOST WINS</span>

    <strong>
      {winsLeaders
        .map((manager) => getManagerName(manager.managerId))
        .join(' · ')}
    </strong>

    <div>
      {winsLeaders[0].wins} wins
    </div>
  </div>

  <div className="history-overview-record-card">
    <span>MOST CHAMPIONSHIPS</span>

    <strong>
      {championshipLeaders
        .map((manager) => getManagerName(manager.managerId))
        .join(' · ')}
    </strong>

    <div>
      {championshipLeaders[0].championships}{' '}
      {championshipLeaders[0].championships === 1
        ? 'title'
        : 'titles'}
    </div>
  </div>

  <div className="history-overview-record-card">
    <span>MOST PODIUMS</span>

    <strong>
      {podiumLeaders
        .map((manager) => getManagerName(manager.managerId))
        .join(' · ')}
    </strong>

    <div>
      {podiumLeaders[0].podiums}{' '}
      {podiumLeaders[0].podiums === 1
        ? 'podium'
        : 'podiums'}
    </div>
  </div>

  <div className="history-overview-record-card">
    <span>BEST WIN %</span>

    <strong>
      {getManagerName(winPercentageLeader.managerId)}
    </strong>

    <div>
      {winPercentageLeader.winPercentage.toFixed(1)}%
      {' · '}
      {winPercentageLeader.wins}-{winPercentageLeader.losses}
{winPercentageLeader.ties > 0
  ? `-${winPercentageLeader.ties}`
  : ''}
    </div>

    <small>
      {winPercentageLeader.seasons}{' '}
      {winPercentageLeader.seasons === 1
        ? 'season'
        : 'seasons'}
    </small>
  </div>
</div>
<div className="history-manager-section">
  <div className="history-section-header">
    <div>
      <div className="eyebrow">MANAGER PERFORMANCE</div>
      <h2>Manager Standings</h2>
    </div>

    <div className="history-manager-count">
      {managerStandings.length} managers
    </div>
  </div>

  <div className="history-manager-table-wrap">
    <div className="history-manager-table">
      <div className="history-manager-row history-manager-heading">
        <div>MANAGER</div>
        <div>SEASONS</div>
        <div>W-L</div>
        <div>WIN %</div>
        <div>PPG</div>
        <div>TITLES</div>
        <div>RUNNER-UP</div>
        <div>PODIUMS</div>
      </div>

      {managerStandings.map((manager) => (
        <div
          className="history-manager-row"
          key={manager.managerId}
        >
          <div className="history-manager-name">
            {getManagerName(manager.managerId)}
          </div>

          <div>{manager.seasons}</div>

         <div>
  {manager.wins}-{manager.losses}
  {manager.ties > 0 ? `-${manager.ties}` : ''}
</div>

          <div className="history-manager-winpct">
            {manager.winPercentage.toFixed(1)}%
          </div>

          <div>
            {manager.pointsPerGame.toFixed(1)}
          </div>

          <div className="history-manager-title-count">
            {manager.championships}
          </div>

          <div>{manager.runnerUps}</div>

          <div>{manager.podiums}</div>
        </div>
      ))}
    </div>
  </div>
</div>
    </section>
  )
}

export default HistoryOverview