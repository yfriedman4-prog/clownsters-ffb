/** Equal records/PF retain a range of possible seeds, never an arbitrary winner. */
export function rankTeams(rows) {
  const sorted = [...rows].sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
  const result = []
  for (let i = 0; i < sorted.length;) {
    let end = i + 1
    while (end < sorted.length && sorted[end].wins === sorted[i].wins && sorted[end].pointsFor === sorted[i].pointsFor) end++
    for (let j = i; j < end; j++) result.push({ ...sorted[j], seedMin: i + 1, seedMax: end })
    i = end
  }
  return result
}
