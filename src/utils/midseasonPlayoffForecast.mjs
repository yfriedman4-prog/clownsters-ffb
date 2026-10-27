/** Frozen Week 7 playoff forecast. No live-season imports or side effects. */
export function seededRandom(seed = 202607) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function normal(random) {
  const u = Math.max(Number.EPSILON, random())
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random())
}

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length

export function forecastPlayoffs(snapshot, { iterations = 20000, playoffSpots = 6, seed = 202607 } = {}) {
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error('iterations must be a positive integer')
  const throughWeek = snapshot.throughWeek
  const rows = snapshot.standings
  const names = rows.map((row) => row.teamName)
  if (new Set(names).size !== names.length) throw new Error('Duplicate team names')
  if (!Number.isInteger(playoffSpots) || playoffSpots < 1 || playoffSpots > names.length) throw new Error('Invalid playoffSpots')
  const nameSet = new Set(names)
  const past = snapshot.matchups.filter((game) => game.week <= throughWeek)
  const future = snapshot.matchups.filter((game) => game.week > throughWeek)
  const scores = Object.fromEntries(names.map((name) => [name, []]))
  for (const game of past) {
    for (const side of [game.home, game.away]) {
      if (!nameSet.has(side.teamName) || !Number.isFinite(side.score)) throw new Error('Invalid completed matchup')
      scores[side.teamName].push({ week: game.week, score: side.score })
    }
  }
  for (const name of names) {
    const weeks = scores[name].map((x) => x.week)
    if (weeks.length !== throughWeek || new Set(weeks).size !== throughWeek) throw new Error(`Incomplete historical scores: ${name}`)
    scores[name].sort((a, b) => a.week - b.week)
  }
  for (const game of future) {
    if (!nameSet.has(game.home.teamName) || !nameSet.has(game.away.teamName) || game.home.teamName === game.away.teamName) throw new Error('Invalid future matchup')
  }
  const scoring = Object.fromEntries(names.map((name) => {
    const values = scores[name].map((x) => x.score)
    const overall = mean(values)
    const recent = mean(values.slice(-4))
    const expected = 0.7 * overall + 0.3 * recent
    const sampleVariance = values.reduce((sum, value) => sum + (value - overall) ** 2, 0) / Math.max(1, values.length - 1)
    // Minimum 12-point weekly volatility avoids false certainty from seven observations.
    return [name, { expected, sd: Math.max(12, Math.sqrt(sampleVariance)) }]
  }))
  const outcomes = Object.fromEntries(names.map((name) => [name, { playoffs: 0, first: 0, totalWins: 0, totalRank: 0, ranks: Array(names.length).fill(0) }]))
  const random = seededRandom(seed)
  for (let iteration = 0; iteration < iterations; iteration++) {
    const results = Object.fromEntries(rows.map((row) => [row.teamName, { name: row.teamName, wins: row.wins, losses: row.losses, pointsFor: row.pointsFor }]))
    for (const game of future) {
      const home = results[game.home.teamName]
      const away = results[game.away.teamName]
      const homeScore = Math.max(0, scoring[home.name].expected + scoring[home.name].sd * normal(random))
      const awayScore = Math.max(0, scoring[away.name].expected + scoring[away.name].sd * normal(random))
      home.pointsFor += homeScore
      away.pointsFor += awayScore
      if (homeScore > awayScore) home.wins += 1, away.losses += 1
      else if (awayScore > homeScore) away.wins += 1, home.losses += 1
      // Exact ties are extremely unlikely; they do not award a win.
    }
    const sorted = Object.values(results).sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor || a.name.localeCompare(b.name))
    sorted.forEach((team, index) => {
      const item = outcomes[team.name]
      item.playoffs += Number(index < playoffSpots)
      item.first += Number(index === 0)
      item.totalWins += team.wins
      item.totalRank += index + 1
      item.ranks[index] += 1
    })
  }
  return rows.map((row) => ({
    teamName: row.teamName,
    currentWins: row.wins,
    currentLosses: row.losses,
    projectedWins: outcomes[row.teamName].totalWins / iterations,
    expectedFinish: outcomes[row.teamName].totalRank / iterations,
    playoffProbability: outcomes[row.teamName].playoffs / iterations,
    firstPlaceProbability: outcomes[row.teamName].first / iterations,
    rankProbabilities: outcomes[row.teamName].ranks.map((count) => count / iterations),
    scoringMean: scoring[row.teamName].expected,
    scoringSD: scoring[row.teamName].sd,
  })).sort((a, b) => b.playoffProbability - a.playoffProbability || b.projectedWins - a.projectedWins)
}
