import test from 'node:test'
import assert from 'node:assert/strict'
import { getRivalryDetails } from '../src/utils/headToHeadAnalytics.js'
const match = (week, home, away, a, b) => ({ week, home: { managerId: home, score: a }, away: { managerId: away, score: b } })
const seasons = {
  2024: { season: 2024, regularSeasonStartWeek: 1, regularSeasonEndWeek: 14, matchups: [
    match(1, 'a', 'b', 100, 90), match(3, 'b', 'a', 80, 90), match(5, 'a', 'b', 95, 95),
  ] },
  2026: { season: 2026, seasonStatus: 'in_progress', completedThroughWeek: 2, regularSeasonStartWeek: 1, regularSeasonEndWeek: 14, matchups: [
    match(1, 'b', 'a', 110, 100), match(2, 'a', 'b', 101, 99), match(3, 'a', 'b', 999, 0),
  ] },
}
test('chronological results, seasonal aggregates, and excludes future weeks', () => {
  const r = getRivalryDetails(seasons, 'a', 'b')
  assert.equal(r.games, 5)
  assert.deepEqual(r.matchups.map(m => m.result), ['W', 'W', 'T', 'L', 'W'])
  assert.equal(r.seasons.length, 2)
  assert.deepEqual(r.seasons.map(s => s.games), [3, 2])
  assert.equal(r.seasons[0].pointDifferential, 20)
  assert.equal(r.matchups[4].cumulativeWinPercentage, 0.7)
  assert.equal(r.currentStreak.managerId, 'a')
  assert.equal(r.currentStreak.length, 1)
  assert.equal(r.longestStreak.managerId, 'a')
  assert.equal(r.longestStreak.length, 2)
})
test('reverse manager perspective and year filters', () => {
  const a = getRivalryDetails(seasons, 'a', 'b', 2026, 2026)
  const b = getRivalryDetails(seasons, 'b', 'a', 2026, 2026)
  assert.deepEqual(a.matchups.map(m => m.result), ['L', 'W'])
  assert.deepEqual(b.matchups.map(m => m.result), ['W', 'L'])
  assert.equal(a.pointDifferential, -b.pointDifferential)
  assert.equal(a.seasons[0].pointDifferential, -b.seasons[0].pointDifferential)
})
test('empty rivalry has safe neutral streaks and no timeline', () => {
  const r = getRivalryDetails(seasons, 'a', 'missing')
  assert.equal(r.games, 0)
  assert.deepEqual(r.seasons, [])
  assert.deepEqual(r.cumulative, [])
  assert.equal(r.currentStreak.length, 0)
  assert.equal(r.longestStreak.length, 0)
})
