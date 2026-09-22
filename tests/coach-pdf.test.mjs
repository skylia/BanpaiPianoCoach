import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {coachDocument,reportBlocks,inlineRuns} from '../public/coach-document.mjs';
import {createCoachPdf} from '../public/coach-pdf.mjs';
import {PDFDocument,PDFName} from '../public/vendor/pdf-lib-1.17.1.mjs';
import {coachPdfFixture} from './coach-pdf-fixture.mjs';
const loadFonts=()=>Promise.all(['banpai-report-400.ttf','banpai-report-600.ttf'].map(p=>readFile(new URL('../public/fonts/'+p,import.meta.url))));

test('PDF document keeps report text, supports old evidence-free reports, and never invents statistics',()=>{
  const report=coachPdfFixture(),doc=coachDocument(report);assert.equal(doc.evidence.current.follow.errorAttempts,13);assert.equal(doc.filename,'Banpai-AI-2026-09-22-7days.pdf');
  const old=coachDocument({...report,evidence:undefined});assert.equal(old.evidence,null);assert.equal(old.blocks.length,doc.blocks.length);
  assert.equal(coachDocument({...report,evidence:{...report.evidence,period:{...report.period,end:'2026-09-21'}}}).evidence,null);
  assert.throws(()=>coachDocument({...report,text:' '}));assert.throws(()=>coachDocument({...report,text:'字'.repeat(30001)}));assert.throws(()=>coachDocument({...report,period:{...report.period,start:'2026-99-99'}}));
  const blocks=reportBlocks('## 概况\n\n一、建议\n- **慢练** 72 BPM\n<script>alert(1)</script>\n1. '+ '保持稳定。'.repeat(20));
  assert.deepEqual(blocks.map(b=>b.kind),['heading','heading','list','paragraph','paragraph']);assert.equal(blocks[3].text,'<script>alert(1)</script>');assert.deepEqual(inlineRuns('请**慢练**再`合手`').map(r=>r.text),['请','慢练','再','合手']);
  assert.equal(reportBlocks('# '+ '很长的标题'.repeat(100))[0].kind,'paragraph');
});

test('PDF exports selectable embedded Chinese text with A4 pagination and no credential metadata',async()=>{
  const report={...coachPdfFixture(),apiKey:'DO-NOT-EXPORT',privateNote:'PRIVATE-NOTE'};
  const result=await createCoachPdf(report,{loadFonts}),pdf=await PDFDocument.load(result.bytes);
  assert.equal(pdf.getTitle(),'近 7 天练琴报告');assert.equal(pdf.getAuthor(),'半拍 · BANPAI PIANO');assert(result.pages>=3&&result.pages<=5);assert(result.bytes.length<500000);assert.deepEqual(result.substitutions,[]);
  for(const page of pdf.getPages()) {
    assert.equal(page.getWidth(),595.28);assert.equal(page.getHeight(),841.89);
    const fonts=page.node.Resources().lookup(PDFName.of('Font'));
    for(const [,ref] of fonts.entries())assert(pdf.context.lookup(ref).has(PDFName.of('ToUnicode')),'copyable text needs a Unicode map');
  }
  assert(!Buffer.from(result.bytes).includes(Buffer.from('DO-NOT-EXPORT')));
});

test('long paragraphs, URLs, special symbols and 30-day historical reports still export',async()=>{
  const report=coachPdfFixture(30);report.text='## 阅读测试\n'+('节奏先稳定，再加速；保留休止与呼吸。'.repeat(300))+'\n'+'https://example.test/'+('verylong'.repeat(80))+'\n𝄞 🎹\n尾段仍然保留。';
  report.evidence=undefined;
  const result=await createCoachPdf(report,{loadFonts});assert(result.pages>3);assert(result.pages<20);assert(result.filename.endsWith('-30days.pdf'));assert(result.substitutions.includes('[U+1F3B9]'));
});
