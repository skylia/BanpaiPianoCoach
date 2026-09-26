// Source-backed full-work transcriptions from the historical Breitkopf editions.
// Quarter-note beats, scientific pitch names. Fractions preserve the original triplet.
export const PRIMER_EXTRA_PIECES = [
  {
    id:'beethoven-woo86',title:'降 E 大调苏格兰舞曲 · WoO 86',composer:'L. van Beethoven',collection:'贝多芬初级钢琴小品',
    meter:2,timeSignature:[2,4],key:'Eb',bpm:100,page:366,sourceKey:'beethoven-woo86',
    right:'r eb4:.5 eb4:.5 | g4 g4:.5 g4:.5 | bb4 bb4:.5 bb4:.5 | eb5 eb5:.5 eb5:.5 | bb4:2 | g4:.5 bb4:.5 ab4:.5 g4:.5 | eb4:.5 g4:.5 f4:.5 eb4:.5 | f4 f4:.5 g4:.5 | eb4 eb4:.5 f4:.5 | g4:.5 bb4:.5 ab4:.5 g4:.5 | eb4:.5 g4:.5 f4:.5 eb4:.5 | ab4 bb4:.5 c5:.5 | bb4 eb5:.5 f5:.5 | g5:.5 bb5:.5 ab5:.5 g5:.5 | eb5:.5 g5:.5 f5:.5 eb5:.5 | f5 a5:.5 bb5:.5 | eb5 r',
    left:'r:2 | eb3+g3 bb3 | d3+f3 bb3 | c3+eb3 bb3 | d3+f3 bb3 | eb3+g3 bb3 | eb3+g3 bb3 | bb2+f3 bb3 | eb3+g3 bb3 | eb3+g3 bb3 | eb3+g3 bb3 | eb3+ab3 c4 | eb3+g3 bb3 | eb3+g3 bb3 | eb3+g3 bb3 | bb2+f3 bb3 | eb3+g3 r',
    note:'原谱完整两段各弹一遍，两处均采用第二结尾；第一结尾属于回到反复段的衔接。原曲一拍弱起在应用首小节前补一拍休止，因此显示小节号比原曲正拍小节多 1；非改编。保留末段高音区及 A 自然音。RCM 2022 钢琴大纲 Level 1 List A（印刷第 21 页）列有本曲。',
  },
  {
    id:'mozart-k2',title:'F 大调小步舞曲 · K.2',composer:'W. A. Mozart',collection:'莫扎特早期钢琴小品',
    meter:3,timeSignature:[3,4],key:'F',bpm:108,page:3,sourceKey:'mozart-k2',
    right:'f5:.5 a5:.5 c5 c5 | d5:.5 f5:.5 bb4 bb4 | a4:.5 c5:.5 f4 e4 | e4:2 f4 | c4:.5 e4:.5 g4 g4 | c4:.5 f4:.5 a4 a4 | c4:1/3 e4:1/3 g4:1/3 bb4 a4 | a4:2 g4 | c5:.5 eb5:.5 a4 a4 | bb4:.5 d5:.5 g4 g4 | a4:.5 c5:.5 f#4 f#4 | f#4:2 g4 | bb4:.5 d5:.5 g4 g4 | a4:.5 c5:.5 f4 f4 | g4:.5 bb4:.5 e4 e4 | e4:2 f4 | f5:.5 a5:.5 c5 c5 | d5:.5 f5:.5 bb4 bb4 | a4:.5 c5:.5 f4 e4 | e4:2 f4 | f5:.5 a5:.5 c5 c5 | d5:.5 f5:.5 bb4 bb4 | a4:.5 c5:.5 f4 e4 | e4:2 f4',
    left:'f3:2 a3 | bb3:2 bb3 | c4:2 c3 | f3 c3 f2 | c3:3 | c3:3 | c3 e3 f3 | c4 g3 c3 | f#3:3 | g3:3 | c4 d4 d3 | g3 d3 g2 | e3:3 | f3:3 | bb3 c4 c3 | f3 c3 f2 | a3:3 | bb3:3 | c4:2 c3 | d3:3 | a3:3 | bb3:3 | c4:2 c3 | f3 c3 f2',
    note:'完整 24 小节；开头 8 小节的反复仅弹一遍。第 7 小节保留三连音（每音 1/3 拍），第 9、11、12 小节保留原谱临时升降号。延长记号、断连奏和指法未编码，谱面连线是乐句连线，不合并为延音。RCM 2022 钢琴大纲 Level 1 List A（印刷第 21 页）列有本曲。',
  },
  {
    id:'mozart-k3',title:'降 B 大调快板 · K.3',composer:'W. A. Mozart',collection:'莫扎特早期钢琴小品',
    meter:2,timeSignature:[2,4],key:'Bb',bpm:104,page:38,sourceKey:'mozart-k3',
    right:'r:1.5 f5:.5 | d5:.5 bb4:.5 a4:.5 c5:.5 | bb4:.5 f4:.5 r:.5 f4:.5 | g4:.5 g4:.5 a4:.5 a4:.5 | bb4 r:.5 f4:.5 | g4:.5 g4:.5 a4:.5 a4:.5 | bb4 r:.5 d5:.5 | c5:.5 f4:.5 e4:.5 bb4:.5 | a4:.5 f4:.5 r:.5 f4:.5 | a4:.125 g4:.375 f#4:.5 g4:.5 a4:.5 | f4 r:.5 f4:.5 | g4:.25 f#4:.25 g4:.25 f#4:.25 g4:.5 a4:.5 | f4:1.5 f5:.5 | f5:.5 d5:.5 d5:.5 b4:.5 | b4 r:.5 g4:.5 | c5:.5 g4:.5 d5:.5 g4:.5 | eb5 r:.5 eb5:.5 | eb5:.5 c5:.5 c5:.5 a4:.5 | a4 r:.5 f4:.5 | bb4:.5 f4:.5 c5:.5 f4:.5 | d5 r:.5 f5:.5 | d5:.5 bb4:.5 a4:.5 c5:.5 | bb4:.5 f4:.5 r:.5 f4:.5 | g4:.5 g4:.5 a4:.5 a4:.5 | bb4 r:.5 f4:.5 | g4:.5 g4:.5 a4:.5 a4:.5 | bb4 r:.5 bb4:.5 | d5:.125 c5:.375 bb4:.5 c5:.5 d5:.5 | bb4 r:.5 bb4:.5 | c5:.25 b4:.25 c5:.25 b4:.25 c5:.5 d5:.5 | bb4:1.5 r:.5',
    left:'r:2 | bb3 c4 | d4 r:.5 d4:.5 | eb4:.5 eb4:.5 c4:.5 c4:.5 | bb3+d4 r:.5 d4:.5 | eb4:.5 eb4:.5 c4:.5 c4:.5 | bb3+d4 r:.5 bb3:.5 | a3 g3 | f3 r:.5 a3:.5 | bb3 c4 | d4 r:.5 a3:.5 | bb3:1.5 c4:.5 | f3:1.5 r:.5 | r:2 | g3 f3 | eb3 b2 | c3 r | r:2 | f3 eb3 | d3 a2 | bb2 r | bb3 c4 | d4 r:.5 d4:.5 | eb4:.5 eb4:.5 c4:.5 c4:.5 | bb3+d4 r:.5 d4:.5 | eb4:.5 eb4:.5 c4:.5 c4:.5 | bb3+d4 r:.5 d3:.5 | eb3 f3 | g3 r:.5 d3:.5 | eb3:1.5 f3:.5 | bb2:1.5 r:.5',
    note:'完整两段，第一段反复仅弹一遍。开头半拍弱起前补 1.5 拍休止；段际前段 1.5 拍收尾与后段半拍弱起连成应用一小节，内部未加停顿；末尾补半拍空白，合计 31 个显示小节。原谱两处小音符 A4→G4、D5→C5 均保留，标准音符示范暂用前音 1/8 拍、主音 3/8 拍实现，实际装饰时值应依老师版本；未编码独立倚音记谱及自由时值识别。原谱第 11、29 正拍小节的装饰写为实值十六分音符，按谱保留。RCM 2022 钢琴大纲 Level 1 List A（印刷第 21 页）列有本曲。',
  },
];

const verifiedOn='2026-09-27';
const gradeUrl='https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf';
export const PRIMER_EXTRA_SOURCES={
  'mozart-k3':{
    label:'Breitkopf & Härtel 1878 · IMSLP #56704 · 公版原谱',
    url:'https://imslp.org/wiki/Allegro_in_B-flat_major,_K.3_(Mozart,_Wolfgang_Amadeus)',
    file:'research/primer/mozart-k3-breitkopf1878.pdf',sha256:'613d86999be27ce2a3615efb8731f5445798762ac4995bbed8a96b0f7da5aa32',
    downloadUrl:'https://ks15.imslp.org/files/imglnks/usimg/1/11/IMSLP56704-PMLP116955-Mozart_Werke_Breitkopf_Serie_22_KV3.pdf',
    edition:'Mozarts Werke, Serie XXII, Kleinere Stücke für das Pianoforte No.12, Leipzig: Breitkopf & Härtel, 1878, plate W.A.M.3, p.2 (38).',
    license:'Public Domain',gradeUrl,gradeEvidence:'RCM Piano Syllabus 2022, Level 1 List A, printed p.21',verifiedOn,
  },
  'beethoven-woo86':{
    label:'Breitkopf & Härtel 贝多芬全集 · IMSLP #318765 · 公版原谱',
    url:'https://imslp.org/wiki/Ecossaise,_WoO_86_(Beethoven,_Ludwig_van)',
    file:'research/primer/beethoven-woo86-breitkopf.pdf',sha256:'9ead23b63f9ef298abca4eec0f5412cb817968054a44e891627d7c9fa5be61e0',
    downloadUrl:'https://ks15.imslp.org/files/imglnks/usimg/5/57/IMSLP318765-PMLP09922-Beethoven%2C_Ludwig_van-Werke_Breitkopf_Kalmus_Band_32_B305_WoO_86_scan.pdf',
    edition:'Ludwig van Beethovens Werke, Serie 25, No.305, Leipzig: Breitkopf & Härtel [1862–90], plate B.305, p.366.',
    license:'Public Domain',gradeUrl,gradeEvidence:'RCM Piano Syllabus 2022, Level 1 List A, printed p.21',verifiedOn,
  },
  'mozart-k2':{
    label:'Breitkopf & Härtel 1878 · IMSLP #56677 · 公版原谱',
    url:'https://imslp.org/wiki/Minuet_in_F_major,_K.2_(Mozart,_Wolfgang_Amadeus)',
    file:'research/primer/mozart-k2-breitkopf1878.pdf',sha256:'85d62b56eeec2ba73935ffa93d05b6c188eec6a84ace06b59e10649e85c128fb',
    downloadUrl:'https://ks15.imslp.org/files/imglnks/usimg/4/40/IMSLP56677-PMLP116890-Mozart_Werke_Breitkopf_Serie_22_KV2.pdf',
    edition:'Mozarts Werke, Serie XXII, Kleinere Stücke für das Pianoforte No.2, Leipzig: Breitkopf & Härtel, 1878, plate W.A.M.2.4, p.3.',
    license:'Public Domain',gradeUrl,gradeEvidence:'RCM Piano Syllabus 2022, Level 1 List A, printed p.21',verifiedOn,
  },
};

export const PRIMER_EXTRA_DEMOS=[
  {id:'mozart-k3-smirnow2024',scoreIds:['mozart-k3'],kind:'audio',title:'K.3 · Jewgeni Smirnow 真人演奏',performer:'Jewgeni Smirnow',instrument:'数码键盘（真人弹奏）',src:'./audio/demos/mozart-k3-smirnow2024.mp3',type:'audio/mpeg',sha256:'8a30d593fa264f9e5c3c62442db85c69437b3d46b50da35ef0a511d8c11ad283',sourceUrl:PRIMER_EXTRA_SOURCES['mozart-k3'].url,sourceLabel:'IMSLP #902696 · Jewgeni Smirnow, 2024',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',attribution:'Wolfgang Amadeus Mozart: Allegro in B-flat major, K.3. Jewgeni Smirnow, digital keyboard, 2024. IMSLP #902696. CC BY 4.0. Original MP3 retained without alteration.',coverage:'独立完整数码键盘真人演奏，来自 IMSLP 的 Recordings 栏；录音反复、倚音时值及乐句处理按演奏者版本。未校准小节或逐音跟谱。',mapping:null,verifiedOn},
  {id:'beethoven-woo86-mcpp2017',scoreIds:['beethoven-woo86'],kind:'audio',title:'WoO 86 · Mississippi College 真人演奏',performer:'Mississippi College Piano Pedagogy',instrument:'钢琴',src:'./audio/demos/beethoven-woo86-mcpp2017.mp3',type:'audio/mpeg',sha256:'eab866b202846b30c3f6d5ef1f895d6f31c3494bef67845a91a2a27b147ff49e',sourceUrl:PRIMER_EXTRA_SOURCES['beethoven-woo86'].url,sourceLabel:'IMSLP #469938 · Mississippi College Piano Pedagogy, 2017',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',attribution:'Ludwig van Beethoven: Écossaise in E-flat major, WoO 86. Piano: Mississippi College Piano Pedagogy, 2017. IMSLP #469938. CC BY-SA 4.0. Original MP3 retained without alteration.',coverage:'独立完整录音；反复与节奏处理按演奏者版本，本练习谱各段只弹一遍、采用第二结尾。未校准小节或逐音跟谱。',mapping:null,verifiedOn},
  {id:'mozart-k2-smirnow2024',scoreIds:['mozart-k2'],kind:'audio',title:'K.2 · Jewgeni Smirnow 真人演奏',performer:'Jewgeni Smirnow',instrument:'数码键盘（真人弹奏）',src:'./audio/demos/mozart-k2-smirnow2024.mp3',type:'audio/mpeg',sha256:'ef065da54ffad7efae98f5e3ec4b47fca345904b6ad184e62139b9a085fa63f0',sourceUrl:PRIMER_EXTRA_SOURCES['mozart-k2'].url,sourceLabel:'IMSLP #906552 · Jewgeni Smirnow, 2024',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',attribution:'Wolfgang Amadeus Mozart: Minuet in F major, K.2. Jewgeni Smirnow, digital keyboard, 2024. IMSLP #906552. CC BY 4.0. Original MP3 retained without alteration.',coverage:'独立完整数码键盘真人演奏，来自 IMSLP 的 Recordings 栏；本练习谱开头反复只弹一遍。未校准小节或逐音跟谱。',mapping:null,verifiedOn},
];
