// Isolated playback validation. No personal browser profile or teacher recording is used.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {writeFileSync,mkdirSync}=require('node:fs');

(async()=>{
 mkdirSync('output/playwright',{recursive:true});
 const browser=await chromium.launch({channel:process.env.QA_CHROMIUM?undefined:'chrome',executablePath:process.env.QA_CHROMIUM||undefined,headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto(process.env.QA_URL||'http://127.0.0.1:3001/');await page.waitForSelector('#score-viewer svg');
  const data=await page.evaluate(async()=>{const {DEMO_LIBRARY}=await import('/demo-library.mjs');return DEMO_LIBRARY;});
  const local=[...new Map(data.filter(d=>d.src).map(d=>[d.src,d])).values()],report=[];
  for(const demo of local){
   const result=await page.evaluate(async src=>{
    const audio=new Audio(new URL(src,location.href).href);audio.muted=true;audio.preload='metadata';
    try {
     await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('metadata timeout')),12000);audio.onloadedmetadata=()=>{clearTimeout(timer);resolve();};audio.onerror=()=>{clearTimeout(timer);reject(Error('audio decode error'));};if(audio.readyState>=1){clearTimeout(timer);resolve();}});
     if(!Number.isFinite(audio.duration)||audio.duration<=0)throw Error('invalid duration');
     await audio.play();await new Promise((resolve,reject)=>{const started=performance.now();const check=()=>{if(audio.currentTime>.03)resolve();else if(performance.now()-started>5000)reject(Error('playhead did not advance'));else setTimeout(check,30);};check();});
     return {duration:audio.duration,played:audio.currentTime};
    }finally{audio.pause();audio.removeAttribute('src');audio.load();}
   },demo.src);
   assert(result.played>0);report.push({id:demo.id,src:demo.src,...result});
  }
  console.log(`PASS ${local.length} distinct bundled recordings decode and play in Chromium`);
  await page.locator('[data-view="library"]').click();await page.locator('[data-open-score="mutopia-clementi-op36-no1-movement2"]').click();await page.locator('#listen-human-button').click();
  await page.waitForFunction(()=>document.querySelector('#human-demo audio').readyState>=1);
  assert.match(await page.locator('.human-demo-clock').innerText(),/1:00/);
  await page.locator('.human-demo-play').click();await page.waitForFunction(()=>document.querySelector('#human-demo audio').currentTime>119.4);await page.locator('.human-demo-stop').click();
  assert(Math.abs(await page.locator('#human-demo audio').evaluate(a=>a.currentTime)-119.3)<.05);
  console.log('PASS Andante opens at its verified movement start and stop returns there');
  const external=data.find(d=>d.kind==='external');assert(external);
  await page.locator('[data-view="library"]').click();await page.locator(`[data-open-score="${external.scoreIds[0]}"]`).click();await page.locator('#listen-human-button').click();
  assert.equal(await page.locator('.human-demo-embed iframe').count(),0);assert(await page.locator('.human-demo-external-link').getAttribute('href'));
  const source=await page.locator('.human-demo-external-link').getAttribute('href');assert.equal(source,external.sourceUrl);assert.equal(new URL(source).hostname,'www.bilibili.com');
  if(external.embedUrl){
   await page.locator('.human-demo-external-play').click();assert.equal(await page.locator('.human-demo-embed iframe').count(),1);
   await page.locator('#listen-button').click();assert.equal(await page.locator('.human-demo-embed iframe').count(),0);await page.locator('#listen-stop').click();
  }else assert.equal(await page.locator('.human-demo-external-play').isVisible(),false);
  console.log('PASS exact Bilibili source link is available; only supported embedded players expose an in-page play button (provider playback is checked separately)');
  await page.screenshot({path:'output/playwright/human-demo-sources.png',fullPage:true});
  assert.deepEqual(errors,[]);writeFileSync('output/playwright/audio-decoding.json',JSON.stringify(report,null,2));
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
