// Confirmed by the commissioner in the Playoff Scenarios v1 request.
export const playoffRules = Object.freeze({
  teams: 12, berths: 6, byes: 2, regularSeasonEnd: 14,
  playoffWeeks: [15, 16, 17], divisions: false,
  ranking: ['wins', 'pointsFor'],
  unresolved: ['Exact-PF tiebreaker', 'Matchup tie treatment', 'Official score precision and rounding', 'Playoff reseeding'],
})
