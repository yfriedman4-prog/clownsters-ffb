import { simulateScenario } from '../utils/playoffs/scenarioResults.js'
import { simulatePlayoffs } from '../utils/playoffs/simulation.js'
import { analyzeKeyMatchups } from '../utils/playoffs/raceInsights.js'
self.onmessage = ({ data }) => {
  try {
    if (data.type==='scenario') {
      self.postMessage({ requestId:data.requestId,scenario:simulateScenario(data.season,data.selections,data.options) })
      return
    }
    self.postMessage({ result: simulatePlayoffs(data.season, data.options) })
    const insights = analyzeKeyMatchups(data.season, data.options, (done, total) => self.postMessage({ progress: { done, total } }))
    self.postMessage({ insights })
  } catch (error) { self.postMessage({ requestId:data.requestId,error: error.message }) }
}
