import { useEffect,useMemo,useRef,useState } from 'react'
import ScenarioOutcomeSelector from '../components/playoffs/ScenarioOutcomeSelector.jsx'
import ScenarioResults from '../components/playoffs/ScenarioResults.jsx'
import { remainingScenarioState,reconcileSelections,validateSelections } from '../utils/playoffs/scenarioSelections.js'
import './PlayoffWhatIf.css'
export default function PlayoffWhatIf({ season,iterations }) {
  const [rawSelections,setSelections]=useState([])
  const [step,setStep]=useState('select')
  const [response,setResponse]=useState(null)
  const sequence=useRef(0)
  const resultHeading=useRef(null),selectionHeading=useRef(null)
  const state=useMemo(()=>remainingScenarioState(season),[season])
  const selectionKey=JSON.stringify(validateSelections(season,reconcileSelections(season,rawSelections)))
  const input=useMemo(()=>({season,selections:JSON.parse(selectionKey),options:{iterations,seed:202610}}),[season,selectionKey,iterations])
  useEffect(()=>{
    let active=true
    const requestId=++sequence.current
    const worker=new Worker(new URL('../workers/playoffScenarios.worker.js',import.meta.url),{type:'module'})
    const timer=setTimeout(()=>worker.postMessage({type:'scenario',requestId,...input}),180)
    worker.onmessage=({data})=>{
      if (!active || data.requestId!==requestId) return
      setResponse({input,result:data.scenario,error:data.error})
      worker.terminate()
    }
    worker.onerror=()=>{if(active){setResponse({input,error:'Scenario calculation could not complete. Change a selection or reset to try again.'});worker.terminate()}}
    return ()=>{active=false;clearTimeout(timer);worker.terminate()}
  },[input])
  const current=response?.input===input ? response : null
  const changeStep=next=>{setStep(next);requestAnimationFrame(()=>{(next==='results'?resultHeading:selectionHeading).current?.focus()})}
  return <section className="whatif-section" id="playoff-what-if" aria-labelledby="whatif-title"><header><span className="playoff-kicker">YOUR PICKS. A DIFFERENT PLAYOFF PICTURE.</span><h2 id="whatif-title">What-If Simulator</h2><p>Explore hypothetical results without changing the current forecast or any recorded games.</p></header>
    <div className="whatif-toolbar"><strong role="status">{input.selections.length} selected outcomes</strong><button type="button" onClick={()=>setSelections([])} disabled={!input.selections.length}>Reset Scenario</button></div>
    <div className="whatif-stepper" role="group" aria-label="Simulator steps"><button type="button" aria-pressed={step==='select'} onClick={()=>changeStep('select')}>1. Select Outcomes</button><button type="button" aria-pressed={step==='results'} onClick={()=>changeStep('results')}>2. View Results</button></div>
    <div className={`whatif-panels step-${step}`}>
      <section className="whatif-select-panel" aria-label="Select Game Outcomes"><ScenarioOutcomeSelector season={season} state={state} selections={input.selections} onChange={setSelections} headingRef={selectionHeading}/><button className="whatif-next" type="button" onClick={()=>changeStep('results')}>View Results · {input.selections.length} selections</button></section>
      <section className="whatif-result-panel" aria-labelledby="whatif-results-title" aria-busy={!current}><h3 tabIndex={-1} id="whatif-results-title" ref={resultHeading}>View the Results</h3><p className="whatif-hypothetical">HYPOTHETICAL SCENARIO · ESTIMATES, NOT GUARANTEES</p>
        {!current && <p role="status" className="whatif-loading">Calculating {input.selections.length} selected outcomes with {iterations.toLocaleString()} simulations…</p>}
        {current?.error && <p role="alert">{current.error}</p>}
        {current?.result && <ScenarioResults report={current.result} state={state}/>}
        <button className="whatif-back" type="button" onClick={()=>changeStep('select')}>Back to Select Outcomes</button>
      </section>
    </div>
  </section>
}
