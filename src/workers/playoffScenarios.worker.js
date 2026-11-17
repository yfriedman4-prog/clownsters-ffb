import { simulatePlayoffs } from '../utils/playoffs/simulation.js'
import { analyzeKeyMatchups } from '../utils/playoffs/raceInsights.js'
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ result: simulatePlayoffs(data.season, data.options) })
    const insights = analyzeKeyMatchups(data.season, data.options, (done, total) => self.postMessage({ progress: { done, total } }))
    self.postMessage({ insights })
  } catch (error) { self.postMessage({ error: error.message }) }
}
