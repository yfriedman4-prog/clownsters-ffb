import { useState } from 'react'
import seasonData from './data/2025.json'
import matchupData from './data/2025-matchups.json'
import { calculateStandings } from './utils/standings'
import './App.css'

function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedWeek, setSelectedWeek] = useState(1)
  const standings = calculateStandings(seasonData, matchupData)
  const selectedWeekData = matchupData.matchups.find(
  (week) => week.week === selectedWeek
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
page !== 'matchups' ? (
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
      </main>
    </div>
  )
}

export default App