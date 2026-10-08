export function buildScoringTrends(historicalSeasons, startYear, endYear) {
  return Object.values(historicalSeasons)
    .filter((s) => s.seasonStatus !== 'in_progress' && s.season >= startYear && s.season <= endYear)
    .sort((a, b) => a.season - b.season)
    .map((season) => {
      const totals = new Map()
      for (const game of season.matchups ?? []) {
        if (game.week < season.regularSeasonStartWeek || game.week > season.regularSeasonEndWeek) continue
        for (const side of [game.home, game.away]) {
          if (!side?.managerId || !Number.isFinite(side.score)) continue
          const previous = totals.get(side.managerId) ?? { points: 0, games: 0 }
          totals.set(side.managerId, { points: previous.points + side.score, games: previous.games + 1 })
        }
      }
      const all = [...totals.values()]
      const leaguePoints = all.reduce((sum, entry) => sum + entry.points, 0)
      const leagueGames = all.reduce((sum, entry) => sum + entry.games, 0)
      const leagueAverage = leagueGames ? leaguePoints / leagueGames : null
      return {
        season: season.season,
        leagueAverage,
        managers: Object.fromEntries([...totals].map(([id, entry]) => [id, {
          games: entry.games,
          points: entry.points,
          ppg: entry.points / entry.games,
          relative: leagueAverage ? (entry.points / entry.games / leagueAverage) * 100 : null,
        }])),
      }
    })
}
