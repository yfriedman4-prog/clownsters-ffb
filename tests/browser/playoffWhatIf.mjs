/** Requires local Vite, Playwright and Chromium. See playoffMatchupViews.mjs for setup. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const base=process.env.BASE_URL??'http://127.0.0.1:5173',out=process.env.ARTIFACT_DIR??'/workspace/artifacts'
fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{
  const Original=window.Worker;window.__scenarioWorkers=[];window.__scenarioRequests=[];window.__lastScenario=null;window.__scenarioRuns=[];window.__normalRequests=0
  window.Worker=class extends Original{
   constructor(...args){super(...args);window.__scenarioWorkers.push(this);this.addEventListener('message',({data})=>{if(data.scenario){window.__lastScenario=data.scenario;window.__scenarioRuns.push({selected:data.scenario.selections.length,ms:performance.now()-this.started,iterations:data.scenario.metadata.iterations})}})}
   postMessage(data,...args){this.started=performance.now();if(data.type==='scenario')window.__scenarioRequests.push(data);else window.__normalRequests++;return super.postMessage(data,...args)}
   terminate(){this.wasTerminated=true;return super.terminate()}
  }
 })
 await page.goto(base);await page.getByRole('button',{name:'Playoff Scenarios',exact:true}).click()
 const section=page.locator('#playoff-what-if')
 await section.locator('.whatif-team').first().waitFor({timeout:90000})
 assert.equal(await section.locator('.whatif-team').count(),12)
 assert.equal(await section.locator('.whatif-game').count(),24)
 assert.match(await section.locator('.whatif-toolbar').textContent(),/0 selected outcomes/)
 assert.ok(await section.locator('.whatif-select-panel').isVisible());assert.ok(await section.locator('.whatif-result-panel').isVisible())
 const pick=section.locator('.whatif-game').first().getByRole('button',{name:/wins against/}).first()
 await pick.focus();await page.keyboard.press('Space')
 await page.waitForFunction(()=>window.__lastScenario?.selections.length===1)
 await section.locator('.whatif-team').first().waitFor()
 const selectedId=await page.evaluate(()=>window.__lastScenario.selections[0].winner)
 assert.match(await section.locator('.whatif-toolbar').textContent(),/1 selected outcomes/)
 assert.equal(await pick.getAttribute('aria-pressed'),'true')
 // Toggle/clear picks and verify deterministic presets and their disclosed conflicts.
 await pick.click();await page.waitForFunction(()=>window.__lastScenario?.selections.length===0)
 await section.getByRole('button',{name:'Bubble Teams Win Out',exact:true}).click()
 await section.locator('.whatif-notice').getByText(/preset conflicts resolved/).waitFor()
 await page.waitForFunction(()=>window.__lastScenario?.selections.length>1)
 await section.getByRole('button',{name:'Top Teams Win Out',exact:true}).click()
 await page.waitForFunction(()=>window.__lastScenario?.selections.length===24)
 await section.locator('.whatif-team').first().waitFor()
 // All games forced: every projected W-L win total is an integer; 84 league wins.
 assert.equal(await page.evaluate(()=>window.__lastScenario.scenario.results.reduce((n,t)=>n+t.expectedWins,0)),84)
 await section.evaluate(e=>e.scrollIntoView({block:'start'}))
 await page.screenshot({path:`${out}/playoffs-v13-desktop.png`})
 // Rapid edits cancel old jobs; late messages cannot overwrite the current request.
 const first=section.locator('.whatif-game').first(),win=first.getByRole('button',{name:/wins against/}).last()
 await win.click();await first.getByRole('button',{name:/wins against/}).first().click()
 await page.evaluate(()=>{for(const w of window.__scenarioWorkers.filter(w=>w.wasTerminated)){w.dispatchEvent(new MessageEvent('message',{data:{requestId:1,error:'STALE SCENARIO'}}))}})
 await section.locator('.whatif-team').first().waitFor()
 assert.ok(!(await section.textContent()).includes('STALE SCENARIO'))
 // Wait for existing key-games batch; toggling its views must not touch scenario picks.
 await page.locator('.playoff-key-game').first().waitFor({timeout:90000})
 const before=await page.evaluate(()=>window.__scenarioRequests.length)
 for(const width of [768,390,320]){
  await page.setViewportSize({width,height:width===768?1024:844})
  assert.ok(await section.locator('.whatif-select-panel').isVisible())
  await section.getByRole('button',{name:'2. View Results',exact:true}).focus();await page.keyboard.press('Enter')
  await section.locator('.whatif-team').first().waitFor()
  assert.equal(await page.evaluate(()=>document.activeElement.id),'whatif-results-title')
  assert.ok(!await section.locator('.whatif-select-panel').isVisible())
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`results overflow ${width}`)
  if (await section.locator('.whatif-seed-distribution').first().getAttribute('open')===null) await section.locator('.whatif-seed-distribution>summary').first().click()
  assert.ok(await section.locator('.whatif-seed-grid').first().isVisible())
  await section.evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/playoffs-v13-results-${width}.png`})
  await section.getByRole('button',{name:'Back to Select Outcomes',exact:true}).click()
  assert.ok(await section.locator('.whatif-select-panel').isVisible())
  assert.match(await section.locator('.whatif-toolbar').textContent(),/24 selected outcomes/)
  await section.evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/playoffs-v13-select-${width}.png`})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`selector overflow ${width}`)
 }
 assert.equal(await page.evaluate(()=>window.__scenarioRequests.length),before,'Step switching must not recalculate')
 for(const name of ['Playoff Chase','Bye Battle','All Key Matchups'])await page.getByRole('button',{name,exact:true}).click()
 assert.equal(await page.evaluate(()=>window.__scenarioRequests.length),before,'Matchup view switching must not recalculate scenarios')
 await section.getByRole('button',{name:'Reset Scenario',exact:true}).click()
 await page.waitForFunction(()=>window.__lastScenario?.selections.length===0)
 assert.match(await section.locator('.whatif-toolbar').textContent(),/0 selected outcomes/)
 await page.setViewportSize({width:1440,height:1000})
 await page.getByRole('combobox').selectOption('1000')
 await page.waitForFunction(()=>window.__lastScenario?.metadata.iterations===1000)
 await section.getByRole('button',{name:'Underdog Chaos',exact:true}).click()
 await page.waitForFunction(()=>window.__lastScenario?.metadata.iterations===1000&&window.__lastScenario?.selections.length===24)
 assert.ok(await page.evaluate(()=>window.__scenarioWorkers.some(w=>w.wasTerminated)))
 assert.ok(selectedId)
 const report=await page.evaluate(()=>({runs:window.__scenarioRuns,requests:window.__scenarioRequests.length,normalRequests:window.__normalRequests}))
 fs.writeFileSync(`${out}/playoffs-v13-browser-qa.json`,JSON.stringify(report,null,2)+'\n')
 assert.deepEqual(errors,[])
 console.log(JSON.stringify(report));console.log('PASS what-if desktop/mobile, presets, conflict notices, counts, reset, exact win totals, step persistence without recalculation, keyboard focus, seeds, count control, worker cancellation and stale guards.')
}finally{await browser.close()}
