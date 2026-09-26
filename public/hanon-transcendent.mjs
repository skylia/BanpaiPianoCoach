// Independently transcribed from Schirmer (1900), printed pp.22–49.
// Musical data: CC0. Generator code: MIT. See research/hanon/transcendent-transcription.md.
const natural=[0,2,4,5,7,9,11];
const degree=d=>48+12*Math.floor(d/7)+natural[((d%7)+7)%7];
const sourceUrl='https://s9.imslp.org/files/imglnks/usimg/1/1b/IMSLP91547-PMLP03129-Hanon_Final.pdf';

// Ascending degrees are relative to C3. Descending degrees are offsets from G5.
// Separate downward figures are essential: several are not a simple inversion.
const figures=[
  [21,[0,1,2,1,0,2,3,4,5,4,3,4,5,4,3,2],[0,-1,-2,-1,0,-2,-3,-4,-5,-4,-3,-4,-5,-4,-3,-2]],
  [22,[0,2,1,2,0,2,3,4,5,3,4,3,5,4,3,2],[0,-2,-1,-2,0,-2,-3,-4,-5,-3,-4,-3,-5,-4,-3,-2]],
  [23,[0,1,2,1,0,1,2,1,0,5,4,3,2,3,4,3],[0,-1,-2,-1,0,-1,-2,-1,0,-5,-4,-3,-2,-3,-4,-3]],
  [24,[2,1,2,0,2,1,2,0,2,1,2,0,5,3,4,2],[-2,0,-1,0,-2,0,-1,0,-2,0,-1,0,-5,-3,-4,-2]],
  [25,[0,1,2,0,1,2,3,1,2,3,4,3,2,4,3,2],[0,-1,-2,0,-1,-2,-3,-1,-2,-3,-4,-2,-3,-4,-3,-2]],
  [26,[2,3,4,2,1,2,3,1,0,1,2,0,5,4,5,4],[0,-2,-1,0,-1,-3,-2,-1,-2,-4,-3,-2,-3,-4,-3,-4]],
  [27,[2,3,1,2,0,2,3,4,5,4,5,4,5,4,3,2],[0,-1,0,-2,-1,-2,-3,-4,-5,-4,-5,-4,-5,-4,-3,-2]],
  [28,[0,2,1,2,0,2,1,2,0,5,4,5,3,4,2,3],[0,-2,-1,-2,0,-2,-1,-2,0,-5,-4,-5,-3,-4,-2,-3]],
  [29,[0,1,0,2,1,2,1,3,2,3,2,4,3,4,3,4],[0,-1,0,-2,-1,-2,-1,-3,-2,-3,-2,-4,-3,-2,-3,-2]],
  [30,[0,1,0,1,0,1,0,2,5,4,5,4,5,4,5,3],[0,-1,0,-1,0,-1,0,-2,-5,-4,-5,-4,-5,-4,-5,-3]],
];

function baseScore(number,notes,totalBeats,timeSignature=[4,4],suffix='',extra=''){
  const id=`hanon-${number}${suffix?'-'+suffix:''}`;
  return {schemaVersion:2,id,title:`哈农第 ${number} 条 · ${extra||'全曲单遍'}`,composer:'C. L. Hanon',collection:'哈农 · 第 II 部',level:'基本功',category:'technique',evaluationProfile:'technique',bpm:60,timeSignature,keySignature:'C',notes:notes.map((n,i)=>({...n,id:`${id}-${n.hand[0]}-${i}`})),totalBeats,source:{label:'Schirmer 1900 · 公版原谱',url:sourceUrl,note:`由 Schirmer 1900 公版原谱独立转录第 ${number} 条。${number<=30?`原版第 ${22+(number-21)*2}–${23+(number-21)*2} 页。`:''}保留原音区、时值和完整段落；反复记号弹一遍，训练时可自行循环。双手按实际声部分开，跨谱表不改变归属。转录曲谱数据采用 CC0，程序代码为 MIT。`},tags:['基本功','哈农',`哈农第${number}条`,'全曲单遍','双手']};
}
function repeatedFigure([number,up,down]){
  const notes=[];
  let beat=0;
  const emit=d=>{notes.push({pitch:degree(d),beat,duration:.25,hand:'right'},{pitch:degree(d)-12,beat,duration:.25,hand:'left'});beat+=.25;};
  for(let bar=0;bar<14;bar++)for(const offset of up)emit(bar+offset);
  const downBars=number===30?13:14;
  for(let bar=0;bar<downBars;bar++)for(let i=0;i<down.length;i++){
    let offset=down[i];
    // Printed terminal-bar adjustments, not another transposition of the motif.
    if(number===22&&bar===13&&i===13)offset=-2;
    if(number===22&&bar===13&&i===15)offset=-4;
    if(number===30&&bar===12&&i===15)offset=-4;
    emit(18-bar+offset);
  }
  notes.push({pitch:48,beat,duration:2,hand:'right'},{pitch:36,beat,duration:2,hand:'left'});
  return baseScore(number,notes,beat+2);
}
// Notes below are transcribed independently from printed pp.42–49, including
// warm-up repetitions explicitly requested by the original instructions.
function writer(){
  const notes=[];let beat=0;
  return {notes,get beat(){return beat;},
    pair(r,l,duration=.25){for(const [pitches,hand]of [[r,'right'],[l,'left']])for(const pitch of Array.isArray(pitches)?pitches:[pitches])notes.push({pitch,beat,duration,hand});beat+=duration;},
    parallel(values,duration=.25){for(const d of values)this.pair(degree(d),degree(d)-12,duration);},
    rest(duration){for(const hand of ['right','left'])notes.push({pitch:null,rest:true,beat,duration,hand});beat+=duration;}
  };
}
function finish(number,w,timeSignature,suffix='',title='',instructions=''){
  const score=baseScore(number,w.notes,w.beat,timeSignature,suffix,title);
  score.bpm=[32,33,35].includes(number)?40:60;
  const pages={31:'42–43',32:'43',33:'44',34:'45',35:'46',36:'47',37:'47',38:'48–49'};
  score.source.note=`由 Schirmer 1900 公版原谱第 ${pages[number]} 页独立转录第 ${number} 条。${instructions}正文反复记号各弹一遍，训练时可自行循环。双手按实际声部分开，跨谱表不改变归属。转录曲谱数据采用 CC0，程序代码为 MIT。`;
  return score;
}
function exercise31(){
  const w=writer(),up=[0,7,6,7,5,7,4,7,3,7,2,7],down=[7,0,1,0,2,0,3,0,4,0,5,0];
  for(let bar=0;bar<14;bar++)for(const offset of up)w.pair(degree(2+bar+offset),degree(-7+bar+offset));
  w.pair(76,60,3);
  for(let bar=0;bar<14;bar++)for(const offset of down)w.pair(degree(16-bar+offset),degree(7-bar+offset));
  w.pair([52,64],[36,48],2);w.rest(1);
  return finish(31,w,[3,4],'','全曲单遍','两手不是平行八度；保留十度关系、中段附点二分音符及结尾双八度和弦。');
}
function thumbExercise(number,warmup,repeats,up,bases,down,downBases,timeSignature){
  const w=writer();for(let n=0;n<repeats;n++)w.parallel(warmup);
  for(const base of bases)w.parallel(up.map(x=>x+base));
  for(const base of downBases)w.parallel(down.map(x=>x+base));
  w.pair(48,36,timeSignature[0]===2?2:3);
  return finish(number,w,timeSignature,'','全曲（含预备练习）',`原谱指定的预备小节完整弹 ${repeats} 遍。`);
}
const range=(start,count,step=1)=>Array.from({length:count},(_,i)=>start+i*step);
function exercise36(){
  const w=writer();for(const base of range(0,8,2))w.parallel([0,2,1,0,1,3,2,1].map(x=>x+base));
  w.parallel([15,17,16,15,14,15,14,13]);
  for(const base of range(14,7,-2))w.parallel([0,-2,-1,0,-1,-3,-2,-1].map(x=>x+base));
  w.pair(48,36,2);return finish(36,w,[2,4]);
}
function exercise37(){
  const w=writer();
  const bars=[
    [[0,2,0,2],[1,1,1,1]],[[4,2,4,2],[1,1,1,1]],
    [[0,2,2,0,2,2],[1,.5,.5,1,.5,.5]],[[4,2,2,4,2,2],[1,.5,.5,1,.5,.5]],
    [[0,0,2,2,0,0,2,2],Array(8).fill(.5)],[[4,4,2,2,4,4,2,2],Array(8).fill(.5)],
    [[4,4,2,2,0,0,2,2],Array(8).fill(.5)],[[4,2,0,2,4,2,0,2],Array(8).fill(.5)],
    [[4,2,2,4,2,2],[1,.5,.5,1,.5,.5]],[[0,2,0,2],[1,1,1,1]],[[0,0],[2,2]],[[0],[4]]
  ];
  for(const [pitches,durations]of bars)for(let i=0;i<pitches.length;i++)w.pair(degree(14+pitches[i]),degree(pitches[i]),durations[i]);
  for(const n of w.notes)n.finger=1;
  const instructions='全程仅用两手拇指弹奏 12 小节。开始前轻轻按住右手 D5、F5、A5（2、4、5 指）与左手 F3、D3、B2（2、4、5 指），不使其发声，并保持按住。静默持音不列作需击奏的目标；谱中只显示实际拇指音。';
  const score=finish(37,w,[4,4],'','拇指专项 · 12 小节',instructions);
  return score;
}
function exercise38(contrary){
  const w=writer();
  for(let bar=0;bar<15;bar++)for(let note=0;note<8;note++)w.pair(degree((contrary?7:0)+bar+note),degree((contrary?0:-7)+bar+(contrary?-note:note)));
  w.pair(contrary?84:72,contrary?72:60,2);
  for(let bar=0;bar<15;bar++)for(let note=0;note<8;note++)w.pair(degree((contrary?28:21)-bar-note),degree((contrary?7:14)-bar+(contrary?note:-note)));
  // Original p.48 ends with C4/C3, one octave above its final sixteenth.
  w.pair(contrary?72:60,contrary?36:48,2);
  return finish(38,w,[2,4],contrary?'contrary':'parallel',contrary?'音阶准备 · 反向部分':'音阶准备 · 同向部分','本条按原谱两页分为同向、反向两部分，各含完整上行、下行及中间与结尾长音。');
}
export const HANON_TRANSCENDENT=[
  ...figures.map(repeatedFigure),exercise31(),
  thumbExercise(32,[0,1,0,-1,0,1,0,-1,0,1,0,-1],4,[0,1,2,3,2,1,2,3,4,5,4,3],range(0,6,4),[0,-1,0,1,0,-1,-2,-3,-4,-2,-3,-4],range(22,5,-4),[6,8]),
  thumbExercise(33,[0,1,2,3,2,1,0,1,2,3,2,1],4,[0,1,2,3,2,1,1,2,3,4,3,2],range(0,12,2),[0,-1,-2,-3,-2,-1,-1,-2,-3,-4,-3,-2],range(24,11,-2),[6,8]),
  thumbExercise(34,[0,1,2,3,4,3,2,1],10,[0,1,2,3,4,3,2,1],range(1,14),[0,1,2,3,3,2,1,0],range(14,15,-1),[2,4]),
  thumbExercise(35,[0,1,0,1,2,3,4,5,4,3,2,1],10,[0,1,0,1,2,3,4,5,4,3,2,1],range(1,14),[0,-1,0,-1,-2,-3,-4,-5,-4,-3,-2,-1],range(18,14,-1),[3,4]),
  exercise36(),exercise37(),exercise38(false),exercise38(true)
];
