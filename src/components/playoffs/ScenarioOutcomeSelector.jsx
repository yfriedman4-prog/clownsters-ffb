import { useState } from 'react'
import { matchupKey, presetPolicies, scenarioPreset, toggleSelection } from '../../utils/playoffs/scenarioSelections.js'
export default function ScenarioOutcomeSelector({ season, state, selections, onChange, headingRef }) {
  const [notice,setNotice]=useState(null)
  const byId=Object.fromEntries(state.teams.map(t=>[t.managerId,t.teamName]))
  const weeks=[...new Set(state.remaining.map(g=>g.week))]
  const preset=id=>{try{const result=scenarioPreset(season,id);onChange(result.selections);setNotice({text:presetPolicies[id],conflicts:result.conflicts})}catch(e){setNotice({error:e.message})}}
  return <div className="whatif-selector">
    <h3 ref={headingRef} tabIndex={-1}>Select Game Outcomes</h3><p>Pick hypothetical winners. Unselected games remain probabilistically simulated. Click a selected winner again to clear it.</p>
    <fieldset className="whatif-presets"><legend>Quick scenarios · hypothetical, not predictions</legend>{[['current','Current Forecast'],['top','Top Teams Win Out'],['bubble','Bubble Teams Win Out'],['chaos','Underdog Chaos']].map(([id,label])=><button type="button" key={id} onClick={()=>preset(id)}>{label}</button>)}</fieldset>
    <details className="whatif-policy"><summary>Preset policies and conflict handling</summary>{Object.values(presetPolicies).map(p=><p key={p}>{p}</p>)}<p>Tied current standings require manual selections; no official tiebreaker is invented.</p></details>
    {notice && <div className="whatif-notice" role={notice.error?'alert':'status'}><p>{notice.error??notice.text}</p>{notice.conflicts?.length>0 && <details open><summary>{notice.conflicts.length} preset conflicts resolved by the stated policy</summary><ul>{notice.conflicts.map(c=><li key={c}>{c}</li>)}</ul></details>}</div>}
    {weeks.map((week,i)=><details key={week} className="whatif-week" open={i===0}><summary>Week {week} · {selections.filter(s=>s.week===week).length} selected</summary>{state.remaining.filter(g=>g.week===week).map(g=>{
      const pick=selections.find(s=>matchupKey(s)===matchupKey(g))
      return <fieldset key={matchupKey(g)} className="whatif-game"><legend>{byId[g.home]} vs {byId[g.away]}</legend><div>{[g.home,g.away].map(id=><button key={id} type="button" aria-label={`Week ${week}: ${byId[id]} wins against ${byId[id===g.home?g.away:g.home]}`} aria-pressed={pick?.winner===id} onClick={()=>{setNotice(null);onChange(toggleSelection(selections,g,id))}}>{byId[id]}</button>)}</div><button className="whatif-clear" type="button" disabled={!pick} aria-label={`Clear Week ${week}: ${byId[g.home]} vs ${byId[g.away]}`} onClick={()=>{setNotice(null);onChange(selections.filter(s=>matchupKey(s)!==matchupKey(g)))}}>Clear selection</button></fieldset>
    })}</details>)}
    {!weeks.length && <p>No remaining regular-season games to select.</p>}
  </div>
}
