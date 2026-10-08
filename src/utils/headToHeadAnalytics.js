/** Pure historical head-to-head analytics. No React or team-name dependencies. */
export function getCompletedH2HMatchups(historicalSeasons, startSeason = -Infinity, endSeason = Infinity) {
  return Object.values(historicalSeasons ?? {})
    .filter((season) => season && season.season >= startSeason && season.season <= endSeason)
    .flatMap((season) => {
      const first = season.regularSeasonStartWeek ?? 1
      const last = season.regularSeasonEndWeek ?? Infinity
      const completed = season.seasonStatus === 'in_progress'
        ? (season.completedThroughWeek ?? 0)
        : Infinity
      return (season.matchups ?? [])
        .filter((match) => match.week >= first && match.week <= last && match.week <= completed)
        .filter((match) => match.home?.managerId && match.away?.managerId &&
          match.home.managerId !== match.away.managerId &&
          Number.isFinite(match.home.score) && Number.isFinite(match.away.score))
        .map((match) => ({ season: season.season, week: match.week,
          home: { ...match.home }, away: { ...match.away } }))
    })
    .sort((a, b) => a.season - b.season || a.week - b.week)
}

function summarize(managerId, opponentId, games) {
  let wins = 0; let losses = 0; let ties = 0; let pointsFor = 0; let pointsAgainst = 0
  let biggestWin = null; let closestMatchup = null
  for (const game of games) {
    const home = game.home.managerId === managerId
    const scored = home ? game.home.score : game.away.score
    const conceded = home ? game.away.score : game.home.score
    const margin = scored - conceded
    pointsFor += scored; pointsAgainst += conceded
    if (margin > 0) { wins++; if (!biggestWin || margin > biggestWin.margin) biggestWin = { ...game, margin } }
    else if (margin < 0) losses++
    else ties++
    if (!closestMatchup || Math.abs(margin) < closestMatchup.absoluteMargin) {
      closestMatchup = { ...game, absoluteMargin: Math.abs(margin), margin }
    }
  }
  const total = games.length
  return { managerId, opponentId, games: total, wins, losses, ties,
    winPercentage: total ? (wins + ties * 0.5) / total : null,
    pointsFor, pointsAgainst, pointDifferential: pointsFor - pointsAgainst,
    averageMargin: total ? (pointsFor - pointsAgainst) / total : null,
    biggestWin, closestMatchup }
}

export function getHeadToHeadRecord(historicalSeasons, managerId, opponentId, startSeason = -Infinity, endSeason = Infinity) {
  const games = managerId && opponentId && managerId !== opponentId
    ? getCompletedH2HMatchups(historicalSeasons, startSeason, endSeason).filter((game) =>
      (game.home.managerId === managerId && game.away.managerId === opponentId) ||
      (game.home.managerId === opponentId && game.away.managerId === managerId))
    : []
  return { ...summarize(managerId, opponentId, games), matchups: games }
}

export function buildHeadToHeadMatrix(historicalSeasons, startSeason = -Infinity, endSeason = Infinity) {
  const games = getCompletedH2HMatchups(historicalSeasons, startSeason, endSeason)
  const ids = [...new Set(games.flatMap((game) => [game.home.managerId, game.away.managerId]))].sort()
  const matrix = Object.fromEntries(ids.map((id) => [id, {}]))
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]; const b = ids[j]
      const paired = games.filter((game) =>
        (game.home.managerId === a && game.away.managerId === b) ||
        (game.home.managerId === b && game.away.managerId === a))
      matrix[a][b] = summarize(a, b, paired)
      matrix[b][a] = summarize(b, a, paired)
    }
  }
  return { managerIds: ids, matrix, matchupCount: games.length }
}

/** Detailed rivalry timeline from the first manager's perspective. */
export function getRivalryDetails(historicalSeasons, managerId, opponentId, startSeason = -Infinity, endSeason = Infinity) {
  const record = getHeadToHeadRecord(historicalSeasons, managerId, opponentId, startSeason, endSeason)
  let wins = 0; let losses = 0; let ties = 0
  let activeWinner = null; let activeLength = 0
  let longestStreak = { managerId: null, length: 0, start: null, end: null }
  let streakStart = null
  const bySeason = new Map()
  const matchups = record.matchups.map((game) => {
    const isHome = game.home.managerId === managerId
    const pointsFor = isHome ? game.home.score : game.away.score
    const pointsAgainst = isHome ? game.away.score : game.home.score
    const margin = pointsFor - pointsAgainst
    const result = margin > 0 ? 'W' : margin < 0 ? 'L' : 'T'
    const winnerId = result === 'W' ? managerId : result === 'L' ? opponentId : null
    if (result === 'W') wins++
    else if (result === 'L') losses++
    else ties++
    const entry = { season: game.season, week: game.week, pointsFor, pointsAgainst, margin, result,
      winnerId, homeManagerId: game.home.managerId, awayManagerId: game.away.managerId,
      cumulativeWins: wins, cumulativeLosses: losses, cumulativeTies: ties,
      cumulativeWinPercentage: (wins + ties * 0.5) / (wins + losses + ties) }
    if (!bySeason.has(game.season)) bySeason.set(game.season, { season: game.season, games: 0, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 })
    const season = bySeason.get(game.season)
    season.games++; season.pointsFor += pointsFor; season.pointsAgainst += pointsAgainst
    if (result === 'W') season.wins++
    else if (result === 'L') season.losses++
    else season.ties++
    if (winnerId === null) { activeWinner = null; activeLength = 0; streakStart = null }
    else {
      if (activeWinner === winnerId) activeLength++
      else { activeWinner = winnerId; activeLength = 1; streakStart = { season: game.season, week: game.week } }
      if (activeLength > longestStreak.length) longestStreak = { managerId: winnerId, length: activeLength, start: streakStart, end: { season: game.season, week: game.week } }
    }
    return entry
  })
  const seasons = [...bySeason.values()].map((season) => ({ ...season,
    pointDifferential: season.pointsFor - season.pointsAgainst,
    winPercentage: (season.wins + season.ties * 0.5) / season.games }))
  return { ...record, matchups, seasons, cumulative: matchups.map(({ season, week, cumulativeWins, cumulativeLosses, cumulativeTies, cumulativeWinPercentage }) =>
    ({ season, week, wins: cumulativeWins, losses: cumulativeLosses, ties: cumulativeTies, winPercentage: cumulativeWinPercentage })),
    longestStreak, currentStreak: { managerId: activeWinner, length: activeLength } }
}
