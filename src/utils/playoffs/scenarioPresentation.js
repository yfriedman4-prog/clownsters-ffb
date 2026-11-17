export function scenarioTakeaways(comparisons) {
  const effects=comparisons.flatMap(t=>['playoff','bye'].map(kind=>({managerId:t.managerId,kind,change:t[`${kind}Change`],uncertainty:t[`${kind}Uncertainty`].change})))
  // Require a visible change and a conservative sampling range excluding zero.
  const gain=effects.filter(t=>Number((100*t.change[0]).toFixed(1))>0 && t.uncertainty[0]>0).sort((a,b)=>b.change[0]-a.change[0] || a.managerId.localeCompare(b.managerId))[0]
  const loss=effects.filter(t=>Number((100*t.change[1]).toFixed(1))<0 && t.uncertainty[1]<0).sort((a,b)=>a.change[1]-b.change[1] || a.managerId.localeCompare(b.managerId))[0]
  return [gain&&{...gain,type:'Largest supported increase'},loss&&{...loss,type:'Largest supported decrease'}].filter(Boolean)
}
export function projectedScenarioOrder(comparisons) {
  return [...comparisons].sort((a,b)=>a.scenario.expectedSeedMin-b.scenario.expectedSeedMin || a.scenario.expectedSeedMax-b.scenario.expectedSeedMax || a.managerId.localeCompare(b.managerId))
}
