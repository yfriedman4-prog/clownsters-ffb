export function aggregateHistory(
  historicalSeasons,
  startSeason,
  endSeason
) {
  const selectedSeasons = Object.values(historicalSeasons)
    .filter(
      (season) =>
        season.season >= startSeason &&
        season.season <= endSeason
    )
    .sort((a, b) => a.season - b.season)

  const managers = {}

  selectedSeasons.forEach((season) => {
    season.standings.forEach((team) => {
      if (!managers[team.managerId]) {
        managers[team.managerId] = {
          managerId: team.managerId,
          seasons: 0,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          championships: 0,
          runnerUps: 0,
          thirdPlaces: 0,
        }
      }

      const manager = managers[team.managerId]

      manager.seasons += 1
      manager.wins += team.wins
      manager.losses += team.losses
      manager.pointsFor += team.pointsFor
      manager.pointsAgainst += team.pointsAgainst
    })

    const championId = season.podium.champion.managerId
    const runnerUpId = season.podium.runnerUp.managerId
    const thirdPlaceId = season.podium.thirdPlace.managerId

    if (managers[championId]) {
      managers[championId].championships += 1
    }

    if (managers[runnerUpId]) {
      managers[runnerUpId].runnerUps += 1
    }

    if (managers[thirdPlaceId]) {
      managers[thirdPlaceId].thirdPlaces += 1
    }
  })

  const managerStats = Object.values(managers).map((manager) => {
    const games = manager.wins + manager.losses

    return {
      ...manager,
      pointsFor: Number(manager.pointsFor.toFixed(2)),
      pointsAgainst: Number(manager.pointsAgainst.toFixed(2)),
      winPercentage:
        games > 0
          ? Number(((manager.wins / games) * 100).toFixed(1))
          : 0,
    }
  })

  return {
    startSeason,
    endSeason,
    seasons: selectedSeasons,
    seasonCount: selectedSeasons.length,
    managers: managerStats,
  }
}