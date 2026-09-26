// Full 1–10 catalogue acceptance against the isolated QA origin.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {mkdirSync,writeFileSync}=require('node:fs');

(async()=>{
 mkdirSync('output/playwright',{recursive:true});
 const browser=await chromium.launch({channel:process.env.QA_CHROMIUM?undefined:'chrome',executablePath:process.env.QA_CHROMIUM||undefined,headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.QA_URL||'http://127.0.0.1:3001/';
 try{
  await page.goto(new URL('qa-local.html',base).href);await page.locator('#run').click();
  await page.waitForFunction(()=>document.querySelector('#result').textContent.trim().startsWith('{'),{},{timeout:120000});
  const notation=JSON.parse(await page.locator('#result').innerText());
  assert.equal(notation.rendered,103);assert.deepEqual(notation.failures,[]);assert.deepEqual(notation.warnings,[]);assert.equal(notation.samples,30);
  console.log('PASS all 103 complete scores render without fallback or warnings; playhead, following and piano samples remain valid');
  await page.goto(base);await page.waitForSelector('#score-viewer svg');await page.locator('[data-view="library"]').click();
  const grades=[];
  for(let grade=1;grade<=10;grade++){
   await page.locator('#library-grade').selectOption(String(grade));
   const count=await page.locator('.score-tile').count(),expected=grade===3?13:10;
   assert.equal(count,expected,`grade ${grade}`);assert.equal(await page.locator('.score-tile .demo-resource-tag').count(),count,`grade ${grade} human demos`);
   const titles=await page.locator('.score-tile h3').allTextContents();grades.push({grade,count,titles});
   if([1,4,10].includes(grade))await page.screenshot({path:`output/playwright/catalogue-grade-${grade}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);writeFileSync('output/playwright/catalogue-validation.json',JSON.stringify({grades,notation,errors},null,2));
  console.log('PASS every grade 1–10 is visible with the expected count and a human-performance badge on every musical piece');
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
