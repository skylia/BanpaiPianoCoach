// D.G. Türk: Das Ballett, complete 1797 second-edition score, printed p.6.
// The historical edition numbers this 19; the modern performance catalogue calls it 18.
// Scientific pitches, quarter-note beats, each repeat played once.
export const PRIMER_TURK_BALLET_PIECES = [{
  id:'turk-ballet',title:'芭蕾舞 · Das Ballett',composer:'D. G. Türk',collection:'蒂尔克初学键盘小曲',
  meter:2,timeSignature:[4,8],key:'D',bpm:88,page:10,sourceKey:'turk-ballet',
  right:'r:1.5 a4:.5 | d5:.5 d5:.5 d5:.5 a4:.5 | f#4:.5 f#4:.5 f#4:.5 a4:.5 | g4:.5 f#4:.5 g4:.5 f#4:.5 | e4 r:.5 e4:.5 | a4:.5 a4:.5 a4:.5 f#4:.5 | c#5:.5 c#5:.5 c#5:.5 e5:.5 | a4:.5 a4:.5 c#5:.125 b4:.375 a4:.25 b4:.25 | a4 r:.5 a4:.25 b4:.25 | c#5:.25 d5:.25 e5:.25 d5:.25 c#5:.5 a4:.25 b4:.25 | c#5:.25 d5:.25 e5:.25 d5:.25 c#5:.5 a4:.25 b4:.25 | c#5:.25 d5:.25 e5:.25 d5:.25 c#5:.25 d5:.25 e5:.25 d5:.25 | c#5:.25 d5:.25 e5:.25 d5:.25 c#5:.5 a4:.5 | d5:.5 d5:.5 d5:.5 a4:.5 | f#4:.5 f#4:.5 f#4:.5 a4:.5 | d4:.5 d4:.5 f#4:.125 e4:.375 d4:.25 e4:.25 | d4 r',
  left:'r:2 | f#4:.5 f#4:.5 f#4:.5 r:.5 | d4:.5 d4:.5 d4:.5 r:.5 | e4:.5 d4:.5 e4:.5 d4:.5 | c#4:.5 a3:.5 a3:.5 r:.5 | c#4:.5 c#4:.5 c#4:.5 r:.5 | a3:.5 a3:.5 a3:.5 r:.5 | c#3:.5 c#3:.5 d3:.5 e3:.5 | a2 r | e4:.5 g4:.5 e4:.5 r:.5 | e4:.5 g4:.5 e4:.5 r:.5 | e4:.5 g4:.5 e4:.5 g4:.5 | e4:.5 g4:.5 e4:.5 r:.5 | f#4:.5 f#4:.5 f#4:.5 r:.5 | d4:.5 d4:.5 d4:.5 r:.5 | f#3:.5 f#3:.5 g3:.5 a3:.5 | d3 r',
  note:'1797年第二版第19首《Das Ballett》，现代教学录音编号为第18首；作品开头已按录音频谱与原谱A4弱起、D5/F♯4及F♯4/D4核对。原谱4/8拍，每段反复各弹一遍；首小节弱起前补1.5拍休止，前段末与后段弱起合为一小节，末尾补0.5拍，共17个显示小节。保留中途换高音谱号的左手实际音区，两处短倚音各分配1/8拍并从后续主音扣除，不要求照此分配演奏；省略连线、指法和表情，练习BPM为应用设置。RCM2022大纲Level1 List A列有本曲。历史版为公版，本次独立音符转录CC0。'
}];

export const PRIMER_TURK_BALLET_SOURCES = {
  'turk-ballet':{
    file:'research/primer/turk-handstucke-1797.pdf',sha256:'96c56d4a2473831b4d43d5e9ced30b0c47b7cc6f6cb4dc0c8773ae329798df7a',
    url:'https://imslp.org/wiki/120_Handst%C3%BCcke_f%C3%BCr_angehende_Klavierspieler_(T%C3%BCrk,_Daniel_Gottlob)',
    label:'1797年第2版 · IMSLP #299257 · 公版原谱',edition:'Leipzig: Schwickert; Halle: Hemmerde und Schwetschke, 1797, 2nd edition, Volume 1, No.19 Das Ballett, printed p.6 (PDF p.10).',
    license:'Public Domain',pages:[10],
    gradeUrl:'https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf',
    gradeEvidence:'RCM Piano Syllabus 2022, Level 1 List A, The Ballet, printed p.21.',verifiedOn:'2026-09-27'
  }
};

export const PRIMER_TURK_BALLET_DEMOS = [{
  id:'turk-ballet-mcpp2019',scoreIds:['turk-ballet'],kind:'audio',title:'芭蕾舞 · Mississippi College 真人演奏',performer:'Mississippi College Piano Pedagogy',instrument:'钢琴',year:2019,
  src:'./audio/demos/primer-turk-ballet-mcpp.mp3',type:'audio/mpeg',sha256:'2a55fafad246d20de49850a08664a3a51297fe6dcddd39e7e50dee700e94b850',
  sourceUrl:PRIMER_TURK_BALLET_SOURCES['turk-ballet'].url+'#IMSLP601847',sourceLabel:'IMSLP #601847 · Mississippi College Piano Pedagogy, 2019',
  license:'CC BY-NC-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  attribution:'Daniel Gottlob Türk: The Ballet, Handstücke für angehende Klavierspieler, Vol.1. Piano: Mississippi College Piano Pedagogy, 2019. IMSLP #601847. CC BY-NC-SA 4.0. Original MP3 retained without alteration. Recording license, including its noncommercial condition, is separate from the application code license.',
  coverage:'独立完整真人钢琴演奏，43秒。IMSLP现代编号18对应1797版的第19首，已按开头原谱音高与录音频谱确认；反复、倚音和乐句处理按演奏者版本。本谱每段只弹一遍，未校准小节跟谱。',
  mapping:null,verifiedOn:'2026-09-27'
}];
