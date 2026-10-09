function getTeamTies(season, team) {
  if (team.ties != null) {
    return team.ties
  }

  return (season.matchups ?? []).filter(
    (matchup) =>
      matchup.week >= season.regularSeasonStartWeek &&
      matchup.week <= season.regularSeasonEndWeek &&
      matchup.home.score === matchup.away.score &&
      (
        matchup.home.managerId === team.managerId ||
        matchup.away.managerId === team.managerId
      )
  ).length
}

export function buildSeasonRecordRows(historicalSeasons) {
  return Object.values(historicalSeasons)
    .sort((a, b) => a.season - b.season)
    .flatMap((season) =>
      (season.standings ?? []).map((team) => {
        const ties = getTeamTies(season, team)

        const games =
          team.wins +
          team.losses +
          ties

        return {
          season: season.season,
          managerId: team.managerId,
          teamName: team.teamName ?? null,

          wins: team.wins,
          losses: team.losses,
          ties,
          games,

          winPercentage:
            games > 0
              ? Number(
                  (
                    ((team.wins + ties * 0.5) / games) *
                    100
                  ).toFixed(1)
                )
              : 0,

          pointsFor: Number(team.pointsFor.toFixed(2)),
          pointsAgainst: Number(
            team.pointsAgainst.toFixed(2)
          ),

          pointsPerGame:
            games > 0
              ? Number(
                  (team.pointsFor / games).toFixed(1)
                )
              : 0,
        }
      })
    )
}

export function buildGameRecordRows(historicalSeasons) {
  return Object.values(historicalSeasons)
    .sort((a, b) => a.season - b.season)
    .flatMap((season) =>
      (season.matchups ?? [])
        .filter(
          (matchup) =>
            matchup.week >= season.regularSeasonStartWeek &&
            matchup.week <= season.regularSeasonEndWeek
        )
        .flatMap((matchup) => {
          const homeMargin =
            matchup.home.score - matchup.away.score

          const awayMargin = -homeMargin

          return [
            {
              season: season.season,
              week: matchup.week,
              managerId: matchup.home.managerId,
              teamName: matchup.home.teamName ?? null,
              opponentManagerId: matchup.away.managerId,
              opponentTeamName:
                matchup.away.teamName ?? null,
              score: matchup.home.score,
              opponentScore: matchup.away.score,
              margin: Number(homeMargin.toFixed(2)),
            },
            {
              season: season.season,
              week: matchup.week,
              managerId: matchup.away.managerId,
              teamName: matchup.away.teamName ?? null,
              opponentManagerId: matchup.home.managerId,
              opponentTeamName:
                matchup.home.teamName ?? null,
              score: matchup.away.score,
              opponentScore: matchup.home.score,
              margin: Number(awayMargin.toFixed(2)),
            },
          ]
        })
    )
}
function getExtremeRows(rows, field, direction = 'max') {
  if (rows.length === 0) {
    return []
  }

  const values = rows.map((row) => row[field])

  const extreme =
    direction === 'min'
      ? Math.min(...values)
      : Math.max(...values)

  return rows.filter((row) => row[field] === extreme)
}
function rankRows(
  rows,
  field,
  direction = 'max',
  limit = 10
) {
  const sorted = [...rows].sort((a, b) => {
    const difference =
      direction === 'min'
        ? a[field] - b[field]
        : b[field] - a[field]

    if (difference !== 0) {
      return difference
    }

    if (
      a.season != null &&
      b.season != null &&
      a.season !== b.season
    ) {
      return b.season - a.season
    }

    if (
      a.week != null &&
      b.week != null &&
      a.week !== b.week
    ) {
      return b.week - a.week
    }

    return String(a.managerId).localeCompare(
      String(b.managerId)
    )
  })

  if (sorted.length <= limit) {
    return sorted
  }

  const cutoffValue = sorted[limit - 1][field]

  return sorted.filter((row, index) =>
    index < limit || row[field] === cutoffValue
  )
}

function rankWinningMargins(
  gameRows,
  direction = 'max',
  limit = 10
) {
  return rankRows(
    gameRows.filter((game) => game.margin > 0),
    'margin',
    direction,
    limit
  )
}

function buildCareerRows(
  seasonRows,
  historicalSeasons
) {
  const managers = new Map()

  seasonRows.forEach((row) => {
    if (!managers.has(row.managerId)) {
      managers.set(row.managerId, {
        managerId: row.managerId,
        seasons: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        games: 0,
        pointsFor: 0,
        playoffAppearances: 0,
        championships: 0,
        runnerUps: 0,
        thirdPlaces: 0,
      })
    }

    const manager = managers.get(row.managerId)

    manager.seasons += 1
    manager.wins += row.wins
    manager.losses += row.losses
    manager.ties += row.ties
    manager.games += row.games
    manager.pointsFor += row.pointsFor
  })

  Object.values(historicalSeasons).forEach((season) => {
    const playoffManagers = new Set(
      [...(season.standings ?? [])]
        .map((team) => {
          const ties = getTeamTies(season, team)
          const games = team.wins + team.losses + ties

          return {
            ...team,
            winPercentage:
              games > 0
                ? (team.wins + ties * 0.5) / games
                : 0,
          }
        })
        .sort((a, b) => {
          if (b.winPercentage !== a.winPercentage) {
            return b.winPercentage - a.winPercentage
          }

          return b.pointsFor - a.pointsFor
        })
        .slice(0, 6)
        .map((team) => team.managerId)
    )

    playoffManagers.forEach((managerId) => {
      const manager = managers.get(managerId)

      if (manager) {
        manager.playoffAppearances += 1
      }
    })

    const podiumFields = [
      ['champion', 'championships'],
      ['runnerUp', 'runnerUps'],
      ['thirdPlace', 'thirdPlaces'],
    ]

    podiumFields.forEach(([podiumField, careerField]) => {
      const managerId =
        season.podium?.[podiumField]?.managerId

      const manager = managers.get(managerId)

      if (manager) {
        manager[careerField] += 1
      }
    })
  })

  return [...managers.values()].map((manager) => {
    const podiums =
      manager.championships +
      manager.runnerUps +
      manager.thirdPlaces

    return {
      ...manager,

      podiums,

      pointsFor: Number(
        manager.pointsFor.toFixed(2)
      ),

      winPercentage:
        manager.games > 0
          ? Number(
              (
                (
                  (manager.wins +
                    manager.ties * 0.5) /
                  manager.games
                ) * 100
              ).toFixed(1)
            )
          : 0,

      pointsPerGame:
        manager.games > 0
          ? Number(
              (
                manager.pointsFor /
                manager.games
              ).toFixed(1)
            )
          : 0,
    }
  })
}

export function buildWeeklyHighScoreRows(historicalSeasons) {
  const seasonCounts = new Map()
  const careerCounts = new Map()

  Object.values(historicalSeasons)
    .filter((season) => season.seasonStatus !== 'in_progress')
    .forEach((season) => {
      const weeks = new Map()
      for (const matchup of season.matchups ?? []) {
        if (matchup.week < season.regularSeasonStartWeek ||
            matchup.week > season.regularSeasonEndWeek) continue
        if (!weeks.has(matchup.week)) weeks.set(matchup.week, new Map())
        const teams = weeks.get(matchup.week)
        for (const side of [matchup.home, matchup.away]) {
          if (!side?.managerId || !Number.isFinite(side.score)) continue
          teams.set(side.managerId, {
            managerId: side.managerId,
            teamName: side.teamName ?? null,
            score: side.score,
          })
        }
      }
      for (const teams of weeks.values()) {
        if (!teams.size) continue
        const highest = Math.max(...[...teams.values()].map((team) => team.score))
        for (const team of teams.values()) {
          if (team.score !== highest) continue
          const key = `${season.season}:${team.managerId}`
          const current = seasonCounts.get(key) ?? {
            season: season.season,
            managerId: team.managerId,
            teamName: team.teamName,
            weeklyHighScores: 0,
          }
          current.weeklyHighScores += 1
          seasonCounts.set(key, current)
          careerCounts.set(team.managerId, (careerCounts.get(team.managerId) ?? 0) + 1)
        }
      }
    })

  return { seasonCounts, careerCounts }
}

export function buildRecordBook(historicalSeasons) {
  const seasonRows =
    buildSeasonRecordRows(historicalSeasons)

  const gameRows =
    buildGameRecordRows(historicalSeasons)

  const careerRows =
    buildCareerRows(
      seasonRows,
      historicalSeasons
    )

  const weeklyHighScores = buildWeeklyHighScoreRows(historicalSeasons)
  const weeklySeasonRows = seasonRows.map((row) => ({
    ...row,
    weeklyHighScores: weeklyHighScores.seasonCounts.get(`${row.season}:${row.managerId}`)?.weeklyHighScores ?? 0,
  }))
  const weeklyCareerRows = careerRows.map((row) => ({
    ...row,
    weeklyHighScores: weeklyHighScores.careerCounts.get(row.managerId) ?? 0,
  }))

  const careerRateEligible =
    careerRows.filter(
      (manager) => manager.seasons >= 3
    )

  const winningGames =
    gameRows.filter((game) => game.margin > 0)

  return {
    career: {
      weeklyHighScores: getExtremeRows(weeklyCareerRows, 'weeklyHighScores'),
      wins: getExtremeRows(
        careerRows,
        'wins'
      ),

      winPercentage: getExtremeRows(
        careerRateEligible,
        'winPercentage'
      ),

      pointsFor: getExtremeRows(
        careerRows,
        'pointsFor'
      ),

      pointsPerGame: getExtremeRows(
        careerRateEligible,
        'pointsPerGame'
      ),

      championships: getExtremeRows(
        careerRows,
        'championships'
      ),

      playoffAppearances: getExtremeRows(
        careerRows,
        'playoffAppearances'
      ),

      podiums: getExtremeRows(
        careerRows,
        'podiums'
      ),
    },

    season: {
      weeklyHighScores: getExtremeRows(weeklySeasonRows, 'weeklyHighScores'),
      wins: getExtremeRows(
        seasonRows,
        'wins'
      ),

      winPercentage: getExtremeRows(
        seasonRows,
        'winPercentage'
      ),

      pointsFor: getExtremeRows(
        seasonRows,
        'pointsFor'
      ),

      pointsPerGame: getExtremeRows(
        seasonRows,
        'pointsPerGame'
      ),

      lowestPointsFor: getExtremeRows(
        seasonRows,
        'pointsFor',
        'min'
      ),

      pointsAgainst: getExtremeRows(
        seasonRows,
        'pointsAgainst'
      ),

      lowestPointsAgainst: getExtremeRows(
        seasonRows,
        'pointsAgainst',
        'min'
      ),
    },

    game: {
      highestScore: getExtremeRows(
        gameRows,
        'score'
      ),

      lowestScore: getExtremeRows(
        gameRows,
        'score',
        'min'
      ),

      largestVictory: getExtremeRows(
        winningGames,
        'margin'
      ),

      closestVictory: getExtremeRows(
        winningGames,
        'margin',
        'min'
      ),
    },
    leaderboards: {
  career: {
    weeklyHighScores: rankRows(weeklyCareerRows, 'weeklyHighScores'),
    wins: rankRows(
      careerRows,
      'wins'
    ),

    winPercentage: rankRows(
      careerRateEligible,
      'winPercentage'
    ),

    pointsFor: rankRows(
      careerRows,
      'pointsFor'
    ),

    pointsPerGame: rankRows(
      careerRateEligible,
      'pointsPerGame'
    ),

    championships: rankRows(
      careerRows,
      'championships'
    ),

    playoffAppearances: rankRows(
      careerRows,
      'playoffAppearances'
    ),

    podiums: rankRows(
      careerRows,
      'podiums'
    ),
  },

  season: {
    weeklyHighScores: rankRows(weeklySeasonRows, 'weeklyHighScores'),
    wins: rankRows(
      seasonRows,
      'wins'
    ),

    winPercentage: rankRows(
      seasonRows,
      'winPercentage'
    ),

    pointsFor: rankRows(
      seasonRows,
      'pointsFor'
    ),

    pointsPerGame: rankRows(
      seasonRows,
      'pointsPerGame'
    ),
  },

  game: {
    highestScore: rankRows(
      gameRows,
      'score'
    ),

    lowestScore: rankRows(
      gameRows,
      'score',
      'min'
    ),

    largestVictory: rankWinningMargins(
      gameRows
    ),

    closestVictory: rankWinningMargins(
      gameRows,
      'min'
    ),
  },
},

    metadata: {
      careerRateMinimumSeasons: 3,
      seasonRows: seasonRows.length,
      gameRows: gameRows.length,
    },
  }
}