export function calculateStandings(seasonData, matchupData) {
  const standings = {}

  // Create an empty record for every team
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
    }
  })

  // Process each week's matchups
  matchupData.matchups.forEach((weekData) => {
    const scoreIndex = weekData.week - 1

    weekData.games.forEach(([teamA, teamB]) => {
      const scoreA = seasonData.scores[teamA][scoreIndex]
      const scoreB = seasonData.scores[teamB][scoreIndex]

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
// Calculate all-play record:
// How many other teams would each team have beaten each week?
for (let week = 0; week < seasonData.weeks; week++) {
  const weeklyScores = seasonData.teams.map((team) => ({
    team,
    score: seasonData.scores[team][week],
  }))

  weeklyScores.forEach((teamA) => {
    weeklyScores.forEach((teamB) => {
      if (teamA.team === teamB.team) return

      if (teamA.score > teamB.score) {
        standings[teamA.team].allPlayWins += 1
      } else if (teamA.score < teamB.score) {
        standings[teamA.team].allPlayLosses += 1
      }
    })
  })
}
  // Convert to an array and rank by record, then Points For
  return Object.values(standings)
    .map((team) => ({
      ...team,
      pointsFor: Number(team.pointsFor.toFixed(2)),
      pointsAgainst: Number(team.pointsAgainst.toFixed(2)),
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins
      }

      return b.pointsFor - a.pointsFor
    })
}