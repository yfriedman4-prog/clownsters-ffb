import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWeeklyHighScoreRows } from '../src/utils/recordAnalytics.js'

const matchup = (week, home, away, a, b) => ({
  week,
  home: { managerId: home, score: a },
  away: { managerId: away, score: b },
})

test('weekly high scores count regular season only, deduplicate teams, and credit ties', () => {
  const seasons = {
    2025: {
      season: 2025, seasonStatus: 'complete', regularSeasonStartWeek: 1, regularSeasonEndWeek: 2,
      matchups: [
        matchup(1, 'a', 'b', 100, 90), matchup(1, 'c', 'd', 100, 80),
        matchup(2, 'a', 'b', 70, 120), matchup(2, 'c', 'd', 110, 100),
        matchup(3, 'a', 'b', 500, 20),
      ],
    },
    2026: {
      season: 2026, seasonStatus: 'in_progress', regularSeasonStartWeek: 1, regularSeasonEndWeek: 2,
      matchups: [matchup(1, 'a', 'b', 200, 20)],
    },
  }
  const result = buildWeeklyHighScoreRows(seasons)
  assert.equal(result.careerCounts.get('a'), 1)
  assert.equal(result.careerCounts.get('c'), 1)
  assert.equal(result.careerCounts.get('b'), 1)
  assert.equal(result.careerCounts.get('d') ?? 0, 0)
  assert.equal(result.seasonCounts.get('2025:a').weeklyHighScores, 1)
  assert.equal(result.seasonCounts.has('2026:a'), false)
})
