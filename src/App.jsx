import { useState } from 'react'
import seasonData from './data/2025.json'
import matchupData from './data/2025-matchups.json'
import { calculateStandings } from './utils/standings'
import './App.css'

function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedTeam, setSelectedTeam] = useState(null)
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
      onClick={() => setPage(id)}
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
page !== 'teams' ? (
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
        <div>#</div>
        <div>TEAM</div>
        <div>RECORD</div>
        <div>PF</div>
        <div>PA</div>
        <div>AVG</div>
        <div>DIFF</div>
        <div>ALL-PLAY</div>
        <div>xW</div>
        <div>LUCK</div>
        <div>SOS</div>
      </div>

      {standings.map((team, index) => (
        <div className="full-row" key={team.team}>
          <div className="rank">{index + 1}</div>

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

          <div>{team.strengthOfSchedule.toFixed(1)}</div>
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
      </main>
    </div>
  )
}

export default App