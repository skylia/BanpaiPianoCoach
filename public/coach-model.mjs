import {normalizeActivity, normalizeLearning, aggregateActivities, dayKey, shiftDay} from './progress-model.mjs';
import {analyze} from './analysis.mjs';
import {analyzeFollow,isFollow} from './follow.mjs';
import {scoreToTimedNotes} from './score-model.mjs';

export function buildCoachSummary({activities, learning, takes = [], days = 7, today = dayKey()}) {
  if (![7,30].includes(days)) throw Error('请选择近 7 或 30 天。');
  const state = normalizeLearning(learning);
  const start = shiftDay(today, 1-days), previousStart = shiftDay(start,-days);
  const unique = new Map(); let invalid = 0;
  for (const raw of activities) {try {const a=normalizeActivity(raw);if(a.date<=today)unique.set(a.id,a);}catch{invalid++;}}
  const all=[...unique.values()], current=all.filter(a=>a.date>=start), previous=all.filter(a=>a.date>=previousStart&&a.date<start);
  if (!current.length) throw Error('这段时间还没有真实采集或练习补记。先练一遍或补记，再生成报告。');
  const summarize = (records, end) => {const s=aggregateActivities(records,{days,today:end});return {minutes:Math.round(s.seconds/60),captureMinutes:Math.round(s.captureSeconds/60),manualMinutes:Math.round(s.manualSeconds/60),practiceDays:s.days,sessions:s.count,midiSessions:records.filter(a=>a.source==='midi').length,virtualSessions:records.filter(a=>a.source==='virtual').length,incompleteSessions:records.filter(a=>a.kind==='capture'&&!a.complete).length,pitch:s.pitch,rhythm:s.rhythm,follow:s.follow};};
  const groups=new Map();
  for(const a of current.filter(a=>a.kind==='capture')) {
    // Compare like with like: a change of hand, range or tempo is a new group.
    const key=JSON.stringify([a.fingerprint||a.scoreId,a.hand,a.startBar,a.endBar,a.bpm,a.source,a.analysisVersion,a.practiceMode]);
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);
  }
  const pieces=[...groups.values()].map(list=>{
    list.sort((a,b)=>Date.parse(a.startedAt)-Date.parse(b.startedAt)); const last=list.at(-1), complete=list.filter(a=>a.complete);
    const metric=a=>({date:a.date,pitch:a.practiceMode==='follow'?null:Math.round(a.correct/(a.expected+a.extras)*100),firstPass:a.practiceMode==='follow'?Math.round(a.follow.firstPassGroups/a.follow.totalGroups*100):null,rhythm:a.practiceMode==='follow'?(a.follow.rhythmCount>=3?Math.round(a.follow.rhythmSteady/a.follow.rhythmCount*100):null):(a.paired>=3?Math.round(a.steady/a.paired*100):null)});
    return {title:last.title,source:last.source,practiceMode:last.practiceMode,errorAttempts:list.reduce((sum,a)=>sum+(a.follow?.errorAttempts||0),0),hand:last.hand,startBar:last.startBar,endBar:last.endBar,bpm:last.bpm,attempts:list.length,complete:complete.length,minutes:Math.round(list.reduce((s,a)=>s+a.seconds,0)/60),first:complete.length?metric(complete[0]):null,last:complete.length?metric(complete.at(-1)):null};
  }).sort((a,b)=>b.attempts-a.attempts).slice(0,30);
  const ids=new Set(current.filter(a=>a.kind==='capture'&&a.complete).map(a=>a.id)); const hotspots=new Map();let detailed=0;
  for(const t of takes){if(!ids.has('take:'+t.id)||!['midi','virtual'].includes(t.source)||!t.events?.length||t.interrupted)continue;
    try {const expected=scoreToTimedNotes(t.score,{bpm:t.bpm,...t.options});const rows=isFollow(t)?analyzeFollow(expected,t.events,t.bpm,{elapsed:t.elapsed}).steps.map(s=>({bar:s.bar,status:s.errors?'wrong':'correct',timing:s.timing})):analyze(expected,t.events,t.bpm).rows; detailed++;
      for(const r of rows){if(r.status==='correct'&&r.timing==='steady')continue; const bar=r.expected?.bar??r.bar; if(!Number.isInteger(bar))continue;
        const key=JSON.stringify([t.score.id,bar,t.options?.hand,isFollow(t)]);const h=hotspots.get(key)||{title:t.score.title,bar,hand:t.options?.hand||'both',practiceMode:isFollow(t)?'follow':'fixed',issues:0};h.issues++;hotspots.set(key,h);}
    }catch{}
  }
  return {schemaVersion:1,period:{days,start,end:today},targetGrade:state.targetGrade,weeklyMinutes:state.weeklyMinutes,current:summarize(current,today),previous:summarize(previous,shiftDay(start,-1)),pieces,hotspots:[...hotspots.values()].sort((a,b)=>b.issues-a.issues).slice(0,12),evidence:{detailedCompleteTakes:detailed,captureSessions:current.filter(a=>a.kind==='capture').length,invalidRecords:invalid,limitations:['模拟练习已排除；补记只代表投入时长。','整体准确率变化可能来自曲目或速度变化，不能直接等同于能力升降。','详细音符只保留最近 100 遍，热点仅覆盖仍有明细的完整练习。','未采集手型、手指、踏板、原始音频或音乐表现力。','跟弹与固定速度分组：跟弹首次通过率、首次起音节奏和纠错次数单列，整体音符准确率只含固定速度。']},plans:state.plans.slice(0,20).map(p=>({title:p.title,grade:p.grade,targetBpm:p.targetBpm,hand:p.hand,status:p.status})),checklist:{done:Object.values(state.checks).filter(c=>c.state==='done').length,review:Object.values(state.checks).filter(c=>c.state==='review').length}};
}

// Only a bounded data summary is accepted by the local API, never chat roles or prompts.
export function validateCoachSummary(raw) {
  if(!raw||raw.schemaVersion!==1||![7,30].includes(raw.period?.days))throw Error('点评摘要格式不正确。');
  if(JSON.stringify(raw).length>48000)throw Error('点评摘要过大。');
  const str=(v,n=120)=>{if(typeof v!=='string'||v.length>n)throw Error('点评文字字段无效。');return v;};
  const num=(v,max=1000000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)throw Error('点评数值字段无效。');return v;};
  const metric=v=>v===null?null:num(v,100);
  const practiceMode=v=>v==='follow'?'follow':'fixed';
  const follow=f=>({sessions:num(f?.sessions??0),errorAttempts:num(f?.errorAttempts??0),correctionSeconds:num(f?.correctionSeconds??0,1e10),firstPass:metric(f?.firstPass??null),rhythm:metric(f?.rhythm??null)});
  const stats=s=>({minutes:num(s.minutes),captureMinutes:num(s.captureMinutes),manualMinutes:num(s.manualMinutes),practiceDays:num(s.practiceDays,30),sessions:num(s.sessions),midiSessions:num(s.midiSessions),virtualSessions:num(s.virtualSessions),incompleteSessions:num(s.incompleteSessions),pitch:metric(s.pitch),rhythm:metric(s.rhythm),follow:follow(s.follow)});
  const list=(v,max,fn)=>{if(!Array.isArray(v)||v.length>max)throw Error('点评列表无效。');return v.map(fn);};
  const attempt=a=>a===null?null:({date:str(a.date,10),pitch:metric(a.pitch),rhythm:metric(a.rhythm),firstPass:metric(a.firstPass??null)});
  const hand=v=>{if(!['left','right','both'].includes(v))throw Error('点评声部无效。');return v;};
  return {schemaVersion:1,period:{days:raw.period.days,start:str(raw.period.start,10),end:str(raw.period.end,10)},targetGrade:num(raw.targetGrade,10),weeklyMinutes:num(raw.weeklyMinutes,2520),current:stats(raw.current),previous:stats(raw.previous),pieces:list(raw.pieces,30,p=>({title:str(p.title),practiceMode:practiceMode(p.practiceMode),errorAttempts:num(p.errorAttempts??0),source:['midi','virtual'].includes(p.source)?p.source:'unknown',hand:hand(p.hand),startBar:num(p.startBar,2048),endBar:num(p.endBar,2048),bpm:num(p.bpm,1000),attempts:num(p.attempts),complete:num(p.complete),minutes:num(p.minutes),first:attempt(p.first),last:attempt(p.last)})),hotspots:list(raw.hotspots,12,h=>({title:str(h.title),practiceMode:practiceMode(h.practiceMode),bar:num(h.bar,2048),hand:hand(h.hand),issues:num(h.issues)})),evidence:{detailedCompleteTakes:num(raw.evidence.detailedCompleteTakes,100),captureSessions:num(raw.evidence.captureSessions),invalidRecords:num(raw.evidence.invalidRecords),limitations:list(raw.evidence.limitations,8,s=>str(s,300))},plans:list(raw.plans,20,p=>({title:str(p.title),grade:num(p.grade,10),targetBpm:num(p.targetBpm,1000),hand:hand(p.hand),status:str(p.status,20)})),checklist:{done:num(raw.checklist.done,120),review:num(raw.checklist.review,120)}};
}
