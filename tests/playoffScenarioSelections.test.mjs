import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { remainingScenarioState,matchupKey,toggleSelection,scenarioPreset,validateSelections,reconcileSelections } from '../src/utils/playoffs/scenarioSelections.js'
const season=JSON.parse(fs.readFileSync('src/data/history/seasons/2026.json'))
test('remaining schedule and canonical identities drive independent toggle and clear state',()=>{
 const before=JSON.stringify(season),state=remainingScenarioState(season),g=state.remaining[0]
 assert.equal(state.remaining.length,24);assert.ok(state.remaining.every(g=>g.week>10))
 const p=toggleSelection([],g,g.home);assert.equal(p.length,1)
 assert.equal(toggleSelection(p,g,g.home).length,0)
 assert.equal(toggleSelection(p,g,g.away)[0].winner,g.away)
 assert.equal(validateSelections(season,p)[0].winner,g.home)
 assert.equal(p[0].winner,g.home);assert.equal(JSON.stringify(season),before)
 assert.throws(()=>toggleSelection([],g,'unknown'))
})
test('deterministic presets choose top, underdog and bubble teams with explicit conflicts',()=>{
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
 const updated=structuredClone(season);updated.completedThroughWeek=11
 for(const m of updated.matchups.filter(m=>m.week===11)){m.home.score=140;m.away.score=100;for(const [a,b] of [[m.home,m.away],[m.away,m.home]]){const t=updated.standings.find(t=>t.managerId===a.managerId);t.wins+=Number(a.score>b.score);t.losses+=Number(a.score<b.score);t.pointsFor=+(t.pointsFor+a.score).toFixed(2);t.pointsAgainst=+(t.pointsAgainst+b.score).toFixed(2)}}
 assert.equal(remainingScenarioState(updated).remaining.length,18)
 assert.deepEqual(reconcileSelections(updated,[p]),[])
 assert.throws(()=>validateSelections(updated,[p]),/remaining/)
 assert.equal(new Set(remainingScenarioState(updated).remaining.map(matchupKey)).size,18)
})
