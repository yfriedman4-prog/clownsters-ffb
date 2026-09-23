export function calculateStandings(seasonData, matchupData) {
  const standings = {}

  seasonData.teams.forEach((team) => {
    standings[team] = {
      team,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      allPlayWins: 0,
      allPlayLosses: 0,
      allPlayTies: 0,
    }
  })

  // Process actual weekly matchups
  matchupData.matchups.forEach((weekData) => {
    const weekIndex = weekData.week - 1

    weekData.games.forEach(([teamA, teamB]) => {
      const scoreA = seasonData.scores[teamA][weekIndex]
      const scoreB = seasonData.scores[teamB][weekIndex]

      standings[teamA].pointsFor += scoreA
      standings[teamA].pointsAgainst += scoreB

      standings[teamB].pointsFor += scoreB
      standings[teamB].pointsAgainst += scoreA

      if (scoreA > scoreB) {
        standings[teamA].wins += 1
        standings[teamB].losses += 1
      } else if (scoreB > scoreA) {
        standings[teamB].wins += 1
        standings[teamA].losses += 1
      } else {
        standings[teamA].ties += 1
        standings[teamB].ties += 1
      }
    })
  })

  // Calculate all-play records
  for (let week = 0; week < seasonData.weeks; week++) {
    const weeklyScores = seasonData.teams.map((team) => ({
      team,
      score: seasonData.scores[team][week],
    }))

   weeklyScores.forEach((teamA) => {
  weeklyScores.forEach((teamB) => {
    // Don't compare a team against itself
    if (teamA.team === teamB.team) return

    if (teamA.score > teamB.score) {
      standings[teamA.team].allPlayWins += 1
    } else if (teamA.score < teamB.score) {
      standings[teamA.team].allPlayLosses += 1
    } else {
      standings[teamA.team].allPlayTies += 1
    }
  })
})
  }

  // Calculate derived statistics
  const results = Object.values(standings).map((team) => {
    const scores = seasonData.scores[team.team]

    const gamesPlayed = team.wins + team.losses + team.ties

    const averagePF =
      gamesPlayed > 0 ? team.pointsFor / gamesPlayed : 0

    const averagePA =
      gamesPlayed > 0 ? team.pointsAgainst / gamesPlayed : 0

    const highScore = Math.max(...scores)
    const lowScore = Math.min(...scores)

    const pointDifferential =
      team.pointsFor - team.pointsAgainst

    const averageMargin =
      gamesPlayed > 0 ? pointDifferential / gamesPlayed : 0

    const expectedWins =
  (team.allPlayWins + team.allPlayTies * 0.5) /
  (seasonData.teams.length - 1)

    const luck = team.wins - expectedWins

    return {
      ...team,
      gamesPlayed,

      pointsFor: Number(team.pointsFor.toFixed(2)),
      pointsAgainst: Number(team.pointsAgainst.toFixed(2)),

      averagePF: Number(averagePF.toFixed(2)),
      averagePA: Number(averagePA.toFixed(2)),

      highScore: Number(highScore.toFixed(2)),
      lowScore: Number(lowScore.toFixed(2)),

      pointDifferential: Number(pointDifferential.toFixed(2)),
      averageMargin: Number(averageMargin.toFixed(2)),

      expectedWins: Number(expectedWins.toFixed(2)),
      luck: Number(luck.toFixed(2)),
    }
  })

// Calculate Strength of Schedule (SOS):
// average all-play win percentage of the opponents actually faced
results.forEach((team) => {
  let opponentStrengthTotal = 0
  let opponentGames = 0

  matchupData.matchups.forEach((weekData) => {
    weekData.games.forEach(([teamA, teamB]) => {
      let opponent = null

      if (teamA === team.team) {
        opponent = teamB
      } else if (teamB === team.team) {
        opponent = teamA
      }

      if (opponent) {
        const opponentResult = results.find(
          (result) => result.team === opponent
        )

      const opponentAllPlayGames =
  opponentResult.allPlayWins +
  opponentResult.allPlayLosses +
  opponentResult.allPlayTies

const opponentAllPlayWinPct =
  opponentAllPlayGames > 0
    ? (
        opponentResult.allPlayWins +
        opponentResult.allPlayTies * 0.5
      ) / opponentAllPlayGames
    : 0

        opponentStrengthTotal += opponentAllPlayWinPct
        opponentGames += 1
      }
    })
  })

  team.strengthOfSchedule =
    opponentGames > 0
      ? Number(
          (
            (opponentStrengthTotal / opponentGames) *
            100
          ).toFixed(1)
        )
      : 0
})

  // Rank by actual record, then PF
  return results.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins
    }

    return b.pointsFor - a.pointsFor
  })
}