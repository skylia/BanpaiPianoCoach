/** Five-line grand staff. VexFlow 4.2.5 is vendored with its Bravura font. */
const NS = 'http://www.w3.org/2000/svg';
const GRID = 48; // Straight and triplet display grid; source events are never modified.
const MAX_BARS = 256;
const EPS = 1e-6;
export const DEFAULT_NOTATION_SCALE = .8;
export const MIN_NOTATION_SCALE = .5;
export const MAX_NOTATION_SCALE = 1.8;
const DURATIONS = [
  { ticks: 48, duration: 'w', dots: 1 }, { ticks: 32, duration: 'w', dots: 0 },
  { ticks: 24, duration: 'h', dots: 1 }, { ticks: 16, duration: 'h', dots: 0 },
  { ticks: 12, duration: 'q', dots: 1 }, { ticks: 8, duration: 'q', dots: 0 },
  { ticks: 6, duration: '8', dots: 1 }, { ticks: 4, duration: '8', dots: 0 },
  { ticks: 3, duration: '16', dots: 1 }, { ticks: 2, duration: '16', dots: 0 },
  { ticks: 1, duration: '32', dots: 0 },
  { ticks: .5, duration: '64', dots: 0 },
].map(d=>({...d,ticks:d.ticks*6}));
const TRIPLETS=[['w',128],['h',64],['q',32],['8',16],['16',8],['32',4],['64',2],['128',1]].map(([duration,ticks])=>({ticks,duration,dots:0,tuplet:true}));
const KEY_SIGS = { C:0, G:1, D:2, A:3, E:4, B:5, 'F#':6, 'C#':7, F:-1, Bb:-2, Eb:-3, Ab:-4, Db:-5, Gb:-6, Cb:-7, Am:0, Em:1, Bm:2, 'F#m':3, 'C#m':4, 'G#m':5, 'D#m':6, 'A#m':7, Dm:-1, Gm:-2, Cm:-3, Fm:-4, Bbm:-5, Ebm:-6, Abm:-7 };
const finite = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function notationTime(score) {
  const ts = score.timeSignature;
  const pair = Array.isArray(ts) ? ts : typeof ts === 'string' ? ts.split('/') : [ts?.numerator ?? ts?.beats ?? 4, ts?.denominator ?? ts?.beatType ?? 4];
  const numerator = clamp(Math.round(finite(pair[0], 4)), 1, 16);
  const denominator = [1,2,4,8,16,32].includes(Number(pair[1])) ? Number(pair[1]) : 4;
  return { numerator, denominator, barBeats: numerator * 4 / denominator };
}
function noteHand(note) { return ['left','lh','L'].includes(note.hand) ? 'left' : ['right','rh','R'].includes(note.hand) ? 'right' : (note.pitch !== null && Number(note.pitch) < 60 ? 'left' : 'right'); }
/** Select one consistent clef per hand for the whole score, including range previews. */
export function chooseNotationClefs(score) {
  const result = { right: 'treble', left: 'bass' };
  for (const hand of ['right','left']) {
    const pitches = (Array.isArray(score.notes) ? score.notes : [])
      .filter(note => noteHand(note) === hand && note.pitch !== null && Number.isFinite(Number(note.pitch)))
      .map(note => Number(note.pitch)).sort((a,b) => a-b);
    if (!pitches.length) continue;
    const middle = Math.floor(pitches.length / 2);
    const median = pitches.length % 2 ? pitches[middle] : (pitches[middle-1] + pitches[middle]) / 2;
    result[hand] = median >= 60 ? 'treble' : 'bass';
  }
  return result;
}
function splitDuration(ticks) {
  const result=[];
  while(ticks>0){
    const pool=ticks%3===0?DURATIONS:TRIPLETS;
    const spec=pool.find(d=>d.ticks<=ticks)||TRIPLETS.at(-1);
    result.push(spec);ticks-=spec.ticks;
  }
  return result;
}
/** Pure notation preparation; never changes or quantizes the source practice data. */
export function buildNotationBars(score, options = {}) {
  const time = notationTime(score);
  const warnings = new Set();
  let adjusted = false;
  const notes = (Array.isArray(score.notes) ? score.notes : []).map((n, i) => {
    const rawBeat = Math.max(0, finite(n.beat, 0));
    const rawDuration = Math.max(.01, finite(n.duration, 1));
    const start = Math.round(rawBeat * GRID), end = Math.max(start + 1, Math.round((rawBeat + rawDuration) * GRID));
    if (Math.abs(start/GRID-rawBeat) > .00001 || Math.abs((end-start)/GRID-rawDuration) > .00001) adjusted = true;
    return { ...n, id: String(n.id ?? `note-${i}`), pitch: n.pitch === null || n.pitch === undefined ? null : clamp(Math.round(finite(n.pitch,60)),0,127), hand: noteHand(n), start, end };
  }).sort((a,b) => a.start-b.start || (a.pitch??0)-(b.pitch??0));
  if (adjusted) warnings.add('五线谱按普通与三连音细分网格显示；极短装饰音可能近似，原始演奏与分析时值保持不变。');
  const barTicks = Math.round(time.barBeats*GRID);
  const totalTicks = Math.max(barTicks, Math.ceil(finite(score.totalBeats,0)*GRID), ...notes.map(n => n.end));
  const totalBars = Math.ceil(totalTicks/barTicks);
  const first = clamp(Math.round(finite(options.startBar,1)),1,Math.max(1,totalBars));
  const last = clamp(Math.round(finite(options.endBar,totalBars)),first,Math.min(totalBars,first+MAX_BARS-1));
  if (last < totalBars && options.endBar === undefined) warnings.add(`本次显示第 ${first}–${last} 小节；长谱可选择练习小节范围。`);
  const bars = [];
  for (let bar = first-1; bar < last; bar++) {
    const start = bar*barTicks, end = start+barTicks;
    const entry = { number: bar+1, startBeat: start/GRID, endBeat: end/GRID, hands: {}, maxEvents: 0 };
    for (const hand of ['right','left']) {
      const relevant = notes.filter(n => n.hand===hand && n.start<end && n.end>start);
      const pitched = relevant.filter(n => n.pitch!==null);
      const cuts = [...new Set([start,end,...relevant.flatMap(n => [Math.max(start,n.start),Math.min(end,n.end)])])].sort((a,b)=>a-b);
      const segments=[];
      for (let c=0;c<cuts.length-1;c++) {
        const from=cuts[c],to=cuts[c+1];
        const active=pitched.filter(n=>n.start<=from && n.end>=to);
        // A single staff voice preserves all pitches/durations through tied chords.
        if (active.length>1 && (new Set(active.map(n=>n.start)).size>1 || new Set(active.map(n=>n.end)).size>1)) warnings.add('复调以共用符干和延音线显示；保留音高与时值，未还原原版声部分配。');
        const unique=[];
        for(const n of active) if(!unique.some(v=>v.pitch===n.pitch)) unique.push(n); else warnings.add('重叠的同音在谱面中合并显示，分析仍使用原始音符。');
        const rests=active.length ? [] : relevant.filter(n=>n.pitch===null && n.start<=from && n.end>=to);
        let tick=from;
        for(const spec of splitDuration(to-from)) {
          segments.push({ beat:tick/GRID, duration:spec.ticks/GRID, value:spec.duration, dots:spec.dots, tuplet:!!spec.tuplet, notes:unique, rests, hand }); tick+=spec.ticks;
        }
      }
      entry.hands[hand]=segments;
      entry.maxEvents=Math.max(entry.maxEvents,segments.length);
    }
    bars.push(entry);
  }
  return { bars, notes, time, totalBars, clefs: chooseNotationClefs({notes}), warnings:[...warnings], keySignature: Object.hasOwn(KEY_SIGS,score.keySignature) ? score.keySignature : 'C' };
}
function pitchKey(pitch,key) {
  const flat=KEY_SIGS[key]<0;
  const keys=flat?['c','db','d','eb','e','f','gb','g','ab','a','bb','b']:['c','c#','d','d#','e','f','f#','g','g#','a','a#','b'];
  return `${keys[pitch%12]}/${Math.floor(pitch/12)-1}`;
}
function signatureState(key) {
  const count=KEY_SIGS[key]||0,result={};
  for(const letter of (count<0?['b','e','a','d','g','c','f']:['f','c','g','d','a','e','b']).slice(0,Math.abs(count))) result[letter]=count<0?'b':'#';
  return result;
}
function svgElement(name, attrs={}) { const el=document.createElementNS(NS,name); for(const [key,value] of Object.entries(attrs)) el.setAttribute(key,String(value)); return el; }
function plain(container, text, className) { const el=document.createElement('div'); el.className=className;el.textContent=text;container.append(el);return el; }

/** Keep the current system and its successor in view when both fit. */
export function notationFollowTarget({top,height,nextBottom,scrollTop,viewportHeight}) {
  const inset=12,available=viewportHeight-inset*2;
  const previewFits=Number.isFinite(nextBottom)&&nextBottom-top<=available;
  const bottom=previewFits?nextBottom:top+Math.min(height,available);
  if(top>=scrollTop+inset && bottom<=scrollTop+viewportHeight-inset)return null;
  // Systems already contain top padding; align their edge to hide fragments of
  // the preceding system, while retaining the bar numbers and full upper staff.
  return Math.max(0,top);
}

export function renderNotation(container, score, options = {}) {
  if (!container) throw new TypeError('A notation container is required');
  const V=globalThis.Vex?.Flow ?? globalThis.Vex;
  const prepared=buildNotationBars(score,options);
  const displayScale=clamp(finite(options.scale,DEFAULT_NOTATION_SCALE),MIN_NOTATION_SCALE,MAX_NOTATION_SCALE);
  let gone=false,progress=null,selected=null,lastWidth=0,resizeTimer,following=true;
  let drawings=[],notesById=new Map(),rows=[],cursor=null,surface=null,lastFollowRow=-1;
  container.classList.add('notation-view');
  if (!container.hasAttribute('tabindex')) container.tabIndex=0;
  container.setAttribute('aria-label',`${score.title||'练习曲'}，五线谱，可在谱面内滚动查看`);
  const colorForHand=hand=>options.selectedHand && options.selectedHand!=='both' && options.selectedHand!==hand ? '#b9b9b5' : '#273b39';
  const render=()=>{
    if(gone)return;
    container.replaceChildren(); drawings=[];notesById=new Map();rows=[];lastFollowRow=-1;
    if(!V?.Renderer) { plain(container,'谱面组件未能加载，请刷新页面后重试。','notation-error'); return; }
    const width=container.clientWidth||800;
    lastWidth=width;
    surface=document.createElement('div');surface.className='notation-surface';container.append(surface);
    const legend=document.createElement('div');legend.className='notation-legend';
    for(const text of [`${prepared.clefs.right==='treble'?'高音':'低音'}谱表 · 右手`,`${prepared.clefs.left==='treble'?'高音':'低音'}谱表 · 左手`,`${prepared.time.numerator}/${prepared.time.denominator} 拍`]) {const span=document.createElement('span');span.textContent=text;legend.append(span);}
    if(prepared.warnings.length) {
      const notice=document.createElement('details');notice.className='notation-notice';
      const summary=document.createElement('summary');summary.textContent='谱面转录说明';notice.append(summary);
      const explanation=document.createElement('p');explanation.textContent=prepared.warnings.join(' ');notice.append(explanation);legend.append(notice);
    }
    surface.append(legend);
    const logicalWidth=Math.max(330,(width-32)/displayScale);
    const allRows=[];
    let current=[],used=0;
    for(const bar of prepared.bars) {
      const base=Math.max(156,bar.maxEvents*28+40);
      const signatureExtra=94+(Math.abs(KEY_SIGS[prepared.keySignature])||0)*9;
      const needed=base+(current.length?0:signatureExtra);
      if(current.length && used+needed>logicalWidth-36) {allRows.push(current);current=[];used=0;}
      const entry={bar,minWidth:base+(current.length?0:signatureExtra)};
      current.push(entry);used+=entry.minWidth;
      if(used>=logicalWidth-36) {allRows.push(current);current=[];used=0;}
    }
    if(current.length)allRows.push(current);
    const allTies=[];
    const refs=new Map();
    allRows.forEach((row,rowIndex)=>{
      const rowDiv=document.createElement('div');rowDiv.className='notation-system';rowDiv.dataset.row=String(rowIndex);rowDiv.dataset.rightClef=prepared.clefs.right;rowDiv.dataset.leftClef=prepared.clefs.left;surface.append(rowDiv);
      const rowMin=row.reduce((sum,b)=>sum+b.minWidth,0)+36;
      const rowWidth=Math.max(logicalWidth,rowMin);
      const inRow=prepared.notes.filter(n=>n.pitch!==null && n.start/GRID<row.at(-1).bar.endBeat && n.end/GRID>row[0].bar.startBeat);
      // Vertical spacing follows the actual clef and written diatonic position.
      const staffStep=pitch=>{const key=pitchKey(pitch,prepared.keySignature);return Number(key.split('/')[1])*7+{c:0,d:1,e:2,f:3,g:4,a:5,b:6}[key[0]];};
      const upper=inRow.filter(n=>n.hand==='right').map(n=>staffStep(n.pitch)),lower=inRow.filter(n=>n.hand==='left').map(n=>staffStep(n.pitch));
      const upperTop=prepared.clefs.right==='treble'?37:26,lowerTop=prepared.clefs.left==='treble'?37:26;
      const topPadding=Math.max(0,(Math.max(upperTop+5,...upper)-upperTop-5)*5);
      const middlePadding=Math.max(0,(upperTop-14-Math.min(upperTop-14,...upper))*5)+Math.max(0,(Math.max(lowerTop+4,...lower)-lowerTop-4)*5);
      const bottomPadding=Math.max(0,(lowerTop-12-Math.min(lowerTop-12,...lower))*5);
      const trebleY=28+topPadding,bassY=138+topPadding+middlePadding;
      const rowHeight=246+topPadding+middlePadding+bottomPadding;
      const renderer=new V.Renderer(rowDiv,V.Renderer.Backends.SVG);
      renderer.resize(rowWidth*displayScale,rowHeight*displayScale);
      const ctx=renderer.getContext();ctx.scale(displayScale,displayScale);
      const svg=rowDiv.querySelector('svg');svg.classList.add('notation-svg');svg.setAttribute('role','img');svg.setAttribute('aria-label',`第 ${row[0].bar.number} 至 ${row.at(-1).bar.number} 小节`);
      const widthBudget=rowWidth-36;
      const minTotal=row.reduce((s,b)=>s+b.minWidth,0);
      let x=22;
      row.forEach(({bar,minWidth},barInRow)=>{
        const bw=minWidth+(widthBudget-minTotal)/row.length;
        const top=new V.Stave(x,trebleY,bw),bottom=new V.Stave(x,bassY,bw);
        const first=barInRow===0;
        if(first) {top.addClef(prepared.clefs.right);bottom.addClef(prepared.clefs.left);if(prepared.keySignature!=='C') {top.addKeySignature(prepared.keySignature);bottom.addKeySignature(prepared.keySignature);} if(rowIndex===0) {top.addTimeSignature(`${prepared.time.numerator}/${prepared.time.denominator}`);bottom.addTimeSignature(`${prepared.time.numerator}/${prepared.time.denominator}`);}}
        if(bar.number===prepared.totalBars) {top.setEndBarType(V.Barline.type.END);bottom.setEndBarType(V.Barline.type.END);}
        top.setContext(ctx).draw();bottom.setContext(ctx).draw();
        if(first) {new V.StaveConnector(top,bottom).setType(V.StaveConnector.type.BRACE).setContext(ctx).draw();new V.StaveConnector(top,bottom).setType(V.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();}
        new V.StaveConnector(top,bottom).setType(V.StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw();
        const label=svgElement('text',{x:x+3,y:23,class:'notation-bar-number'});label.textContent=String(bar.number);
        const scaledLabel=svgElement('g');scaledLabel.append(label);svg.append(scaledLabel);
        const noteStart=Math.max(top.getNoteStartX(),bottom.getNoteStartX());top.setNoteStartX(noteStart);bottom.setNoteStartX(noteStart);
        const voices=[],voiceSets=[],beamSets=[],tupletSets=[];
        for(const [hand,stave,clef] of [['right',top,prepared.clefs.right],['left',bottom,prepared.clefs.left]]) {
          const accidentalState=new Map(),defaults=signatureState(prepared.keySignature);
          const staffNotes=bar.hands[hand].map(segment=>{
            const isRest=segment.notes.length===0;
            const source=isRest?segment.rests:segment.notes;
            const keys=isRest?[clef==='treble'?'b/4':'d/3']:segment.notes.map(n=>pitchKey(n.pitch,prepared.keySignature));
            const note=new V.StaveNote({keys,duration:segment.value+(isRest?'r':''),dots:segment.dots,clef,auto_stem:true});
            note.setStave(stave);note.setStyle({fillStyle:colorForHand(hand),strokeStyle:colorForHand(hand)});
            if(segment.dots)V.Dot.buildAndAttach([note],{all:true});
            if(!isRest)segment.notes.forEach((n,index)=>{
              const key=keys[index],letter=key[0],accidental=key.slice(1,key.indexOf('/')),stateKey=letter+key.slice(key.indexOf('/'));
              const prev=accidentalState.get(stateKey)??defaults[letter]??'';
              if(accidental!==prev && Math.abs(segment.beat-n.start/GRID)<EPS)note.addModifier(new V.Accidental(accidental||'n'),index);
              accidentalState.set(stateKey,accidental);
              if(options.showFingering!==false && n.finger>=1 && n.finger<=5 && Math.abs(segment.beat-n.start/GRID)<EPS) {
                const fingering=new V.FretHandFinger(String(n.finger));fingering.setPosition(hand==='right'?V.Modifier.Position.ABOVE:V.Modifier.Position.BELOW);note.addModifier(fingering,index);
              }
              if(options.showLabels && Math.abs(segment.beat-n.start/GRID)<EPS && index===segment.notes.length-1) {const annotation=new V.Annotation(keys[index].replace('/','').toUpperCase()).setFont('Arial',10);annotation.setVerticalJustification(V.Annotation.VerticalJustify.BOTTOM);note.addModifier(annotation,index);}
            });
            const d={note,segment,source,rowIndex,bar:bar.number,stave,hand};drawings.push(d);
            for(const n of source) {if(!notesById.has(n.id))notesById.set(n.id,[]);notesById.get(n.id).push(d);}
            return note;
          });
          let tripletGroup=[];
          const finishTuplet=()=>{if(tripletGroup.length){tupletSets.push(new V.Tuplet(tripletGroup,{num_notes:3,notes_occupied:2,bracketed:true,ratioed:true}));tripletGroup=[];}};
          bar.hands[hand].forEach((segment,i)=>{if(segment.tuplet){tripletGroup.push(staffNotes[i]);if(Math.abs((segment.beat+segment.duration)%1)<EPS)finishTuplet();}else finishTuplet();});finishTuplet();
          const voice=new V.Voice({num_beats:prepared.time.numerator,beat_value:prepared.time.denominator}).setMode(V.Voice.Mode.SOFT).addTickables(staffNotes);
          voices.push(voice);voiceSets.push({voice,stave,hand,staffNotes});
          const grouping=prepared.time.denominator===8 && prepared.time.numerator%3===0?new V.Fraction(3,8):new V.Fraction(1,4);
          const beams=V.Beam.generateBeams(staffNotes,{groups:[grouping],maintain_stem_directions:false});
          beams.forEach(beam=>beam.setStyle({fillStyle:colorForHand(hand),strokeStyle:colorForHand(hand)}));beamSets.push(beams);
        }
        const formatter=new V.Formatter();voiceSets.forEach(v=>formatter.joinVoices([v.voice]));
        try {
          formatter.format(voices,Math.max(52,x+bw-noteStart-20));
          voiceSets.forEach(v=>v.voice.draw(ctx,v.stave));beamSets.flat().forEach(beam=>beam.setContext(ctx).draw());tupletSets.forEach(t=>t.setContext(ctx).draw());
          for(const d of drawings.filter(d=>d.bar===bar.number)) {
            for(let k=0;k<d.segment.notes.length;k++) {
              const n=d.segment.notes[k],prev=refs.get(n.id);
              if(prev && Math.abs(prev.segment.beat+prev.segment.duration-d.segment.beat)<EPS) allTies.push({previous:prev,current:d,index:k,previousIndex:prev.segment.notes.findIndex(v=>v.id===n.id)});
              refs.set(n.id,d);
            }
          }
        }catch(error) {const fallback=svgElement('text',{x:x+20,y:112,fill:'#8a583b','font-size':12});fallback.textContent='此小节过于复杂，请简化声部后查看';const group=svgElement('g');group.append(fallback);svg.append(group);console.warn('Notation measure fallback',bar.number,error?.message);}
        x+=bw;
      });
      rows.push({element:rowDiv,svg,ctx,index:rowIndex,scale:displayScale,trebleY,bassY,startBeat:row[0].bar.startBeat,endBeat:row.at(-1).bar.endBeat});
    });
    for(const {previous,current,index,previousIndex} of allTies) {
      try {
        if(previous.rowIndex===current.rowIndex)new V.StaveTie({first_note:previous.note,last_note:current.note,first_indices:[previousIndex],last_indices:[index]}).setContext(rows[current.rowIndex].ctx).draw();
        else {new V.StaveTie({first_note:previous.note,first_indices:[previousIndex]}).setContext(rows[previous.rowIndex].ctx).draw();new V.StaveTie({last_note:current.note,last_indices:[index]}).setContext(rows[current.rowIndex].ctx).draw();}
      }catch(error){console.warn('Notation tie fallback',error?.message);}
    }
    for(const d of drawings) {
      const el=d.note.getSVGElement?.();if(el){d.element=el;el.classList.add('notation-note');if(d.source.length){el.dataset.noteId=d.source[0].id;el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`${d.bar} 小节，${d.segment.hand==='left'?'左手':'右手'}，${d.segment.notes.length?d.segment.notes.map(n=>pitchKey(n.pitch,prepared.keySignature).replace('/','').toUpperCase()).join('、'):'休止符'}`);const click=()=>options.onNoteClick?.(d.source[0].id);el.addEventListener('click',click);el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();click();}});}}
    }
    if(selected!==null)selectNote(selected);
    if(progress!==null)setProgress(progress,{follow:following});
  };
  function selectNote(id) { selected=id===null?null:String(id);for(const d of drawings)d.element?.classList.toggle('notation-selected',selected!==null&&d.source.some(n=>n.id===selected)); }
  function setProgress(absoluteQuarterBeat,{follow=true}={}) {
    progress=absoluteQuarterBeat;
    following=follow;
    if(!follow)lastFollowRow=-1;
    if(gone)return;
    for(const d of drawings)d.element?.classList.toggle('notation-playing',(!options.selectedHand||options.selectedHand==='both'||options.selectedHand===d.hand)&&Number.isFinite(progress)&&progress>=d.segment.beat-EPS&&progress<d.segment.beat+d.segment.duration-EPS);
    cursor?.remove();cursor=null;
    if(!Number.isFinite(progress))return;
    const row=rows.find(r=>progress>=r.startBeat-EPS&&progress<r.endBeat-EPS);if(!row)return;
    const candidates=drawings.filter(d=>d.rowIndex===row.index&&d.segment.beat<=progress+EPS&&(!options.selectedHand||options.selectedHand==='both'||options.selectedHand===d.hand));
    const closest=candidates.sort((a,b)=>b.segment.beat-a.segment.beat)[0];if(!closest)return;
    let xpos;try{xpos=(closest.note.getNoteHeadBeginX()+closest.note.getNoteHeadEndX())/2;}catch{return;}
    // VexFlow applies display scale through the SVG viewBox. These coordinates
    // already share its user space; a second scale displaced the playhead.
    cursor=svgElement('g',{class:'notation-playhead','aria-hidden':'true'});
    cursor.append(svgElement('rect',{x:xpos-12,y:row.trebleY+9,width:24,height:row.bassY-row.trebleY+60,rx:9,fill:'#54a495','fill-opacity':'.12'}));
    cursor.append(svgElement('path',{d:`M ${xpos-5} ${row.trebleY+1} L ${xpos+5} ${row.trebleY+1} L ${xpos} ${row.trebleY+7} Z`,fill:'#267c6c'}));
    row.svg.append(cursor);
    if(follow&&lastFollowRow!==row.index) {
      lastFollowRow=row.index;
      const origin=container.getBoundingClientRect().top+container.clientTop-container.scrollTop;
      const currentRect=row.element.getBoundingClientRect(),nextRect=rows[row.index+1]?.element.getBoundingClientRect();
      const target=notationFollowTarget({top:currentRect.top-origin,height:currentRect.height,nextBottom:nextRect?nextRect.bottom-origin:null,scrollTop:container.scrollTop,viewportHeight:container.clientHeight});
      // Move between systems immediately: an animated page turn consumes preview time.
      if(target!==null)container.scrollTo({top:target,behavior:'instant'});
    }
  }
  render();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(entries=>{const w=Math.round(entries[0]?.contentRect.width||0);if(w>0&&Math.abs(w-lastWidth)>8){clearTimeout(resizeTimer);resizeTimer=setTimeout(render,110);}}):null;
  observer?.observe(container);
  return {setProgress,selectNote,destroy(){gone=true;clearTimeout(resizeTimer);observer?.disconnect();container.replaceChildren();drawings=[];notesById.clear();}};
}
