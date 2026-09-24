import fs from 'node:fs'
import path from 'node:path'

const season = Number(process.argv[2])
const sourceYear = Number(process.argv[3] || season)

if (!season) {
  console.error(
    'Usage: node scripts/history/import-frb.mjs <season> [source-year]'
  )
  process.exit(1)
}

const sourceDir = path.resolve(`data-import/frb/${sourceYear}`)
const outputDir = path.resolve('src/data/history/seasons')
const managersPath = path.resolve('src/data/history/managers.json')
const hiddenMappingsPath = path.resolve(
  'src/data/history/frb-hidden-mappings.json'
)

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  values.push(current)
  return values
}

function readCsv(filename) {
  const fullPath = path.join(sourceDir, filename)

  const lines = fs
    .readFileSync(fullPath, 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)

  const headers = parseCsvLine(lines[0])

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ''])
    )
  })
}

function findFile(prefix) {
  const filename = fs
    .readdirSync(sourceDir)
    .find((name) => name.startsWith(prefix) && name.endsWith('.csv'))

  if (!filename) {
    throw new Error(`Missing ${prefix} CSV in ${sourceDir}`)
  }

  return filename
}

const managerRegistry = JSON.parse(
  fs.readFileSync(managersPath, 'utf8')
).managers
const hiddenMappings = JSON.parse(
  fs.readFileSync(hiddenMappingsPath, 'utf8')
).mappings
const aliasMap = new Map()

for (const manager of managerRegistry) {
  for (const alias of manager.aliases) {
    aliasMap.set(alias.toLowerCase(), manager.id)
  }
}

function resolveManager(sourceName, teamName, recordSeason = season) {
  if (sourceName === '--Hidden--') {
    const mapping = hiddenMappings.find(
      (item) =>
        item.season === recordSeason &&
        item.teamName === teamName
    )

    if (!mapping) {
      throw new Error(
        `Unresolved hidden manager: ${recordSeason} / "${teamName}"`
      )
    }

    return mapping.managerId
  }

  const managerId = aliasMap.get(sourceName.toLowerCase())

  if (!managerId) {
    throw new Error(
      `Unresolved manager "${sourceName}". Add an alias to managers.json before importing.`
    )
  }

  return managerId
}

const teamsRows = readCsv(findFile('FRB_teams_'))
const standingsRows = readCsv(findFile('FRB_standings_'))
const matchupRows = readCsv(findFile('FRB_matchups_'))
const championshipRows = readCsv(findFile('FRB_championships_'))

const seasonTeams = teamsRows
  .filter((row) =>
    row['Seasons Active']
      .split(',')
      .map((value) => value.trim())
      .includes(String(season))
  )
  .map((row) => ({
    managerId: resolveManager(row['Owner Name'], row['Team Name'], season),
    sourceManagerName: row['Owner Name'],
    teamName: row['Team Name'],
    sourceOwnerId: row['Platform Owner ID'] || null,
  }))

const standings = standingsRows
  .filter((row) => Number(row['Season Year']) === season)
  .map((row) => ({
    rank: Number(row['Rank']),
    managerId: resolveManager(row['Owner Name'], row['Team Name'], season),
    sourceManagerName: row['Owner Name'],
    teamName: row['Team Name'],
    wins: Number(row['Wins']),
    losses: Number(row['Losses']),
    pointsFor: Number(row['Points For']),
    pointsAgainst: Number(row['Points Against']),
  }))
  .sort((a, b) => a.rank - b.rank)

const matchups = matchupRows
  .filter((row) => Number(row['Season Year']) === season)
  .map((row) => ({
    week: Number(row['Week Number']),
    home: {
      managerId: resolveManager(row['Home Owner'], row['Home Team'], season),
      sourceManagerName: row['Home Owner'],
      teamName: row['Home Team'],
      score: Number(row['Home Score']),
    },
    away: {
      managerId: resolveManager(row['Away Owner'], row['Away Team'], season),
      sourceManagerName: row['Away Owner'],
      teamName: row['Away Team'],
      score: Number(row['Away Score']),
    },
  }))

const championshipRow = championshipRows.find(
  (row) => Number(row['Season Year']) === season
)

if (!championshipRow) {
  throw new Error(`No championship record found for ${season}`)
}

const podium = {
  champion: {
    managerId: resolveManager(
      championshipRow['1st Place Owner'],
      championshipRow['1st Place Team'],
      season
    ),
    sourceManagerName: championshipRow['1st Place Owner'],
    teamName: championshipRow['1st Place Team'],
  },
  runnerUp: {
    managerId: resolveManager(
      championshipRow['2nd Place Owner'],
      championshipRow['2nd Place Team'],
      season
    ),
    sourceManagerName: championshipRow['2nd Place Owner'],
    teamName: championshipRow['2nd Place Team'],
  },
  thirdPlace: {
    managerId: resolveManager(
      championshipRow['3rd Place Owner'],
      championshipRow['3rd Place Team'],
      season
    ),
    sourceManagerName: championshipRow['3rd Place Owner'],
    teamName: championshipRow['3rd Place Team'],
  },
}

const regularSeasonWeeks = Math.max(
  ...standings.map((standing) => standing.wins + standing.losses)
)

const normalized = {
  season,
  source: {
    provider: 'Fantasy Record Book',
    importedFrom: 'FRB CSV export',
  },
  regularSeasonWeeks,
  seasonTeams,
  standings,
  matchups,
  podium,
}

fs.mkdirSync(outputDir, { recursive: true })

const outputPath = path.join(outputDir, `${season}.json`)

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(normalized, null, 2)}\n`
)

console.log(`Imported ${season}`)
console.log(`Season teams: ${seasonTeams.length}`)
console.log(`Standings: ${standings.length}`)
console.log(`Matchups: ${matchups.length}`)
console.log(`Regular-season weeks: ${regularSeasonWeeks}`)
console.log(`Output: ${outputPath}`)
