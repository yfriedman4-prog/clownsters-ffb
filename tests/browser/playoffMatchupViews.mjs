/** Browser regression runner. Requires Playwright and Chromium, plus the Vite server.
 * Example: PLAYWRIGHT_MODULE=/tmp/playoff-browser/node_modules/playwright/index.mjs node tests/browser/playoffMatchupViews.mjs
 * BASE_URL, CHROMIUM_PATH and ARTIFACT_DIR may override local defaults.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const output=process.env.ARTIFACT_DIR ?? '/workspace/artifacts'
fs.mkdirSync(output,{recursive:true})
const base=process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',headless:true,args:['--no-sandbox']})
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{
  const Original=window.Worker
  window.__workers=[];window.__requests=0;window.__latest=null
  window.Worker=class extends Original {
   constructor(...args){super(...args);this.started=performance.now();window.__workers.push(this);this.addEventListener('message',({data})=>{if(data.insights){this.elapsed=performance.now()-this.started;window.__latest=data.insights}})}
   postMessage(...args){window.__requests++;return super.postMessage(...args)}
   terminate(){this.wasTerminated=true;return super.terminate()}
  }
 })
 await page.goto(base)
 await page.getByRole('button',{name:'Playoff Scenarios',exact:true}).click()
 // Switching while loading cannot enqueue another batch.
 await page.getByRole('button',{name:'Bye Battle',exact:true}).click()
 await page.getByRole('button',{name:'Playoff Chase',exact:true}).click()
 await page.locator('.playoff-key-game').first().waitFor({timeout:90000})
 const requests=await page.evaluate(()=>window.__requests)
 const currentRuntime=await page.evaluate(()=>window.__workers.find(w=>w.elapsed)?.elapsed)
 assert.equal(await page.locator('.playoff-key-game').count(),3)
 for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,844]]){
  await page.setViewportSize({width,height})
  for(const [label,kind] of [['Playoff Chase','playoff'],['Bye Battle','bye'],['All Key Matchups','combined']]){
   await page.getByRole('button',{name:label,exact:true}).click()
   assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true')
   assert.equal(await page.locator('.playoff-key-game').count(),3)
   const first=page.locator('.playoff-key-game').first()
   const expected=await page.evaluate(kind=>{
    const games=window.__latest.games
    const impact=g=>kind==='combined'?g.impact:g.homeWin.results.reduce((n,h)=>n+Math.abs(h[kind+'Lower']-g.awayWin.results.find(a=>a.managerId===h.managerId)[kind+'Lower']),0)/2
    const ranked=[...games].sort((a,b)=>impact(b)-impact(a)||a.week-b.week||(kind==='combined'?games.indexOf(a)-games.indexOf(b):a.home.localeCompare(b.home)||a.away.localeCompare(b.away)))
    const g=ranked[0],r=g.homeWin.results.find(t=>t.managerId===g.home)
    return {week:g.week,home:g.home,probability:(100*r[(kind==='combined'?'playoff':kind)+'Lower']).toFixed(1)+'%'}
   },kind)
   assert.equal(await first.getAttribute('data-home'),expected.home)
   assert.equal(Number(await first.getAttribute('data-week')),expected.week)
   if(kind!=='combined'){
    assert.ok((await first.locator('.playoff-compact-odds').textContent()).includes(expected.probability))
    assert.match(await first.locator('.playoff-compact-odds').textContent(),/ pp/)
   } else assert.equal(await first.locator('.playoff-compact-odds').count(),0)
   await first.locator('.playoff-game-details>summary').click()
   assert.ok(await first.locator('.playoff-outcome').first().isVisible())
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`expanded overflow ${width} ${kind}`)
   await first.locator('.playoff-game-details>summary').click()
   await page.getByRole('button',{name:'View All Key Matchups (24)',exact:true}).click()
   assert.equal(await page.locator('.playoff-key-game').count(),24)
   await page.getByRole('button',{name:'Show Top Three Matchups',exact:true}).click()
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${kind}`)
  }
 }
 assert.equal(await page.evaluate(()=>window.__requests),requests,'View changes must not resimulate')
 assert.equal(await page.locator('.playoff-weeks p').count(),24)
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:width===1440?1000:844})
  await page.getByRole('button',{name:'Bye Battle',exact:true}).click()
  await page.locator('.playoff-key-games').evaluate(e=>e.scrollIntoView({block:'start'}))
  await page.screenshot({path:`${output}/playoffs-v12-bye-${width}.png`})
 }
 // Cancel an expensive count change; inject a queued stale error from its worker.
 await page.getByRole('combobox').selectOption('25000')
 await page.getByRole('combobox').selectOption('1000')
 await page.evaluate(()=>{for(const w of window.__workers.filter(w=>w.wasTerminated)) w.dispatchEvent(new MessageEvent('message',{data:{error:'STALE WORKER RESULT'}}))})
 await page.locator('.playoff-key-game').first().waitFor({timeout:90000})
 assert.match(await page.locator('.playoff-key-games>.playoff-note').textContent(),/1,000 runs/)
 assert.ok(!(await page.locator('.playoff-page').textContent()).includes('STALE WORKER RESULT'))
 assert.ok(await page.evaluate(()=>window.__workers.some(w=>w.wasTerminated)))
 await page.getByRole('button',{name:'Midseason Report',exact:true}).click();await page.locator('.midseason-report').waitFor()
 await page.getByRole('button',{name:'League History',exact:true}).click();await page.getByRole('button',{name:'Managers',exact:true}).click();await page.getByRole('button',{name:'H2H Matrix',exact:true}).waitFor()
 assert.deepEqual(errors,[])
 // Same-machine comparison using the approved v1.1.1 worker and unchanged imports.
 const oldWorker=execFileSync('git',['show','6a1bbc7:src/workers/playoffScenarios.worker.js']).toString().replaceAll("'../utils/",`'${base}/src/utils/`)
 const benchmark=await browser.newPage();await benchmark.goto(base)
 const oldRuntime=await benchmark.evaluate(async source=>{
  const season=await fetch('/src/data/history/seasons/2026.json').then(r=>r.json())
  const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'})),start=performance.now()
  return new Promise((resolve,reject)=>{const w=new Worker(url,{type:'module'});w.onerror=e=>{w.terminate();URL.revokeObjectURL(url);reject(new Error(e.message))};w.onmessage=({data})=>{if(data.error){w.terminate();URL.revokeObjectURL(url);reject(new Error(data.error))}if(data.insights){w.terminate();URL.revokeObjectURL(url);resolve(performance.now()-start)}};w.postMessage({season,options:{iterations:10000,seed:202610}})})
 },oldWorker)
 const report={currentWorkerMs:currentRuntime,approvedV111WorkerMs:oldRuntime,viewSwitchAdditionalRequests:0,widths:[320,390,768,1440],result:'passed'}
 fs.writeFileSync(`${output}/playoffs-v12-browser-qa.json`,JSON.stringify(report,null,2)+'\n')
 console.log(JSON.stringify(report))
 console.log('PASS rankings, conditional display, three-view expansion, no resimulation, responsive widths, count changes, worker cancellation/stale messages, schedule and existing navigation.')
} finally {await browser.close()}
