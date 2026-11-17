import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { rankMatchups, leagueEffects, matchupExplanation, probabilityRange, probabilityChange, points } from '../src/utils/playoffs/matchupViews.js'
import { analyzeKeyMatchups } from '../src/utils/playoffs/raceInsights.js'
const row=(managerId,p,b)=>({managerId,playoffLower:p,playoffUpper:p,byeLower:b,byeUpper:b})
const game=(week,home,away,h,a,impact=0)=>({week,home,away,homeWin:{results:h},awayWin:{results:a},impact})
const fixtures=[
 game(11,'a','b',[row('a',0.8,0.1),row('b',0.2,0),row('c',0.5,0.9)],[row('a',0.2,0.1),row('b',0.8,0),row('c',0.5,0.9)],0.6),
 // Participants' bye chances are unchanged, but another contender's odds move.
 game(12,'a','b',[row('a',0.5,0),row('b',0.5,0),row('c',0.5,0.9)],[row('a',0.5,0),row('b',0.5,0),row('c',0.5,0.1)],0.2),
]
test('qualification and bye metrics use all teams and both winners, not only participants',()=>{
 assert.equal(rankMatchups(fixtures,'playoff')[0].week,11)
 assert.equal(rankMatchups(fixtures,'bye')[0].week,12)
 assert.ok(Math.abs(rankMatchups(fixtures,'playoff')[0].viewImpact-0.6)<1e-12)
 assert.equal(rankMatchups(fixtures,'bye')[0].viewImpact,0.4)
 assert.equal(leagueEffects(fixtures[1],'bye').find(t=>t.managerId==='c').swing,0.8)
 assert.equal(leagueEffects(fixtures[1],'bye').find(t=>t.managerId==='a').swing,0)
})
test('combined ranking preserves approved impact and input ordering for equal week/impact',()=>{
 const tied=game(11,'z','b',[],[],0.6)
 const games=[tied,fixtures[0],fixtures[1]], before=structuredClone(games)
 assert.deepEqual(rankMatchups(games,'combined').map(g=>[g.week,g.home,g.viewImpact]),[[11,'z',0.6],[11,'a',0.6],[12,'a',0.2]])
 assert.deepEqual(games,before)
})
test('separate view ties use week and identities for presentation only; repeatable without mutation',()=>{
 const a=game(12,'z','y',[],[]),b=game(11,'z','y',[],[]),c=game(11,'a','b',[],[])
 const games=[a,b,c],original=structuredClone(games)
 assert.deepEqual(rankMatchups(games,'bye').map(g=>[g.week,g.home]),[[11,'a'],[11,'z'],[12,'z']])
 assert.deepEqual(rankMatchups(games,'bye'),rankMatchups(games,'bye'))
 assert.deepEqual(games,original)
 assert.throws(()=>rankMatchups(games,'invalid'),/Unknown matchup/)
})
test('formatters display probabilities and absolute percentage-point changes, including bounds and negative-zero',()=>{
 assert.equal(probabilityRange(0.25,0.25),'25.0%')
 assert.equal(probabilityRange(0.2,0.3),'20.0%–30.0%')
 assert.equal(probabilityChange(row('a',0.6,0.5),row('a',0.4,0.2),'playoff'),'+20.0 pp')
 assert.equal(probabilityChange(row('a',0.6,0.5),row('a',0.4,0.2),'bye'),'+30.0 pp')
 assert.equal(probabilityChange({...row('a',0.2,0),playoffUpper:0.3},{...row('a',0.4,0),playoffUpper:0.5},'playoff'),'-30.0 to -10.0 pp')
 assert.equal(points(-0.00000001),'0.0')
})
test('bye explanation identifies a nonparticipant beneficiary from actual conditional results',()=>{
 const byId={a:{teamName:'A',seedMin:7,seedMax:7},b:{teamName:'B',seedMin:8,seedMax:8},c:{teamName:'C',seedMin:3,seedMax:3}}
 const explanation=matchupExplanation(fixtures[1],byId,'bye')
 assert.match(explanation.summary,/C.*80.0 percentage points/)
 assert.match(explanation.other,/90.0%.*A wins.*10.0%.*B wins/)
 assert.match(explanation.other,/favors a A win/)
 assert.equal(explanation.label,'Top-two seed stakes')
})
test('actual conditional outputs retain original combined ordering and all league probabilities',()=>{
 const season=JSON.parse(fs.readFileSync('src/data/history/seasons/2026.json'))
 const analysis=analyzeKeyMatchups(season,{iterations:100,seed:42}),before=structuredClone(analysis)
 assert.deepEqual(rankMatchups(analysis.games,'combined').map(g=>[g.week,g.home,g.away,g.viewImpact]),analysis.games.map(g=>[g.week,g.home,g.away,g.impact]))
 for(const view of ['bye','playoff']){
  const ranked=rankMatchups(analysis.games,view)
  assert.equal(ranked.length,24)
  for(const g of ranked){assert.equal(g.homeWin.results.length,12);assert.equal(g.awayWin.results.length,12)}
 }
 assert.deepEqual(analysis,before)
 for(const path of ['src/utils/playoffs/raceInsights.js']) assert.equal(fs.readFileSync(path,'utf8'),execFileSync('git',['show',`6a1bbc7:${path}`]).toString())
})
