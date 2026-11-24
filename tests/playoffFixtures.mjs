import fs from 'node:fs'

export const activeSeason = JSON.parse(
  fs.readFileSync(new URL('../src/data/history/seasons/2026.json', import.meta.url))
)

// Production snapshot at 89d3810, before the Week 11 import.
export const week10Season = JSON.parse(
  fs.readFileSync(new URL('./fixtures/2026-week10.json', import.meta.url))
)

export function remainingFixtures(season) {
  return season.matchups
    .filter(game => game.week > season.completedThroughWeek)
    .map(({ week, home, away }) => ({
      week, home: home.managerId, away: away.managerId,
    }))
}
