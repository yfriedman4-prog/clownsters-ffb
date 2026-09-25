function SeasonHistory({
  activeSeason,
  activeHistoricalSeason,
  getManagerName,
}) {
  const historicalRegularSeasonMatchups =
    activeHistoricalSeason.matchups.filter(
      (matchup) =>
        matchup.week >= activeHistoricalSeason.regularSeasonStartWeek &&
        matchup.week <= activeHistoricalSeason.regularSeasonEndWeek
    )

  const historicalScoringChampion =
    [...activeHistoricalSeason.standings].sort(
      (a, b) => b.pointsFor - a.pointsFor
    )[0]

  const historicalRegularSeasonScores =
    historicalRegularSeasonMatchups.flatMap((matchup) => [
      {
        ...matchup.home,
        week: matchup.week,
      },
      {
        ...matchup.away,
        week: matchup.week,
      },
    ])

  const historicalExpectedWins = {}

  activeHistoricalSeason.standings.forEach((team) => {
    historicalExpectedWins[team.managerId] = {
      allPlayWins: 0,
      allPlayLosses: 0,
      allPlayTies: 0,
    }
  })

  for (
    let week = activeHistoricalSeason.regularSeasonStartWeek;
    week <= activeHistoricalSeason.regularSeasonEndWeek;
    week++
  ) {
    const weekScores = historicalRegularSeasonScores.filter(
      (team) => team.week === week
    )

    weekScores.forEach((teamA) => {
      weekScores.forEach((teamB) => {
        if (teamA.managerId === teamB.managerId) return

        if (teamA.score > teamB.score) {
          historicalExpectedWins[teamA.managerId].allPlayWins += 1
        } else if (teamA.score < teamB.score) {
          historicalExpectedWins[teamA.managerId].allPlayLosses += 1
        } else {
          historicalExpectedWins[teamA.managerId].allPlayTies += 1
        }
      })
    })
  }

  const historicalTeamCount =
    activeHistoricalSeason.standings.length

  Object.values(historicalExpectedWins).forEach((team) => {
    team.expectedWins =
      (team.allPlayWins + team.allPlayTies * 0.5) /
      (historicalTeamCount - 1)
  })

  const historicalWeeklyAwards = {}

  for (
    let week = activeHistoricalSeason.regularSeasonStartWeek;
    week <= activeHistoricalSeason.regularSeasonEndWeek;
    week++
  ) {
    const weekMatchups = historicalRegularSeasonMatchups.filter(
      (matchup) => matchup.week === week
    )

    const weekTeams = weekMatchups.flatMap((matchup) => [
      matchup.home,
      matchup.away,
    ])

    if (weekTeams.length === 0) continue

    const highestScore = Math.max(
      ...weekTeams.map((team) => team.score)
    )

    weekTeams
      .filter((team) => team.score === highestScore)
      .forEach((team) => {
        if (!historicalWeeklyAwards[team.managerId]) {
          historicalWeeklyAwards[team.managerId] = {
            managerId: team.managerId,
            teamName: team.teamName,
            wins: 0,
            weeks: [],
          }
        }

        historicalWeeklyAwards[team.managerId].wins += 1
        historicalWeeklyAwards[team.managerId].weeks.push({
          week,
          score: team.score,
        })
      })
  }

  const historicalWeeklyAwardLeaders = Object.values(
    historicalWeeklyAwards
  ).sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins
    }

    return getManagerName(a.managerId).localeCompare(
      getManagerName(b.managerId)
    )
  })

  const historicalHighestWeek =
    [...historicalRegularSeasonScores].sort(
      (a, b) => b.score - a.score
    )[0]

  const historicalLowestWeek =
    [...historicalRegularSeasonScores].sort(
      (a, b) => a.score - b.score
    )[0]

  const historicalBestPointDifferential =
    [...activeHistoricalSeason.standings]
      .map((team) => ({
        ...team,
        pointDifferential:
          team.pointsFor - team.pointsAgainst,
      }))
      .sort(
        (a, b) =>
          b.pointDifferential - a.pointDifferential
      )[0]

  return (
    <section>
      <div className="history-header">
        <div>
          <div className="eyebrow">CLOWNSTERS FFB</div>
          <h1>League History</h1>
          <p>
            Championships, season results, and the Clownsters record book.
          </p>
        </div>

        <div className="history-season">
          {activeSeason}
        </div>
      </div>

      <div className="history-section-header">
        <div className="eyebrow">FINAL RESULTS</div>
        <h2>{activeSeason} Podium</h2>
      </div>

      <div className="history-podium">
        <div className="podium-card podium-second">
          <div className="podium-place">RUNNER-UP</div>
          <div className="podium-medal">🥈</div>
          <h2>{activeHistoricalSeason.podium.runnerUp.teamName}</h2>
          <div>
            {getManagerName(
              activeHistoricalSeason.podium.runnerUp.managerId
            )}
          </div>
        </div>

        <div className="podium-card podium-first">
          <div className="podium-place">
            {activeSeason} CHAMPION
          </div>
          <div className="podium-medal">🏆</div>
          <h2>{activeHistoricalSeason.podium.champion.teamName}</h2>
          <div>
            {getManagerName(
              activeHistoricalSeason.podium.champion.managerId
            )}
          </div>
        </div>

        <div className="podium-card podium-third">
          <div className="podium-place">3RD PLACE</div>
          <div className="podium-medal">🥉</div>
          <h2>{activeHistoricalSeason.podium.thirdPlace.teamName}</h2>
          <div>
            {getManagerName(
              activeHistoricalSeason.podium.thirdPlace.managerId
            )}
          </div>
        </div>
      </div>

      <div className="history-section-header">
        <div className="eyebrow">REGULAR SEASON AWARDS</div>
        <h2>{activeSeason} Regular Season Awards</h2>
      </div>

      <div className="scoring-champion-card">
        <div>
          <span>SCORING CHAMPION</span>

          <strong>
            {historicalScoringChampion.teamName}
          </strong>

          <div>
            {getManagerName(historicalScoringChampion.managerId)}
          </div>

          <div>
            {historicalScoringChampion.pointsFor.toFixed(1)} points
          </div>
        </div>

        <div className="scoring-champion-icon">🏆</div>
      </div>

      <div className="history-section-header weekly-awards-header">
        <h2>Weekly High-Score Winners</h2>
      </div>

      <div className="weekly-awards">
        {historicalWeeklyAwardLeaders.map((manager) => (
          <div
            className="weekly-award-card"
            key={manager.managerId}
          >
            <div>
              <strong>{manager.teamName}</strong>

              <div>
                {getManagerName(manager.managerId)}
              </div>

              <div className="weekly-award-weeks">
                {manager.weeks
                  .map(
                    (result) =>
                      `W${result.week} · ${result.score.toFixed(1)}`
                  )
                  .join('   •   ')}
              </div>
            </div>

            <div className="weekly-award-count">
              {manager.wins}
              <span>
                {manager.wins === 1
                  ? ' WEEKLY WIN'
                  : ' WEEKLY WINS'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="history-section-header">
        <div className="eyebrow">
          {activeSeason} RECORD BOOK
        </div>
        <h2>Season Records</h2>
      </div>

      <div className="record-grid">
        <div className="record-card">
          <span>HIGHEST WEEK</span>
          <strong>{historicalHighestWeek.teamName}</strong>
          <div>
            {getManagerName(historicalHighestWeek.managerId)}
          </div>
          <div>
            {historicalHighestWeek.score.toFixed(1)} · W
            {historicalHighestWeek.week}
          </div>
        </div>

        <div className="record-card">
          <span>LOWEST WEEK</span>
          <strong>{historicalLowestWeek.teamName}</strong>
          <div>
            {getManagerName(historicalLowestWeek.managerId)}
          </div>
          <div>
            {historicalLowestWeek.score.toFixed(1)} · W
            {historicalLowestWeek.week}
          </div>
        </div>

        <div className="record-card">
          <span>BEST POINT DIFFERENTIAL</span>
          <strong>
            {historicalBestPointDifferential.teamName}
          </strong>
          <div>
            {getManagerName(
              historicalBestPointDifferential.managerId
            )}
          </div>
          <div
            className={
              historicalBestPointDifferential.pointDifferential >= 0
                ? 'positive'
                : 'negative'
            }
          >
            {historicalBestPointDifferential.pointDifferential > 0
              ? '+'
              : ''}
            {historicalBestPointDifferential.pointDifferential.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="history-standings">
        <div className="history-section-header">
          <div className="eyebrow">
            REGULAR SEASON STANDINGS
          </div>
          <h2>{activeSeason} Regular Season</h2>
        </div>

        <div className="history-table">
          <div className="history-row history-heading">
            <div>#</div>
            <div>TEAM</div>
            <div>MANAGER</div>
            <div>RECORD</div>
            <div>PF</div>
            <div>PA</div>
            <div>xW</div>
          </div>

          {[...activeHistoricalSeason.standings]
            .sort((a, b) => a.rank - b.rank)
            .map((team) => (
              <div
                className="history-row"
                key={team.managerId}
              >
                <div>{team.rank}</div>

                <div className="team-name">
                  {team.teamName}
                </div>

                <div>
                  {getManagerName(team.managerId)}
                </div>

                <div>
                  {team.wins}-{team.losses}
                </div>

                <div>
                  {team.pointsFor.toFixed(1)}
                </div>

                <div>
                  {team.pointsAgainst.toFixed(1)}
                </div>

                <div>
                  {historicalExpectedWins[
                    team.managerId
                  ].expectedWins.toFixed(1)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}

export default SeasonHistory