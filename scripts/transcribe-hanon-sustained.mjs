// Independent Schirmer (1900) transcription, printed pp. 106–109.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {normalizeScore} from '../public/score-model.mjs';
const SOURCE='https://s9.imslp.org/files/imglnks/usimg/1/1b/IMSLP91547-PMLP03129-Hanon_Final.pdf';
const white=i=>60+12*Math.floor(i/7)+[0,2,4,5,7,9,11][((i%7)+7)%7];
function create(number,title,bpm,pages,note){
 const raw={schemaVersion:2,id:`hanon-${number}-complete`,title:`哈农第${number}条 · ${title}`,composer:'Charles-Louis Hanon',collection:'哈农 · 第 III 部',level:'基本功',category:'technique',evaluationProfile:'technique',bpm,timeSignature:[4,4],keySignature:'C',tags:['基本功','哈农',`哈农第${number}条`],source:{label:'Hanon · The Virtuoso Pianist · Schirmer (1900)',url:SOURCE,note:`独立按公版扫描印刷第${pages}页录入双手音高、时值和全部段落。${note}原谱八度线、跨谱表换算为真实音高；重新排版不代表原版版式。`},notes:[]};
 let count=0;
 const chord=(pitches,beat,duration,hand,fingers=[])=>pitches.forEach((pitch,i)=>raw.notes.push({id:`n${++count}`,pitch,beat,duration,hand,...(fingers[i]?{finger:fingers[i]}:{})}));
 return {raw,chord,finish:totalBeats=>normalizeScore({...raw,totalBeats})};
}

// Each row reads [RH octave root, RH inner dyad, LH octave root, LH inner dyad,
// optional held duration]. These are the changing harmonies of printed p.107,
// not generated transpositions of p.106. C4 is MIDI 60.
const SECOND_PAGE_58=[
 // First system, two bars.
 [60,[64,67],36,[40,43]], [62,[67,71],43,[47,50]],
 [64,[67,72],48,[52,55]], [65,[69,72],45,[48,53]],
 [67,[72,76],40,[43,48]], [69,[72,77],41,[45,48]],
 [71,[74,79],38,[43,47]], [72,[76,79],40,[43,48]],
 // Second system. The original starts the 8va at the fourth beat, after F4.
 [74,[79,83],35,[38,43]], [76,[79,84],36,[40,43]],
 [65,[69,72],33,[36,41]], [79,[84,88],28,[31,36]],
 [81,[84,89],29,[33,36]], [83,[86,91],26,[31,35]],
 [84,[88,91],24,[28,31],2],
 // Third system, contrary motion through the C-major chord.
 [88,[91,96],24,[28,31]], [84,[88,91],28,[31,36]],
 [79,[84,88],31,[35,38]], [76,[79,84],36,[40,43]],
 [76,[79,84],36,[40,43]], [72,[76,79],40,[43,48]],
 [67,[72,76],43,[47,50]], [64,[67,72],48,[52,55]],
 // Fourth system: two alternating harmonies, then their higher-register form.
 [64,[67,72],48,[52,55]], [67,[72,76],43,[48,52]],
 [64,[67,72],48,[52,55]], [67,[72,76],43,[48,52]],
 [62,[67,71],47,[50,55]], [67,[71,74],43,[47,50]],
 [62,[67,71],47,[50,55]], [67,[71,74],43,[47,50]],
 [76,[79,84],36,[40,43]], [79,[84,88],31,[36,40]],
 [76,[79,84],36,[40,43]], [79,[84,88],31,[36,40]],
 [74,[79,83],35,[38,43]], [79,[83,86],31,[35,38]],
 [74,[79,83],35,[38,43]], [79,[83,86],31,[35,38]],
];

function sustained58(){
 const b=create(58,'持续八度与内声双音 · 完整',60,'106–107','全部18小节主体依反复演奏两遍，再奏原谱全音符终止和弦。持八度保留1拍/2拍，内声为各拍第2–4个十六分音符；不把持音切碎为重击。指法请参阅原谱。');
 const degreePath=[...Array.from({length:17},(_,i)=>i),...Array.from({length:15},(_,i)=>15-i)];
 const first=degreePath.map((d,i)=>[white(d),[white(d+2),white(d+(i===0?4:5))],white(d)-24,[white(d+2)-24,white(d+(i===0?4:5))-24]]);
 let beat=0;
 for(let repeat=0;repeat<2;repeat++)for(const [right,ri,left,li,duration=1] of [...first,...SECOND_PAGE_58]){
  b.chord([right,right+12],beat,duration,'right');b.chord([left,left+12],beat,duration,'left');
  for(let i=1;i<duration*4;i++){b.chord(ri,beat+i*.25,.25,'right');b.chord(li,beat+i*.25,.25,'left');}
  beat+=duration;
 }
 b.chord([84,88,91,96],beat,4,'right');b.chord([24,28,31,36],beat,4,'left');
 return b.finish(beat+4);
}

function sixths59(){
 const b=create(59,'六度双音颤动 · 主体与两种变式',40,'108–109','首小节按文字四遍，主体及随后两种四小节变式的普通反复各两遍；保留两个全音符结尾。这里是明确写出的双音交替基本功，按原谱逐音严格练习，不转成自由颤音识别。记录原谱交替指法。');
 let beat=0;
 const dyad=(degree,rf,lf,duration=.25)=>{
  b.chord([white(degree),white(degree+5)],beat,duration,'right',rf);
  b.chord([white(degree)-24,white(degree+5)-24],beat,duration,'left',lf);beat+=duration;
 };
 const upF=[[1,4],[2,5]],leftUp=[[5,2],[4,1]];
 const downF=[[2,5],[1,4]],leftDown=[[4,1],[5,2]];
 for(let repeat=0;repeat<4;repeat++)for(let i=0;i<16;i++)dyad(2+i%2,upF[i%2],leftUp[i%2]);
 for(let repeat=0;repeat<2;repeat++){
  for(let d=2;d<=15;d++)for(let i=0;i<8;i++)dyad(d+i%2,upF[i%2],leftUp[i%2]);
  for(let d=16;d>=3;d--)for(let i=0;i<8;i++)dyad(d-i%2,downF[i%2],leftDown[i%2]);
 }
 dyad(2,[2,5],[4,1],4);
 // Two independently printed variations; their repeated common notes are
 // intentional. Every written attack is a sixteenth, including beam breaks.
 for(let repeat=0;repeat<2;repeat++){
  for(let d=2;d<=17;d++){dyad(d,upF[0],leftUp[0]);dyad(d+1,upF[1],leftUp[1]);}
  for(let d=18;d>=3;d--){dyad(d,downF[0],leftDown[0]);dyad(d-1,downF[1],leftDown[1]);}
 }
 for(let repeat=0;repeat<2;repeat++){
  for(let d=2;d<=17;d++){dyad(d,upF[0],leftUp[0]);dyad(d+2,upF[1],leftUp[1]);}
  for(let d=18;d>=3;d--){dyad(d,downF[0],leftDown[0]);dyad(d-2,downF[1],leftDown[1]);}
 }
 b.chord([64,67,72],beat,4,'right');b.chord([36,40,48],beat,4,'left');
 return b.finish(beat+4);
}

export function transcribeHanonSustained(){return [sustained58(),sixths59()];}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const scores=transcribeHanonSustained();
 await writeFile(new URL('../public/hanon-sustained.mjs',import.meta.url),`// Generated from independent Schirmer (1900) transcription.\n// Rebuild: node scripts/transcribe-hanon-sustained.mjs\nexport const HANON_SUSTAINED = ${JSON.stringify(scores)};\n`);
 console.log(scores.map(s=>`${s.id}: ${s.totalBeats/4} bars, ${s.notes.length} notes`).join('\n'));
}
