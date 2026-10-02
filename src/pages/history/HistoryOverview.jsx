import { useState } from 'react'
import { aggregateHistory } from '../../utils/historyAnalytics'

const LEAGUE_ERAS = [
  { id: 'all', label: 'All Time', startSeason: 2006, endSeason: 2025 },
  { id: 'high-school', label: 'High School', startSeason: 2006, endSeason: 2009 },
  { id: 'revival', label: 'Revival', startSeason: 2012, endSeason: 2017 },
  { id: 'modern', label: 'Modern', startSeason: 2018, endSeason: 2025 },
]

function HistoryOverview({
  availableSeasons,
  historicalSeasons,
  getManagerName,
  onSelectManager,
}) {
  const firstSeason = Math.min(...availableSeasons)
  const lastSeason = Math.max(...availableSeasons)

  const [startSeason, setStartSeason] = useState(firstSeason)
  const [endSeason, setEndSeason] = useState(lastSeason)
const [managerSort, setManagerSort] = useState({
  key: 'winPercentage',
  direction: 'desc',
})
  const historyStats = aggregateHistory(
    historicalSeasons,
    startSeason,
    endSeason
  )
  const minSeason = Math.min(...availableSeasons)
const maxSeason = Math.max(...availableSeasons)
const sliderSeasons = [...availableSeasons].sort((a, b) => a - b)

const startSeasonIndex = sliderSeasons.indexOf(startSeason)
const endSeasonIndex = sliderSeasons.indexOf(endSeason)


const managerStandings = [...historyStats.managers].sort((a, b) => {
  const key = managerSort.key
  const direction = managerSort.direction === 'asc' ? 1 : -1

  if (key === 'manager') {
    return (
      getManagerName(a.managerId).localeCompare(
        getManagerName(b.managerId)
      ) * direction
    )
  }

  if (a[key] !== b[key]) {
    return (a[key] - b[key]) * direction
  }

  if (b.wins !== a.wins) {
    return b.wins - a.wins
  }

  return getManagerName(a.managerId).localeCompare(
    getManagerName(b.managerId)
  )
})

const handleManagerSort = (key) => {
  setManagerSort((current) => {
    if (current.key === key) {
      return {
        key,
        direction:
          current.direction === 'desc' ? 'asc' : 'desc',
      }
    }

    return {
      key,
      direction: key === 'manager' ? 'asc' : 'desc',
    }
  })
}

const getSortIndicator = (key) => {
  if (managerSort.key !== key) {
    return ''
  }

  return managerSort.direction === 'desc' ? ' ↓' : ' ↑'
}
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
  const selectedSeasonCount =
  availableSeasons.filter(
    (year) => year >= startSeason && year <= endSeason
  ).length
  const activeEra =
  LEAGUE_ERAS.find(
    (era) =>
      era.startSeason === startSeason &&
      era.endSeason === endSeason
  )?.id ?? 'custom'
  const handleEraSelect = (era) => {
  setStartSeason(era.startSeason)
  setEndSeason(era.endSeason)
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

        <div className="history-era-presets">
          {LEAGUE_ERAS.map((era) => (
            <button
              key={era.id}
              type="button"
              className={activeEra === era.id ? 'active' : ''}
              onClick={() => handleEraSelect(era)}
            >
              {era.label}
            </button>
          ))}

          {activeEra === 'custom' && (
            <span className="history-era-custom">Custom</span>
          )}
        </div>

       <div className="history-range-slider">
  <div className="history-range-labels">
    <span>{startSeason}</span>
    <span>{endSeason}</span>
  </div>

  <div className="history-range-track-wrap">
    <div className="history-range-track" />

    <div
      className="history-range-selected"
      style={{
  left: `${
    (startSeasonIndex /
      (sliderSeasons.length - 1)) *
    100
  }%`,
  right: `${
    100 -
    (endSeasonIndex /
      (sliderSeasons.length - 1)) *
      100
  }%`,
}}
    />

    <input
  type="range"
  min="0"
  max={sliderSeasons.length - 1}
  step="1"
  value={startSeasonIndex}
  onChange={(event) => {
    const nextIndex = Number(event.target.value)

    if (nextIndex <= endSeasonIndex) {
      setStartSeason(sliderSeasons[nextIndex])
    }
  }}
  className="history-range-input history-range-start"
  aria-label="Starting season"
/>

  <input
  type="range"
  min="0"
  max={sliderSeasons.length - 1}
  step="1"
  value={endSeasonIndex}
  onChange={(event) => {
    const nextIndex = Number(event.target.value)

    if (nextIndex >= startSeasonIndex) {
      setEndSeason(sliderSeasons[nextIndex])
    }
  }}
  className="history-range-input history-range-end"
  aria-label="Ending season"
/>
  </div>

  <div className="history-range-extents">
    <span>{minSeason}</span>
    <span>{maxSeason}</span>
  </div>
  <div className="history-range-summary">
  <strong>
    {startSeason}–{endSeason}
  </strong>
  <span>·</span>
  <span>
    {selectedSeasonCount}{' '}
    {selectedSeasonCount === 1 ? 'season' : 'seasons'}
  </span>
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

  <strong className="history-leader-name-list">
  {championshipLeaders.map((manager) => (
    <span key={manager.managerId}>
      {getManagerName(manager.managerId)}
    </span>
  ))}
</strong>

    <div>
  {championshipLeaders[0].championships}{' '}
  {championshipLeaders[0].championships === 1
    ? 'title'
    : 'titles'}
  {championshipLeaders.length > 1 ? ' each' : ''}
</div>
  </div>

  <div className="history-overview-record-card">
    <span>MOST PODIUMS</span>

   <strong className="history-leader-name-list">
  {podiumLeaders.map((manager) => (
    <span key={manager.managerId}>
      {getManagerName(manager.managerId)}
    </span>
  ))}
</strong>

   <div>
  {podiumLeaders[0].podiums}{' '}
  {podiumLeaders[0].podiums === 1
    ? 'podium'
    : 'podiums'}
  {podiumLeaders.length > 1 ? ' each' : ''}
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
  <button
    type="button"
    onClick={() => handleManagerSort('manager')}
    className={managerSort.key === 'manager' ? 'active-sort' : ''}
  >
    MANAGER{getSortIndicator('manager')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('seasons')}
    className={managerSort.key === 'seasons' ? 'active-sort' : ''}
  >
    SEASONS{getSortIndicator('seasons')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('wins')}
    className={managerSort.key === 'wins' ? 'active-sort' : ''}
  >
    W-L-T{getSortIndicator('wins')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('winPercentage')}
    className={
      managerSort.key === 'winPercentage' ? 'active-sort' : ''
    }
  >
    WIN %{getSortIndicator('winPercentage')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('pointsPerGame')}
    className={
      managerSort.key === 'pointsPerGame' ? 'active-sort' : ''
    }
  >
    PPG{getSortIndicator('pointsPerGame')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('playoffAppearances')}
    className={
      managerSort.key === 'playoffAppearances' ? 'active-sort' : ''
    }
  >
    PLAYOFFS{getSortIndicator('playoffAppearances')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('playoffPercentage')}
    className={
      managerSort.key === 'playoffPercentage' ? 'active-sort' : ''
    }
  >
    PLAYOFF %{getSortIndicator('playoffPercentage')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('championships')}
    className={
      managerSort.key === 'championships' ? 'active-sort' : ''
    }
  >
    TITLES{getSortIndicator('championships')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('runnerUps')}
    className={
      managerSort.key === 'runnerUps' ? 'active-sort' : ''
    }
  >
    RUNNER-UP{getSortIndicator('runnerUps')}
  </button>

  <button
    type="button"
    onClick={() => handleManagerSort('podiums')}
    className={managerSort.key === 'podiums' ? 'active-sort' : ''}
  >
    PODIUMS{getSortIndicator('podiums')}
  </button>
</div>

      {managerStandings.map((manager) => (
        <div
          className="history-manager-row"
          key={manager.managerId}
        >
         <button
  type="button"
  className="history-manager-name history-manager-link"
  onClick={() => onSelectManager(manager.managerId)}
>
  {getManagerName(manager.managerId)}
</button>

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
          <div>
  {manager.playoffAppearances}
</div>

<div>
  {manager.playoffPercentage.toFixed(1)}%
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
