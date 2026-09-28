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
          ties: 0,
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
      const standingsTies = team.ties

if (standingsTies != null) {
  manager.ties += standingsTies
} else {
  const regularSeasonMatchups = season.matchups.filter(
    (matchup) =>
      matchup.week >= season.regularSeasonStartWeek &&
      matchup.week <= season.regularSeasonEndWeek
  )

  const derivedTies = regularSeasonMatchups.filter(
    (matchup) =>
      matchup.home.managerId === team.managerId ||
      matchup.away.managerId === team.managerId
  ).filter(
    (matchup) =>
      matchup.home.score === matchup.away.score
  ).length

  manager.ties += derivedTies
}
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
  const games =
  manager.wins +
  manager.losses +
  manager.ties
  const podiums =
    manager.championships +
    manager.runnerUps +
    manager.thirdPlaces

return {
  ...manager,
  games,
  podiums,
  pointsFor: Number(manager.pointsFor.toFixed(2)),
  pointsAgainst: Number(manager.pointsAgainst.toFixed(2)),
  pointsPerGame:
    games > 0
      ? Number((manager.pointsFor / games).toFixed(1))
      : 0,
 winPercentage:
  games > 0
    ? Number(
        (
          ((manager.wins + manager.ties * 0.5) / games) *
          100
        ).toFixed(1)
      )
    : 0,
}
})

const maxWins = Math.max(
  ...managerStats.map((manager) => manager.wins)
)

const maxChampionships = Math.max(
  ...managerStats.map((manager) => manager.championships)
)

const maxSeasons = Math.max(
  ...managerStats.map((manager) => manager.seasons)
)

const maxPodiums = Math.max(
  ...managerStats.map((manager) => manager.podiums)
)
const minimumWinPctSeasons = Math.min(
  3,
  selectedSeasons.length
)

const winPctEligibleManagers = managerStats.filter(
  (manager) =>
    manager.seasons >= minimumWinPctSeasons
)

const maxWinPercentage = Math.max(
  ...winPctEligibleManagers.map(
    (manager) => manager.winPercentage
  )
)
const leaders = {
  wins: managerStats
    .filter((manager) => manager.wins === maxWins)
    .sort((a, b) => b.winPercentage - a.winPercentage),

  championships: managerStats
    .filter(
      (manager) =>
        manager.championships === maxChampionships
    )
    .sort((a, b) => b.wins - a.wins),

  seasons: managerStats
    .filter((manager) => manager.seasons === maxSeasons)
    .sort((a, b) => b.wins - a.wins),

  podiums: managerStats
    .filter((manager) => manager.podiums === maxPodiums)
    .sort((a, b) => b.championships - a.championships),
    winPercentage: winPctEligibleManagers
  .filter(
    (manager) =>
      manager.winPercentage === maxWinPercentage
  )
  .sort((a, b) => b.wins - a.wins),
}

return {
  startSeason,
  endSeason,
  seasons: selectedSeasons,
  seasonCount: selectedSeasons.length,
  managers: managerStats,
  leaders,
  minimumWinPctSeasons,
}
}