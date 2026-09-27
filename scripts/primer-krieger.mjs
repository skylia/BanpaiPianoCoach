// Johann Krieger: original A-minor Menuet, Appendix to 6 Musicalische Partien.
// Transcribed from Klaus Heidtmann's 2022 edition, IMSLP #797875, CC BY-SA 4.0.
// Scientific pitch names; quarter-note beats; both repeats taken once.
export const PRIMER_KRIEGER_PIECES = [{
 id:'krieger-minuet-a-minor',title:'a 小调小步舞曲',composer:'Johann Krieger',collection:'巴洛克入门小曲',
 meter:3,timeSignature:[3,4],key:'Am',bpm:88,page:1,sourceKey:'krieger',
 right:'e5 c5 a4 | f5:3 | d5 b4 g4 | e5:3 | a4:1.5 c5:.5 b4:.5 a4:.5 | g#4 e4 e5 | d5:.5 c5:.5 b4:1.5 a4:.25 b4:.25 | a4:3 | c5 d5 e5 | a4:3 | b4 c5 d5 | g4:3 | a4 b4 c5 | b4 g4 g5 | f5:.5 e5:.5 d5:1.5 c5:.25 d5:.25 | c5:3 | e5 c5 a4 | f5:3 | d5 b4 g4 | e5:3 | a4:1.5 c5:.5 b4:.5 a4:.5 | g#4 e4 e5 | d5:.5 c5:.5 b4:1.5 a4:.25 b4:.25 | a4:3',
 left:'a3+c4:3 | d3 e3 f3 | g3:3 | c3 d3 e3 | f3 c3 d3 | e3:2 c3 | d3 e3:2 | a2:3 | a3:2 g3 | f3 e3 d3 | g3:2 f3 | e3 d3 c3 | f3 g3 a3 | g3:1.5 f3:.5 e3 | f3 g3:2 | c3:1.5 d3:.5 c3:.5 b2:.5 | a2:3 | d3 e3 f3 | g3:3 | c3 d3 e3 | f3 c3 d3 | e3:1.5 d3:.5 c3 | d3 e3:2 | a2:3',
 // These bass notes overlap a sustained inner voice; retain both durations.
 extraNotes:[{pitch:40,beat:20,duration:1,hand:'left'},{pitch:43,beat:44,duration:1,hand:'left'},{pitch:40,beat:68,duration:1,hand:'left'}],
 note:'完整24小节，反复各弹一遍；保留左手第7、15、23小节内声部与低音的重叠时值。原作收于附录，部分教学书称第6组曲小步舞曲。依据2022 RCM官方大纲Level1作为入门难度参考，半拍不声称指定考试版本。由Klaus Heidtmann 2022版独立转录，本条机器可读谱面沿用CC BY-SA 4.0，保留原调和音区，省略原版声部符干布局。'
}];

export const PRIMER_KRIEGER_SOURCES = {
 krieger:{file:'research/primer/krieger-minuet-heidtmann.pdf',sha256:'c92d9be66fc95c096f2be3508dbcf763035852e0129455c3229a39b7c71bb1a9',bytes:26310,url:'https://imslp.org/wiki/6_Musikalische_Partien_(Krieger,_Johann)',downloadUrl:'https://s9.imslp.org/files/imglnks/usimg/f/f5/IMSLP797875-PMLP196320-Krieger_Appendix_Menuet_Bourree_a_6_Musicalische_Partien_original_neu.pdf',label:'Klaus Heidtmann 2022 · IMSLP #797875 · CC BY-SA 4.0',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',editor:'Klaus Heidtmann',edition:'Appendix: Menuet and Bourrée in A minor, 6 Musicalische Partien, 2022',pages:[1],gradeUrl:'https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf',gradePage:21,gradeEvidence:'Royal Conservatory Piano Syllabus 2022, Level 1 List A, Minuet in A Minor from Partita No.6'}
};

export const PRIMER_KRIEGER_DEMOS = [{
 id:'krieger-minuet-mcpp',kind:'audio',scoreIds:['krieger-minuet-a-minor'],title:'a 小调小步舞曲 · 真人钢琴录音',performer:'Mississippi College Piano Pedagogy',instrument:'钢琴',year:2019,
 src:'./audio/demos/krieger-minuet-mcpp.mp3',type:'audio/mpeg',sourceUrl:'https://imslp.org/wiki/6_Musikalische_Partien_(Krieger,_Johann)#IMSLP601850',sourceLabel:'IMSLP · 密西西比学院钢琴教学项目 · #601850',
 license:'CC BY-NC-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',
 attribution:'Johann Krieger: Minuet in A minor, 6 Musicalische Partien. Piano: Mississippi College Piano Pedagogy (2019). IMSLP #601850. CC BY-NC-SA 4.0. Original audio retained without alteration; recording license is separate from application code.',
 coverage:'完整小步舞曲真人钢琴录音，包含反复；练习谱反复各弹一遍。来源标为Level1。用于听乐句与表达，未逐小节对齐。',mapping:null,
 sha256:'903cff1c1c4fd776d769d3c8cc33b7901f9ebeda3400afdfb9d306ba674f67bc',bytes:771770,
 downloadUrl:'https://s9.imslp.org/files/imglnks/usimg/e/e5/IMSLP601850-PMLP196320-Level_1_Krieger_Minuet_in_A_Minor,_from_Partita_No._6_in_B-Flat_Major_in_Sechs_musicalische_Partien.mp3',verifiedOn:'2026-09-27'
}];
