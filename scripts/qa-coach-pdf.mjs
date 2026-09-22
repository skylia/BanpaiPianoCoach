// Generates synthetic QA PDFs only, without reading the browser or calling AI.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createCoachPdf} from '../public/coach-pdf.mjs';
import {coachPdfFixture} from '../tests/coach-pdf-fixture.mjs';
const loadFonts=()=>Promise.all(['banpai-report-400.ttf','banpai-report-600.ttf'].map(p=>readFile(new URL('../public/fonts/'+p,import.meta.url))));
const dir=new URL('../artifacts/coach-pdf/',import.meta.url);await mkdir(dir,{recursive:true});
for(const days of [7,30]) {
  const report=coachPdfFixture(days),result=await createCoachPdf(report,{loadFonts});
  await writeFile(new URL(result.filename,dir),result.bytes);
  await writeFile(new URL(`source-${days}.json`,dir),JSON.stringify(report,null,2));
  console.log(JSON.stringify({filename:result.filename,pages:result.pages,bytes:result.bytes.length,substitutions:result.substitutions}));
}
