import { useState } from 'react'
import seasonData from './data/2025.json'
import matchupData from './data/2025-matchups.json'
import { calculateStandings } from './utils/standings'
import './App.css'
const seasonHistory = {
  2025: {
    champion: 'Yaakov',
    runnerUp: 'Benjy',
    thirdPlace: 'Reoven',
  },
}
const weeklyAwards = seasonData.teams.map((team) => ({
  team,
  wins: 0,
  weeks: [],
}))

for (let week = 0; week < seasonData.weeks; week++) {
  const weeklyScores = seasonData.teams.map((team) => ({
    team,
    score: seasonData.scores[team][week],
  }))

  const highestScore = Math.max(
    ...weeklyScores.map((item) => item.score)
  )

  weeklyScores
    .filter((item) => item.score === highestScore)
    .forEach((winner) => {
      const manager = weeklyAwards.find(
        (item) => item.team === winner.team
      )

      manager.wins += 1
      manager.weeks.push({
        week: week + 1,
        score: winner.score,
      })
    })
}

weeklyAwards.sort((a, b) => {
  if (b.wins !== a.wins) {
    return b.wins - a.wins
  }

  return a.team.localeCompare(b.team)
})
function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [pfMode, setPfMode] = useState('total')
const [paMode, setPaMode] = useState('total')
  const standings = calculateStandings(seasonData, matchupData)
  const selectedWeekData = matchupData.matchups.find(
  (week) => week.week === selectedWeek
)
const getTeamWeeklyResults = (teamName) => {
  return matchupData.matchups.map((weekData) => {
    const game = weekData.games.find(
      ([teamA, teamB]) =>
        teamA === teamName || teamB === teamName
    )

    if (!game) return null

    const [teamA, teamB] = game
    const opponent = teamA === teamName ? teamB : teamA
    const weekIndex = weekData.week - 1

    const score = seasonData.scores[teamName][weekIndex]
    const opponentScore = seasonData.scores[opponent][weekIndex]

    let result = 'T'

    if (score > opponentScore) result = 'W'
    if (score < opponentScore) result = 'L'

    return {
      week: weekData.week,
      opponent,
      score,
      opponentScore,
      result,
      margin: score - opponentScore,
    }
  }).filter(Boolean)
}
const scoringRankings = [...standings].sort(
  (a, b) => b.pointsFor - a.pointsFor
)

const allPlayRankings = [...standings].sort(
  (a, b) => b.expectedWins - a.expectedWins
)

const luckRankings = [...standings].sort(
  (a, b) => b.luck - a.luck
)
const pointsAgainstRankings = [...standings].sort(
  (a, b) => b.averagePA - a.averagePA
)

const maxPointsFor = Math.max(
  ...standings.map((team) => team.pointsFor)
)

const maxExpectedWins = Math.max(
  ...standings.map((team) => team.expectedWins)
)
const maxAveragePA = Math.max(
  ...standings.map((team) => team.averagePA)
)
const maxAbsLuck = Math.max(
  ...standings.map((team) => Math.abs(team.luck))
)
  const leader = standings[0]
  const highestScorer = [...standings].sort(
    (a, b) => b.highScore - a.highScore
  )[0]
  const luckiest = [...standings].sort(
    (a, b) => b.luck - a.luck
  )[0]
  const unluckiest = [...standings].sort(
    (a, b) => a.luck - b.luck
  )[0]
const highestScoringTeam = [...standings].sort(
  (a, b) => b.pointsFor - a.pointsFor
)[0]

const highestWeeklyScore = [...standings].sort(
  (a, b) => b.highScore - a.highScore
)[0]

const lowestWeeklyScore = [...standings].sort(
  (a, b) => a.lowScore - b.lowScore
)[0]

const bestPointDifferential = [...standings].sort(
  (a, b) => b.pointDifferential - a.pointDifferential
)[0]
const [standingsSort, setStandingsSort] = useState({
  key: 'rank',
  direction: 'asc',
})
const [powerSort, setPowerSort] = useState({
  key: 'powerRank',
  direction: 'asc',
})
const handleStandingsSort = (key) => {
  setStandingsSort((current) => {
    if (current.key === key) {
      return {
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      }
    }

    return {
      key,
      direction:
        key === 'rank' || key === 'team'
          ? 'asc'
          : 'desc',
    }
  })
}
const handlePowerSort = (key) => {
  setPowerSort((current) => {
    if (current.key === key) {
      return {
        key,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      }
    }

    return {
      key,
      direction:
        key === 'powerRank' || key === 'team'
          ? 'asc'
          : 'desc',
    }
  })
}

const getPowerSortIndicator = (key) => {
  if (powerSort.key !== key) return ''

  return powerSort.direction === 'asc' ? ' ▲' : ' ▼'
}
const sortedStandings = [...standings].sort((a, b) => {
  const { key, direction } = standingsSort

  let valueA
  let valueB

  switch (key) {
    case 'rank':
      valueA = standings.indexOf(a)
      valueB = standings.indexOf(b)
      break

    case 'team':
      valueA = a.team
      valueB = b.team
      break

    case 'record':
      valueA = a.wins + a.ties * 0.5
      valueB = b.wins + b.ties * 0.5
      break

    case 'pointsFor':
      valueA = a.pointsFor
      valueB = b.pointsFor
      break

    case 'pointsAgainst':
      valueA = a.pointsAgainst
      valueB = b.pointsAgainst
      break

    case 'averagePF':
      valueA = a.averagePF
      valueB = b.averagePF
      break

    case 'pointDifferential':
      valueA = a.pointDifferential
      valueB = b.pointDifferential
      break

    case 'allPlay':
      valueA = a.allPlayWins + a.allPlayTies * 0.5
      valueB = b.allPlayWins + b.allPlayTies * 0.5
      break

    case 'expectedWins':
      valueA = a.expectedWins
      valueB = b.expectedWins
      break

    case 'luck':
      valueA = a.luck
      valueB = b.luck
      break

    default:
      return 0
  }

  if (typeof valueA === 'string') {
    return direction === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA)
  }

  return direction === 'asc'
    ? valueA - valueB
    : valueB - valueA
})
const getSortIndicator = (key) => {
  if (standingsSort.key !== key) return ''

  return standingsSort.direction === 'asc' ? ' ▲' : ' ▼'
}
const powerRankings = standings
  .map((team) => {
    const teamScores = seasonData.scores[team.team]

    // Recent form = average score over the final 3 regular-season weeks
    const recentScores = teamScores.slice(-3)

    const recentAverage =
      recentScores.reduce((sum, score) => sum + score, 0) /
      recentScores.length

    const allPlayGames =
      team.allPlayWins +
      team.allPlayLosses +
      (team.allPlayTies || 0)

    const allPlayPct =
      allPlayGames > 0
        ? (
            team.allPlayWins +
            (team.allPlayTies || 0) * 0.5
          ) / allPlayGames
        : 0

    const recordGames =
      team.wins + team.losses + team.ties

    const recordPct =
      recordGames > 0
        ? (team.wins + team.ties * 0.5) / recordGames
        : 0

    return {
      ...team,
      recentAverage,
      allPlayPct,
      recordPct,
    }
  })
  const getRankScore = (value, values) => {
  const sorted = [...values].sort((a, b) => a - b)

  if (sorted.length <= 1) return 100

  const below = sorted.filter((item) => item < value).length
  const equal = sorted.filter((item) => item === value).length

  const averageRank = below + (equal - 1) / 2

  return (averageRank / (sorted.length - 1)) * 100
}
const allPlayValues = powerRankings.map(
  (team) => team.allPlayPct
)

const scoringValues = powerRankings.map(
  (team) => team.averagePF
)

const recentFormValues = powerRankings.map(
  (team) => team.recentAverage
)

const recordValues = powerRankings.map(
  (team) => team.recordPct
)
const calculatedPowerRankings = powerRankings
  .map((team) => {
    const allPlayScore = getRankScore(
      team.allPlayPct,
      allPlayValues
    )

    const scoringScore = getRankScore(
      team.averagePF,
      scoringValues
    )

    const formScore = getRankScore(
      team.recentAverage,
      recentFormValues
    )

    const recordScore = getRankScore(
      team.recordPct,
      recordValues
    )

    const powerScore =
      allPlayScore * 0.4 +
      scoringScore * 0.3 +
      formScore * 0.2 +
      recordScore * 0.1

    return {
      ...team,
      allPlayScore,
      scoringScore,
      formScore,
      recordScore,
      powerScore,
    }
  })
  .sort((a, b) => b.powerScore - a.powerScore)
  const sortedPowerRankings = [...calculatedPowerRankings].sort((a, b) => {
  const { key, direction } = powerSort

  let valueA
  let valueB

  switch (key) {
    case 'powerRank':
      valueA = calculatedPowerRankings.indexOf(a)
      valueB = calculatedPowerRankings.indexOf(b)
      break

    case 'team':
      valueA = a.team
      valueB = b.team
      break

    case 'powerScore':
      valueA = a.powerScore
      valueB = b.powerScore
      break

    case 'record':
      valueA = a.wins + a.ties * 0.5
      valueB = b.wins + b.ties * 0.5
      break

    case 'allPlay':
      valueA =
        a.allPlayWins + (a.allPlayTies || 0) * 0.5
      valueB =
        b.allPlayWins + (b.allPlayTies || 0) * 0.5
      break

    case 'averagePF':
      valueA = a.averagePF
      valueB = b.averagePF
      break

    case 'recentAverage':
      valueA = a.recentAverage
      valueB = b.recentAverage
      break

    default:
      return 0
  }

  if (typeof valueA === 'string') {
    return direction === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA)
  }

  return direction === 'asc'
    ? valueA - valueB
    : valueB - valueA
})
  return (
    <div className="app">
     <header className="header">
  <div className="header-brand">
    <div className="brand">🏈 CLOWNSTERS FFB</div>
    <div className="subtitle">Fantasy Football League</div>
  </div>

 <nav className="nav">
  {[
    ['dashboard', 'Dashboard'],
    ['standings', 'Standings'],
    ['matchups', 'Matchups'],
    ['teams', 'Teams'],
    ['analytics', 'Analytics'],
    ['history', 'History'],
  ].map(([id, label]) => (
    <button
      key={id}
      className={`nav-item ${page === id ? 'active' : ''}`}
      onClick={() => {
  setPage(id)

  if (id === 'teams') {
    setSelectedTeam(null)
  }
}}
    >
      {label}
    </button>
  ))}
</nav>

  <div className="season">2025 Season</div>
</header>

      <main className="dashboard">
{page !== 'dashboard' &&
page !== 'standings' &&
page !== 'matchups' &&
page !== 'teams' &&
page !== 'analytics' &&
page !== 'history' ? (
      <section className="placeholder-page">
    <div className="eyebrow">CLOWNSTERS FFB</div>

    <h1>
      {page.charAt(0).toUpperCase() + page.slice(1)}
    </h1>

    <p>
      This section is under construction.
    </p>
  </section>
) : page === 'dashboard' ? (
    <>

        <section className="hero">
          <div>
            <div className="eyebrow">LEAGUE LEADER</div>
            <h1>{leader.team}</h1>
            <div className="hero-record">
              {leader.wins}-{leader.losses}
            </div>
          </div>

          <div className="hero-stat">
            <span>{leader.pointsFor.toFixed(1)}</span>
            <small>POINTS FOR</small>
          </div>

          <div className="hero-stat">
            <span>{leader.averagePF.toFixed(1)}</span>
            <small>AVG / WEEK</small>
          </div>

          <div className="hero-stat">
            <span>
              {leader.luck > 0 ? '+' : ''}
              {leader.luck.toFixed(1)}
            </span>
            <small>LUCK</small>
          </div>
        </section>

        <section className="cards">

          <div className="card">
            <div className="card-icon">🔥</div>
            <div>
              <div className="card-label">BEST WEEK</div>
              <div className="card-value">{highestScorer.team}</div>
              <div className="card-detail">
                {highestScorer.highScore.toFixed(1)} pts
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">🍀</div>
            <div>
              <div className="card-label">LUCKIEST</div>
              <div className="card-value">{luckiest.team}</div>
              <div className="card-detail">
                +{luckiest.luck.toFixed(1)} wins
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">💀</div>
            <div>
              <div className="card-label">UNLUCKIEST</div>
              <div className="card-value">{unluckiest.team}</div>
              <div className="card-detail">
                {unluckiest.luck.toFixed(1)} wins
              </div>
            </div>
          </div>

        </section>

        <section className="panel">

          <div className="panel-header">
            <div>
              <div className="eyebrow">LEAGUE TABLE</div>
              <h2>Standings</h2>
            </div>
          </div>

          <div className="standings">

            <div className="standings-row standings-heading">
              <div>#</div>
              <div>TEAM</div>
              <div>RECORD</div>
              <div>PF</div>
              <div>DIFF</div>
              <div>xW</div>
              <div>LUCK</div>
            </div>

            {standings.map((team, index) => (
              <div className="standings-row" key={team.team}>

                <div className="rank">{index + 1}</div>

                <div className="team-name">{team.team}</div>

                <div>
                  {team.wins}-{team.losses}
                </div>

                <div>{team.pointsFor.toFixed(1)}</div>

                <div
                  className={
                    team.pointDifferential >= 0
                      ? 'positive'
                      : 'negative'
                  }
                >
                  {team.pointDifferential > 0 ? '+' : ''}
                  {team.pointDifferential.toFixed(1)}
                </div>

                <div>{team.expectedWins.toFixed(1)}</div>

                <div
                  className={
                    team.luck >= 0
                      ? 'positive'
                      : 'negative'
                  }
                >
                  {team.luck > 0 ? '+' : ''}
                  {team.luck.toFixed(1)}
                </div>

              </div>
            ))}

          </div>

        </section>
    </>
) : null}
{page === 'standings' && (
  <section className="panel">
    <div className="page-header">
      <div className="eyebrow">2025 SEASON</div>
      <h1>League Standings</h1>
      <p>Full season standings and performance metrics.</p>
    </div>

    <div className="full-standings">
 <div className="full-row full-heading">
  <button
    className="sort-header"
    onClick={() => handleStandingsSort('rank')}
  >
    #{getSortIndicator('rank')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('team')}
  >
    TEAM{getSortIndicator('team')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('record')}
  >
    RECORD{getSortIndicator('record')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('pointsFor')}
  >
    PF{getSortIndicator('pointsFor')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('pointsAgainst')}
  >
    PA{getSortIndicator('pointsAgainst')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('averagePF')}
  >
    AVG{getSortIndicator('averagePF')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('pointDifferential')}
  >
    DIFF{getSortIndicator('pointDifferential')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('allPlay')}
  >
    ALL-PLAY{getSortIndicator('allPlay')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('expectedWins')}
  >
    xW{getSortIndicator('expectedWins')}
  </button>

  <button
    className="sort-header"
    onClick={() => handleStandingsSort('luck')}
  >
    LUCK{getSortIndicator('luck')}
  </button>
</div>

   {sortedStandings.map((team) => (
        <div className="full-row" key={team.team}>
          <div className="rank">{standings.findIndex((item) => item.team === team.team) + 1}</div>

          <div className="team-name">{team.team}</div>

          <div>
            {team.wins}-{team.losses}
          </div>

          <div>{team.pointsFor.toFixed(1)}</div>

          <div>{team.pointsAgainst.toFixed(1)}</div>

          <div>{team.averagePF.toFixed(1)}</div>

          <div
            className={
              team.pointDifferential >= 0 ? 'positive' : 'negative'
            }
          >
            {team.pointDifferential > 0 ? '+' : ''}
            {team.pointDifferential.toFixed(1)}
          </div>

          <div>
            {team.allPlayWins}-{team.allPlayLosses}
          </div>

          <div>{team.expectedWins.toFixed(1)}</div>

          <div
            className={team.luck >= 0 ? 'positive' : 'negative'}
          >
            {team.luck > 0 ? '+' : ''}
            {team.luck.toFixed(1)}
          </div>
        </div>
      ))}
    </div>
  </section>
)}
{page === 'matchups' && (
  <section>
    <div className="matchups-header">
      <div>
        <div className="eyebrow">2025 SEASON</div>
        <h1>Weekly Matchups</h1>
        <p>Select a week to view results.</p>
      </div>

      <select
        className="week-select"
        value={selectedWeek}
        onChange={(e) => setSelectedWeek(Number(e.target.value))}
      >
        {matchupData.matchups.map((week) => (
          <option key={week.week} value={week.week}>
            Week {week.week}
          </option>
        ))}
      </select>
    </div>

    <div className="matchup-grid">
      {selectedWeekData.games.map(([teamA, teamB]) => {
        const scoreA =
          seasonData.scores[teamA][selectedWeek - 1]

        const scoreB =
          seasonData.scores[teamB][selectedWeek - 1]

        const winnerA = scoreA > scoreB
        const winnerB = scoreB > scoreA

        return (
          <div className="matchup-card" key={`${teamA}-${teamB}`}>
            <div
              className={`matchup-team ${
                winnerA ? 'winner' : ''
              }`}
            >
              <span>{teamA}</span>
              <strong>{scoreA.toFixed(2)}</strong>
            </div>

            <div
              className={`matchup-team ${
                winnerB ? 'winner' : ''
              }`}
            >
              <span>{teamB}</span>
              <strong>{scoreB.toFixed(2)}</strong>
            </div>

            <div className="matchup-footer">
              Final
            </div>
          </div>
        )
      })}
    </div>
  </section>
)}
{page === 'teams' && (
  <section>
    {selectedTeam ? (
      <div className="team-profile">

        <button
          className="back-button"
          onClick={() => setSelectedTeam(null)}
        >
          ← All Teams
        </button>

        <div className="profile-hero">
          <div>
            <div className="eyebrow">2025 TEAM PROFILE</div>

            <h1>{selectedTeam.team}</h1>

            <div className="profile-record">
              {selectedTeam.wins}-{selectedTeam.losses}
            </div>
          </div>

          <div className="profile-stat">
            <strong>{selectedTeam.pointsFor.toFixed(1)}</strong>
            <span>POINTS FOR</span>
          </div>

          <div className="profile-stat">
            <strong>{selectedTeam.averagePF.toFixed(1)}</strong>
            <span>AVG / WEEK</span>
          </div>

          <div className="profile-stat">
            <strong>{selectedTeam.expectedWins.toFixed(1)}</strong>
            <span>EXPECTED WINS</span>
          </div>

          <div className="profile-stat">
            <strong
              className={
                selectedTeam.luck >= 0 ? 'positive' : 'negative'
              }
            >
              {selectedTeam.luck > 0 ? '+' : ''}
              {selectedTeam.luck.toFixed(1)}
            </strong>
            <span>LUCK</span>
          </div>
        </div>

        <div className="profile-cards">
          <div className="profile-mini-card">
            <span>HIGH SCORE</span>
            <strong>{selectedTeam.highScore.toFixed(1)}</strong>
          </div>

          <div className="profile-mini-card">
            <span>LOW SCORE</span>
            <strong>{selectedTeam.lowScore.toFixed(1)}</strong>
          </div>

          <div className="profile-mini-card">
            <span>POINT DIFF</span>
            <strong
              className={
                selectedTeam.pointDifferential >= 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {selectedTeam.pointDifferential > 0 ? '+' : ''}
              {selectedTeam.pointDifferential.toFixed(1)}
            </strong>
          </div>

          <div className="profile-mini-card">
            <span>ALL-PLAY</span>
            <strong>
              {selectedTeam.allPlayWins}-{selectedTeam.allPlayLosses}
            </strong>
          </div>
        </div>

        <div className="profile-results">
          <div className="profile-section-header">
            <div className="eyebrow">GAME LOG</div>
            <h2>Weekly Results</h2>
          </div>

          <div className="results-table">
            <div className="results-row results-heading">
              <div>WEEK</div>
              <div>OPPONENT</div>
              <div>RESULT</div>
              <div>PF</div>
              <div>PA</div>
              <div>MARGIN</div>
            </div>

            {getTeamWeeklyResults(selectedTeam.team).map((game) => (
              <div
                className="results-row"
                key={game.week}
              >
                <div>{game.week}</div>

                <div className="team-name">
                  {game.opponent}
                </div>

                <div>
                  <span
                    className={`result-badge result-${game.result.toLowerCase()}`}
                  >
                    {game.result}
                  </span>
                </div>

                <div>{game.score.toFixed(2)}</div>

                <div>{game.opponentScore.toFixed(2)}</div>

                <div
                  className={
                    game.margin >= 0 ? 'positive' : 'negative'
                  }
                >
                  {game.margin > 0 ? '+' : ''}
                  {game.margin.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    ) : (
      <>
        <div className="teams-header">
          <div>
            <div className="eyebrow">2025 SEASON</div>
            <h1>Teams</h1>
            <p>Select a team to view its season profile.</p>
          </div>
        </div>

        <div className="teams-grid">
          {standings.map((team, index) => (
            <button
              className="team-card"
              key={team.team}
              onClick={() => setSelectedTeam(team)}
            >
              <div className="team-card-top">
                <span className="team-rank">
                  #{index + 1}
                </span>

                <span
                  className={
                    team.luck >= 0
                      ? 'team-luck positive'
                      : 'team-luck negative'
                  }
                >
                  {team.luck > 0 ? '+' : ''}
                  {team.luck.toFixed(1)} luck
                </span>
              </div>

              <div className="team-card-name">
                {team.team}
              </div>

              <div className="team-card-record">
                {team.wins}-{team.losses}
              </div>

              <div className="team-card-stats">
                <div>
                  <strong>{team.pointsFor.toFixed(1)}</strong>
                  <span>POINTS FOR</span>
                </div>

                <div>
                  <strong>{team.averagePF.toFixed(1)}</strong>
                  <span>AVG / WEEK</span>
                </div>

                <div>
                  <strong>{team.expectedWins.toFixed(1)}</strong>
                  <span>xW</span>
                </div>
              </div>

              <div className="team-card-footer">
                View Team →
              </div>
            </button>
          ))}
        </div>
      </>
    )}
  </section>
)}
{page === 'analytics' && (
  <section>
    <div className="analytics-header">
      <div>
        <div className="eyebrow">2025 SEASON</div>
        <h1>League Analytics</h1>
        <p>
          A deeper look at scoring strength, expected performance,
          and schedule luck.
        </p>
      </div>
    </div>
<div className="power-panel">

  <div className="power-header">
    <div>
      <div className="eyebrow">2025 FINAL</div>
      <h2>Power Rankings</h2>
      <p>
        Team strength based on all-play performance, scoring,
        recent form, and actual record.
      </p>
    </div>

    <div className="power-formula">
      40% ALL-PLAY · 30% SCORING · 20% FORM · 10% RECORD
    </div>
  </div>

  <div className="power-table">

    <div className="power-row power-heading">
  <button
    className="sort-header"
    onClick={() => handlePowerSort('powerRank')}
  >
    #{getPowerSortIndicator('powerRank')}
  </button>

  <button
    className="sort-header"
    onClick={() => handlePowerSort('team')}
  >
    TEAM{getPowerSortIndicator('team')}
  </button>

  <button
    className="sort-header"
    onClick={() => handlePowerSort('powerScore')}
  >
    POWER{getPowerSortIndicator('powerScore')}
  </button>

  <button
    className="sort-header"
    onClick={() => handlePowerSort('record')}
  >
    RECORD{getPowerSortIndicator('record')}
  </button>

  <button
    className="sort-header"
    onClick={() => handlePowerSort('allPlay')}
  >
    ALL-PLAY{getPowerSortIndicator('allPlay')}
  </button>

  <button
    className="sort-header"
    onClick={() => handlePowerSort('averagePF')}
  >
    AVG PF{getPowerSortIndicator('averagePF')}
  </button>

  <button
    className="sort-header"
    onClick={() => handlePowerSort('recentAverage')}
  >
    LAST 3{getPowerSortIndicator('recentAverage')}
  </button>
</div>

{sortedPowerRankings.map((team) => (
      <div className="power-row" key={team.team}>

       <div className="power-rank">
  {calculatedPowerRankings.findIndex(
    (item) => item.team === team.team
  ) + 1}
</div>

        <div className="team-name">
          {team.team}
        </div>

        <div>
          <span className="power-score">
            {team.powerScore.toFixed(1)}
          </span>
        </div>

        <div>
          {team.wins}-{team.losses}
        </div>

        <div>
          {team.allPlayWins}-{team.allPlayLosses}
        </div>

        <div>
          {team.averagePF.toFixed(1)}
        </div>

        <div>
          {team.recentAverage.toFixed(1)}
        </div>

      </div>
    ))}

  </div>
</div>
    <div className="analytics-summary">
      <div className="analytics-summary-card">
        <span>TOP OFFENSE</span>
        <strong>{scoringRankings[0].team}</strong>
        <small>
          {scoringRankings[0].pointsFor.toFixed(1)} PF
        </small>
      </div>

      <div className="analytics-summary-card">
        <span>BEST ALL-PLAY</span>
        <strong>{allPlayRankings[0].team}</strong>
        <small>
          {allPlayRankings[0].allPlayWins}-
          {allPlayRankings[0].allPlayLosses}
        </small>
      </div>

      <div className="analytics-summary-card">
        <span>LUCKIEST</span>
        <strong>{luckRankings[0].team}</strong>
        <small className="positive">
          +{luckRankings[0].luck.toFixed(1)} wins
        </small>
      </div>

      <div className="analytics-summary-card">
        <span>UNLUCKIEST</span>
        <strong>{luckRankings[luckRankings.length - 1].team}</strong>
        <small className="negative">
          {luckRankings[luckRankings.length - 1].luck.toFixed(1)} wins
        </small>
      </div>
    </div>

    <div className="analytics-grid">

      <div className="analytics-panel">
        <div className="analytics-panel-header analytics-panel-header-row">
  <div>
    <div className="eyebrow">SCORING</div>
    <h2>Points For</h2>
  </div>

  <div className="metric-toggle">
    <button
      className={pfMode === 'total' ? 'active' : ''}
      onClick={() => setPfMode('total')}
    >
      Total
    </button>

    <button
      className={pfMode === 'average' ? 'active' : ''}
      onClick={() => setPfMode('average')}
    >
      Average
    </button>
  </div>
</div>

        <div className="ranking-list">
          {scoringRankings.map((team, index) => (
            <div className="ranking-item" key={team.team}>
              <div className="ranking-info">
                <span className="ranking-position">
                  {index + 1}
                </span>

                <span className="ranking-team">
                  {team.team}
                </span>

               <strong>
  {pfMode === 'total'
    ? team.pointsFor.toFixed(1)
    : team.averagePF.toFixed(1)}
</strong>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                 style={{
  width: `${
    pfMode === 'total'
      ? (team.pointsFor / maxPointsFor) * 100
      : (team.averagePF /
          Math.max(...standings.map((t) => t.averagePF))) *
        100
  }%`,
}}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-panel">
        <div className="analytics-panel-header">
          <div className="eyebrow">PERFORMANCE</div>
          <h2>Expected Wins</h2>
        </div>

        <div className="ranking-list">
          {allPlayRankings.map((team, index) => (
            <div className="ranking-item" key={team.team}>
              <div className="ranking-info">
                <span className="ranking-position">
                  {index + 1}
                </span>

                <span className="ranking-team">
                  {team.team}
                </span>

                <strong>
                  {team.expectedWins.toFixed(1)}
                </strong>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${
                      (team.expectedWins / maxExpectedWins) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
<div className="analytics-panel">
 <div className="analytics-panel-header analytics-panel-header-row">
  <div>
    <div className="eyebrow">SCHEDULE</div>
    <h2>Points Against</h2>
  </div>

  <div className="metric-toggle">
    <button
      className={paMode === 'total' ? 'active' : ''}
      onClick={() => setPaMode('total')}
    >
      Total
    </button>

    <button
      className={paMode === 'average' ? 'active' : ''}
      onClick={() => setPaMode('average')}
    >
      Average
    </button>
  </div>
</div>

  <div className="ranking-list">
    {pointsAgainstRankings.map((team, index) => (
      <div className="ranking-item" key={team.team}>
        <div className="ranking-info">
          <span className="ranking-position">
            {index + 1}
          </span>

          <span className="ranking-team">
            {team.team}
          </span>

          <strong>
  {paMode === 'total'
    ? team.pointsAgainst.toFixed(1)
    : team.averagePA.toFixed(1)}
</strong>
        </div>

        <div className="bar-track">
          <div
            className="bar-fill bar-fill-danger"
            style={{
  width: `${
    paMode === 'total'
      ? (team.pointsAgainst /
          Math.max(...standings.map((t) => t.pointsAgainst))) *
        100
      : (team.averagePA / maxAveragePA) * 100
  }%`,
}}
          />
        </div>
      </div>
    ))}
  </div>
    </div>

</div>
    <div className="analytics-panel luck-panel">
      <div className="analytics-panel-header">
        <div className="eyebrow">ACTUAL WINS VS EXPECTED WINS</div>
        <h2>Luck Index</h2>
        <p>
          Positive values indicate more actual wins than expected
          from weekly scoring performance.
        </p>
      </div>

      <div className="luck-list">
        {luckRankings.map((team) => (
          <div className="luck-row" key={team.team}>

            <div className="luck-team">
              {team.team}
            </div>

            <div className="luck-chart">
              <div className="luck-center" />

              {team.luck >= 0 ? (
                <div
                  className="luck-bar luck-positive"
                  style={{
                    width: `${
                      (team.luck / maxAbsLuck) * 50
                    }%`,
                  }}
                />
              ) : (
                <div
                  className="luck-bar luck-negative"
                  style={{
                    width: `${
                      (Math.abs(team.luck) / maxAbsLuck) * 50
                    }%`,
                  }}
                />
              )}
            </div>

            <div
              className={
                team.luck >= 0
                  ? 'luck-value positive'
                  : 'luck-value negative'
              }
            >
              {team.luck > 0 ? '+' : ''}
              {team.luck.toFixed(1)}
            </div>

          </div>
        ))}
      </div>
    </div>
  </section>
)}
{page === 'history' && (
  <section>
    <div className="history-header">
      <div>
        <div className="eyebrow">CLOWNSTERS FFB</div>
        <h1>League History</h1>
        <p>
          Championships, season results, and the Clownsters record book.
        </p>
      </div>

      <div className="history-season">
        2025
      </div>
    </div>

    <div className="history-section-header">
      <div className="eyebrow">FINAL RESULTS</div>
      <h2>2025 Podium</h2>
    </div>

    <div className="history-podium">

      <div className="podium-card podium-second">
        <div className="podium-place">RUNNER-UP</div>
        <div className="podium-medal">🥈</div>
        <h2>{seasonHistory[2025].runnerUp}</h2>
      </div>

      <div className="podium-card podium-first">
        <div className="podium-place">2025 CHAMPION</div>
        <div className="podium-medal">🏆</div>
        <h2>{seasonHistory[2025].champion}</h2>
      </div>

      <div className="podium-card podium-third">
        <div className="podium-place">3RD PLACE</div>
        <div className="podium-medal">🥉</div>
        <h2>{seasonHistory[2025].thirdPlace}</h2>
      </div>

    </div>
<div className="history-section-header">
  <div className="eyebrow">REGULAR SEASON AWARDS</div>
  <h2>2025 Regular Season Awards</h2>
</div>

<div className="scoring-champion-card">
  <div>
    <span>SCORING CHAMPION</span>
    <strong>{highestScoringTeam.team}</strong>
    <div>
      {highestScoringTeam.pointsFor.toFixed(1)} points
    </div>
  </div>

  <div className="scoring-champion-icon">🏆</div>
</div>

<div className="history-section-header weekly-awards-header">
  <h2>Weekly High-Score Winners</h2>
</div>

<div className="weekly-awards">
  {weeklyAwards
    .filter((manager) => manager.wins > 0)
    .map((manager) => (
      <div className="weekly-award-card" key={manager.team}>
        <div>
          <strong>{manager.team}</strong>

          <div className="weekly-award-weeks">
            {manager.weeks
              .map(
                (result) =>
                  `W${result.week} · ${result.score.toFixed(1)}`
              )
              .join('   •   ')}
          </div>
        </div>

        <div className="weekly-award-count">
          {manager.wins}
          <span>
            {manager.wins === 1 ? ' WEEKLY WIN' : ' WEEKLY WINS'}
          </span>
        </div>
      </div>
    ))}
</div>
    <div className="history-section-header">
      <div className="eyebrow">2025 RECORD BOOK</div>
      <h2>Season Records</h2>
    </div>

    <div className="record-grid">

      

      <div className="record-card">
        <span>HIGHEST WEEK</span>
        <strong>{highestWeeklyScore.team}</strong>
        <div>
          {highestWeeklyScore.highScore.toFixed(1)}
        </div>
      </div>

      <div className="record-card">
        <span>LOWEST WEEK</span>
        <strong>{lowestWeeklyScore.team}</strong>
        <div>
          {lowestWeeklyScore.lowScore.toFixed(1)}
        </div>
      </div>

      <div className="record-card">
        <span>BEST POINT DIFFERENTIAL</span>
        <strong>{bestPointDifferential.team}</strong>
        <div
          className={
            bestPointDifferential.pointDifferential >= 0
              ? 'positive'
              : 'negative'
          }
        >
          {bestPointDifferential.pointDifferential > 0 ? '+' : ''}
          {bestPointDifferential.pointDifferential.toFixed(1)}
        </div>
      </div>

    </div>

    <div className="history-standings">
      <div className="history-section-header">
        <div className="eyebrow">REGULAR SEASON STANDINGS</div>
        <h2>2025 Regular Season</h2>
      </div>

      <div className="history-table">
        <div className="history-row history-heading">
          <div>#</div>
          <div>TEAM</div>
          <div>RECORD</div>
          <div>PF</div>
          <div>AVG</div>
          <div>ALL-PLAY</div>
          <div>xW</div>
        </div>

        {standings.map((team, index) => (
          <div className="history-row" key={team.team}>
            <div>{index + 1}</div>

            <div className="team-name">
              {team.team}
            </div>

            <div>
              {team.wins}-{team.losses}
            </div>

            <div>
              {team.pointsFor.toFixed(1)}
            </div>

            <div>
              {team.averagePF.toFixed(1)}
            </div>

            <div>
              {team.allPlayWins}-{team.allPlayLosses}
            </div>

            <div>
              {team.expectedWins.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)}
      </main>
    </div>
  )
}

export default App