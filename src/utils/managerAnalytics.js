const LEAGUE_ERAS = [
  {
    id: 'highSchool',
    label: 'High School',
    startSeason: 2006,
    endSeason: 2009,
  },
  {
    id: 'revival',
    label: 'Revival',
    startSeason: 2012,
    endSeason: 2017,
  },
  {
    id: 'modern',
    label: 'Modern',
    startSeason: 2018,
    endSeason: null,
  },
]

function getTeamTies(season, team) {
  if (team.ties != null) {
    return team.ties
  }

  return season.matchups.filter(
    (matchup) =>
      matchup.week >= season.regularSeasonStartWeek &&
      matchup.week <= season.regularSeasonEndWeek &&
      matchup.home.score === matchup.away.score &&
      (matchup.home.managerId === team.managerId ||
        matchup.away.managerId === team.managerId)
  ).length
}

function getPlayoffManagers(season) {
  return new Set(
    [...season.standings]
      .map((team) => {
        const ties = getTeamTies(season, team)
        const games = team.wins + team.losses + ties

        const winPercentage =
          games > 0
            ? (team.wins + ties * 0.5) / games
            : 0

        return {
          ...team,
          winPercentage,
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
}

function getFinish(season, managerId) {
  if (season.podium?.champion?.managerId === managerId) {
    return 1
  }

  if (season.podium?.runnerUp?.managerId === managerId) {
    return 2
  }

  if (season.podium?.thirdPlace?.managerId === managerId) {
    return 3
  }

  return null
}

function summarizeSeasons(seasons) {
  const summary = {
    seasons: seasons.length,
    wins: 0,
    losses: 0,
    ties: 0,
    games: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    playoffAppearances: 0,
    championships: 0,
    runnerUps: 0,
    thirdPlaces: 0,
    podiums: 0,
  }

  seasons.forEach((season) => {
    summary.wins += season.wins
    summary.losses += season.losses
    summary.ties += season.ties
    summary.pointsFor += season.pointsFor
    summary.pointsAgainst += season.pointsAgainst

    if (season.madePlayoffs) {
      summary.playoffAppearances += 1
    }

    if (season.finish === 1) {
      summary.championships += 1
    } else if (season.finish === 2) {
      summary.runnerUps += 1
    } else if (season.finish === 3) {
      summary.thirdPlaces += 1
    }
  })

  summary.games =
    summary.wins +
    summary.losses +
    summary.ties

  summary.podiums =
    summary.championships +
    summary.runnerUps +
    summary.thirdPlaces

  summary.pointsFor = Number(summary.pointsFor.toFixed(2))
  summary.pointsAgainst = Number(
    summary.pointsAgainst.toFixed(2)
  )

  summary.pointsPerGame =
    summary.games > 0
      ? Number(
          (summary.pointsFor / summary.games).toFixed(1)
        )
      : 0

  summary.winPercentage =
    summary.games > 0
      ? Number(
          (
            ((summary.wins + summary.ties * 0.5) /
              summary.games) *
            100
          ).toFixed(1)
        )
      : 0

  summary.playoffPercentage =
    summary.seasons > 0
      ? Number(
          (
            (summary.playoffAppearances /
              summary.seasons) *
            100
          ).toFixed(1)
        )
      : 0

  return summary
}

export function getManagerProfile(
  historicalSeasons,
  managerId
) {
  const seasons = Object.values(historicalSeasons)
    .sort((a, b) => a.season - b.season)
    .flatMap((season) => {
      const team = season.standings.find(
        (entry) => entry.managerId === managerId
      )

      if (!team) {
        return []
      }

      const seasonTeam = season.seasonTeams?.find(
        (entry) => entry.managerId === managerId
      )

      const ties = getTeamTies(season, team)
      const games = team.wins + team.losses + ties
      const playoffManagers = getPlayoffManagers(season)

      return [
        {
          season: season.season,
          teamName:
  team.teamName ??
  seasonTeam?.teamName ??
  null,

          wins: team.wins,
          losses: team.losses,
          ties,
          games,

          winPercentage:
            games > 0
              ? Number(
                  (
                    ((team.wins + ties * 0.5) /
                      games) *
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

          madePlayoffs: playoffManagers.has(managerId),
          finish: getFinish(season, managerId),
        },
      ]
    })

  if (seasons.length === 0) {
    return null
  }

  const eras = {}

  LEAGUE_ERAS.forEach((era) => {
    const eraSeasons = seasons.filter(
      (season) =>
        season.season >= era.startSeason &&
        (era.endSeason == null ||
          season.season <= era.endSeason)
    )

    eras[era.id] = {
      id: era.id,
      label: era.label,
      startSeason: era.startSeason,
      endSeason: era.endSeason,
      ...summarizeSeasons(eraSeasons),
    }
  })

  return {
    managerId,
    career: summarizeSeasons(seasons),
    eras,
    seasons: [...seasons].sort(
      (a, b) => b.season - a.season
    ),
  }
}