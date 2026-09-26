// Schirmer 1900, printed p.110. Independent transcription, CC0.
// One cell is the printed two-beat tremolo: eight alternating pairs of 32nds.
import {normalizeScore} from '../public/score-model.mjs';
const note = s=>{const m=/^([A-G])([#b]?)(\d)$/.exec(s);if(!m)throw Error('pitch '+s);return 12*(Number(m[3])+1)+({C:0,D:2,E:4,F:5,G:7,A:9,B:11})[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);};
const chord=s=>s.split(' ').map(note);
const cell=(ra,rb,la,lb,n=8)=>({r:Array.from({length:n*2},(_,i)=>chord(i%2?rb:ra)),l:Array.from({length:n*2},(_,i)=>chord(i%2?lb:la))});
export const TREMOLO_OPENING=[
 // printed p.110 system 1
 cell('E4 G4','C4','C3 E3','G3'),cell('F4 G4','D4','B2 D3','G3'),
 cell('E4 G4','C4','C3 E3','G3'),cell('A4 C5','E4','A2 E3','A3',4),cell('A4 C5','E4','C3 E3','A3',4),
 // system 2
 cell('G4 B4','D4','D3 G3','B3'),cell('D4 F#4 A4','B3','D2','D3'),
 cell('D4 G4','B3','G2','G3'),cell('D4 G4','B3','G2','F3'),
 // system 3
 cell('E4 G4','C4','C3 E3','G3'),cell('E4 G#4','D4','B2 D3','E3'),
 cell('E4 A4','C4','A2 C3','E3'),cell('A4 D5','F4','F2 A2','D3'),
 // system 4
 cell('G4 C5','E4','G2 C3','E3'),cell('G4 B4','F4','G2 D3','G3'),
 cell('G4 C5','E4','C3 E3','G3'),cell('G4 C5','E4','C3 E3','G3'),
 // system 5: the thicker chordal texture is retained.
 cell('C5 E5 G5','G4','C3 E3 G3','C4'),cell('D5 F5 G5','G4','B2 D3 G3','B3'),
 cell('C5 E5 G5','G4','C3 E3 G3','C4'),cell('E5 A5 C6','C5','A2 E3','A3',4),cell('E5 A5 C6','C5','C3 E3','A3',4),
];
export function tremoloScore(part,page,cells){
 const notes=[];for(const[hand,key]of [['right','r'],['left','l']]){let beat=0;for(const c of cells)for(const item of c[key]){const pitches=Array.isArray(item)?item:item.pitches,duration=item.duration??.125;for(const pitch of pitches)notes.push({id:`h60p${part}-${key}-${notes.length}`,pitch,hand,beat,duration});beat+=duration;}}
 return normalizeScore({schemaVersion:2,id:`hanon-60-part-${part}`,title:`哈农第 60 条 · 震音 · 第 ${part}/6 段`,composer:'C. L. Hanon',collection:'哈农 · 第 III 部',level:'基本功',category:'technique',evaluationProfile:'technique',bpm:48,timeSignature:[4,4],keySignature:'C',notes,totalBeats:Math.max(...notes.map(n=>n.beat+n.duration)),source:{label:'Schirmer 1900 · 公版原谱',url:'https://s9.imslp.org/files/imglnks/usimg/1/1b/IMSLP91547-PMLP03129-Hanon_Final.pdf',note:`独立转录原谱印刷第 ${page} 页；全条按六个原谱页面连续分段，第 ${part}/6 段。三十二分音符、和弦与原谱音区保留；力度与渐变请依原谱和老师示范掌握。新转录音符数据 CC0。`},tags:['基本功','哈农','哈农第60条','震音',`第${part}/6段`,'双手']});
}
export const HANON_TREMOLO_OPENING=tremoloScore(1,110,TREMOLO_OPENING);
