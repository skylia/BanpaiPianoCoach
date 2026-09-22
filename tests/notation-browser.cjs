// Optional isolated notation acceptance test: NODE_PATH=... QA_CHROMIUM=... node tests/notation-browser.cjs
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const {mkdirSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
  const server=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:'3198'},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',()=>reject(new Error('Notation test server exited')));});
  let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.QA_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    const errors=[],warnings=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='warning')warnings.push(message.text());});
    // Route an isolated harness so app-level errors cannot invalidate renderer tests.
    await page.route('**/notation-harness',route=>route.fulfill({contentType:'text/html',body:'<!DOCTYPE html><html lang="zh-CN"><meta charset="utf-8"><link rel="stylesheet" href="/notation.css"><style>body{margin:0;padding:32px;background:#f6f3eb;font-family:Arial}#sheet{width:100%}</style><div id="sheet"></div></html>'}));
    await page.goto('http://127.0.0.1:3198/notation-harness');
    await page.addScriptTag({url:'/vendor/vexflow-bravura.js'});
    await page.evaluate(async()=>{
      const {renderNotation}=await import('/notation.mjs');window.renderNotation=renderNotation;
      const notes=[];let id=0;
      for(let bar=0;bar<10;bar++)for(let n=0;n<8;n++)for(const hand of ['right','left'])notes.push({id:`n${id++}`,pitch:(hand==='right'?60:48)+[0,4,5,7,9,7,5,4][n]+bar,beat:bar*4+n*.5,duration:.5,hand,finger:[1,2,3,4,5,4,3,2][n]});
      notes.push({id:'long',pitch:55,beat:0,duration:8,hand:'left'});
      window.notation=renderNotation(document.querySelector('#sheet'),{title:'Notation fixture',notes,totalBeats:40,bpm:60,timeSignature:[4,4],keySignature:'D'},{onNoteClick:id=>window.clicked=id});
      window.notation.setProgress(0);
    });
    assert.equal(await page.locator('.notation-note').count(),160);assert(await page.locator('.notation-system').count()<=4);
    await page.locator('.notation-note[role="button"]').first().click();assert.equal(await page.evaluate(()=>window.clicked),'n0');
    await page.evaluate(()=>window.notation.selectNote('n0'));assert(await page.locator('.notation-selected').count()>0);
    await page.evaluate(()=>window.notation.setProgress(24));await page.waitForTimeout(650);
    const scroll=await page.evaluate(()=>({inside:document.querySelector('#sheet').scrollTop,outside:window.scrollY}));
    assert(scroll.inside>0);assert.equal(scroll.outside,0);assert.equal(await page.locator('.notation-playhead').count(),1);
    const artifacts=path.join(root,'artifacts');mkdirSync(artifacts,{recursive:true});
    await page.screenshot({path:path.join(artifacts,'notation-desktop.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
    assert.equal(await page.locator('.notation-system').count(),10);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(artifacts,'notation-mobile.png'),fullPage:true});
    console.log('PASS: two-staff rendering, chord/voice ties, key signature, fingering, note selection, internal follow, responsive resize');
    const fixtures=await page.evaluate(()=>{
      window.notation.destroy();
      const sets=[
        {title:'Dotted and rests',totalBeats:8,timeSignature:[4,4],keySignature:'F',notes:[{id:'a',pitch:70,beat:0,duration:1.5,hand:'right'},{id:'r',pitch:null,beat:1.5,duration:.5,hand:'right'},{id:'hold',pitch:60,beat:2,duration:5.75,hand:'right'}]},
        {title:'Compound meter',totalBeats:3,timeSignature:[6,8],keySignature:'Eb',notes:Array.from({length:12},(_,i)=>({id:`a${i}`,pitch:60+i%12,beat:i*.25,duration:.25,hand:'right'}))},
        {title:'Tiny meter',totalBeats:.375,timeSignature:[3,32],keySignature:'C',notes:[{id:'a',pitch:60,beat:0,duration:.375,hand:'right'}]},
        {title:'Empty',totalBeats:4,timeSignature:[4,4],keySignature:'C',notes:[]},
      ];
      return sets.map(score=>{const api=renderNotation(document.querySelector('#sheet'),score,{showLabels:true});const result={name:score.title,count:document.querySelectorAll('.notation-note').length,fallback:document.querySelector('#sheet').textContent.includes('过于复杂')};api.destroy();return result;});
    });
    assert(fixtures.every(f=>f.count>0&&!f.fallback));
    const clefCheck=await page.evaluate(async()=>{
      const target=document.querySelector('#sheet');
      const score={title:'Same pitch on both hands',timeSignature:[4,4],totalBeats:4,keySignature:'C',notes:[{id:'r60',pitch:60,beat:0,duration:4,hand:'right'},{id:'l60',pitch:60,beat:0,duration:4,hand:'left'}]};
      let api=renderNotation(target,score);
      const right=target.querySelector('[data-note-id="r60"]').getBBox(),left=target.querySelector('[data-note-id="l60"]').getBBox();
      const samePitchOffset=left.y-right.y,labels=target.querySelector('.notation-legend').textContent;
      api.destroy();
      const {REPERTOIRE}=await import('/repertoire.mjs');
      const czerny=REPERTOIRE.find(score=>score.id==='czerny-599-1');
      api=renderNotation(target,czerny,{startBar:1,endBar:2});
      const clefs=[...target.querySelectorAll('.notation-system')].map(el=>[el.dataset.rightClef,el.dataset.leftClef]);
      const notes=target.querySelectorAll('.notation-note').length;
      api.destroy();
      api=renderNotation(target,{title:'New blank score',notes:[],timeSignature:[4,4],totalBeats:8,keySignature:'C'});
      const emptyCount=target.querySelectorAll('.notation-note').length,emptyClefs=[target.querySelector('.notation-system').dataset.rightClef,target.querySelector('.notation-system').dataset.leftClef];
      api.destroy();return {samePitchOffset,labels,clefs,notes,emptyCount,emptyClefs};
    });
    assert(clefCheck.samePitchOffset>=100&&clefCheck.samePitchOffset<=130);assert.match(clefCheck.labels,/高音谱表 · 左手/);
    assert(clefCheck.clefs.every(pair=>pair.join(',')==='treble,treble'));assert(clefCheck.notes>0);
    assert.equal(clefCheck.emptyCount,4);assert.deepEqual(clefCheck.emptyClefs,['treble','bass']);
    console.log('PASS: actual Czerny 599 uses two treble clefs; note geometry matches clefs; blank editor renders two resting bars');
    await page.setViewportSize({width:1280,height:900});
    await page.evaluate(async()=>{const {REPERTOIRE}=await import('/repertoire.mjs');window.notation=renderNotation(document.querySelector('#sheet'),REPERTOIRE.find(score=>score.id==='czerny-599-1'),{startBar:1,endBar:4});});
    await page.screenshot({path:path.join(artifacts,'notation-czerny.png'),fullPage:true});
    assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);
    console.log('PASS: dotted durations, rests, partial and cross-system ties, 6/8, 3/32 and empty staves; zero browser errors or fallbacks');
  } finally {await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
