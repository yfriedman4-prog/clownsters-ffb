/** Playwright + Chromium navigation QA. Run with PLAYWRIGHT_MODULE as documented in playoffMatchupViews.mjs. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright')
const output=process.env.ARTIFACT_DIR??'/workspace/artifacts/navigation';fs.mkdirSync(output,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']})
const pages={current:[['dashboard','Dashboard'],['standings','Standings'],['matchups','Matchups'],['teams','Teams'],['analytics','Analytics'],['playoffs','Playoff Scenarios'],['midseason','Midseason Report']],history:[['overview','Overview'],['history','Seasons'],['managers','Managers'],['records','Records'],['scoring-analytics','Scoring Analytics'],['era-comparisons','Era Comparisons']]}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],overflow=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto(process.env.BASE_URL??'http://127.0.0.1:5173/')
 const section=mode=>page.getByRole('button',{name:mode==='current'?'Current Season':'League History',exact:true})
 for(const width of [1440,1366,768,390,320]){
  await page.setViewportSize({width,height:width<=390?844:1000})
  for(const mode of ['current','history']){
   await section(mode).click()
   const nav=page.getByRole('navigation',{name:`${mode==='current'?'Current Season':'League History'} pages`,exact:true})
   assert.deepEqual(await nav.getByRole('button').allTextContents(),pages[mode].map(([,label])=>label))
   assert.equal(await page.locator('.primary-header .nav-item').count(),0)
   assert.equal(await page.locator('.primary-header .mode-switcher').count(),1)
   if(width>=1366){
    const alignment=await page.evaluate(()=>{const b=document.querySelector('.primary-header .header-brand').getBoundingClientRect(),t=document.querySelector('.primary-header .mode-switcher').getBoundingClientRect(),h=document.querySelector('.primary-header').getBoundingClientRect();return {sameLine:Math.abs((b.top+b.height/2)-(t.top+t.height/2))<2,right:h.right-t.right}})
    assert.ok(alignment.sameLine);assert.ok(alignment.right<60)
    assert.equal(await nav.evaluate(e=>e.scrollWidth<=e.clientWidth),true)
   }
   for(const [id,label]of pages[mode]){
    const button=nav.getByRole('button',{name:label,exact:true})
    await button.click()
    await page.waitForFunction(id=>JSON.parse(localStorage.getItem('clownsters-navigation-v1')).page===id,id)
    assert.equal(await button.getAttribute('aria-current'),'page')
    const visible=await button.evaluate(e=>{const r=e.getBoundingClientRect(),n=e.parentElement.getBoundingClientRect();return r.left>=n.left-1&&r.right<=n.right+1})
    assert.ok(visible,`active item outside navigation ${width} ${label}`)
    assert.equal(await page.locator('.placeholder-page').count(),0)
    if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))overflow.push({width,id})
   }
   const label=mode==='current'?'Playoff Scenarios':'Scoring Analytics'
   await nav.getByRole('button',{name:label,exact:true}).click()
   if(mode==='current')await page.locator('.playoff-cover').waitFor()
   else await page.locator('.scoring-analytics-page').waitFor()
   await page.evaluate(()=>scrollTo(0,0))
   await page.screenshot({path:`${output}/${mode}-${width}.png`})
   // Keyboard action and visible focus outline.
   const first=nav.getByRole('button').first();await first.focus();await page.keyboard.press('Enter')
   assert.equal(await first.getAttribute('aria-current'),'page')
   assert.equal(await first.evaluate(e=>getComputedStyle(e).outlineStyle),'solid')
  }
 }
 assert.deepEqual(overflow,[],'No page-level overflow on any existing nav page')
 // Remember separate sections, including Midseason Report after refresh.
 await section('current').click();await page.getByRole('navigation').getByRole('button',{name:'Midseason Report',exact:true}).click()
 await section('history').click();await page.getByRole('navigation').getByRole('button',{name:'Records',exact:true}).click()
 await section('current').click();assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Midseason Report',exact:true}).getAttribute('aria-current'),'page')
 await page.reload();await page.locator('.midseason-report').waitFor();assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Midseason Report',exact:true}).getAttribute('aria-current'),'page')
 await section('history').click();assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Records',exact:true}).getAttribute('aria-current'),'page')
 await page.reload();await section('current').click();await page.locator('.midseason-report').waitFor()
 // Existing state navigation does not add new URL history entries.
 const historyLength=await page.evaluate(()=>history.length)
 await page.getByRole('navigation').getByRole('button',{name:'Standings',exact:true}).click()
 assert.equal(await page.evaluate(()=>history.length),historyLength)
 await page.evaluate(()=>{location.hash='navigation-qa'})
 await page.goBack();assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Standings',exact:true}).getAttribute('aria-current'),'page')
 await page.goForward();assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Standings',exact:true}).getAttribute('aria-current'),'page')
 // Nested manager and rivalry pages retain their existing entry points and section context.
 await section('history').click();await page.getByRole('navigation').getByRole('button',{name:'Managers',exact:true}).click()
 await page.locator('.history-directory-card').first().click();await page.locator('.history-manager-profile').waitFor()
 await page.getByRole('button',{name:/^View rivalry with/}).first().click();await page.locator('.rivalry-detail').waitFor()
 await section('current').click();await section('history').click();await page.locator('.rivalry-detail').waitFor()
 await page.reload();await page.locator('.rivalry-detail').waitFor()
 assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Managers',exact:true}).getAttribute('aria-current'),'page')
 // Long mobile labels can be scrolled without widening the document.
 const mobile=await browser.newContext({viewport:{width:320,height:844},isMobile:true,hasTouch:true})
 const touch=await mobile.newPage();await touch.goto(process.env.BASE_URL??'http://127.0.0.1:5173/')
 const rail=touch.getByRole('navigation');assert.ok(await rail.evaluate(e=>e.scrollWidth>e.clientWidth))
 const cdp=await mobile.newCDPSession(touch),bounds=await rail.boundingBox(),y=bounds.y+bounds.height/2
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:280,y}]})
 for(let x=260;x>=40;x-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await touch.evaluate(()=>new Promise(r=>requestAnimationFrame(r)))}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
 await touch.waitForFunction(()=>document.querySelector('.secondary-navigation').scrollLeft>0)
 await rail.evaluate(e=>{e.scrollLeft=e.scrollWidth})
 assert.ok(await rail.getByRole('button',{name:'Midseason Report',exact:true}).isVisible())
 await rail.getByRole('button',{name:'Midseason Report',exact:true}).tap()
 assert.equal(await rail.getByRole('button',{name:'Midseason Report',exact:true}).getAttribute('aria-current'),'page')
 assert.ok(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 await mobile.close()
 assert.deepEqual(errors,[])
 console.log('PASS all 13 existing pages at 1440/1366/768/390/320; header alignment, no overflow, active rail visibility, keyboard/focus, touch, per-section persistence, Midseason refresh, and unchanged URL history behavior.')
}finally{await browser.close()}
