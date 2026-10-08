import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { getCompletedH2HMatchups, getHeadToHeadRecord, buildHeadToHeadMatrix } from '../src/utils/headToHeadAnalytics.js'
const directory = new URL('../src/data/history/seasons/', import.meta.url)
const seasons = Object.fromEntries(fs.readdirSync(directory).filter((name) => name.endsWith('.json')).map((name) => [name.slice(0, 4), JSON.parse(fs.readFileSync(new URL(name, directory)))]))
test('current season only includes completed weeks', () => {
  const games = getCompletedH2HMatchups(seasons, 2026, 2026)
  assert.ok(games.length > 0)
  assert.ok(games.every((game) => game.week <= 4))
})
test('records mirror and count games once', () => {
  const { managerIds, matrix, matchupCount } = buildHeadToHeadMatrix(seasons)
  assert.equal(matchupCount, getCompletedH2HMatchups(seasons).length)
  for (const a of managerIds) for (const b of managerIds) if (a !== b) {
    const x = matrix[a][b]; const y = matrix[b][a]
    assert.equal(x.wins, y.losses); assert.equal(x.losses, y.wins)
    assert.equal(x.ties, y.ties); assert.equal(x.games, y.games)
    assert.ok(Math.abs(x.pointDifferential + y.pointDifferential) < 1e-6)
  }
})
test('ties, filtering, empty pairs, and missing scores', () => {
  const mock = { 2020: { season: 2020, regularSeasonStartWeek: 1, regularSeasonEndWeek: 2, matchups: [
    { week: 1, home: { managerId: 'a', score: 10 }, away: { managerId: 'b', score: 10 } },
    { week: 2, home: { managerId: 'b', score: 15 }, away: { managerId: 'a', score: 5 } },
    { week: 3, home: { managerId: 'a', score: 100 }, away: { managerId: 'b', score: 0 } },
    { week: 1, home: { managerId: 'a', score: null }, away: { managerId: 'c', score: 0 } },
  ] } }
  const r = getHeadToHeadRecord(mock, 'a', 'b')
  assert.equal(r.games, 2); assert.equal(r.ties, 1); assert.equal(r.losses, 1)
  assert.equal(r.winPercentage, 0.25)
  assert.equal(getHeadToHeadRecord(mock, 'a', 'c').games, 0)
  assert.equal(getHeadToHeadRecord(mock, 'a', 'b', 2021, 2022).games, 0)
})
