import { simulatePlayoffs } from './simulation.js'
import { validateSelections } from './scenarioSelections.js'
import { probabilityUncertainty } from './sampling.js'
export function compareScenario(baseline, scenario) {
  return scenario.results.map(s=>{
    const b=baseline.results.find(t=>t.managerId===s.managerId)
    const intervals=kind=>{
      const before=probabilityUncertainty(b,baseline.metadata.iterations,kind),after=probabilityUncertainty(s,scenario.metadata.iterations,kind)
      return { baseline:before,scenario:after,change:baseline===scenario ? [0,0] : [after[0]-before[1],after[1]-before[0]] }
    }
    return {managerId:s.managerId,baseline:b,scenario:s,
      playoffChange:baseline===scenario ? [0,0] : [s.playoffLower-b.playoffUpper,s.playoffUpper-b.playoffLower],
      byeChange:baseline===scenario ? [0,0] : [s.byeLower-b.byeUpper,s.byeUpper-b.byeLower],
      playoffUncertainty:intervals('playoff'),byeUncertainty:intervals('bye')}
  })
}
export function simulateScenario(season,selections,options={}) {
  const picks=validateSelections(season,selections)
  const baseline=simulatePlayoffs(season,options)
  const scenario=picks.length ? simulatePlayoffs(season,{...options,forcedWinners:picks}) : baseline
  return {baseline,scenario,comparisons:compareScenario(baseline,scenario),selections:picks,
    metadata:{...scenario.metadata,hypothetical:true,selectedOutcomes:picks.length,randomness:'Same seed and scoring model. Rejection draws can shift later random draws, so differences are not fully paired common-random-number estimates.',changeUncertainty:'Conservative differences of marginal Wilson endpoints, not joint 95% confidence intervals; no-selection differences are exactly zero.'}}
}
