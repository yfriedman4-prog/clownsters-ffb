import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { matchupStakes, viewIntroductions } from '../src/utils/playoffs/matchupPresentation.js'
const row=(managerId,p,b)=>({managerId,playoffLower:p,playoffUpper:p,byeLower:b,byeUpper:b})
const fixture={home:'a',away:'b',homeWin:{results:[row('a',0.8,0.7),row('b',0.2,0.1),row('c',0.5,0.2)]},awayWin:{results:[row('a',0.3,0.1),row('b',0.7,0.4),row('c',0.4,0.5)]}}
test('view copy matches release wording',()=>{
 assert.equal(viewIntroductions.playoff,'The games that could have the biggest impact on who makes the playoffs.')
 assert.equal(viewIntroductions.bye,'Discover which remaining games could shake up the race for a first-round bye.')
 assert.equal(viewIntroductions.combined,'The most consequential remaining games across the playoff and bye races.')
})
test('stakes select correct probability and actual winner values without mutation',()=>{
 const before=structuredClone(fixture)
 const p=matchupStakes(fixture,'playoff').highlight,b=matchupStakes(fixture,'bye').highlight
 assert.equal(p.kind,'playoff');assert.equal(p.managerId,'a');assert.equal((100*p.swing).toFixed(1),'50.0')
 assert.equal(p.home.playoffLower,0.8);assert.equal(p.away.playoffLower,0.3)
 assert.equal(b.kind,'bye');assert.equal(b.managerId,'a');assert.equal((100*b.swing).toFixed(1),'60.0')
 assert.equal(b.home.byeLower,0.7);assert.equal(b.away.byeLower,0.1)
 assert.equal(matchupStakes(fixture,'combined').highlight.kind,'bye')
 assert.deepEqual(fixture,before);assert.deepEqual(matchupStakes(fixture,'bye'),matchupStakes(fixture,'bye'))
})
test('beneficiary excludes participants, shows both outcomes and picks supported beneficial result',()=>{
 const b=matchupStakes(fixture,'bye').beneficiary
 assert.equal(b.managerId,'c');assert.equal(b.favored,'b')
 assert.equal(b.home.byeLower,0.2);assert.equal(b.away.byeLower,0.5)
 const f=structuredClone(fixture);f.homeWin.results[2].byeUpper=0.6
 assert.equal(matchupStakes(f,'bye').beneficiary,null,'Overlapping bounds cannot support a benefit direction')
 f.homeWin.results[2]=row('c',0.5,0.5);f.awayWin.results[2]=row('c',0.5,0.50001)
 assert.equal(matchupStakes(f,'bye').beneficiary,null,'Omit effects rounding to zero')
})
test('zero swings omit callouts; release leaves validated calculations, rankings and worker unchanged',()=>{
 const f=structuredClone(fixture);f.awayWin=structuredClone(f.homeWin)
 assert.deepEqual(matchupStakes(f,'combined'),{highlight:null,beneficiary:null})
 for(const path of ['src/utils/playoffs/matchupViews.js','src/utils/playoffs/raceInsights.js','src/utils/playoffs/sampling.js','src/config/playoffs2026.js']) assert.equal(fs.readFileSync(path,'utf8'),execFileSync('git',['show',`893f8af:${path}`]).toString())
})
