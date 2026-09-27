import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeScore} from '../public/score-model.mjs';
import * as core from './primer-pieces.mjs';
import {PRIMER_EXTRA_PIECES,PRIMER_EXTRA_SOURCES,PRIMER_EXTRA_DEMOS} from './primer-extra-pieces.mjs';
import {PRIMER_KRIEGER_PIECES,PRIMER_KRIEGER_SOURCES,PRIMER_KRIEGER_DEMOS} from './primer-krieger.mjs';
import {PRIMER_JCBACH_PIECES,PRIMER_JCBACH_SOURCES,PRIMER_JCBACH_DEMOS} from './primer-jcbach.mjs';
import {PRIMER_BACH514_PIECES,PRIMER_BACH514_SOURCES,PRIMER_BACH514_DEMOS} from './primer-bach514.mjs';
import {PRIMER_TURK_BALLET_PIECES,PRIMER_TURK_BALLET_SOURCES,PRIMER_TURK_BALLET_DEMOS} from './primer-turk-ballet.mjs';

// Retired score snapshots: Schirmer 1895, printed pp. 1–5. Keep IDs and notes
// unchanged so saved plans and history continue to resolve after replacement.
// Both original staves use treble clefs. Pitch names use scientific octaves.
// Durations are quarter-note beats; r is a rest; + is a chord; ~ is a tie.
// Repeats are played once. No. 4 uses the second ending for that single pass.
const pieces=[
 {number:1,page:1,meter:4,tempo:'Moderato',bpm:92,
 right:'c5:2 e5:2 | d5:2 g5:2 | e5:2 c5:2 | d5:4 | c5:2 e5:2 | d5:2 g5:2 | e5:2 c5:2 | d5:4 | f5:2 d5:2 | e5:2 c5:2 | f5:2 d5:2 | e5:2 c5:2 | f5:2 d5:2 | e5:2 c5:2 | d5:2 g5:2 | c5:4',
 left:'c4:4 | b3:4 | c4:4 | g3:4 | c4:4 | b3:4 | c4:4 | g3:4 | b3:4 | c4:4 | b3:4 | c4:4 | b3:4 | c4:4 | a3:4 | c4:4'},
 {number:2,page:1,meter:4,tempo:'Moderato',bpm:92,
 right:'c5 e5 g5 e5 | d5 e5 c5 e5 | c5 e5 g5 e5 | d5 e5 c5 r | f5 e5 d5 e5 | f5 e5 d5 e5 | f5 e5 d5 e5 | f5 e5 d5 r | c5 e5 g5 e5 | d5 e5 c5 e5 | c5 e5 g5 e5 | d5 e5 c5 r',
 left:'c4:4 | b3:2 c4 r | c4:4 | b3:2 c4 r | d4 c4 b3 c4 | d4 c4 b3 c4 | d4 c4 b3 c4 | d4 c4 b3 r | c4:4 | b3:2 c4 r | c4:4 | b3:2 c4 r'},
 {number:3,page:2,meter:3,tempo:'Con moto',bpm:100,
 right:'c5 d5 e5 | d5 e5 f5 | e5 f5 g5 | f5 e5 d5 | c5 d5 e5 | d5 e5 f5 | e5 f5 g5 | f5 e5 d5 | c5:3~ | c5:3~ | c5:3 | d5:3 | c5:3~ | c5:3~ | c5:3 | d5:3 | c5 d5 e5 | d5 e5 f5 | e5 f5 g5 | f5 e5 d5 | c5 d5 e5 | d5 e5 f5 | e5 f5 g5 | f5 e5 d5 | c5:3',
 left:'c4:3~ | c4:3~ | c4:3 | b3:3 | c4:3~ | c4:3~ | c4:3 | b3:2 r | g3 a3 b3 | a3 b3 c4 | b3 c4 d4 | c4 b3 a3 | g3 a3 b3 | a3 b3 c4 | b3 c4 d4 | c4 b3 a3 | g3 a3 b3 | a3 b3 c4 | b3 c4 d4 | c4 b3 a3 | g3 a3 b3 | a3 b3 c4 | b3 c4 d4 | c4 b3 a3 | g3:3'},
 {number:4,page:2,meter:4,tempo:'Con moto',bpm:100,
 right:'e5:2 d5:2 | c5:2 d5:2 | e5:2 d5:2 | c5:2 d5:2 | e5:2 f5:2 | g5:2 f5:2 | e5:2 d5:2 | c5:2 b4:2 | c5:2 r:2',
 left:'c4:2 d4:2 | e4:2 d4:2 | c4:2 d4:2 | e4:2 d4:2 | c4:2 d4:2 | e4:2 f4:2 | g4:2 f4:2 | e4:2 d4:2 | c4+e4:2 r:2'},
 {number:5,page:3,meter:2,tempo:'Allegretto',bpm:84,
 right:'c5 e5:.5 g5:.5 | c5 e5:.5 g5:.5 | d5 f5:.5 g5:.5 | d5 f5:.5 g5:.5 | c5 e5:.5 g5:.5 | c5 e5:.5 g5:.5 | d5 d5 | d5 r | c5 e5:.5 g5:.5 | c5 e5:.5 g5:.5 | d5 f5:.5 g5:.5 | d5 f5:.5 g5:.5 | c5 e5:.5 g5:.5 | d5 f5:.5 g5:.5 | c5 c5 | c5 r',
 left:'c4:2 | r:2 | g4:2 | r:2 | c4:2 | r:2 | g4 g4 | g4 r | c4:2 | r:2 | g4:2 | r:2 | c4:2 | g4:2 | c4 c4 | c4 r'},
 {number:6,page:3,meter:2,tempo:'Allegretto grazioso',bpm:80,
 right:'c5:.5 e5:.5 c5:.5 e5:.5 | g5:2 | e5:.5 c5:.5 e5:.5 c5:.5 | d5:2 | e5:.5 g5:.5 e5:.5 g5:.5 | d5:.5 g5:.5 d5:.5 g5:.5 | c5:.5 f#5:.5 c5:.5 f#5:.5 | b4:.5 g5:.5 b4:.5 g5:.5 | f5:.5 d5:.5 f5:.5 d5:.5 | b4 r | f5:.5 d5:.5 f5:.5 d5:.5 | b4 r | f5:.5 d5:.5 f5:.5 d5:.5 | f5:.5 d5:.5 f5:.5 d5:.5 | f5:.5 d5:.5 f5:.5 d5:.5 | g5:.5 f5:.5 e5:.5 d5:.5 | c5:.5 e5:.5 c5:.5 e5:.5 | g5:2 | e5:.5 c5:.5 e5:.5 c5:.5 | d5:2 | e5:.5 g5:.5 e5:.5 g5:.5 | d5:.5 f5:.5 d5:.5 f5:.5 | c5:.5 e5:.5 d5:.5 g5:.5 | c5:2',
 left:'c4:2 | b3:2 | c4:2 | g3:2 | c4:2 | b3:2 | a3:2 | g3:2 | r:2 | bb4:.5 a4:.5 bb4:.5 a4:.5 | bb4 r | bb4:.5 a4:.5 bb4:.5 a4:.5 | bb4 r | bb4 r | bb4 r | g4 r | c4:2 | b3:2 | c4:2 | g3 r | c4:2 | f4:2 | g4 g3 | c4:2'},
 {number:7,page:4,meter:2,tempo:'Moderato',bpm:80,
 right:'e5:.5 e5:.5 c5 | e5:.5 e5:.5 c5 | d5:.5 d5:.5 g5:.5 g5:.5 | e5:.5 e5:.5 c5 | e5:.5 e5:.5 c5 | e5:.5 e5:.5 c5 | d5:.5 d5:.5 g5:.5 g5:.5 | c5 r | d5:.5 d5:.5 g5:.5 g5:.5 | e5:.5 e5:.5 c5:.5 c5:.5 | d5:.5 d5:.5 g5:.5 g5:.5 | e5:.5 c5:.5 e5:.5 c5:.5 | e5:.5 e5:.5 c5 | e5:.5 e5:.5 c5 | d5:.5 d5:.5 g5:.5 g5:.5 | c5 r',
 left:'c4+e4 g4 | c4+e4 g4 | b3+d4 g4 | c4+e4 g4 | c4+e4 g4 | c4+e4 g4 | b3+d4 g4 | c4+e4 g4 | b3+d4 g4 | c4+e4 g4 | b3+d4 g4 | c4+e4 g4 | c4+e4 g4 | c4+e4 g4 | b3+d4 g4 | c4+e4 r'},
 {number:8,page:4,meter:4,tempo:'Vivace',bpm:104,
 right:'c5 c5:.5 d5:.5 e5 c5 | d5 g5 g5:.5 f5:.5 e5:.5 d5:.5 | c5 c5:.5 d5:.5 e5 c5 | d5 g5 g5:2 | c5 c5:.5 d5:.5 e5 c5 | d5 g5 g5:.5 f5:.5 e5:.5 d5:.5 | c5 c5:.5 d5:.5 e5 c5 | d5 g5 c5 r | d5 g5 e5 c5 | d5 g5 e5 c5 | d5 g5 e5 c5 | d5 g5 g5:2 | c5 c5:.5 d5:.5 e5 c5 | d5 g5 g5:.5 f5:.5 e5:.5 d5:.5 | c5 c5:.5 d5:.5 e5 c5 | d5 g5 c5 r',
 left:'c4+e4:4 | g3+d4:4 | c4+e4:4 | g3+d4:4 | c4+e4:4 | g3+d4:4 | c4+e4:4 | g3+d4:2 c4+e4 r | g3+d4:2 c4+e4:2 | g3+d4:2 c4+e4:2 | g3+d4:2 c4+e4:2 | g3+d4:2 g3+d4:2 | c4+e4:4 | g3+d4:4 | c4+e4:4 | g3+d4:2 c4+e4 r'},
 {number:9,page:5,meter:3,tempo:'Allegretto',bpm:92,
 right:'r c5+e5 c5+e5 | d5+g5:2 r | r c5+e5 c5+e5 | d5+g5:2 r | r c5+e5 c5+e5 | d5+g5:2 r | r c5+f#5 c5+f#5 | b4+g5:2 r | r d5+f5 d5+f5 | c5+e5:2 r | r d5+f5 d5+f5 | c5+e5:2 r | r d5+f5 d5+f5 | c5+e5:2 r | r b4+d5 b4+d5 | c5:2 r',
 left:'c4:2 r | r b3 b3 | c4:2 r | r b3 b3 | c4:2 r | r b3 b3 | a3:2 r | r g3 g3 | b3:2 r | r c4 c4 | b3:2 r | r c4 c4 | b3:2 r | r c4 c4 | g3+f4:2 r | c4+e4:2 r'},
 {number:10,page:5,meter:4,tempo:'Con moto',bpm:100,
 right:'c5 e5 g5 e5 | g5 f5 d5:2 | c5 e5 g5 e5 | d5:2 c5 r | r:2 d5+f5 c5+e5 | r:2 d5+f5 c5+e5 | r:2 d5+f5 c5+e5 | b4+d5:2 r:2 | c5 e5 g5 e5 | g5 f5 d5:2 | c5 e5 g5 e5 | d5:2 c5 r',
 left:'c4+e4:4 | g3+d4:4 | c4+e4:4 | g3+d4:2 c4+e4 r | g3+d4 c4+e4 r:2 | g3+d4 c4+e4 r:2 | g3+d4 c4+e4 r:2 | g3+d4:2 r:2 | c4+e4:4 | g3+d4:4 | c4+e4:4 | g3+d4:2 c4+e4 r'},
];

export function parseStaff(text,hand,meter,id){
 const notes=[];let beat=0,tied=[];
 const pitches={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
 for(const [bar,line]of text.split('|').entries()){
  let length=0;
  for(const token of line.trim().split(/\s+/)){
   const [names,raw='1']=token.replace(/~$/,'').split(':'),fraction=raw.split('/').map(Number),duration=fraction.length===2?fraction[0]/fraction[1]:Number(raw),tie=token.endsWith('~');
   if(!Number.isFinite(duration)||duration<=0)throw Error(`${id}: invalid duration ${raw}`);
   const members=names==='r'?[null]:names.split('+').map(name=>{const m=name.match(/^([a-g])([#b]?)(\d)$/);if(!m)throw Error(`Invalid pitch ${name}`);return (Number(m[3])+1)*12+pitches[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);});
   if(tied.length){if(tied.length!==members.length||members.some((p,i)=>p!==tied[i].pitch))throw Error(`${id}: invalid tie at ${bar+1}`);for(const n of tied)n.duration+=duration;}
   else tied=members.map(pitch=>{const n={id:`${id}-${hand}-${notes.length}`,pitch,beat,duration,hand};notes.push(n);return n;});
   if(!tie)tied=[];beat+=duration;length+=duration;
  }
  if(Math.abs(length-meter)>1e-7)throw Error(`${id} ${hand} bar ${bar+1}: ${length} beats, expected ${meter}`);
 }
 if(tied.length)throw Error(`${id}: unfinished tie`);
 return {notes,totalBeats:beat};
}

const sourceUrl='https://imslp.org/wiki/Anfangs-Stunden,_Op.117_(Gurlitt,_Cornelius)';
const sha256='f86d232e9fe4bc6f390f6c981056922a13df4fbc1c410f20c1871ef53fbf7a08';
function buildArchive(){
const source=readFileSync(new URL('../research/primer/gurlitt-op117-schirmer1895.pdf',import.meta.url));
if(createHash('sha256').update(source).digest('hex')!==sha256)throw Error('Primer source score checksum mismatch');
const scores=pieces.map(p=>{
 const id=`gurlitt-op117-${p.number}`,right=parseStaff(p.right,'right',p.meter,id),left=parseStaff(p.left,'left',p.meter,id);
 if(right.totalBeats!==left.totalBeats)throw Error(`${id}: staff length mismatch`);
 return normalizeScore({schemaVersion:2,id,title:`初学钢琴曲 · Op.117 No.${p.number}（${p.tempo}）`,composer:'C. Gurlitt',collection:'古尔利特初学钢琴曲 Op.117',level:'通用参考 1 级 · 入门',grade:1,category:'piece',grading:'general',evaluationProfile:'musical',bpm:p.bpm,timeSignature:[p.meter,4],keySignature:'C',notes:[...right.notes,...left.notes],totalBeats:right.totalBeats,source:{label:'G. Schirmer 1895 · IMSLP #400775 · 公版原谱',url:sourceUrl,note:`独立转录 1895 Schirmer 版第 ${p.page} 页，保留双手原音区、音高、时值、休止与延音；原版上下谱表均为高音谱号，应用按左右手重新排版。反复段各弹一遍${p.number===4?'，采用第二结尾，第一结尾仅用于反复时故略去':''}。省略指法、连奏线和表情符号；练习 BPM 为应用设置，不是示范演奏速度。属于初学/Preliminary 程度，半拍归入通用参考 1 级，不代表任何考级教材清单。原作品和所用历史版谱面为公版，本次机器可读转录以 CC0 提供。`},tags:['1级','入门','双手','公版原谱','全曲单遍','真人示范']});
});
return scores;
}

const root=new URL('../',import.meta.url);
function verifyFile(file,expected,label){
 if(!file||!expected)throw Error(`${label}: missing source file or checksum`);
 const actual=createHash('sha256').update(readFileSync(new URL(file,root))).digest('hex');
 if(actual!==expected)throw Error(`${label}: checksum mismatch for ${file}`);
}

export function buildPrimer(){
 if(!core.PRIMER_SOURCES||!core.PRIMER_DEMOS)throw Error('Primer sources and performances are not ready');
 const activePieces=[...core.PRIMER_PIECES,...PRIMER_TURK_BALLET_PIECES,...PRIMER_EXTRA_PIECES,...PRIMER_KRIEGER_PIECES,...PRIMER_JCBACH_PIECES,...PRIMER_BACH514_PIECES];
 const sources={...core.PRIMER_SOURCES,...PRIMER_TURK_BALLET_SOURCES,...PRIMER_EXTRA_SOURCES,...PRIMER_KRIEGER_SOURCES,...PRIMER_JCBACH_SOURCES,...PRIMER_BACH514_SOURCES};
 const demos=[...core.PRIMER_DEMOS,...PRIMER_TURK_BALLET_DEMOS,...PRIMER_EXTRA_DEMOS,...PRIMER_KRIEGER_DEMOS,...PRIMER_JCBACH_DEMOS,...PRIMER_BACH514_DEMOS];
 if(activePieces.length!==10||new Set(activePieces.map(p=>p.id)).size!==10)throw Error('Expected ten distinct complete beginner pieces');
 for(const [key,source] of Object.entries(sources))verifyFile(source.file,source.sha256,key);
 const scores=activePieces.map(p=>{
  const source=sources[p.sourceKey];
  const gradeEvidence=p.gradeEvidence||source?.gradeEvidence,gradeUrl=p.gradeUrl||source?.gradeUrl;
  if(!gradeEvidence||!gradeUrl)throw Error(`${p.id}: missing source or difficulty evidence`);
  const right=parseStaff(p.right,'right',p.meter,p.id),left=parseStaff(p.left,'left',p.meter,p.id);
  if(Math.abs(right.totalBeats-left.totalBeats)>1e-7)throw Error(`${p.id}: staff length mismatch`);
  if(Math.abs(p.timeSignature[0]*4/p.timeSignature[1]-p.meter)>1e-7)throw Error(`${p.id}: time signature mismatch`);
  const license=source.license==='Public Domain'?'原作品和所用历史版谱面为公版，本次独立机器可读转录以 CC0 提供。':`本次机器可读转录沿用所据版本的 ${source.license} 许可；版本署名：${source.editor||source.label}。许可：${source.licenseUrl}`;
  const extraNotes=(p.extraNotes||[]).map((note,i)=>({...note,id:`${p.id}-extra-${i}`}));
  return normalizeScore({schemaVersion:2,id:p.id,title:p.title,composer:p.composer,collection:p.collection,level:'通用参考 1 级',grade:1,category:'piece',grading:'general',evaluationProfile:'musical',bpm:p.bpm,timeSignature:p.timeSignature,keySignature:p.key,
   notes:[...right.notes,...left.notes,...extraNotes],totalBeats:p.right.split('|').length*p.meter,
   source:{label:source.label,url:source.url,note:`${p.note} 所据版本：${source.edition} ${license} 难度参考：${gradeEvidence}；半拍分级不代表指定考试版本。练习 BPM 为应用设置，真人录音是独立演绎参考。`},
   tags:['1级','双手','完整原作','全曲单遍','真人示范']});
 });
 const scoreIds=new Set(scores.map(s=>s.id)),demoIds=new Set();
 for(const demo of demos){
  if(!demo.id||demoIds.has(demo.id)||!demo.scoreIds?.length||demo.scoreIds.some(id=>!scoreIds.has(id)))throw Error(`Invalid primer performance: ${demo.id}`);
  demoIds.add(demo.id);
  if(/youtube|youtu\.be/i.test(JSON.stringify(demo)))throw Error(`Retired platform in active performance: ${demo.id}`);
  if(demo.kind==='audio')verifyFile(`public/${demo.src.replace(/^\.\//,'')}`,demo.sha256,demo.id);
  else if(demo.kind!=='external'||new URL(demo.sourceUrl).hostname!=='www.bilibili.com')throw Error(`Unsupported performance source: ${demo.id}`);
 }
 for(const score of scores)if(!demos.some(demo=>demo.scoreIds.includes(score.id)))throw Error(`${score.id}: missing human performance`);
 const archive=buildArchive();
 if(archive.some(score=>scoreIds.has(score.id)))throw Error('Active and archived primer IDs overlap');
 const generated='// Generated by scripts/build-primer.mjs. Source editions and licenses: research/primer/source.json.\n';
 writeFileSync(new URL('public/primer-repertoire.mjs',root),generated+'export const PRIMER_REPERTOIRE = '+JSON.stringify(scores,null,2)+';\n\nexport const PRIMER_ARCHIVE = '+JSON.stringify(archive,null,2)+';\n\nexport const PRIMER_DEMOS = '+JSON.stringify(demos,null,2)+';\n');
 writeFileSync(new URL('research/primer/source.json',root),JSON.stringify({verifiedOn:'2026-09-27',sources,entries:activePieces.map(p=>({id:p.id,sourceKey:p.sourceKey,page:p.page,gradeEvidence:p.gradeEvidence||sources[p.sourceKey].gradeEvidence,gradeUrl:p.gradeUrl||sources[p.sourceKey].gradeUrl,transcriptionLicense:sources[p.sourceKey].license==='Public Domain'?'CC0':sources[p.sourceKey].license})),performances:demos,archive:{ids:archive.map(s=>s.id),provenanceFile:'research/primer/archive-source.json',note:'Former Gurlitt Op.117 Nos.1–10 remain unchanged for saved history and plans; not offered in the current graded library.'}},null,2)+'\n');
 const noticePath=new URL('public/audio/demos/NOTICE.md',root),notice=readFileSync(noticePath,'utf8');
 const marker=/\n?<!-- BEGIN PRIMER RECORDINGS -->[\s\S]*?<!-- END PRIMER RECORDINGS -->\n?/;
 const entries=demos.filter(d=>d.kind==='audio').map(d=>`## ${d.src.split('/').at(-1)}\n\n${d.attribution}\n\n- File: ${d.src.split('/').at(-1)}\n- Source: ${d.sourceUrl}\n- Recording license: ${d.license}\n- License: ${d.licenseUrl}\n- SHA-256: ${d.sha256}`).join('\n\n');
 writeFileSync(noticePath,notice.replace(marker,'').trimEnd()+'\n\n<!-- BEGIN PRIMER RECORDINGS -->\n'+entries+'\n<!-- END PRIMER RECORDINGS -->\n');
 console.log(`Built ${scores.length} source-backed beginner pieces, ${demos.length} performances, and ${archive.length} archived scores.`);
 return {scores,demos,archive};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))buildPrimer();
