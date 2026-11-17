import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { simulatePlayoffs } from '../src/utils/playoffs/simulation.js'
import { validateSeason } from '../src/utils/playoffs/seasonState.js'
import { rankTeams } from '../src/utils/playoffs/ranking.js'
import { selectStorylines, analyzeKeyMatchups, samplingInterval } from '../src/utils/playoffs/raceInsights.js'
const season=JSON.parse(fs.readFileSync(new URL('../src/data/history/seasons/2026.json',import.meta.url)))
test('unconditioned baseline is identical to validated v1 for identical seed and count', async()=>{
  let old=execFileSync('git',['show','e720dd4:src/utils/playoffs/simulation.js']).toString()
  for(const [relative,url] of [['../../config/playoffs2026.js',new URL('../src/config/playoffs2026.js',import.meta.url)],['./seasonState.js',new URL('../src/utils/playoffs/seasonState.js',import.meta.url)],['./ranking.js',new URL('../src/utils/playoffs/ranking.js',import.meta.url)]]) old=old.replace(relative,url.href)
  const prior=await import(`data:text/javascript;base64,${Buffer.from(old).toString('base64')}`)
  assert.deepEqual(simulatePlayoffs(season,{iterations:1000,seed:42}),prior.simulatePlayoffs(season,{iterations:1000,seed:42}))
})
test('conditional winner samples feasible scores with PF effects and preserves deterministic input',()=>{
  // Only one game remains: conditional winner must get the win, and winning PF is higher than losing PF.
  const fixture=structuredClone(season);fixture.completedThroughWeek=13
  for(const g of fixture.matchups.filter(g=>g.week<=13 && g.week>10)){g.home.score=140;g.away.score=100}
  for(const t of fixture.standings){t.wins=0;t.losses=0;t.pointsFor=0;t.pointsAgainst=0;for(const g of fixture.matchups.filter(g=>g.week<=13)){const a=g.home.managerId===t.managerId?g.home:g.away.managerId===t.managerId?g.away:null;if(!a)continue;const b=a===g.home?g.away:g.home;t.wins+=Number(a.score>b.score);t.losses+=Number(a.score<b.score);t.pointsFor+=a.score;t.pointsAgainst+=b.score}t.pointsFor=+t.pointsFor.toFixed(2);t.pointsAgainst=+t.pointsAgainst.toFixed(2)}
  const g=validateSeason(fixture).remaining[0], before=JSON.stringify(fixture)
  const options={iterations:1000,seed:42,forcedWinner:{...g,winner:g.home}}
  const run=simulatePlayoffs(fixture,options), same=simulatePlayoffs(fixture,options)
  assert.deepEqual(run,same);assert.equal(JSON.stringify(fixture),before)
  assert.equal(run.results.find(t=>t.managerId===g.home).expectedWins,fixture.standings.find(t=>t.managerId===g.home).wins+1)
  assert.equal(run.metadata.forcedWinner.winner,g.home);assert.ok(run.metadata.rejectedDraws>0)
  assert.ok(run.results.every(t=>t.playoffInterval.length===2 && t.byeInterval.length===2))
  const h=run.results.find(t=>t.managerId===g.home), a=run.results.find(t=>t.managerId===g.away)
  const beforeHome=fixture.standings.find(t=>t.managerId===g.home), beforeAway=fixture.standings.find(t=>t.managerId===g.away)
  assert.ok(h.expectedFinalPF-beforeHome.pointsFor > a.expectedFinalPF-beforeAway.pointsFor)
  const losing=simulatePlayoffs(fixture,{...options,forcedWinner:{...g,winner:g.away}})
  assert.ok(h.expectedFinalPF > losing.results.find(t=>t.managerId===g.home).expectedFinalPF)
  assert.equal(a.expectedWins,beforeAway.wins)
  assert.throws(()=>simulatePlayoffs(season,{forcedWinner:{...g,week:1,winner:g.home}}),/remaining matchup/)
  assert.throws(()=>simulatePlayoffs(season,{forcedWinner:{...g,winner:'unknown'}}),/remaining matchup/)
})
test('storylines select strongest outsider, weakest qualifier and largest projected riser; absent criteria omitted',()=>{
  const rows=rankTeams(validateSeason(season).teams)
  const results=rows.map(t=>({managerId:t.managerId,playoffLower:(13-t.seedMin)/13,playoffUpper:(13-t.seedMin)/13,expectedSeedMin:t.seedMin,expectedSeedMax:t.seedMin}))
  const outsider=rows[6];results[6].playoffLower=0.95;results[6].playoffUpper=0.95;results[6].expectedSeedMin=4;results[6].expectedSeedMax=4
  const stories=selectStorylines(rows,results)
  assert.equal(stories[0].team.managerId,outsider.managerId);assert.equal(stories[1].team.managerId,rows[5].managerId);assert.equal(stories[2].team.managerId,outsider.managerId)
  assert.deepEqual(selectStorylines(rows,[]),[])
  for(const r of results){r.expectedSeedMin=12;r.expectedSeedMax=12}
  assert.ok(!selectStorylines(rows,results).some(s=>s.type==='Projected-Seed Riser'))
})
test('all actual remaining games ranked by documented impact with reproducible uncertainty',()=>{
  const before=JSON.stringify(season),progress=[]
  const report=analyzeKeyMatchups(season,{iterations:100,seed:42},n=>progress.push(n))
  assert.equal(report.games.length,24);assert.equal(progress.at(-1),24)
  assert.deepEqual(report,analyzeKeyMatchups(season,{iterations:100,seed:42}));assert.equal(JSON.stringify(season),before)
  for(let i=0;i<24;i++){
    const g=report.games[i];assert.ok(g.week>=11&&g.week<=14)
    if(i)assert.ok(report.games[i-1].impact>=g.impact)
    const metric=g.homeWin.results.reduce((n,h)=>{const a=g.awayWin.results.find(t=>t.managerId===h.managerId);return n+Math.abs(h.playoffLower-a.playoffLower)+0.5*Math.abs(h.byeLower-a.byeLower)},0)/2
    assert.equal(g.impact,metric)
    assert.equal(g.homeWin.metadata.forcedWinner.winner,g.home);assert.equal(g.awayWin.metadata.forcedWinner.winner,g.away)
    for(const r of g.homeWin.results){assert.ok(r.playoffInterval[0]<=r.playoffLower);assert.ok(r.playoffInterval[1]>=r.playoffUpper)}
  }
  assert.ok(samplingInterval(0,100)[1]>0);assert.ok(samplingInterval(1,100)[0]<1)
})
