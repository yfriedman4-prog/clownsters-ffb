import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { forecastPlayoffs } from '../src/utils/midseasonPlayoffForecast.mjs'

const snapshot = JSON.parse(readFileSync(new URL('../src/data/midseason/2026-week7.json', import.meta.url), 'utf8'))

test('frozen snapshot is complete: 12 teams, seven completed weeks, seven future weeks', () => {
  assert.equal(snapshot.throughWeek, 7)
  assert.equal(snapshot.standings.length, 12)
  assert.equal(snapshot.matchups.filter((game) => game.week <= 7).length, 42)
  assert.equal(snapshot.matchups.filter((game) => game.week > 7).length, 42)
})

test('forecast is reproducible, probabilities conserve six playoff spots', () => {
  const first = forecastPlayoffs(snapshot, { iterations: 1000, seed: 42 })
  const second = forecastPlayoffs(snapshot, { iterations: 1000, seed: 42 })
  assert.deepEqual(first, second)
  assert.equal(first.length, 12)
  assert.ok(Math.abs(first.reduce((sum, row) => sum + row.playoffProbability, 0) - 6) < 1e-9)
  assert.ok(Math.abs(first.reduce((sum, row) => sum + row.firstPlaceProbability, 0) - 1) < 1e-9)
  for (const row of first) {
    assert.ok(row.playoffProbability >= 0 && row.playoffProbability <= 1)
    assert.ok(Math.abs(row.rankProbabilities.reduce((a, b) => a + b, 0) - 1) < 1e-9)
    assert.ok(row.projectedWins >= row.currentWins)
    assert.ok(row.projectedWins <= row.currentWins + 7)
  }
})

test('forecast does not mutate snapshot', () => {
  const original = JSON.stringify(snapshot)
  forecastPlayoffs(snapshot, { iterations: 50 })
  assert.equal(JSON.stringify(snapshot), original)
})
