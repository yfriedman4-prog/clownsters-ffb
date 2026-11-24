import test from 'node:test'
import assert from 'node:assert/strict'
import { remainingScenarioState,matchupKey,toggleSelection,scenarioPreset,validateSelections,reconcileSelections } from '../src/utils/playoffs/scenarioSelections.js'
import { activeSeason as season, remainingFixtures, week10Season } from './playoffFixtures.mjs'
test('remaining schedule and canonical identities drive independent toggle and clear state',()=>{
 const before=JSON.stringify(season),state=remainingScenarioState(season),g=state.remaining[0]
 assert.deepEqual(state.remaining,remainingFixtures(season))
 assert.ok(state.remaining.every(g=>g.week>season.completedThroughWeek))
 const p=toggleSelection([],g,g.home);assert.equal(p.length,1)
 assert.equal(toggleSelection(p,g,g.home).length,0)
 assert.equal(toggleSelection(p,g,g.away)[0].winner,g.away)
 assert.equal(validateSelections(season,p)[0].winner,g.home)
 assert.equal(p[0].winner,g.home);assert.equal(JSON.stringify(season),before)
 assert.throws(()=>toggleSelection([],g,'unknown'))
})
test('deterministic presets choose top, underdog and bubble teams with explicit conflicts',()=>{
 const season=week10Season
 const state=remainingScenarioState(season),r=Object.fromEntries(state.standings.map(t=>[t.managerId,t.seedMin]))
 const top=scenarioPreset(season,'top'),chaos=scenarioPreset(season,'chaos'),bubble=scenarioPreset(season,'bubble')
 assert.equal(top.selections.length,24);assert.equal(chaos.selections.length,24)
 for(const g of top.selections)assert.equal(g.winner,r[g.home]<r[g.away]?g.home:g.away)
 for(const g of chaos.selections)assert.equal(g.winner,r[g.home]>r[g.away]?g.home:g.away)
 assert.ok(bubble.conflicts.length>0)
 for(const g of bubble.selections){assert.ok(r[g.winner]>=5&&r[g.winner]<=8);if([g.home,g.away].every(id=>r[id]>=5&&r[id]<=8))assert.equal(g.winner,r[g.home]>r[g.away]?g.home:g.away)}
 assert.deepEqual(bubble,scenarioPreset(season,'bubble'));assert.deepEqual(scenarioPreset(season,'current').selections,[])
})
test('invalid, completed, duplicate and conflicting picks are rejected; imports reconcile old UI picks',()=>{
 const g=remainingScenarioState(season).remaining[0],p={...g,winner:g.home}
 assert.throws(()=>validateSelections(season,[p,{...p,winner:g.away}]),/conflicting/)
 assert.throws(()=>validateSelections(season,[{...p,week:1}]),/remaining/)
 assert.throws(()=>validateSelections(season,[{...p,winner:'unknown'}]),/remaining/)
 // Simulate the next weekly import in memory, using synthetic scores.
 const updated = structuredClone(season)
 updated.completedThroughWeek++
 for (const {home, away} of updated.matchups.filter(m => m.week === updated.completedThroughWeek)) {
  home.score = 140
  away.score = 100
  for (const [team, opponent] of [[home, away], [away, home]]) {
   const row = updated.standings.find(t => t.managerId === team.managerId)
   row.wins += Number(team.score > opponent.score)
   row.losses += Number(team.score < opponent.score)
   row.pointsFor = +(row.pointsFor + team.score).toFixed(2)
   row.pointsAgainst = +(row.pointsAgainst + opponent.score).toFixed(2)
  }
 }
 const before = remainingFixtures(season)
 const expected = before.filter(game => game.week > updated.completedThroughWeek)
 const state = remainingScenarioState(updated)
 assert.equal(state.throughWeek, season.completedThroughWeek + 1)
 assert.equal(state.remaining.length, before.length - season.seasonTeams.length / 2)
 assert.deepEqual(state.remaining, expected)
 assert.ok(state.teams.every(team => team.scores.length === updated.completedThroughWeek))
 const stillUpcoming = expected.slice(0,1).map(game=>({...game,winner:game.home}))
 assert.deepEqual(reconcileSelections(updated,[p,...stillUpcoming]),stillUpcoming)
 assert.throws(()=>validateSelections(updated,[p]),/remaining/)
 assert.equal(new Set(state.remaining.map(matchupKey)).size,expected.length)
})
