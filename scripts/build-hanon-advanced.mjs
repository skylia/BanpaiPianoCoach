// Independent transcription of Schirmer (1900), printed pp.72–98.
// Numeric arrays below are diatonic staff steps, checked against the named page.
// These newly entered note data are dedicated to CC0. Repeats are played once.
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {normalizeScore} from '../public/score-model.mjs';
export function transcribeHanonAdvanced(){
const major=[0,2,4,5,7,9,11],rows=[];
const range=(a,b)=>Array.from({length:Math.abs(b-a)+1},(_,i)=>a+i*Math.sign(b-a));
const repeat=(value,n)=>Array.from({length:n},()=>value);
const d=(step,base=48)=>base+12*Math.floor(step/7)+major[(step%7+7)%7];
const sourceUrl='https://s9.imslp.org/files/imglnks/usimg/1/1b/IMSLP91547-PMLP03129-Hanon_Final.pdf';
function add(number,suffix,title,seq,{base=48,left=null,duration=.25,timeSignature=[4,4],keySignature='C',bpm=60,pages,description='',fingers,final=null,pitchMap=null}={}){
 const notes=[];let beat=0;
 for(let i=0;i<seq.length;i++){const item=seq[i],right=(Array.isArray(item)?item:[item]).map(n=>pitchMap?pitchMap(n):d(n,base)),l=left?.[i]??(Array.isArray(item)?item:[item]).map(n=>pitchMap?pitchMap(n)-12:d(n,base-12));for(const [hand,pitches]of [['right',right],['left',Array.isArray(l)?l:[l]]])for(let j=0;j<pitches.length;j++)notes.push({id:`h${number}-${suffix}-${hand[0]}-${i}-${j}`,pitch:pitches[j],beat,duration,hand,...(fingers?{finger:fingers(hand,i,j)}:{})});beat+=duration;}
 if(final){for(const [hand,pitches]of [['right',final.right],['left',final.left]])for(const pitch of pitches)notes.push({id:`h${number}-${suffix}-${hand[0]}-end-${pitch}`,pitch,beat,duration:final.duration??4,hand});beat+=final.duration??4;}
 rows.push(normalizeScore({schemaVersion:2,id:`hanon-${number}${suffix?'-'+suffix:''}`,title:`哈农第 ${number} 条 · ${title}`,composer:'C. L. Hanon',collection:'哈农 · 第 III 部',level:'基本功',category:'technique',evaluationProfile:'technique',bpm,timeSignature,keySignature,notes,totalBeats:beat,source:{label:'Schirmer 1900 · 公版原谱',url:sourceUrl,note:`独立据公版原谱印刷第 ${pages} 页转录；${description}反复段弹一遍。新转录音符数据 CC0；原谱的练习提示与分段保持可核查。`},tags:['基本功','哈农',`哈农第${number}条`,title,'双手']}));
}
// No.44: repeated-note triplets, introduction, scalar span, and the written
// arpeggiated continuation; the final tonic is an octave below the opening.
const h44intro=repeat(0,48),h44scale=[...range(0,23),...range(23,0)].flatMap(n=>repeat(n,3));
const h44cont=range(0,13).flatMap(n=>[n,n+2,n+5,n+3]).concat([14,14,16,14,11,11,14,11,9,9,11,9,7,7,9,7,4,4,7,4,2,2,4,2,0,0,-3,-3]).flatMap(n=>repeat(n,3));
add(44,'','三同音与音阶、延续段',[...h44intro,...h44scale,...h44cont],{duration:1/3,pages:'72–73',description:'三同音组按三连音还原；先四小节同音，后音阶及延续段。',final:{right:[36],left:[24]},fingers:(_h,i)=>[3,2,1][i%3]});
// No.45: six printed fingerings share the same 64-note ascent/descent.
const h45=[0,...range(1,15).flatMap(n=>[n,n]),16,16,...range(15,1).flatMap(n=>[n,n]),0];
for(const [i,pair]of [[1,[1,2]],[2,[2,3]],[3,[3,4]],[4,[4,5]],[5,[1,3]],[6,[2,4]]])add(45,`fingering-${i}`,`两同音 · 指法 ${pair.join('–')}`,h45,{base:60,pages:i<=3?'74':'75',fingers:(hand,n)=>pair[(n+(n>=32?1:0)+(hand==='left'?1:0))%2],description:`原谱第 ${i} 种指法；`,...(i===6?{final:{right:[60],left:[48]}}:{})});
// No.46, pp.76–77: the six-bar preparation, 25 ascending and 23
// descending trill positions, followed by the seven written fingering bars.
const trillPair=i=>i%2?[i+1,i]:[i,i+1];
const h46intro=[0,1,2,3,2,1].flatMap(i=>repeat(trillPair(i),8).flat());
const h46body=[...range(0,24),...range(23,1)].flatMap(i=>repeat(trillPair(i),8).flat());
const h46ending=repeat([0,1],56).flat();
add(46,'','五指颤音 · 全曲单遍',[...h46intro,...h46body,...h46ending],{pages:'76–77',description:'保留六小节预备、上行下行及末尾指法段；颤音依原谱写出的十六分音符逐音练习。',final:{right:[48],left:[36]}});
// No.47: the hands diverge on the descent. The left hand descends
// from G4 while the right hand uses the written four-note figure.
const h47intro=repeat(0,64),h47up=range(0,19).flatMap(n=>repeat(n,8));
const h47down=range(0,9).flatMap(i=>{const n=20-i*2;return [n,n+3,n+2,i===9?n:n-1].flatMap(n=>repeat(n,4));});
const h47left=[...h47intro,...h47up,...range(18,0).flatMap(n=>repeat(n,8)),...repeat(0,8)].map(n=>d(n,36));
add(47,'','四同音 · 全曲单遍',[...h47intro,...h47up,...h47down],{left:h47left,pages:'78',description:'四小节同音预备、上行及双手不同音型的下行，保留原谱尾音。',final:{right:[48],left:[36]},fingers:(_h,i)=>[4,3,2,1][i%4]});
// No.48: four-bar wrist preparation, then independent contrary-motion
// spans. Both pages share the written scale contour; the interval is changed.
const h48prep=[0,1,2,3,2,3,2,1].flatMap(n=>repeat(n,8));
const h48r=[...range(0,15),...range(16,1),...range(0,15),...range(16,9),...range(8,15),...range(16,9),...range(8,15),...range(16,1),...range(0,7),...range(8,1),...range(0,-7),...range(-8,-1)];
const h48l=[...range(0,15),...range(16,1),...range(0,7),...range(8,1),...range(0,15),...range(16,1),...range(0,7),...range(8,1),...range(0,-7),...range(-8,-1),...range(0,-7),...range(-8,-1)];
for(const [name,interval,offset,page]of [['thirds',2,0,79],['sixths',5,2,80]]){const chord=n=>[n,n+interval],map=n=>d(n+offset,60);add(48,name,`${interval===2?'三度':'六度'}断奏 · 预备及全段`,[...h48prep,...h48r].map(chord),{pitchMap:map,left:[...h48prep,...h48l].map(n=>chord(n).map(v=>map(v)-12)),pages:String(page),bpm:40,description:'四小节同音预备与八小节双手同向、反向音阶；',...(interval===5?{final:{right:[64,72],left:[52,60]}}:{})});}
// No.49: two complete eight-bar stretching figures; the first includes a
// separate summit turn, while the continuation ascends without that turn.
const h49up=n=>[n,n+5,n+2,n+7,n+1,n+6,n+3,n+8],h49down=n=>[n,n-5,n-2,n-7,n-1,n-6,n-3,n-8];
const h49a=[...range(0,6).flatMap(i=>h49up(2+i*2)),16,21,18,21,23,21,18,16,...range(0,7).flatMap(i=>h49down(23-i*2))];h49a.splice(-3,3,3,4,3);
const h49b=[...range(0,7).flatMap(i=>{const n=2+i*2;return[n,n+5,n+1,n+6,n+1,n+6,n+2,n+7]}),...range(0,7).flatMap(i=>{const n=23-i*2;return[n,n-5,n-1,n-6,n-1,n-6,n-2,n-7]})];h49b.splice(-3,3,3,4,3);
for(const [suffix,title,seq]of [['stretch','伸展音型',h49a],['continuation','伸展延续音型',h49b]])add(49,suffix,title,seq,{base:60,left:seq.map(n=>d(n,36)),pages:'81',description:'完整八小节及结尾和音；两手相隔两个八度。',final:{right:[64,72],left:[40,48]}});
// No.50: the four-bar preparation, the full ascending / descending
// third figure, followed by the two separately printed scale studies.
const h50prep=repeat([0,1,2,1,0,1,2,1],8).flat();
const h50body=[...range(0,10).flatMap(i=>{const n=i*2;return[n,n+1,n+2,n+1,n+1,n+2,n+3,n+2]}),...range(11,1).flatMap(i=>{const n=i*2;return[n,n-1,n-2,n-1,n-1,n-2,n-3,n-2]})];
add(50,'thirds','连奏三度 · 预备与完整音型',[...h50prep,...h50body].map(n=>[n,n+2]),{pages:'82–83',bpm:40,description:'四小节预备与十一小节连续音型；'});
add(50,'diatonic-scale','连奏三度 · 自然音阶',[...range(0,23),...range(24,1)].map(n=>[n,n+2]),{pages:'83',bpm:40,description:'原谱三小节音阶；空心音头用来提示换指瞬间保留音，本数据保留音高与起奏位置。'});
const h50chromatic=[...range(0,35),...range(36,1)].map(n=>[48+n,51+n]);
add(50,'chromatic-scale','连奏小三度 · 半音阶',h50chromatic,{pitchMap:n=>n,left:h50chromatic.map(chord=>chord.map(n=>n-12)),timeSignature:[3,4],pages:'83',bpm:40,description:'上行三小节、下行三小节；末尾二分音符后休止一拍。',final:{right:[48,51],left:[36,39],duration:2}});rows.at(-1).totalBeats+=1;
// No.51: all three printed pages. The long expanding / contracting
// wave was checked against every lower left-hand note (384 onsets), including
// the altered final turn. Separate arrays preserve the contrary-motion section.
const h51prep=[...range(0,8),...range(7,1)].flatMap(n=>repeat(n,8));
const h51wave=[0];for(const peak of [...range(1,14),...range(13,1)])h51wave.push(...range(1,peak),...range(peak-1,0));h51wave.length=384;h51wave[383]=1;
function octave51(suffix,title,right,left,pages,extra={}){add(51,suffix,title,right.map(n=>[n,n+7]),{base:60,left:left.map(n=>[d(n,36),d(n+7,36)]),pages,bpm:40,...extra});}
octave51('preparation','八度预备 · 同音段',h51prep,h51prep,'84',{description:'原谱最初三行，共八小节；'});
octave51('expanding-scales','八度预备 · 扩展及收缩音阶',h51wave,h51wave,'84–85',{description:'完整二十四小节，逐次扩展后收回，末尾依原谱回到相邻音。'});
const h51r=[...range(2,16),15,...range(14,0),1,...range(2,14),13,12,11,...range(10,0),...range(1,5),...range(6,16),...range(15,11),10,9,8,7,8,9,10,11,12,13,14,13,12,11,10,9,...range(8,0),1,2,1,0,1,2,1];
const h51l=[...range(0,14),13,...range(12,0),1,2,3,...range(4,16),15,14,13,...range(12,0),1,2,3,4,5,6,7,6,5,4,3,2,1,0,1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,1,0,1,2,1,0,1];
octave51('contrary-scales','八度预备 · 双手不同走向',h51r,h51l,'86',{description:'原谱开头七小节，分别转录双手起点、转折及收尾；'});
for(const [suffix,offset,title]of [['chromatic-parallel',0,'半音八度 · 同向'],['chromatic-third',3,'半音八度 · 双手错开三度']]){const steps=[...range(0,23),...range(24,1)],seq=steps.map(n=>[60+offset+n,72+offset+n]);add(51,suffix,title,seq,{pitchMap:n=>n,left:steps.map(n=>[36+n,48+n]),timeSignature:[3,4],pages:'86',bpm:40,description:'原谱四小节半音音阶；',...(offset?{final:{right:[63,75],left:[36,48],duration:2}}:{})});if(offset)rows.at(-1).totalBeats+=1;}
// No.52, pp.87–90: the seven two-beat bars and closing half-note
// are independently transposed using the printed major / harmonic-minor scale.
const h52steps=[...range(0,14),13,...range(12,5),4,3,2,1,0,1,2,3,...range(4,11),12,13,14,13,12,11,10,9,...range(8,1)];
const keys52=[['C',60,false,87],['G',55,false,87],['D',62,false,87],['A',57,false,88],['E',64,false,88],['F',53,false,88],['Bb',58,false,89],['Eb',63,false,89],['Ab',56,false,89],['Am',57,true,90],['Dm',62,true,90],['Gm',55,true,90]];
for(const [key,tonic,minor,page]of keys52){const scale=minor?[0,2,3,5,7,8,11]:major,map=n=>tonic+Math.floor(n/7)*12+scale[(n%7+7)%7];add(52,key,`${key} 三度音阶`,h52steps.map(n=>[n,n+2]),{pitchMap:map,pages:String(page),timeSignature:[2,4],keySignature:key,bpm:40,description:'七小节十六分音符及结尾二分音符；',final:{right:[map(0),map(2)],left:[map(0)-12,map(2)-12],duration:2}});}
// No.54: the first trill moves through a four-position turn in each bar;
// the second uses successive adjacent thirds, including its reversed summit.
const thirdPair=(a,b)=>repeat([[a,a+2],[b,b+2]],4).flat();
const h54a=[...range(0,7).flatMap(n=>[...thirdPair(n,n+1),...thirdPair(n+2,n+1)]),...range(8,2).flatMap(n=>[...thirdPair(n,n-1),...thirdPair(n-2,n-1)])];
add(54,'fourfold','四重三度颤音 · 第一段',h54a,{base:60,pages:'95',bpm:40,description:'上行八小节、下行七小节，保留每半小节的交替方向；',final:{right:[60,64],left:[48,52]}});
const h54b=[...range(0,8).flatMap(n=>thirdPair(n,n+1)),...range(9,1).flatMap(n=>thirdPair(n,n-1))];
add(54,'alternate','四重三度颤音 · 第二段',h54b,{base:60,pages:'96',bpm:40,description:'连续三度交替的第二种指法段；',final:{right:[60,64],left:[48,52]}});
// The appendix on p.98 is explicitly titled “Special fingerings for the
// fourfold Trill”, so it belongs with No.54 even though printed after No.55.
const h54sr=[...repeat([[61,64],[62,65]],4).flat(),...repeat([[59,62],[60,64]],4).flat(),...repeat([[58,61],[57,62]],4).flat(),...repeat([[56,59],[55,60]],4).flat()];
const h54sl=[...repeat([[55,58],[53,57]],4).flat(),...repeat([[53,56],[52,55]],4).flat(),...repeat([[52,55],[50,53]],4).flat(),...repeat([[50,53],[48,52]],4).flat()];
for(const variant of [1,2])add(54,`special-fingering-${variant}`,`附加特殊指法 ${variant}`,h54sr,{pitchMap:n=>n,left:h54sl,pages:'98',bpm:40,description:`附加部分第 ${variant} 行，两小节；保留升降号及双手交叉谱的实际音高。`,fingers:(hand,i,j)=>hand==='right'?(variant===1?[[2,3],[1,4]]:[[2,4],[1,5]])[i%2][j]:(variant===1?[[3,2],[4,1]]:[[4,2],[5,1]])[i%2][j]});
const h54pedal=[4,5,4,5,3,4,3,4,2,3,2,3,1,2,1,2,4,5,4,5,3,4,3,4,2,3,2,3,1,2,0,1,4,5,3,4,2,3,1,2,1,2,3,4,5,4,3,2,1,2,1,2,3,4,3,4,3,4,3,4,2,1,2,3];
add(54,'held-bass','附加颤音 · 低音保持与重复',h54pedal.map(n=>[n,n+3]),{base:48,left:h54pedal.map(n=>d(n-2,48)),pages:'98',bpm:40,description:'附加部分最后两行：四小节，保留左手独立低音声部从二分音符到八分音符的变化。',final:{right:[52,55,60],left:[36,48]}});
for(const [bar,spacing]of [[0,2],[1,1],[2,.5],[3,.5]])for(let at=0;at<4;at+=spacing)rows.at(-1).notes.push({id:`h54-held-bass-${bar}-${at}`,pitch:43,beat:bar*4+at,duration:spacing,hand:'left'});
rows[rows.length-1]=normalizeScore(rows.at(-1));
// No.55: the right hand plays fourths; the left hand follows a diatonic
// third below the lower right-hand note. The final half-bar repeats the tonic turn.
const h55steps=[...range(0,14).flatMap(n=>repeat([n,n+1],4).flat()),...range(15,0).flatMap(n=>repeat([n,n-1],4).flat()),...repeat([0,-1],4).flat()];
add(55,'','三重颤音 · 全曲单遍',h55steps.map(n=>[n,n+3]),{pitchMap:n=>d(n+4,48),left:h55steps.map(n=>d(n+2,48)),pages:'96–97',bpm:40,description:'右手四度与左手单音同时交替；保留顶点换指与结尾重复音型。',final:{right:[55,60],left:[48,52]}});
// No.53: each source key occupies two bars. The last four notes connect to the
// next key: the minor-key bridge has a lowered supertonic and natural seventh.
const keys53=[['C',60,false,91],['Am',57,true,91],['F',53,false,91],['Dm',62,true,91],['Bb',58,false,91],['Gm',55,true,91],['Eb',63,false,92],['Cm',60,true,92],['Ab',56,false,92],['Fm',65,true,92],['Db',61,false,92],['Bbm',58,true,92],['Gb',54,false,93],['Ebm',63,true,93],['B',59,false,93],['G#m',56,true,93],['E',64,false,93],['C#m',61,true,93],['A',57,false,94],['F#m',54,true,94],['D',62,false,94],['Bm',59,true,94],['G',55,false,94],['Em',52,true,94]];
for(const [key,tonic,minor,page]of keys53){const scale=minor?[0,2,3,5,7,8,11]:major,steps=[...range(0,14),...range(13,0),1,0,-1],map=n=>tonic+Math.floor(n/7)*12+scale[(n%7+7)%7],seq=steps.map(n=>[n,n+7]);
 const before=rows.length;add(53,key.replace('#','sharp'),`${key} 八度音阶`,seq,{pages:String(page),bpm:40,keySignature:key,pitchMap:map,left:seq.map(chord=>chord.map(n=>map(n)-24)),description:'该调原谱两小节，包括末尾连接下一调的四音；',...(key==='Em'?{final:{right:[48,60],left:[24,36]}}:{})});
 if(minor){const row=rows[before];for(const n of row.notes)if(Math.abs(n.beat-7.25)<1e-6)n.pitch-=1;else if(Math.abs(n.beat-7.75)<1e-6)n.pitch-=1;}
}
return rows.sort((a,b)=>Number(a.id.match(/^hanon-(\d+)/)[1])-Number(b.id.match(/^hanon-(\d+)/)[1])).map(row=>normalizeScore({...row,totalBeats:Number(row.totalBeats.toFixed(8))}));
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const rows=transcribeHanonAdvanced();
 writeFileSync(new URL('../public/hanon-advanced.mjs',import.meta.url),'// Generated by scripts/build-hanon-advanced.mjs. Source: Schirmer 1900; new note data CC0.\nexport const HANON_ADVANCED = '+JSON.stringify(rows)+';\n');
 console.log(`Built ${rows.length} advanced Hanon sections.`);
}
