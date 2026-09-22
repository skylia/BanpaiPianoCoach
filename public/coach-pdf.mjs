import {coachDocument,inlineRuns} from './coach-document.mjs';

const WIDTH=595.28,HEIGHT=841.89,MARGIN=48,BOTTOM=777,CONTENT=WIDTH-2*MARGIN;
let assets;
async function readAsset(path) {
  const response=await fetch(new URL(path,import.meta.url));
  if(!response.ok)throw Error('PDF 字体加载失败，请确认本地服务正在运行后重试。');
  return new Uint8Array(await response.arrayBuffer());
}
async function defaultAssets() {
  if(!assets)assets=Promise.all([readAsset('./fonts/banpai-report-400.ttf'),readAsset('./fonts/banpai-report-600.ttf')]).catch(e=>{assets=null;throw e;});
  return assets;
}

// Local, vector PDF output. Font subsetting keeps the downloaded report small;
// the larger CJK source font is requested only on the first PDF export.
export async function createCoachPdf(report,{loadFonts=defaultAssets}={}) {
  const document=coachDocument(report);
  const [{PDFDocument,rgb}, {default:fontkit},fontBytes]=await Promise.all([
    import('./vendor/pdf-lib-1.17.1.mjs'),import('./vendor/fontkit-1.1.1.mjs'),loadFonts()
  ]);
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  // The UI semibold is already a small font subset. Re-subsetting its glyph
  // tables with fontkit drops outlines in PDF readers; embed that font intact.
  const [regular,semibold]=await Promise.all(fontBytes.map((bytes,i)=>pdf.embedFont(bytes,{subset:i===0})));
  pdf.setTitle(document.title);pdf.setAuthor('半拍 · BANPAI PIANO');pdf.setSubject(`${document.period.start} 至 ${document.period.end} · AI 阶段点评`);
  pdf.setCreator('半拍钢琴练习室');pdf.setLanguage('zh-CN');
  const color=hex=>rgb(...hex.match(/\w\w/g).map(v=>parseInt(v,16)/255));
  const C={ink:color('283C32'),body:color('35453C'),muted:color('647268'),line:color('DCE2D9'),pale:color('F2F5ED'),accent:color('A66C3C')};
  const regularSet=new Set(regular.getCharacterSet()),boldSet=new Set(semibold.getCharacterSet());
  const substitutions=new Set(),widths=new Map();
  let page,y=0;
  const fontFor=(text,bold)=>bold&&[...text].every(c=>boldSet.has(c.codePointAt(0)))?semibold:regular;
  const safeText=text=>[...String(text).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g,'').replace(/\t/g,'  ')].map(c=>{
    if(regularSet.has(c.codePointAt(0)))return c;
    if(c==='\u200b'||c==='\ufeff')return '';
    const label=`[U+${c.codePointAt(0).toString(16).toUpperCase()}]`;substitutions.add(label);return label;
  }).join('');
  const measure=(text,size,bold=false)=>{const f=fontFor(text,bold),key=`${f===semibold?'b':'r'}:${size}:${text}`;if(!widths.has(key))widths.set(key,f.widthOfTextAtSize(text,size));return widths.get(key);};
  const draw=(text,x,top,size=10.5,bold=false,ink=C.body)=>page.drawText(text,{x,y:HEIGHT-top-size,size,font:fontFor(text,bold),color:ink});
  const rule=(top,x=MARGIN,width=CONTENT)=>page.drawLine({start:{x,y:HEIGHT-top},end:{x:x+width,y:HEIGHT-top},thickness:.65,color:C.line});
  const rect=(x,top,width,height,fill)=>page.drawRectangle({x,y:HEIGHT-top-height,width,height,color:fill});
  function newPage() {
    page=pdf.addPage([WIDTH,HEIGHT]);
    draw('半拍',MARGIN,27,11,true,C.ink);draw('BANPAI  /  PRACTICE NOTES',MARGIN+38,31,7,false,C.muted);
    const period=`${document.period.start} - ${document.period.end}`;
    draw(period,WIDTH-MARGIN-measure(period,8),30,8,false,C.muted);rule(51);y=70;
  }
  const ensure=height=>{if(y+height>BOTTOM)newPage();};
  // Preserve English words when possible, with character fallback for long URLs.
  // Keep CJK closing punctuation together with the preceding character.
  function wrap(text,width,size,bold=false) {
    const tokens=[];
    for(const run of inlineRuns(text)) {
      const value=safeText(run.text),isBold=bold||run.bold;
      for(const token of value.match(/[A-Za-z0-9_:/?&=.%+#@-]+|[^\u0000-\uFFFF]|[\s\S]/gu)||[])
        tokens.push({text:token,bold:isBold});
    }
    for(let i=1;i<tokens.length;i++)if(/^[，。！？、；：）》」』】〕”’%,.!?:;)]$/.test(tokens[i].text)) {
      tokens[i-1].text+=tokens[i].text;tokens.splice(i,1);i--;
    }
    const lines=[];let line=[],used=0;
    const push=()=>{if(line.length)lines.push(line);line=[];used=0;};
    for(const token of tokens) {
      const parts=measure(token.text,size,token.bold)>width?[...token.text].map(text=>({...token,text})):[token];
      for(const part of parts) {
        const w=measure(part.text,size,part.bold);
        if(used+w>width+.01)push();
        if(!line.length&&/^\s+$/.test(part.text))continue;
        // Coalesce runs only when their selected font agrees; widths then match.
        const last=line.at(-1);
        if(last&&last.bold===part.bold&&fontFor(last.text,last.bold)===fontFor(part.text,part.bold))last.text+=part.text;
        else line.push({...part});
        used+=w;
      }
    }
    push();return lines;
  }
  function drawLine(line,x,top,size,ink=C.body) {
    for(const run of line){draw(run.text,x,top,size,run.bold,ink);x+=measure(run.text,size,run.bold);}
  }
  function paragraph(text,{size=10.5,lineHeight=19,gap=9,indent=0,bold=false,ink=C.body,bullet=false}={}) {
    const lines=wrap(text,CONTENT-indent,size,bold);if(!lines.length)return;
    // Keep the first two lines together, and avoid a single last line on a page.
    ensure(Math.min(2,lines.length)*lineHeight);
    for(let i=0;i<lines.length;i++) {
      if(lines.length-i===2)ensure(2*lineHeight);else ensure(lineHeight);
      if(i===0&&bullet)rect(MARGIN+1,y+7,3,3,C.accent);
      drawLine(lines[i],MARGIN+indent,y,size,ink);y+=lineHeight;
    }
    y+=gap;
  }
  function heading(text,{major=false,compact=false}={}) {
    const size=major?17:compact?12:13.2,step=compact?19:22,lines=wrap(text,CONTENT-13,size,true),height=lines.length*step;
    ensure(height+50);y+=compact?4:8;rect(MARGIN,y+3,3,15,C.accent);
    lines.forEach(line=>{drawLine(line,MARGIN+13,y,size,C.ink);y+=step;});y+=compact?5:8;
  }
  const percent=n=>Number.isFinite(n)?`${n}%`:'未形成评分';
  newPage();draw('REFLECT  /  PRACTISE  /  GROW',MARGIN,y,8,true,C.accent);y+=23;
  draw(document.title,MARGIN,y,28,true,C.ink);y+=46;
  paragraph('留住这一阶段的发现，让下一次练习更有方向。',{size:10,ink:C.muted,gap:16});
  const e=document.evidence;
  if(e) {
    const metrics=[[e.current.minutes,'记录练习 / 分钟'],[`${e.current.practiceDays} / ${e.period.days}`,'有练习的日子'],[e.current.sessions,'练习记录 / 条']];
    rect(MARGIN,y,CONTENT,83,C.pale);
    metrics.forEach(([value,label],i)=>{const x=MARGIN+18+i*CONTENT/3;draw(String(value),x,y+12,25,true,C.ink);draw(label,x,y+51,9,false,C.muted);});y+=98;
    paragraph(`固定速度  ·  音符准确率 ${percent(e.current.pitch)}  ·  起音合拍率 ${percent(e.current.rhythm)}`,{size:9.2,lineHeight:16,gap:5,ink:C.muted});
    if(e.current.follow.sessions)paragraph(`跟弹 ${e.current.follow.sessions} 遍  ·  错误尝试 ${e.current.follow.errorAttempts} 次  ·  首次通过率 ${percent(e.current.follow.firstPass)}  ·  首次起音合拍率 ${percent(e.current.follow.rhythm)}`,{size:9.2,lineHeight:16,gap:8,ink:C.muted});
    y+=7;
  }
  for(const block of document.blocks) {
    if(block.kind==='heading')heading(block.text);
    else if(block.kind==='rule'){ensure(25);rule(y+4);y+=20;}
    else paragraph(block.text,{indent:block.kind==='list'||block.kind==='quote'?14:0,bullet:block.kind==='list',ink:block.kind==='quote'?C.muted:C.body});
  }
  if(e) {
    newPage();draw('THE FACTS BEHIND THIS REPORT',MARGIN,y,8,true,C.accent);y+=21;
    heading('本次点评的练习依据',{major:true});
    paragraph('以下来自生成报告时保存的数据快照，与正文使用同一统计周期。',{size:9.5,ink:C.muted,gap:6});
    const rows=[['记录练习时长',`${e.current.minutes} 分钟`,`${e.previous.minutes} 分钟`],['有练习的日子',`${e.current.practiceDays} 天`,`${e.previous.practiceDays} 天`],['练习记录',`${e.current.sessions} 条`,`${e.previous.sessions} 条`],['自动采集 / 手动补记',`${e.current.captureMinutes} / ${e.current.manualMinutes} 分钟`,`${e.previous.captureMinutes} / ${e.previous.manualMinutes} 分钟`],['固定速度音符准确率',percent(e.current.pitch),percent(e.previous.pitch)],['固定速度起音合拍率',percent(e.current.rhythm),percent(e.previous.rhythm)]];
    const xs=[MARGIN+12,MARGIN+220,MARGIN+355];
    rect(MARGIN,y,CONTENT,29,C.pale);['统计项目',`本期 ${e.period.days} 天`,`此前 ${e.period.days} 天`].forEach((t,i)=>draw(t,xs[i],y+8,9,true));y+=29;
    for(const row of rows){row.forEach((v,i)=>draw(v,xs[i],y+6,9));y+=25;rule(y);}
    y+=10;
    paragraph(`实琴采集 ${e.current.midiSessions} 遍 · 屏幕琴键 ${e.current.virtualSessions} 遍 · 提前结束 ${e.current.incompleteSessions} 遍。学习目标 ${e.targetGrade} 级，每周计划 ${e.weeklyMinutes} 分钟。`,{size:9,lineHeight:15,gap:5,ink:C.muted});
    if(e.current.follow.sessions)paragraph(`跟弹单列：${e.current.follow.sessions} 遍，错误尝试 ${e.current.follow.errorAttempts} 次，纠错等待约 ${Math.round(e.current.follow.correctionSeconds)} 秒；首次通过率 ${percent(e.current.follow.firstPass)}，首次起音合拍率 ${percent(e.current.follow.rhythm)}。比例只计完整跟弹。`,{size:9,lineHeight:15,gap:5,ink:C.muted});
    if(e.pieces.length) {
      heading('本期曲目与练习范围',{compact:true});
      for(const p of e.pieces) {
        const mode=p.practiceMode==='follow'?'跟弹':'固定速度',hand={left:'左手',right:'右手',both:'双手'}[p.hand];
        const context=`${mode} · ${hand} · 第 ${p.startBar}-${p.endBar} 小节 · ${p.bpm} BPM · ${p.source==='midi'?'实琴':'屏幕琴键'}`;
        const metric=p.practiceMode==='follow'?`错误尝试 ${p.errorAttempts} 次 · 最近完整一遍首次通过率 ${percent(p.last?.firstPass)}`:`最近完整一遍音符准确率 ${percent(p.last?.pitch)}`;
        const title=wrap(p.title,CONTENT,10.5,true);ensure(title.length*19+66);
        paragraph(p.title,{bold:true,lineHeight:17,gap:1});paragraph(context,{size:8.7,lineHeight:14,gap:1,ink:C.muted});
        paragraph(`${p.attempts} 遍 / 完整 ${p.complete} 遍 / ${p.minutes} 分钟 · ${metric}`,{size:8.7,lineHeight:14,gap:7,ink:C.muted});
      }
    }
    const notesHeight=e.evidence.limitations.reduce((sum,n)=>sum+wrap(n,CONTENT-12,8.7).length*14+4,0);
    // Keep a short explanation and its closing metadata together, rather than
    // leaving one final bullet on a nearly empty page.
    ensure(Math.min(BOTTOM-70,notesHeight+100));
    heading('数据说明',{compact:true});
    for(const note of e.evidence.limitations)paragraph(note,{size:8.7,lineHeight:14,gap:4,indent:12,bullet:true,ink:C.muted});
  }
  ensure(64);y+=10;rule(y);y+=12;
  paragraph(`生成于 ${document.generatedAt} · ${document.model}`,{size:8,lineHeight:14,gap:3,ink:C.muted});
  paragraph('AI 建议用于练习复盘，请结合自己的感受与老师指导。',{size:8,lineHeight:14,gap:0,ink:C.muted});
  if(substitutions.size)paragraph('少数字体未包含的特殊符号以 [U+编码] 保留。',{size:8,lineHeight:14,ink:C.muted});
  const pages=pdf.getPages();
  pages.forEach((p,i)=>{page=p;rule(796);draw('半拍 · 钢琴练习室',MARGIN,807,8,false,C.muted);const label=`${String(i+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;draw(label,WIDTH-MARGIN-measure(label,8),807,8,false,C.muted);});
  return {bytes:await pdf.save(),filename:document.filename,pages:pages.length,substitutions:[...substitutions]};
}

export async function downloadCoachPdf(report) {
  const result=await createCoachPdf(report);
  const url=URL.createObjectURL(new Blob([result.bytes],{type:'application/pdf'}));
  const link=Object.assign(document.createElement('a'),{href:url,download:result.filename});
  document.body.append(link);link.click();link.remove();
  // Leave time for the browser to consume the download, then release memory.
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  return result;
}
