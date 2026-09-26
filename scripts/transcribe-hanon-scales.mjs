// Independent transcription of Schirmer (1900), printed pp. 50–71.
// The pitch/register facts below were read from the scan, not another MIDI edition.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {normalizeScore} from '../public/score-model.mjs';

const SOURCE='https://s9.imslp.org/files/imglnks/usimg/1/1b/IMSLP91547-PMLP03129-Hanon_Final.pdf';
// [major, relative minor, scale RH starts, cadence RH tonic, arpeggio RH starts]
const KEYS=[
 ['C','Am',48,45,60,69,48,45], ['F','Dm',53,50,65,62,53,50],
 ['Bb','Gm',46,55,58,67,46,43], ['Eb','Cm',51,48,63,60,51,48],
 ['Ab','Fm',44,53,68,65,44,53], ['Db','Bbm',49,46,61,58,49,46],
 ['Gb','Ebm',54,51,66,63,42,51], ['B','G#m',47,56,59,68,47,44],
 ['E','C#m',52,49,64,61,52,49], ['A','F#m',45,54,69,66,45,42],
 ['D','Bm',50,47,62,59,50,47], ['G','Em',55,52,67,64,43,52],
];
const displayKey=k=>k.replace('b','♭').replace('#','♯').replace(/m$/,' 小调')+(/m$/.test(k)?'':' 大调');
const slug=k=>k.replace('#','sharp').replace(/m$/,'minor').toLowerCase();
const range=n=>Array.from({length:n},(_,i)=>i);
const outAndBack=steps=>[...range(steps+1),...range(steps-1).map(i=>steps-1-i)];

function builder(number,suffix,title,{key='C',time=[2,4],pages,notesText=''}={}){
 const raw={schemaVersion:2,id:`hanon-${number}-${suffix}`,title:`哈农第${number}条 · ${title}`,composer:'Charles-Louis Hanon',collection:'哈农 · 第 II 部',level:'基本功',category:'technique',evaluationProfile:'technique',bpm:60,timeSignature:time,keySignature:key,notes:[],tags:['基本功','哈农',`哈农第${number}条`],source:{label:'Hanon · The Virtuoso Pianist · Schirmer (1900)',url:SOURCE,note:`独立按公版扫描印刷第${pages}页录入双手音高、时值和小节；不借用现代 MIDI 转录。${notesText}未重排原谱跨谱表记法；应用按左右手显示。指法仅收录明确逐音核对的段落，其余请参阅原谱。`}};
 let count=0;
 const add=(pitch,beat,duration,hand,finger)=>raw.notes.push({id:`n${++count}`,pitch,beat,duration,hand,...(finger?{finger}:{})});
 const pair=(rh,lh,beat,duration=.25,rf,lf)=>{add(rh,beat,duration,'right',rf);add(lh,beat,duration,'left',lf);};
 const run=(rh,lh,beat=0,rf=[],lf=[])=>rh.forEach((p,i)=>pair(p,lh[i],beat+i*.25,.25,rf[i],lf[i]));
 const chord=(rh,lh,beat,duration=1)=>{rh.forEach(p=>add(p,beat,duration,'right'));lh.forEach(p=>add(p,beat,duration,'left'));};
 return {raw,add,pair,run,chord,finish:totalBeats=>normalizeScore({...raw,totalBeats})};
}

function scale39(key,root,cadence,mode,page){
 const minor=mode!=='major';
 const title=`${displayKey(key)}${minor?mode==='harmonic'?' · 和声音阶':' · 旋律音阶':''}（含终止式）`;
 const b=builder(39,`${slug(key)}-${mode}`,title,{key,pages:String(page),notesText:'原谱音阶反复记号取一遍，完整四个八度往返及末三小节终止式。旋律小调上行升六、七级，下行还原。'});
 const asc=mode==='major'?[0,2,4,5,7,9,11]:mode==='harmonic'?[0,2,3,5,7,8,11]:[0,2,3,5,7,9,11];
 const desc=mode==='melodic'?[0,2,3,5,7,8,10]:asc;
 const pitches=outAndBack(28).map((degree,i)=>root+12*Math.floor(degree/7)+(i>28?desc:asc)[degree%7]);
 b.run(pitches,pitches.map(p=>p-12));
 // The first bass octave resolves the scale in its original register. The
 // following cadence uses the separately printed register (notably A/Ab).
 b.chord([],[root-12,root],14);
 b.chord([cadence+2,cadence+(minor?8:9),cadence+12],[cadence-19,cadence-7],15);
 b.chord([cadence+(minor?3:4),cadence+7,cadence+12],[cadence-17,cadence-5],16);
 b.chord([cadence+2,cadence+5,cadence+7,cadence+11],[cadence-29,cadence-17],17);
 b.chord([cadence,cadence+(minor?3:4),cadence+7,cadence+12],[cadence-24,cadence-12],18,2);
 return b.finish(20);
}

const CHROMATIC=[
 ['octave','同向八度',48,36,48,1,62],
 ['minor-third','同向小三度',39,36,48,1,62],
 ['major-sixth','同向大六度',48,39,48,1,63],
 ['minor-sixth','同向小六度',48,40,48,1,63],
 ['contrary-octave','反向 · 八度',84,36,24,-1,64],
 ['contrary-minor-third','反向 · 小三度',87,36,24,-1,64],
 ['contrary-major-third','反向 · 大三度',88,36,24,-1,64],
 ['legato-fingering','另一种连奏指法',60,48,24,1,64],
];
function chromatic40([id,title,rh,lh,steps,direction,page]){
 const b=builder(40,id,title,{time:[3,4],pages:String(page),notesText:'每种完整往返及二分音符、四分休止结尾；原谱反复取一遍。'});
 const path=outAndBack(steps),right=path.map(i=>rh+direction*i),left=path.map(i=>lh+i);
 let rf=[],lf=[];
 if(id==='legato-fingering'){
  const upR=[1,2,3,4,1,2,3,1,2,3,4,1],upL=[3,4,3,2,1,4,3,1,4,3,2,1];
  // Printed descending sequence, including the upper C's changed RH finger.
  const downR=[3,1,4,3,2,1,3,2,1,3,2,1,2,1,4,3,2,1,3,2,1,3,2,1];
  const downL=[1,2,3,1,3,4,1,2,3,1,3,4,1,2,3,1,3,4,1,2,3,1,3,4];
  rf=[...range(24).map(i=>upR[i%12]),...downR];lf=[...range(24).map(i=>upL[i%12]),...downL];
 }
 b.run(right,left,0,rf,lf);
 const end=path.length*.25;
 b.pair(rh,lh,end,2,id==='legato-fingering'?1:undefined,id==='legato-fingering'?3:undefined);
 b.pair(null,null,end+2,1);
 return b.finish(end+3);
}

function triad41(key,root,page){
 const minor=key.endsWith('m'),triad=[0,minor?3:4,7];
 const b=builder(41,slug(key),`${displayKey(key)}三和弦琶音`,{key,time:[3,4],pages:String(page),notesText:'完整四个八度往返，原谱反复取一遍；保留终止二分音符及四分休止。'});
 const pitches=outAndBack(12).map(i=>root+12*Math.floor(i/3)+triad[i%3]);
 b.run(pitches,pitches.map(p=>p-12));b.pair(root,root-12,6,2);b.pair(null,null,8,1);
 return b.finish(9);
}

function seventh(number){
 const diminished=number===42,intervals=diminished?[0,3,6,9]:[0,4,7,10];
 const b=builder(number,'complete',diminished?'减七和弦琶音 · 全七组与尾奏':'属七和弦琶音 · 全七组与尾奏',{pages:diminished?'69–70':'70–71',notesText:'保留原谱七个根音组 C、D、E、F、G、A、B 及全部尾奏。每组第一小节依文字展开四遍，随后三小节依反复记号展开两遍。'});
 let beat=0;
 const at=(root,i)=>root+12*Math.floor(i/4)+intervals[i%4];
 const warm=outAndBack(4),long=outAndBack(12);
 const warmR=[1,2,3,4,5,4,3,2],warmL=[5,4,3,2,1,2,3,4];
 const longR=[1,2,3,4,1,2,3,4,1,2,3,4,5,4,3,2,1,4,3,2,1,4,3,2];
 const longL=[5,4,3,2,1,4,3,2,1,4,3,2,1,2,3,4,1,2,3,4,1,2,3,4];
 for(const root of [48,50,52,53,55,57,59]){
  for(let i=0;i<4;i++){const p=warm.map(n=>at(root,n));b.run(p,p.map(n=>n-12),beat,warmR,warmL);beat+=2;}
  for(let i=0;i<2;i++){const p=long.map(n=>at(root,n));b.run(p,p.map(n=>n-12),beat,longR,longL);beat+=6;}
 }
 if(diminished){
  const p=[71,68,65,62,59,56,53,50];b.run(p,p.map(n=>n-12),beat);beat+=2;
  b.pair(48,36,beat,2);beat+=2;
 }else{
  // The printed coda uses B natural, then resolves to C major. It is not
  // another dominant-seventh transposition of the previous seven groups.
  for(const p of [[60,64,67,71,72,76,79,83],[84,83,79,76,72,71,67,64],[60,64,67,71,72,71,67,64],[60,59,55,52,48,52,55,59]]){b.run(p,p.map(n=>n-12),beat);beat+=2;}
  b.chord([48,52,55,60],[36,40,43],beat,2);beat+=2;
 }
 return b.finish(beat);
}

export function transcribeHanonScales(){
 const scores=[];
 KEYS.forEach(([major,minor,majorRoot,minorRoot,majorCadence,minorCadence],i)=>{
  scores.push(scale39(major,majorRoot,majorCadence,'major',50+i),scale39(minor,minorRoot,minorCadence,'harmonic',50+i),scale39(minor,minorRoot,minorCadence,'melodic',50+i));
 });
 scores.push(...CHROMATIC.map(chromatic40));
 KEYS.forEach(([major,minor,,,,,majorRoot,minorRoot],i)=>scores.push(triad41(major,majorRoot,65+Math.floor(i/3)),triad41(minor,minorRoot,65+Math.floor(i/3))));
 scores.push(seventh(42),seventh(43));
 return scores;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const scores=transcribeHanonScales();
 await writeFile(new URL('../public/hanon-scales.mjs',import.meta.url),`// Generated from independent Schirmer (1900) transcription.\n// Rebuild: node scripts/transcribe-hanon-scales.mjs\nexport const HANON_SCALE_SCORES = ${JSON.stringify(scores)};\n`);
 console.log(`Wrote ${scores.length} scores; ${scores.reduce((n,s)=>n+s.notes.length,0)} notes/rests.`);
}
