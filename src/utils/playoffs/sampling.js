// Wilson 95% interval remains informative for zero successes or all successes.
export function samplingInterval(p, n) {
  const z2 = 1.96 ** 2, denominator = 1 + z2 / n
  const center = (p + z2 / (2 * n)) / denominator
  const half = 1.96 * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denominator
  return [Math.min(p, Math.max(0, center - half)), Math.max(p, Math.min(1, center + half))]
}
export function probabilityUncertainty(row, n, kind = 'playoff') {
  return [samplingInterval(row[`${kind}Lower`], n)[0], samplingInterval(row[`${kind}Upper`], n)[1]]
}
