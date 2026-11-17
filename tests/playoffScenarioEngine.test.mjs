import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { simulatePlayoffs } from '../src/utils/playoffs/simulation.js'
import { simulateScenario } from '../src/utils/playoffs/scenarioResults.js'
import { scenarioPreset,remainingScenarioState } from '../src/utils/playoffs/scenarioSelections.js'
const season=JSON.parse(fs.readFileSync('src/data/history/seasons/2026.json'))
const options={iterations:1000,seed:42}
async function legacy(){let code=execFileSync('git',['show','9bb43ea:src/utils/playoffs/simulation.js']).toString();for(const relative of ['../../config/playoffs2026.js','./seasonState.js','./ranking.js','./sampling.js'])code=code.replace(relative,new URL(relative,new URL('../src/utils/playoffs/simulation.js',import.meta.url)).href);return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)}
test('empty scenarios exactly preserve production baseline; single pick exactly matches legacy conditional',async()=>{
 const old=await legacy(),g=remainingScenarioState(season).remaining[0],pick={...g,winner:g.home}
 const empty=simulateScenario(season,[],options)
 assert.deepEqual(empty.baseline,old.simulatePlayoffs(season,options));assert.deepEqual(empty.scenario,empty.baseline)
 assert.ok(empty.comparisons.every(t=>t.playoffChange.every(n=>n===0)&&t.byeChange.every(n=>n===0)))
 assert.deepEqual(simulateScenario(season,[pick],options).scenario,old.simulatePlayoffs(season,{...options,forcedWinner:pick}))
 assert.deepEqual(simulatePlayoffs(season,{...options,forcedWinners:[]}),empty.baseline)
})
test('all selected winners respected, PF/PA and wins/losses conserve totals, seed probabilities remain consistent',()=>{
 const picks=scenarioPreset(season,'chaos').selections,original=JSON.stringify({season,picks})
 const run=simulateScenario(season,picks,options)
 assert.deepEqual(run,simulateScenario(season,[...picks].reverse(),options))
 for(const t of run.scenario.results){
  const current=season.standings.find(s=>s.managerId===t.managerId),wins=picks.filter(g=>g.winner===t.managerId).length
  assert.equal(t.expectedWins,current.wins+wins);assert.equal(t.expectedLosses,current.losses+4-wins)
  assert.ok(t.expectedFinalPF>=current.pointsFor);assert.ok(t.expectedFinalPA>=current.pointsAgainst)
  assert.ok(Math.abs(t.seedLower.reduce((a,b)=>a+b,0)-1)<1e-9)
  assert.ok(t.playoffInterval[0]<=t.playoffLower && t.playoffInterval[1]>=t.playoffUpper)
 }
 const sum=k=>run.scenario.results.reduce((n,t)=>n+t[k],0)
 assert.ok(Math.abs(sum('expectedFinalPF')-sum('expectedFinalPA'))<1e-6)
 assert.equal(sum('expectedWins'),84);assert.equal(sum('expectedLosses'),84)
 assert.ok(Math.abs(sum('playoffLower')-6)<1e-9);assert.ok(Math.abs(sum('byeLower')-2)<1e-9)
 assert.equal(JSON.stringify({season,picks}),original)
 assert.equal(run.metadata.selectedOutcomes,24)
})
test('invalid, conflicting or completed forced outcomes are rejected explicitly',()=>{
 const g=remainingScenarioState(season).remaining[0],p={...g,winner:g.home}
 for(const picks of [[p,{...p,winner:g.away}],[{...p,week:1}],[{...p,winner:'unknown'}]])assert.throws(()=>simulateScenario(season,picks,options))
 assert.throws(()=>simulatePlayoffs(season,{forcedWinner:p,forcedWinners:[p]}),/either/)
 assert.throws(()=>simulatePlayoffs(season,{forcedWinners:{}}),/array/)
})
test('existing worker routes scenario requests and explicit validation errors with request identity',async()=>{
 const messages=[];globalThis.self={postMessage:m=>messages.push(m)}
 try{
  await import('../src/workers/playoffScenarios.worker.js')
  self.onmessage({data:{type:'scenario',requestId:'current',season,selections:[],options:{iterations:10,seed:42}}})
  assert.equal(messages[0].requestId,'current');assert.equal(messages[0].scenario.metadata.selectedOutcomes,0)
  self.onmessage({data:{type:'scenario',requestId:'invalid',season,selections:[{week:1,home:'x',away:'y',winner:'x'}],options:{iterations:10}}})
  assert.equal(messages[1].requestId,'invalid');assert.match(messages[1].error,/remaining matchup/)
 }finally{delete globalThis.self}
})
