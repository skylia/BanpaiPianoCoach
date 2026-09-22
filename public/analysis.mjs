// Input-independent musical model. Time is seconds relative to the recording start.
export const EXERCISES=[
 {id:'joy',title:'欢乐颂',subtitle:'第一句 · 右手旋律',composer:'贝多芬',level:'入门',bpm:80,pitches:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62],lengths:[1,1,1,1,1,1,1,1,1,1,1,1,1.5,.5,2],tip:'右手从 mi 开始。最后一小节，留意附点节奏与结尾的长音。'},
 {id:'steps',title:'五指小步走',subtitle:'上行与下行 · 右手五指',composer:'半拍练习',level:'入门',bpm:72,pitches:[60,62,64,65,67,65,64,62,60],lengths:[1,1,1,1,1,1,1,1,4],tip:'拇指放在中央 do，相邻五个白键依次弹奏；最后一个 do 保持四拍。'},
 {id:'star',title:'小星星',subtitle:'开头两句 · 右手旋律',composer:'传统旋律',level:'入门',bpm:76,pitches:[60,60,67,67,69,69,67,65,65,64,64,62,62,60],lengths:[1,1,1,1,1,1,2,1,1,1,1,1,1,2],tip:'先找到 do 和 sol 的位置。每句最后一个音保持两拍，不急着弹下一个。'}
];
const NAMES=['do','do♯','re','re♯','mi','fa','fa♯','sol','sol♯','la','la♯','si'];
const LETTERS=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
export const solfege=p=>NAMES[((p%12)+12)%12];
export const noteName=p=>LETTERS[((p%12)+12)%12]+(Math.floor(p/12)-1);
export const numberName=p=>({'0':'1','2':'2','4':'3','5':'4','7':'5','9':'6','11':'7'}[p%12]||'♯');
export function makeScore(exercise,bpm){let beat=0;return exercise.pitches.map((pitch,i)=>{const n={pitch,beat,time:beat*60/bpm,duration:exercise.lengths[i]*60/bpm,beats:exercise.lengths[i],index:i,bar:Math.floor(beat/4)+1};beat+=exercise.lengths[i];return n;});}
export const durationOf=score=>score.reduce((end,n)=>Math.max(end,n.time+n.duration),0);

// Compare onset groups, not the order of individual keys inside a chord.
function onsetGroups(items,span,joinAdjacent=false){
 const groups=[];
 for(const item of items){let group=groups.at(-1);const separated=group&&(item.note.time-group.time>span*(joinAdjacent?2:1)||(joinAdjacent&&item.note.time-group.items.at(-1).note.time>span));if(!group||separated){group={time:item.note.time,items:[],pitches:new Map()};groups.push(group);}group.items.push(item);const bucket=group.pitches.get(item.note.pitch)||[];bucket.push(item);group.pitches.set(item.note.pitch,bucket);}
 return groups;
}
const pairCost=(expected,played,beat)=>(expected.pitch===played.pitch?0:.95)+Math.min(2.2,Math.abs(played.time-expected.time)/beat*.48);
function matchGroups(expected,actual,beat){
 const pairs=[],used=new Set(),remaining=[];let gain=0;
 const add=(e,a)=>{const cost=pairCost(e.note,a.note,beat);if(cost>=2)return false;pairs.push([e,a]);used.add(a.ordinal);gain+=2-cost;return true;};
 // Equal pitches get first choice; all expected notes in the group share an onset.
 for(const [pitch,wanted]of expected.pitches){const candidates=[...(actual.pitches.get(pitch)||[])].sort((a,b)=>Math.abs(a.note.time-expected.time)-Math.abs(b.note.time-expected.time)||a.ordinal-b.ordinal);for(let i=0;i<wanted.length;i++){if(!candidates[i]||!add(wanted[i],candidates[i]))remaining.push(wanted[i]);}}
 const unused=actual.items.filter(a=>!used.has(a.ordinal)).sort((a,b)=>Math.abs(a.note.time-expected.time)-Math.abs(b.note.time-expected.time)||a.ordinal-b.ordinal);
 remaining.sort((a,b)=>a.ordinal-b.ordinal);for(let i=0;i<Math.min(remaining.length,unused.length);i++)add(remaining[i],unused[i]);
 return {pairs,gain};
}
function lowerGroup(groups,time){let low=0,high=groups.length;while(low<high){const mid=(low+high)>>>1;if(groups[mid].time<time)low=mid+1;else high=mid;}return low;}

// Sparse weighted sequence alignment. A Fenwick tree stores the best path ending
// before each performed onset; no score.length × events.length matrix is allocated.
export function analyze(score,events,bpm,{interrupted=false}={}){
 const actual=events.filter(n=>n&&Number.isFinite(n.pitch)&&Number.isFinite(n.time)&&n.time>=0).toSorted((a,b)=>a.time-b.time);
 if(!actual.length)return {empty:true,interrupted,rows:[],extras:[],count:0};
 const n=score.length,m=actual.length,beat=60/bpm;
 const expectedGroups=onsetGroups(score.map((note,ordinal)=>({note,ordinal})).sort((a,b)=>a.note.time-b.note.time||a.ordinal-b.ordinal),.000001);
 let smallestGap=Infinity;for(let i=1;i<expectedGroups.length;i++)smallestGap=Math.min(smallestGap,expectedGroups[i].time-expectedGroups[i-1].time);
 // Join nearby arrivals, including an accidental key just before a chord, while
 // limiting total span below the score's fastest distinct onset interval.
 const chordSpan=Math.min(.12,beat*.24,smallestGap*.45);
 const actualGroups=onsetGroups(actual.map((note,ordinal)=>({note,ordinal})),chordSpan,true),tree=Array(actualGroups.length+1).fill(null);
 const bestBefore=index=>{let best=null;for(let p=index;p>0;p-=p&-p)if(tree[p]&&(!best||tree[p].value>best.value))best=tree[p];return best;};
 const update=(index,node)=>{for(let p=index+1;p<tree.length;p+=p&-p)if(!tree[p]||node.value>tree[p].value)tree[p]=node;};
 const window=beat*2/.48+chordSpan*2,MAX_CANDIDATES=128;
 for(let i=0;i<expectedGroups.length;i++){
  const group=expectedGroups[i],lo=lowerGroup(actualGroups,group.time-window),hi=lowerGroup(actualGroups,group.time+window),center=lowerGroup(actualGroups,group.time);
  // Bound pathological event bursts as well as ordinary long pieces.
  const start=Math.max(lo,Math.min(center-MAX_CANDIDATES/2,hi-MAX_CANDIDATES)),end=Math.min(hi,start+MAX_CANDIDATES),pending=[];
  for(let j=start;j<end;j++){const match=matchGroups(group,actualGroups[j],beat);if(match.gain<=0)continue;const previous=bestBefore(j);pending.push({i,j,previous,value:(previous?.value||0)+match.gain});}
  // Delay updates until this target group is complete: one group cannot pair twice.
  for(const node of pending)update(node.j,node);
 }
 const tolerance=Math.max(.12,beat*.22),used=new Set(),rows=score.map(expected=>({expected,played:null,status:'missing',delta:null,timing:null}));
 for(let node=bestBefore(actualGroups.length);node;node=node.previous)for(const [e,a]of matchGroups(expectedGroups[node.i],actualGroups[node.j],beat).pairs){const expected=e.note,played=a.note,delta=played.time-expected.time;used.add(a.ordinal);rows[e.ordinal]={expected,played,status:expected.pitch===played.pitch?'correct':'wrong',delta,timing:Math.abs(delta)<=tolerance?'steady':delta<0?'early':'late'};}
 const extras=actual.filter((_,ordinal)=>!used.has(ordinal)),correct=rows.filter(r=>r.status==='correct').length,wrong=rows.filter(r=>r.status==='wrong').length,missing=rows.filter(r=>r.status==='missing').length,paired=rows.filter(r=>r.played),steady=paired.filter(r=>r.timing==='steady').length;
 return {empty:false,interrupted,rows,extras,count:m,correct,wrong,missing,pitch:n+extras.length?Math.round(correct/(n+extras.length)*100):0,rhythm:paired.length>=3?Math.round(steady/paired.length*100):null,tolerance,averageDeviation:paired.length?Math.round(paired.reduce((s,r)=>s+Math.abs(r.delta),0)/paired.length*1000):null,coverage:n?Math.round(paired.length/n*100):0};
}
export function makeDemo(score){return score.filter((_,i)=>i!==9).map((n,i)=>({pitch:n.pitch+(n.index===5?2:0),time:n.time+(n.index===11?.28:.035),duration:n.duration*.8,velocity:80}));}
