import { simulatePlayoffs } from '../utils/playoffs/simulation.js'
self.onmessage = ({ data }) => {
  try { self.postMessage({ result: simulatePlayoffs(data.season, data.options) }) }
  catch (error) { self.postMessage({ error: error.message }) }
}
