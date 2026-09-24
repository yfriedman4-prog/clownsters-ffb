import fs from 'node:fs'

const season = Number(process.argv[2])

if (!season) {
  console.error('Usage: node scripts/history/validate-season.mjs <season>')
  process.exit(1)
}

const file = `src/data/history/seasons/${season}.json`
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

const calculated = {}

for (const team of data.seasonTeams) {
  calculated[team.managerId] = {
    managerId: team.managerId,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  }
}

const regularSeasonMatchups = data.matchups.filter(
  (matchup) => matchup.week <= data.regularSeasonWeeks
)

for (const matchup of regularSeasonMatchups) {
  const home = calculated[matchup.home.managerId]
  const away = calculated[matchup.away.managerId]

  home.pointsFor += matchup.home.score
  home.pointsAgainst += matchup.away.score

  away.pointsFor += matchup.away.score
  away.pointsAgainst += matchup.home.score

  if (matchup.home.score > matchup.away.score) {
    home.wins++
    away.losses++
  } else if (matchup.away.score > matchup.home.score) {
    away.wins++
    home.losses++
  }
}

let failures = 0

for (const expected of data.standings) {
  const actual = calculated[expected.managerId]

  const checks = {
    wins: actual.wins === expected.wins,
    losses: actual.losses === expected.losses,
    pointsFor:
      Number(actual.pointsFor.toFixed(2)) === expected.pointsFor,
    pointsAgainst:
      Number(actual.pointsAgainst.toFixed(2)) === expected.pointsAgainst,
  }

  const passed = Object.values(checks).every(Boolean)

  if (!passed) failures++

  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${expected.managerId.padEnd(12)} ` +
    `${actual.wins}-${actual.losses} ` +
    `PF ${actual.pointsFor.toFixed(2)} ` +
    `PA ${actual.pointsAgainst.toFixed(2)}`
  )
}

console.log('')
console.log(`Regular-season matchups: ${regularSeasonMatchups.length}`)
console.log(`Validation failures: ${failures}`)

if (failures > 0) {
  process.exit(1)
}

console.log(`Season ${season} validation PASSED`)
