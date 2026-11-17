import test from 'node:test'
import assert from 'node:assert/strict'
import { scenarioTakeaways,projectedScenarioOrder } from '../src/utils/playoffs/scenarioPresentation.js'
import { compareScenario } from '../src/utils/playoffs/scenarioResults.js'
const row=(id,change,uncertainty,seed)=>({managerId:id,scenario:{expectedSeedMin:seed,expectedSeedMax:seed},playoffChange:[change,change],byeChange:[0,0],playoffUncertainty:{change:uncertainty},byeUncertainty:{change:[-0.1,0.1]}})
test('takeaways require visible changes supported beyond conservative sampling ranges',()=>{
 const rows=[row('gain',0.2,[0.1,0.3],5),row('loss',-0.3,[-0.4,-0.2],8),row('noise',0.4,[-0.1,0.6],2)]
 const before=structuredClone(rows),takes=scenarioTakeaways(rows)
 assert.equal(takes[0].managerId,'gain');assert.equal(takes[1].managerId,'loss')
 assert.deepEqual(rows,before);assert.deepEqual(scenarioTakeaways([rows[2]]),[])
 assert.deepEqual(projectedScenarioOrder(rows).map(t=>t.managerId),['noise','gain','loss'])
})
test('empty scenario comparison has exact zero deltas even with unresolved ranking probability bounds',()=>{
 const baseline={metadata:{iterations:100},results:[{managerId:'a',playoffLower:0.2,playoffUpper:0.8,byeLower:0,byeUpper:0.5}]}
 const result=compareScenario(baseline,baseline)[0]
 assert.deepEqual(result.playoffChange,[0,0]);assert.deepEqual(result.byeChange,[0,0])
 assert.deepEqual(result.playoffUncertainty.change,[0,0])
 assert.ok(result.playoffUncertainty.scenario[0]<0.2);assert.ok(result.playoffUncertainty.scenario[1]>0.8)
})
