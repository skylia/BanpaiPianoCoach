// Evaluation profiles are independent from the transport (fixed / follow).
export const MUSICAL_VERSION='banpai-musical-1';
export const TECHNIQUE_VERSION='banpai-technique-1';
export function evaluationVersion(profile,follow=false){return profile==='musical'?MUSICAL_VERSION+(follow?'-follow':''):profile==='technique'?TECHNIQUE_VERSION+(follow?'-follow':''):follow?'banpai-follow-1':'banpai-onset-1';}
export function validateEvaluationProfile(profile){if(profile!==undefined&&!['musical','technique'].includes(profile))throw Error('评价标准无效。');return profile;}
export const median=values=>{const a=values.filter(Number.isFinite).toSorted((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:null;};

// Compare interval proportions against a multi-note local pace, not a metronome.
// The current interval is excluded so an isolated hesitation cannot explain itself.
export function musicalTiming(groups){
 const intervals=groups.map((g,i)=>{const p=groups[i-1];return p&&g.playedTime!==null&&p.playedTime!==null&&g.time>p.time?{ratio:(g.playedTime-p.playedTime)/(g.time-p.time),gap:g.playedTime-p.playedTime,expected:g.time-p.time}:null;});
 const positive=intervals.filter(v=>v&&v.ratio>0).map(v=>v.ratio),global=median(positive)||1, observations=[];
 const entries=groups.map((g,i)=>{const v=intervals[i];if(!v||v.ratio<=0)return {delta:null,timing:null,tolerance:null};const neighbors=intervals.slice(Math.max(1,i-3),i+4).filter((x,j)=>x&&Math.max(1,i-3)+j!==i&&x.ratio>0).map(x=>x.ratio);const pace=median(neighbors)||global,expected=v.expected*pace,delta=v.gap-expected,tolerance=Math.max(.045,expected*.38);const pause=v.gap>Math.max(1.5,expected*2.5),timing=Math.abs(delta)<=tolerance?'steady':delta<0?'early':'late';if(pause||timing!=='steady')observations.push({type:pause?'pause':'rhythm',bar:g.bar,message:pause?'此处有明显停留，可回听确认是乐句处理还是卡顿。':'此处相邻音的长短比例与前后不同，建议结合乐句回听。',seconds:Math.round(v.gap*100)/100});return {delta,timing,tolerance};});
 if(positive.length>=5){const sorted=positive.toSorted((a,b)=>a-b),low=sorted[Math.floor(sorted.length*.15)],high=sorted[Math.floor(sorted.length*.85)];if(high>low*1.2)observations.push({type:'tempo',bar:groups[0]?.bar??1,message:'这遍存在速度变化；渐快、渐慢本身不作为错误。'});}
 return {entries,observations,pace:global};
}

// Describe input data without equating MIDI velocity with acoustic loudness,
// musical quality, or a desired expressive interpretation.
export function musicalDynamics(events){
 const values=events.map(e=>e.velocity).filter(v=>Number.isFinite(v)&&v>0&&v<=127).toSorted((a,b)=>a-b);
 if(values.length<6)return null;
 const low=values[Math.floor((values.length-1)*.1)],high=values[Math.floor((values.length-1)*.9)];
 return {type:'dynamics',samples:values.length,low,high,message:high-low<5
   ?`本遍多数触键力度记录接近（MIDI ${low}–${high}）；请结合回听和设备灵敏度判断强弱变化。`
   :`本遍多数触键力度记录在 MIDI ${low}–${high} 之间，已观察到力度变化；可回听旋律与伴奏的层次。这不等同于实际响度或表达质量。`};
}

export function ornamentEvidence(ornament,events){
 const pitches=events.map(e=>e.pitch),core=pitches.filter(p=>p===ornament.mainPitch||p===ornament.auxiliaryPitch);let alternations=0;for(let i=1;i<core.length;i++)if(core[i]!==core[i-1])alternations++;
 const valid=alternations>=2;
 return {id:ornament.id,bar:ornament.bar,alternations,valid,message:valid?'装饰音交替已识别。':'此处未识别到完整的装饰音交替，请结合老师版本回听。'};
}

// One illustrative realization, not an authoritative number or speed of trill notes.
export function realizeOrnamentDemo(notes){
 const ornaments=notes.ornaments??[],byId=new Map(ornaments.map(o=>[o.noteId,o]));
 return notes.flatMap(n=>{const o=byId.get(n.id);if(!o)return [{...n}];const firstGrace=notes.filter(g=>o.graceNoteIds.includes(g.id)).sort((a,b)=>a.time-b.time)[0],end=firstGrace?.time??o.endTime,span=Math.max(.04,end-n.time),count=Math.max(4,Math.min(12,Math.round(span/.11/2)*2)),step=span/count;return Array.from({length:count},(_,i)=>({...n,id:i?`${n.id}-trill-${i}`:n.id,pitch:i%2?o.auxiliaryPitch:o.mainPitch,time:n.time+i*step,duration:step*.9,beat:n.beat+(o.endBeat-n.beat)*i/count}));}).sort((a,b)=>a.time-b.time);
}
