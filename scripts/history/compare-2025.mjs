import fs from 'node:fs'

const dashboard = JSON.parse(
  fs.readFileSync('src/data/2025.json', 'utf8')
)

const dashboardMatchups = JSON.parse(
  fs.readFileSync('src/data/2025-matchups.json', 'utf8')
)

const history = JSON.parse(
  fs.readFileSync('src/data/history/seasons/2025.json', 'utf8')
)

const managers = JSON.parse(
  fs.readFileSync('src/data/history/managers.json', 'utf8')
).managers

const displayName = new Map(
  managers.map(manager => [manager.id, manager.displayName])
)

let failures = 0

console.log('===== TEAM SET =====')

const dashboardTeams = [...dashboard.teams].sort()
const historyTeams = history.seasonTeams
  .map(team => displayName.get(team.managerId))
  .sort()

const teamSetMatches =
  JSON.stringify(dashboardTeams) === JSON.stringify(historyTeams)

console.log(
  `${teamSetMatches ? 'PASS' : 'FAIL'} dashboard and FRB manager sets`
)

if (!teamSetMatches) {
  failures++
  console.log('Dashboard:', dashboardTeams)
  console.log('FRB:', historyTeams)
}

console.log('')
console.log('===== WEEKLY SCORES =====')

for (const team of dashboard.teams) {
  const historyScores = history.matchups
    .filter(matchup => matchup.week <= history.regularSeasonWeeks)
    .filter(
      matchup =>
        displayName.get(matchup.home.managerId) === team ||
        displayName.get(matchup.away.managerId) === team
    )
    .sort((a, b) => a.week - b.week)
    .map(matchup =>
      displayName.get(matchup.home.managerId) === team
        ? matchup.home.score
        : matchup.away.score
    )

  const dashboardScores = dashboard.scores[team]

  const matches =
    JSON.stringify(historyScores) === JSON.stringify(dashboardScores)

  console.log(
    `${matches ? 'PASS' : 'FAIL'} ${team} — ${historyScores.length} weeks`
  )

  if (!matches) {
    failures++
    console.log('  Dashboard:', dashboardScores)
    console.log('  FRB:      ', historyScores)
  }
}

console.log('')
console.log('===== MATCHUP SCHEDULE =====')

for (const weekData of dashboardMatchups.matchups) {
  const frbWeek = history.matchups.filter(
    matchup => matchup.week === weekData.week
  )

  const frbPairs = frbWeek.map(matchup =>
    [
      displayName.get(matchup.home.managerId),
      displayName.get(matchup.away.managerId),
    ]
      .sort()
      .join('|')
  )

  const dashboardPairs = weekData.games.map(game =>
    [...game].sort().join('|')
  )

  const matches =
    frbPairs.length === dashboardPairs.length &&
    dashboardPairs.every(pair => frbPairs.includes(pair))

  console.log(
    `${matches ? 'PASS' : 'FAIL'} Week ${weekData.week} — ` +
    `${dashboardPairs.length} games`
  )

  if (!matches) {
    failures++
    console.log('  Dashboard:', dashboardPairs.sort())
    console.log('  FRB:      ', frbPairs.sort())
  }
}

console.log('')
console.log(`Cross-validation failures: ${failures}`)

if (failures > 0) {
  process.exit(1)
}

console.log('2025 dashboard ↔ FRB cross-validation PASSED')
