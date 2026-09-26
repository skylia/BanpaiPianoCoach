// Schirmer 1900, printed pp.111–113. Independent transcription, CC0.
// The repeated units below preserve the printed 32nd-note onsets, hand voicing,
// accidental scope and octave signs. Eight pairs occupy two quarter-note beats.
import {normalizeScore} from '../public/score-model.mjs';
const pitch=s=>{const m=/^([A-G])([#b]?)(\d)$/.exec(s);if(!m)throw Error('pitch '+s);return 12*(+m[3]+1)+({C:0,D:2,E:4,F:5,G:7,A:9,B:11})[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);};
const chord=s=>s.split(' ').filter(Boolean).map(pitch);
export const tremoloCell=(ra,rb,la,lb,n=8)=>({r:Array.from({length:n*2},(_,i)=>chord(i%2?rb:ra)),l:Array.from({length:n*2},(_,i)=>chord(i%2?lb:la))});
const c=tremoloCell;
// The last fast single note is tied into the closing quarter-note chord. It
// sustains without a second attack; the quarter rest still occupies its beat.
const close=(ra,rb,la,lb)=>{const value=c(ra,rb,la,lb);for(const key of ['r','l']){const a=value[key].at(-2),b=value[key].at(-1);value[key][value[key].length-1]={pitches:b,duration:.125,sustain:1.125};value[key].push({pitches:a.filter(p=>!b.includes(p)),duration:1},{pitches:[],duration:1});}return value;};
export const TREMOLO_111_ROW1=[
 c('D5 G5 B5','B4','D3 G3 B3','D4'),c('D5 F#5 A5','C5','D3 F#3 A3','D4'),
 c('B4 D5 G5','G4','G2 B2 D3','G3'),c('B4 D5 G5','G4','G2 B2 D3','F3'),
];
const first111row2=c('C5 E5 G5','G4','C3 E3 G3','C4');
// The left hand explicitly enters C3, E3 before the chordal figure.
first111row2.l[0]=chord('C3');first111row2.l[1]=chord('E3');
export const TREMOLO_111_ROW2=[
 first111row2,c('D5 E5 G#5','G#4','B2 D3 E3','B3'),
 c('C5 E5 A5','A4','A2 C3 E3','A3'),c('A5 D6 F6','F5','D2 A2','D3',4),c('A5 D6 F6','F5','F2 A2','D3',4),
];
export const TREMOLO_111=[...TREMOLO_111_ROW1,...TREMOLO_111_ROW2,
 // System 3, ending the C-major phrase.
 c('G5 C6 E6','E5','G2 C3 E3','G3'),c('G5 B5 D6','F5','G2 B2 D3','G3'),close('E5 G5 C6','C5','C3 E3 G3','C4'),
 // System 4: one-beat changes in the second half of the first bar.
 c('C5 E5','E4','A3','C4'),c('D5 F5','F4','G#3','B3',4),c('C5 E5','E4','A3','C4',4),
 c('A4 D5','D4','F3','A3'),c('A4 D5','D4','E3','G3'),
 // System 5: G-sharp remains in force throughout the second bar.
 c('A4 C5','C4','D#3','F#3'),c('B4','C4','D#3','F#3',4),c('A4','C4','D#3','F#3',4),
 c('E4 G#4','B3','E3','G#3'),c('G#4','E4','E3 G#3','B3'),
 // System 6: the printed natural cancels F-sharp in the left hand.
 c('C5 E5','E4','A3','C4'),c('D5 F5','F4','G#3','B3',4),c('C5 E5','E4','A3','C4',4),
 c('A4 D5','D4','F#3','A3'),c('A4 C5','C#4','F3','A3'),
 // System 7: E-major dominant and the tied A-minor closing chord.
 c('A4 C5','E4','E3 A3','C4'),c('E4 G#4 C5','D4','E2','E3',4),c('E4 G#4 B4','D4','E2','E3',4),close('E4 A4','C4','A2 C3 E3','A3'),
];
export const TREMOLO_112=[
 // Systems 1 and 2 each contain one bar, not two: only 32 fast onsets.
 c('C5 E5','E4','A3','C4'),c('C5 F5','F4','A3','C4',4),c('C5 F#5','F#4','Ab3','C4',4),
 c('C5 G5','G4','G3 C4','E4'),c('C5 A5','A4','F#3 C4','D#4'),
 // System 3: dominant preparation, then a C-major close and quarter rest.
 c('C5 E5','G4','G3 C4','E4'),c('G4 B4 E5','F4','G2','G3',4),c('G4 B4 D5','F4','G2','G3',4),close('E4 G4 C5','C4','C2','C3'),
 // System 4: count ledger lines separately from the compressed staff spacing.
 c('A5 C6','C5','F3 A3','C4'),c('A5 D6','D5','F3 A3','C4',4),c('A5 D#6','D#5','F3 A3','C4',4),
 c('A5 E6','E5','E3 A3','C4'),c('A5 F6','F5','D#3 A3','C4'),
 // System 5, A-minor phrase ending.
 c('A5 C6 E6','E5','E3 A3','C4'),c('E5 G#5 C6','D5','E2','E3',4),c('E5 G#5 B5','D5','E2','E3',4),close('C5 E5 A5','A4','A2','A3'),
];
export const TREMOLO_113=[
 // System 1: four distinct one-beat voicings in the second bar.
 c('C5 E5','A4','A3 C4','E4'),c('C5 F5','A4','A3 C4','E4',4),c('C5 E5','A4','A3 C4','E4',4),
 c('E5 C6','C5','A3 C4','E4',4),c('E5 A5','C5','A3 C4','E4',4),c('A4 F5','F4','D3 A3','D4',4),c('A4 D5','F4','F3 A3','D4',4),
 // System 2.
 c('A4 C5','E4','E3 A3','C4'),c('G#4 B4','E4','E3 G#3','B3'),
 c('A4 D5','F4','F3','A3'),c('A4 C5','E4','A3','C4'),
 // System 3 repeats the melody with a different, lower accompaniment.
 c('C5 E5','A4','A2 C3','E3'),c('C5 F5','A4','A2 C3','E3',4),c('C5 E5','A4','A2 C3','E3',4),
 c('E5 C6','C5','A2 C3','E3',4),c('E5 A5','C5','A2 C3','E3',4),c('A4 F5','F4','D2 A2','D3',4),c('A4 D5','F4','F2 A2','D3',4),
 // System 4: the written poco rit. / a tempo applies to this phrase.
 c('A4 C5','E4','E2 A2','C3'),c('E4 G#4 C5','D4','E2 G#2 B2','E3',4),c('E4 G#4 B4','D4','E2 G#2 B2','E3',4),
 c('C4 E4 A4','A3','A2 C3','E3'),c('C4 E4 A4','A3','E2','E3',4),c('C4 E4 A4','A3','C2','C3',4),
 // System 5: 8va bassa starts halfway through the first bar and continues
 // through the closing chord; its last low A is A0, the piano's bottom key.
 c('C4 E4 A4','A3','A1','A2'),c('C4 E4 A4','A3','E1','E2',4),c('C4 E4 A4','A3','C1','C2',4),close('C4 E4 A4','A3','A0','A1'),
];
export function tremoloMiddleScore(part,page,cells){
 const notes=[],ends=[];for(const[hand,key]of [['right','r'],['left','l']]){let beat=0;for(const value of cells)for(const item of value[key]){const pitches=Array.isArray(item)?item:item.pitches,duration=item.duration??.125;for(const p of pitches)notes.push({id:`h60p${part}-${key}-${notes.length}`,pitch:p,hand,beat,duration:item.sustain??duration});beat+=duration;}ends.push(beat);}
 if(Math.abs(ends[0]-ends[1])>1e-7||ends[0]%4!==0)throw Error(`Hanon 60 p.${page}: unequal/incomplete bars ${ends}`);
 return normalizeScore({schemaVersion:2,id:`hanon-60-part-${part}`,title:`哈农第 60 条 · 震音 · 第 ${part}/6 段`,composer:'C. L. Hanon',collection:'哈农 · 第 III 部',level:'基本功',category:'technique',evaluationProfile:'technique',bpm:48,timeSignature:[4,4],keySignature:'C',notes,totalBeats:ends[0],source:{label:'Schirmer 1900 · 公版原谱',url:'https://s9.imslp.org/files/imglnks/usimg/1/1b/IMSLP91547-PMLP03129-Hanon_Final.pdf',note:`独立转录原谱印刷第 ${page} 页；全条按六个原谱页面连续分段，第 ${part}/6 段。保留三十二分音符、和弦、临时升降号、八度记号和段尾延音及休止。力度、渐变及呼吸请依原谱和老师示范掌握。新转录音符数据 CC0。`},tags:['基本功','哈农','哈农第60条','震音',`第${part}/6段`,'双手']});
}
export const HANON_TREMOLO_MIDDLE=[tremoloMiddleScore(2,111,TREMOLO_111),tremoloMiddleScore(3,112,TREMOLO_112),tremoloMiddleScore(4,113,TREMOLO_113)];
