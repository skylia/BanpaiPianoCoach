import {musicalTiming,musicalDynamics,ornamentEvidence,MUSICAL_VERSION} from './evaluation.mjs';
const groupByOnset=(notes,span)=>{const groups=[];for(const n of notes){let g=groups.at(-1);if(!g||n.time-g.time>span){g={time:n.time,bar:n.bar,notes:[]};groups.push(g);}g.notes.push(n);}return groups;};
// A bounded sequence alignment ignores absolute clock drift. Timing is evaluated
// separately, against surrounding intervals; arbitrary timing is not normalized away.
export function analyzeMusical(score,events,bpm,{interrupted=false,ornaments=score.ornaments??[]}={}){
 const grace=new Set(ornaments.flatMap(o=>o.graceNoteIds)),targets=score.filter(n=>!grace.has(n.id));
 const actual=events.filter(n=>n&&Number.isFinite(n.pitch)&&Number.isFinite(n.time)&&n.time>=0).map((n,index)=>({...n,eventIndex:index})).toSorted((a,b)=>a.time-b.time);
 const base={evaluationProfile:'musical',analysisVersion:MUSICAL_VERSION,targetCount:targets.length,interrupted,observations:[],ornamentResults:[],performedToEnd:false};
 if(!actual.length)return {...base,empty:true,rows:[],extras:[],count:0};
 const expected=groupByOnset(targets.toSorted((a,b)=>a.time-b.time),1e-6),anchor=new Map(ornaments.map(o=>[o.noteId,o]));
 const minGap=Math.min(...expected.slice(1).map((g,i)=>g.time-expected[i].time));
 const played=groupByOnset(actual,Math.min(.08,60/bpm*.16,minGap*.32));
 const n=expected.length,m=played.length;
 if(n>4096||m>8192)throw Error('演奏超过分析容量。');
 const cost=(e,a)=>{let matched=0;const used=new Set();for(const note of e.notes){const o=anchor.get(note.id),i=a.notes.findIndex((x,i)=>!used.has(i)&&(x.pitch===note.pitch||o&&x.pitch===o.auxiliaryPitch));if(i>=0){used.add(i);matched++;}}return 1.4*(1-matched/Math.max(e.notes.length,a.notes.length));};
 const directions=new Uint8Array((n+1)*(m+1));let previous=new Float64Array(m+1),row=new Float64Array(m+1);
 for(let j=1;j<=m;j++){previous[j]=j*.85;directions[j]=2;}
 for(let i=1;i<=n;i++){row[0]=i;directions[i*(m+1)]=1;for(let j=1;j<=m;j++){const diagonal=previous[j-1]+cost(expected[i-1],played[j-1]),deletion=previous[j]+1,insertion=row[j-1]+.85;let value=diagonal,d=0;if(deletion<value-1e-9){value=deletion;d=1;}if(insertion<=value+1e-9){value=insertion;d=2;}row[j]=value;directions[i*(m+1)+j]=d;}[previous,row]=[row,previous];}
 const pairs=[];let i=n,j=m;while(i||j){const d=directions[i*(m+1)+j];if(i&&j&&d===0){pairs.push([--i,--j]);}else if(i&&(j===0||d===1))i--;else j--;}
 pairs.reverse();const used=new Set(),rows=targets.map(expected=>({expected,played:null,status:'missing',delta:null,timing:null})),byId=new Map(rows.map((r,i)=>[r.expected.id??r.expected,i]));
 const aligned=expected.map(g=>({...g,playedTime:null}));
 for(const [ei,ai]of pairs){
   const e=expected[ei],a=played[ai],remaining=[...a.notes],unmatched=[];aligned[ei].playedTime=a.time;
   const assign=(en,an,status)=>{used.add(an.eventIndex);rows[byId.get(en.id??en)]={expected:en,played:an,status,delta:null,timing:null};};
   // Reserve all exact chord tones first. Otherwise an omitted first chord
   // tone steals a correctly played later tone and creates two false errors.
   for(const en of e.notes){const o=anchor.get(en.id),k=remaining.findIndex(x=>x.pitch===en.pitch||o&&x.pitch===o.auxiliaryPitch);if(k<0)unmatched.push(en);else assign(en,remaining.splice(k,1)[0],'correct');}
   for(const en of unmatched)if(remaining.length)assign(en,remaining.shift(),'wrong');
 }
 // An auxiliary pitch can equal the next melody note. Prefer a written
 // terminating grace pattern; otherwise use surrounding accompaniment pace to
 // avoid assigning an early trill repetition to that next anchor.
 for(const o of ornaments){const main=rows.find(r=>r.expected.id===o.noteId),end=rows.find(r=>r.expected.hand===o.hand&&r.expected.time>=o.endTime-1e-6);if(!main?.played||!end)continue;
   const after=rows.find(r=>r.expected.hand===o.hand&&r.expected.time>end.expected.time+1e-6&&r.played),limit=after?.played.time??Infinity,start=main.played.time;
   const nearby=rows.filter(r=>r.played&&r.expected.time>o.time&&r.expected.time<o.endTime&&r.expected.hand!==o.hand),ratios=nearby.map(r=>(r.played.time-start)/(r.expected.time-o.time));const pace=ratios.length?ratios.toSorted((a,b)=>a-b)[Math.floor(ratios.length/2)]:1;
   const candidates=actual.filter(a=>a.pitch===end.expected.pitch&&a.time>start&&a.time<limit),allowed=new Set([o.mainPitch,o.auxiliaryPitch,...o.gracePitches]);
   const hasTail=a=>{const preceding=actual.filter(x=>x.time>=start&&x.time<a.time&&allowed.has(x.pitch));return o.gracePitches.length&&o.gracePitches.every((p,i)=>preceding.at(i-o.gracePitches.length)?.pitch===p);};
   const selected=candidates.find(hasTail)??candidates.find(a=>a.time>=start+(o.endTime-o.time)*pace*.95);
   if(selected){if(end.played)used.delete(end.played.eventIndex);end.played=selected;end.status='correct';used.add(selected.eventIndex);const group=aligned.find(g=>g.notes.includes(end.expected));if(group)group.playedTime=Math.min(...group.notes.map(n=>rows[byId.get(n.id??n)].played?.time??Infinity));}
 }
 for(const o of ornaments){const allowed=new Set([o.mainPitch,o.auxiliaryPitch,...o.gracePitches]);for(const r of rows){if(r.expected.hand!==o.hand&&r.expected.time>=o.time&&r.expected.time<o.endTime&&r.status==='wrong'&&allowed.has(r.played?.pitch)){used.delete(r.played.eventIndex);r.played=null;r.status='missing';const g=aligned.find(g=>g.notes.includes(r.expected));if(g)g.playedTime=g.notes.some(n=>rows[byId.get(n.id??n)].played)?Math.min(...g.notes.map(n=>rows[byId.get(n.id??n)].played?.time??Infinity)):null;}}}
 const timing=musicalTiming(aligned);for(let k=0;k<aligned.length;k++)for(const note of aligned[k].notes){const row=rows[byId.get(note.id??note)];if(row.played)Object.assign(row,timing.entries[k]);}
 const ornamentResults=[];
 for(const o of ornaments){const main=rows.find(r=>r.expected.id===o.noteId),end=rows.find(r=>r.expected.time>=o.endTime-1e-6&&r.played),startTime=main?.played?.time;
   if(startTime===undefined){ornamentResults.push({...ornamentEvidence(o,[]),wrongPitches:[]});continue;}
   const endTime=end?.played?.time??(actual.at(-1).time+1e-6),allowed=new Set([o.mainPitch,o.auxiliaryPitch,...o.gracePitches]);
   const passage=actual.filter(a=>a.time>=startTime-1e-6&&a.time<endTime-1e-6&&(a.eventIndex===main.played.eventIndex||!used.has(a.eventIndex)));
   const evidence=ornamentEvidence(o,passage),wrongPitches=[...new Set(passage.filter(a=>!allowed.has(a.pitch)).map(a=>a.pitch))];
   for(const a of passage)if(allowed.has(a.pitch))used.add(a.eventIndex);
   evidence.wrongPitches=wrongPitches;evidence.valid&&=!wrongPitches.length;if(wrongPitches.length)evidence.message='装饰音时段出现了标注音组以外的音，请回听核对。';ornamentResults.push(evidence);
 }
 const extras=actual.filter(a=>!used.has(a.eventIndex)),correct=rows.filter(r=>r.status==='correct').length,wrong=rows.filter(r=>r.status==='wrong').length,missing=rows.filter(r=>r.status==='missing').length,paired=rows.filter(r=>r.played),steady=paired.filter(r=>r.timing==='steady').length,dynamics=musicalDynamics(paired.filter(r=>r.status==='correct').map(r=>r.played)),observations=[...timing.observations,...ornamentResults.filter(o=>!o.valid).map(o=>({type:'ornament',bar:o.bar,message:o.message})),...(dynamics?[dynamics]:[])];
 const extraBars=new Map();
 for(const extra of extras){const closest=paired.reduce((best,r)=>!best||Math.abs(r.played.time-extra.time)<Math.abs(best.played.time-extra.time)?r:best,null),bar=closest?.expected.bar;if(Number.isInteger(bar))extraBars.set(bar,(extraBars.get(bar)||0)+1);}
 for(const [bar,count]of extraBars)observations.push({type:'extra',bar,message:`这一小节附近记录到 ${count} 个未对应谱面主干或装饰音的音，请回听核对。`});
 const last=aligned.at(-1),performedToEnd=!!last&&last.playedTime!==null&&paired.length>=targets.length*.6;
 return {...base,empty:false,rows,extras,count:actual.length,correct,wrong,missing,paired:paired.length,steady,pitch:Math.round(correct/Math.max(1,targets.length+extras.length)*100),rhythm:paired.filter(r=>r.timing!==null).length>=3?Math.round(steady/paired.filter(r=>r.timing!==null).length*100):null,tolerance:null,averageDeviation:null,coverage:Math.round(paired.length/Math.max(1,targets.length)*100),observations,ornamentResults,performedToEnd};
}
