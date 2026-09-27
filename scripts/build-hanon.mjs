// Reproducible extraction of the original hand voices, including cross-staff notes.
// Source notation/data retains the licenses listed in research/hanon/README.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseMidi} from '../public/midi.mjs';
import {normalizeScore,barCount} from '../public/score-model.mjs';
import {HANON_TRANSCENDENT} from '../public/hanon-transcendent.mjs';
import {HANON_SCALE_SCORES} from '../public/hanon-scales.mjs';
import {HANON_ADVANCED} from '../public/hanon-advanced.mjs';
import {HANON_FINAL} from '../public/hanon-final.mjs';
import {HANON_SUSTAINED} from '../public/hanon-sustained.mjs';
import {HANON_TREMOLO_OPENING} from './hanon-tremolo-outer.mjs';
import {HANON_TREMOLO_MIDDLE} from './hanon-tremolo-middle.mjs';
import {HANON_TREMOLO_CLOSING} from './hanon-tremolo-closing.mjs';

const root=new URL('../research/hanon/',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const natural=[0,2,4,5,7,9,11],letter='cdefgab';
function parseVoice(source,voice){
  const header=new RegExp(`\\b${voice}\\s*=\\s*(?:\\\\relative\\s+([a-g][',]*)\\s*)?\\{`).exec(source);
  if(!header)throw Error('Missing voice '+voice);
  let depth=1,end=header.index+header[0].length;
  for(;end<source.length&&depth;end++)depth+=source[end]==='{'?1:source[end]==='}'?-1:0;
  const relative=Boolean(header[1]);
  function absolute(token){const m=/^([a-g])([',]*)$/.exec(token);return 21+letter.indexOf(m[1])+7*([...m[2]].filter(c=>c==="'").length-[...m[2]].filter(c=>c===',').length);}
  let previous=relative?absolute(header[1]):21,duration=1,beat=0;
  const text=source.slice(header.index+header[0].length,end-1)
    .replace(/%[^\n]*/g,'').replace(/"[^"\n]*"/g,'')
    .replace(/\\repeat\s+volta\s+\d+/g,'').replace(/\\[a-zA-Z]+/g,'');
  // The audited Part I files contain only notes/chords, fingerings, and layout commands.
  const tokens=text.match(/<[^>]+>\s*\d*\.?|(?<![A-Za-z])[a-g][',]*(?:\s*\d+\.?)?(?:\s*[-_^]\s*[1-5])?/g)||[];
  const notes=[];
  for(const token of tokens){
    const chord=token.startsWith('<');
    const body=chord?token.slice(1,token.indexOf('>')):token;
    const parts=[...body.matchAll(/([a-g])([',]*)(?:\s*(\d+)\.?)?(?:\s*[-_^]\s*([1-5]))?/g)];
    const durationText=chord?token.slice(token.indexOf('>')+1).trim():parts[0]?.[3];
    if(durationText)duration=4/Number(durationText.replace('.',''))*(durationText.includes('.')?1.5:1);
    let first;
    for(const part of parts){
      const pitchLetter=letter.indexOf(part[1]);
      let diatonic=relative?previous+((pitchLetter-previous%7+10)%7-3):21+pitchLetter;
      diatonic+=7*([...part[2]].filter(c=>c==="'").length-[...part[2]].filter(c=>c===',').length);
      previous=diatonic;first??=diatonic;
      const note={pitch:12+12*Math.floor(diatonic/7)+natural[diatonic%7],beat,duration,hand:voice==='RH'?'right':'left'};
      if(part[4])note.finger=Number(part[4]);
      notes.push(note);
    }
    if(chord)previous=first;
    beat+=duration;
  }
  return {notes,totalBeats:beat};
}

const rows=[];
for(let number=1;number<=20;number++){
  const pad=String(number).padStart(2,'0'),lyPath=`mutopia/virtuoso-pianist-pt1-lys/hanon${pad}.ily`,midiPath=`mutopia/hanon${pad}.mid`;
  const ly=readFileSync(new URL(lyPath,root)),midi=readFileSync(new URL(midiPath,root));
  const right=parseVoice(ly.toString(),'RH'),left=parseVoice(ly.toString(),'LH');
  if(right.totalBeats!==left.totalBeats)throw Error(`Hanon ${number}: voice duration mismatch`);
  const notes=[...right.notes,...left.notes].sort((a,b)=>a.beat-b.beat||b.pitch-a.pitch);
  const midiNotes=parseMidi(midi).tracks.flatMap(t=>t.notes).sort((a,b)=>a.beat-b.beat||b.pitch-a.pitch);
  const fingerprint=ns=>JSON.stringify(ns.map(n=>[n.pitch,n.beat,n.duration]));
  if(fingerprint(notes)!==fingerprint(midiNotes))throw Error(`Hanon ${number}: notation differs from source MIDI`);
  const score=normalizeScore({schemaVersion:2,id:`hanon-${number}`,title:`哈农第 ${number} 条 · 全曲单遍`,composer:'C. L. Hanon',collection:'哈农 · 第 I 部',level:'基本功',category:'technique',evaluationProfile:'technique',bpm:60,timeSignature:[2,4],keySignature:'C',notes:notes.map((n,i)=>({...n,id:`hanon-${number}-${n.hand[0]}-${i}`})),totalBeats:right.totalBeats,source:{label:'Mutopia · Schirmer 1900 · CC BY-SA 4.0',url:'https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/',note:`第 ${number} 条完整谱面音符，反复段弹一遍。由 Steve Taylor / Javier Ruiz-Alma 的 Mutopia-2015/07/23-2037 LilyPond 原谱提取，按 RH/LH 声部保留左右手及已标指法，跨谱表不改变分手。音高、起音、时值逐项与原 MIDI 核对。曲谱数据沿用 CC BY-SA 4.0；60 BPM 是初始练习速度。`},tags:['基本功','哈农',`哈农第${number}条`,'全曲单遍','双手']});
  rows.push({score,source:{number,part:1,lyPath,midiPath,lySha256:sha(ly),midiSha256:sha(midi),notes:score.notes.length,bars:barCount(score),complete:true,repeatPolicy:'once',license:'CC BY-SA 4.0'}});
}
const scanSha256=sha(readFileSync(new URL('Schirmer-1900-complete.pdf',root)));
for(const raw of [...HANON_TRANSCENDENT,...HANON_SCALE_SCORES,...HANON_ADVANCED,...HANON_FINAL,...HANON_SUSTAINED,HANON_TREMOLO_OPENING,...HANON_TREMOLO_MIDDLE,...HANON_TREMOLO_CLOSING]){
  const score=normalizeScore(raw),number=Number(/^hanon-(\d+)/.exec(score.id)?.[1]);
  rows.push({score,source:{number,id:score.id,part:number<=43?2:3,scanPath:'Schirmer-1900-complete.pdf',scanSha256,notes:score.notes.length,bars:barCount(score),complete:true,repeatPolicy:'see-entry-source-note',license:'CC0-1.0 (independent transcription of public-domain score)'}});
}
rows.sort((a,b)=>a.source.number-b.source.number);
if(new Set(rows.map(r=>r.score.id)).size!==rows.length)throw Error('Duplicate Hanon entry');
for(let number=1;number<=60;number++)if(!rows.some(row=>row.source.number===number))throw Error(`Missing Hanon exercise ${number}`);
if(rows.filter(row=>row.source.number===60).length!==6)throw Error('Hanon 60 must contain all six source-page sections');
writeFileSync(new URL('../public/hanon-repertoire.mjs',import.meta.url),'// Generated by scripts/build-hanon.mjs; see research/hanon/README.md for source licenses.\nexport const HANON_REPERTOIRE = '+JSON.stringify(rows.map(r=>r.score))+';\n');
writeFileSync(new URL('MANIFEST.json',root),JSON.stringify(rows.map(r=>r.source),null,2)+'\n');
console.log(`Built ${rows.length} verified Hanon entries (${new Set(rows.map(r=>r.source.number)).size} exercise numbers).`);
