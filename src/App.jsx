import { useState } from 'react'
import seasonData from './data/2025.json'
import matchupData from './data/2025-matchups.json'
import { calculateStandings } from './utils/standings'
import './App.css'

function App() {
  const [page, setPage] = useState('dashboard')
  const standings = calculateStandings(seasonData, matchupData)

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
        {page !== 'dashboard' ? (
  <section className="placeholder-page">
    <div className="eyebrow">CLOWNSTERS FFB</div>

    <h1>
      {page.charAt(0).toUpperCase() + page.slice(1)}
    </h1>

    <p>
      This section is under construction.
    </p>
  </section>
) : (
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
)}
      </main>
    </div>
  )
}

export default App