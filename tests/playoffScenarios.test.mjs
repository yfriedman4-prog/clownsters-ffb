import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSeason } from '../src/utils/playoffs/seasonState.js'
import { rankTeams } from '../src/utils/playoffs/ranking.js'
import { simulatePlayoffs } from '../src/utils/playoffs/simulation.js'
import { activeSeason as season, remainingFixtures, week10Season } from './playoffFixtures.mjs'
test('current state reconciles scores, records and complete remaining schedule', () => {
  const state = validateSeason(season)
  const completed = season.matchups.filter(g => g.week <= season.completedThroughWeek)
  assert.equal(state.throughWeek, season.completedThroughWeek)
  assert.equal(completed.length, season.completedThroughWeek * 6)
  assert.equal(state.remaining.length, (season.regularSeasonEndWeek - season.completedThroughWeek) * 6)
  assert.deepEqual(state.remaining, remainingFixtures(season))
  assert.equal(state.teams.length, 12)
  const cents = n => Math.round(n * 100)
  for (const team of state.teams) {
    const observations = completed.flatMap(({ home, away }) =>
      home.managerId === team.managerId ? [[home.score, away.score]] :
        away.managerId === team.managerId ? [[away.score, home.score]] : []
    )
    assert.equal(observations.length, season.completedThroughWeek)
    assert.deepEqual(team.scores, observations.map(([score]) => score))
    assert.equal(team.wins, observations.filter(([pf, pa]) => pf > pa).length)
    assert.equal(team.losses, observations.filter(([pf, pa]) => pf < pa).length)
    assert.equal(team.wins + team.losses, season.completedThroughWeek)
    assert.equal(cents(team.pointsFor), observations.reduce((sum, [pf]) => sum + cents(pf), 0))
    assert.equal(cents(team.pointsAgainst), observations.reduce((sum, [, pa]) => sum + cents(pa), 0))
  }
  const expectedOrder = season.standings.toSorted((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
  assert.deepEqual(rankTeams(state.teams).map(t => t.managerId), expectedOrder.map(t => t.managerId))
})
test('invalid scores, records, identities and schedule are rejected; future placeholders ignored', () => {
  for (const mutate of [s => s.matchups.pop(), s => {s.matchups[0].home.score = null}, s => {s.matchups[0].home.score = Infinity}, s => {s.standings[0].pointsFor++}, s => {s.matchups[0].home.managerId = 'unknown'}, s => {s.matchups[0].home.managerId = s.matchups[0].away.managerId}, s => {s.standings[0].managerId = s.standings[1].managerId}]) {
    const copy = structuredClone(season); mutate(copy); assert.throws(() => validateSeason(copy))
  }
  const copy = structuredClone(season); copy.matchups.find(g => g.week === season.completedThroughWeek + 1).home.score = null
  assert.deepEqual(validateSeason(copy), validateSeason(season))
  copy.matchups[0].home.score = copy.matchups[0].away.score
  assert.throws(() => validateSeason(copy), /tie requires/)
})
test('ranking applies wins then PF and preserves unresolved seed ranges across berth and bye boundaries', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ managerId: String(i), wins: 12 - i, pointsFor: 100 }))
  rows[2].wins = rows[1].wins; rows[6].wins = rows[5].wins
  const ranked = rankTeams(rows)
  assert.equal(ranked[1].seedMin, 2); assert.equal(ranked[1].seedMax, 3)
  assert.equal(ranked[5].seedMin, 6); assert.equal(ranked[5].seedMax, 7)
  const before = JSON.stringify(rows); rankTeams(rows); assert.equal(JSON.stringify(rows), before)
  assert.equal(rankTeams([{ managerId: 'a', wins: 1, pointsFor: 100 }, { managerId: 'b', wins: 1, pointsFor: 101 }])[0].managerId, 'b')
})
test('seeded simulations reproduce results, preserve inputs, and conserve berths, byes and seeds', () => {
  const season = week10Season
  const original = JSON.stringify(season)
  const a = simulatePlayoffs(season, { iterations: 1000, seed: 42 })
  assert.deepEqual(a, simulatePlayoffs(season, { iterations: 1000, seed: 42 }))
  assert.notDeepEqual(a.results, simulatePlayoffs(season, { iterations: 1000, seed: 43 }).results)
  assert.equal(JSON.stringify(season), original)
  const sum = key => a.results.reduce((total, t) => total + t[key], 0)
  assert.ok(sum('playoffLower') <= 6 + 1e-9 && sum('playoffUpper') >= 6 - 1e-9)
  assert.ok(sum('byeLower') <= 2 + 1e-9 && sum('byeUpper') >= 2 - 1e-9)
  for (let i = 0; i < 12; i++) assert.ok(Math.abs(a.results.reduce((n, t) => n + t.seedLower[i], 0) - 1) < 1e-9)
  for (const t of a.results) {
    assert.ok(t.playoffLower >= 0 && t.playoffUpper <= 1)
    assert.ok(t.byeUpper <= t.playoffUpper)
    assert.ok(Math.abs(t.seedLower.slice(0, 6).reduce((a,b) => a+b,0) - t.playoffLower) < 1e-9)
    assert.ok(Math.abs(t.seedLower.slice(0, 2).reduce((a,b) => a+b,0) - t.byeLower) < 1e-9)
    const current = season.standings.find(s => s.managerId === t.managerId)
    assert.ok(t.expectedWins >= current.wins && t.expectedWins <= current.wins + 4)
  }
  assert.equal(a.metadata.iterations, 1000); assert.equal(a.metadata.seed, 42)
})
test('completed season with exact PF ties bounds qualification, byes and seed distribution without arbitrary winners', () => {
  const tied = structuredClone(season)
  tied.completedThroughWeek = 14
  // Equal final records/PF for all teams; weekly winners alternate by team partition.
  const ids = tied.seasonTeams.map(t => t.managerId)
  for (let week = 1; week <= 14; week++) {
    const games = tied.matchups.filter(g => g.week === week)
    for (let i = 0; i < 6; i++) games[i] = Object.assign(games[i], { home: {managerId: ids[i], score: week % 2 ? 100 : 50}, away: {managerId: ids[i+6], score: week % 2 ? 50 : 100} })
  }
  tied.standings = ids.map(managerId => ({managerId, wins: 7, losses: 7, pointsFor: 1050, pointsAgainst: 1050}))
  const result = simulatePlayoffs(tied, { iterations: 2 })
  assert.equal(result.metadata.unresolvedTiebreakFrequency, 1)
  for (const t of result.results) {
    assert.equal(t.playoffLower, 0); assert.equal(t.playoffUpper, 1)
    assert.equal(t.byeLower, 0); assert.equal(t.byeUpper, 1)
    assert.deepEqual(t.seedLower, Array(12).fill(0)); assert.deepEqual(t.seedUpper, Array(12).fill(1))
    assert.equal(t.expectedSeedMin, 1); assert.equal(t.expectedSeedMax, 12)
  }
})
test('simulation options are validated', () => {
  for (const iterations of [0, -1, 1.5, 100001]) assert.throws(() => simulatePlayoffs(season, {iterations}))
  assert.throws(() => simulatePlayoffs(season, {seed: -1}))
})
