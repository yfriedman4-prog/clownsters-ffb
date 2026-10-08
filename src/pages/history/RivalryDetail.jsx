import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts'
import { useMemo } from 'react'
import { getRivalryDetails } from '../../utils/headToHeadAnalytics'

const points = (value) => Number(value).toFixed(2)

export default function RivalryDetail({ managerId, opponentId, historicalSeasons, getManagerName, onBack }) {
  const rivalry = useMemo(() => getRivalryDetails(historicalSeasons, managerId, opponentId), [historicalSeasons, managerId, opponentId])
  const momentum = rivalry.cumulative.map((game, index) => ({ meeting: index + 1, season: game.season, week: game.week, winPct: Number((game.winPercentage * 100).toFixed(1)) }))
  const seasons = rivalry.seasons.map((season) => ({ season: String(season.season), wins: season.wins, losses: season.losses, ties: season.ties }))
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
      <section className="rivalry-visuals" aria-label="Rivalry historical charts">
        <div className="rivalry-chart-card">
          <div className="eyebrow">RIVALRY MOMENTUM</div>
          <h2>Cumulative Win Percentage</h2>
          <p>Win percentage after each completed meeting for {getManagerName(managerId)}. Ties count as half a win.</p>
          {momentum.length ? <div className="rivalry-chart-frame"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={momentum} margin={{ top: 12, right: 14, left: 4, bottom: 8 }}>
              <CartesianGrid stroke="#34445a" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="meeting" stroke="#aab7ca" tickLine={false} label={{ value: 'Meeting', position: 'insideBottom', offset: -5, fill: '#aab7ca' }} />
              <YAxis domain={[0, 100]} stroke="#aab7ca" tickFormatter={(value) => `${value}%`} tickLine={false} />
              <Tooltip contentStyle={{ background: '#182438', border: '1px solid #52627a', borderRadius: 8, color: '#f1f5f9' }} formatter={(value) => [`${value}%`, 'Win percentage']} labelFormatter={(meeting) => { const game = momentum[Number(meeting) - 1]; return game ? `Meeting ${meeting} · ${game.season} Week ${game.week}` : `Meeting ${meeting}` }} />
              <Line type="monotone" dataKey="winPct" stroke="#39d6b0" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Win %" />
            </LineChart>
          </ResponsiveContainer></div> : <p>No completed meetings to chart.</p>}
        </div>
        <div className="rivalry-chart-card">
          <div className="eyebrow">SEASON BY SEASON</div>
          <h2>Results by Season</h2>
          <p>Wins, losses and ties from {getManagerName(managerId)}'s perspective.</p>
          {seasons.length ? <div className="rivalry-chart-scroll"><div className="rivalry-chart-frame" style={{ minWidth: Math.max(300, seasons.length * 48) }}><ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasons} margin={{ top: 12, right: 12, left: -28, bottom: 8 }}>
              <CartesianGrid stroke="#34445a" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="season" stroke="#aab7ca" tickLine={false} />
              <YAxis allowDecimals={false} stroke="#aab7ca" tickLine={false} />
              <Tooltip contentStyle={{ background: '#182438', border: '1px solid #52627a', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend verticalAlign="top" height={28} />
              <Bar dataKey="wins" name="Wins" fill="#39d6b0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="losses" name="Losses" fill="#ef7878" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ties" name="Ties" fill="#e4ba65" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div></div> : <p>No completed seasons to chart.</p>}
        </div>
      </section>
      <div className="history-profile-section-heading"><div><div className="eyebrow">GAME LOG</div><h2>Matchup History</h2></div><span>{rivalry.games} completed meetings</span></div>
      {rivalry.matchups.length ? <div className="rivalry-games" role="table" aria-label="Rivalry matchup history">
        <div className="rivalry-game rivalry-game-header" role="row"><span role="columnheader">Season / Week</span><span role="columnheader">{getManagerName(managerId)}</span><span role="columnheader">{getManagerName(opponentId)}</span><span role="columnheader">Result</span><span role="columnheader">Margin</span></div>
        {[...rivalry.matchups].reverse().map((game, index) => <div className="rivalry-game" role="row" key={`${game.season}-${game.week}-${index}`}><span role="cell">{game.season} · Week {game.week}</span><span role="cell">{points(game.pointsFor)}</span><span role="cell">{points(game.pointsAgainst)}</span><span role="cell"><b className={`rivalry-result rivalry-result-${game.result.toLowerCase()}`}>{game.result}</b></span><span role="cell">{game.margin > 0 ? '+' : ''}{points(game.margin)}</span></div>)}
      </div> : <p>No completed meetings found for these managers.</p>}
    </section>
  )
}
