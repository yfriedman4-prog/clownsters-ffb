import { useMemo } from 'react'
import { getCompletedH2HMatchups } from '../../utils/headToHeadAnalytics'

export default function HeadToHeadCards({ managerId, historicalSeasons, getManagerName, onSelectRivalry }) {
  const opponents = useMemo(() => {
    const records = new Map()
    for (const game of getCompletedH2HMatchups(historicalSeasons)) {
      const isHome = game.home.managerId === managerId
      if (!isHome && game.away.managerId !== managerId) continue
      const opponentId = isHome ? game.away.managerId : game.home.managerId
      const scored = isHome ? game.home.score : game.away.score
      const allowed = isHome ? game.away.score : game.home.score
      const r = records.get(opponentId) ?? { opponentId, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, games: 0 }
      r.games++
      r.pointsFor += scored
      r.pointsAgainst += allowed
      if (scored > allowed) r.wins++
      else if (scored < allowed) r.losses++
      else r.ties++
      records.set(opponentId, r)
    }
    return [...records.values()].map(r => ({ ...r, winPercentage: (r.wins + 0.5 * r.ties) / r.games, differential: r.pointsFor - r.pointsAgainst }))
      .sort((a, b) => b.winPercentage - a.winPercentage || b.games - a.games || getManagerName(a.opponentId).localeCompare(getManagerName(b.opponentId)))
  }, [historicalSeasons, managerId, getManagerName])

  return (
    <section className="history-profile-h2h" aria-label="Head-to-head records">
      <div className="history-profile-section-heading">
        <div><div className="eyebrow">RIVALRIES</div><h2>Head-to-Head Records</h2></div>
        <span className="h2h-cards-sort">Sorted by win percentage</span>
      </div>
      <p className="h2h-cards-note">Regular-season meetings, including completed 2026 weeks. Ties count as half a win.</p>
      {opponents.length ? <div className="h2h-opponent-grid">
        {opponents.map(r => <article className="h2h-opponent-card" key={r.opponentId}>
          <button type="button" className="h2h-opponent-open" onClick={() => onSelectRivalry?.(r.opponentId)} aria-label={`View rivalry with ${getManagerName(r.opponentId)}`}>View rivalry →</button>
          <h3>{getManagerName(r.opponentId)}</h3>
          <div className="h2h-opponent-record"><strong>{r.wins}–{r.losses}–{r.ties}</strong><span>{(r.winPercentage * 100).toFixed(1)}%</span></div>
          <div className="h2h-opponent-bar" role="img" aria-label={`${r.wins} wins, ${r.losses} losses, ${r.ties} ties`}>
            <span className="h2h-opponent-wins" style={{ width: `${100 * r.wins / r.games}%` }} />
            <span className="h2h-opponent-ties" style={{ width: `${100 * r.ties / r.games}%` }} />
            <span className="h2h-opponent-losses" style={{ width: `${100 * r.losses / r.games}%` }} />
          </div>
          <div className="h2h-opponent-meta"><span>{r.games} {r.games === 1 ? 'meeting' : 'meetings'}</span><span className={r.differential > 0 ? 'h2h-diff-positive' : r.differential < 0 ? 'h2h-diff-negative' : ''}>Diff: {r.differential > 0 ? '+' : ''}{r.differential.toFixed(2)} pts</span></div>
        </article>)}
      </div> : <p>No completed head-to-head matchups available.</p>}
    </section>
  )
}
