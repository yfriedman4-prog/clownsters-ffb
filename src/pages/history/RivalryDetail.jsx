import { useMemo } from 'react'
import { getRivalryDetails } from '../../utils/headToHeadAnalytics'

const points = (value) => Number(value).toFixed(2)

export default function RivalryDetail({ managerId, opponentId, historicalSeasons, getManagerName, onBack }) {
  const rivalry = useMemo(() => getRivalryDetails(historicalSeasons, managerId, opponentId), [historicalSeasons, managerId, opponentId])
  const stats = [
    ['Record', `${rivalry.wins}–${rivalry.losses}–${rivalry.ties}`],
    ['Win percentage', rivalry.winPercentage == null ? '—' : `${(rivalry.winPercentage * 100).toFixed(1)}%`],
    ['Meetings', rivalry.games],
    ['Points scored', points(rivalry.pointsFor)],
    ['Points allowed', points(rivalry.pointsAgainst)],
    ['Point differential', `${rivalry.pointDifferential > 0 ? '+' : ''}${points(rivalry.pointDifferential)}`],
  ]
  return (
    <section className="panel rivalry-detail">
      <button type="button" className="rivalry-back" onClick={onBack}>← Back to {getManagerName(managerId)}'s profile</button>
      <header className="rivalry-heading">
        <div className="eyebrow">LEAGUE HISTORY / RIVALRIES</div>
        <h1>{getManagerName(managerId)} <span>vs.</span> {getManagerName(opponentId)}</h1>
        <p>All completed regular-season meetings, including played weeks of the current season. Statistics are shown from {getManagerName(managerId)}'s perspective.</p>
      </header>
      <div className="rivalry-stats">{stats.map(([label, value]) => <div className="rivalry-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="history-profile-section-heading"><div><div className="eyebrow">GAME LOG</div><h2>Matchup History</h2></div><span>{rivalry.games} completed meetings</span></div>
      {rivalry.matchups.length ? <div className="rivalry-games" role="table" aria-label="Rivalry matchup history">
        <div className="rivalry-game rivalry-game-header" role="row"><span role="columnheader">Season / Week</span><span role="columnheader">{getManagerName(managerId)}</span><span role="columnheader">{getManagerName(opponentId)}</span><span role="columnheader">Result</span><span role="columnheader">Margin</span></div>
        {[...rivalry.matchups].reverse().map((game, index) => <div className="rivalry-game" role="row" key={`${game.season}-${game.week}-${index}`}><span role="cell">{game.season} · Week {game.week}</span><span role="cell">{points(game.pointsFor)}</span><span role="cell">{points(game.pointsAgainst)}</span><span role="cell"><b className={`rivalry-result rivalry-result-${game.result.toLowerCase()}`}>{game.result}</b></span><span role="cell">{game.margin > 0 ? '+' : ''}{points(game.margin)}</span></div>)}
      </div> : <p>No completed meetings found for these managers.</p>}
    </section>
  )
}
