// Source-backed hand transcriptions. Durations use quarter-note beats.
// Each | separates one full bar. Pickup bars are padded explicitly with rests.
const audioHashes={
  'primer-gurlitt-op117-13-mcpp.mp3':'65a44b42313d0b5d9646db7661eab45408f758338a61c94a5fc34e3242abff04',
  'primer-turk-hunting-horns-mcpp.mp3':'42100bbee065b4125b5d65df9acecdb7c7184b7ad5b7dfe2f19e989034cb1860',
};

export const PRIMER_SOURCES = {
  gurlitt:{file:'research/primer/gurlitt-op117-schirmer1895.pdf',sha256:'f86d232e9fe4bc6f390f6c981056922a13df4fbc1c410f20c1871ef53fbf7a08',label:'G. Schirmer 1895 · IMSLP #400775 · 公版原谱',url:'https://imslp.org/wiki/Anfangs-Stunden,_Op.117_(Gurlitt,_Cornelius)',downloadUrl:'https://ks15.imslp.org/files/imglnks/usimg/a/a1/IMSLP400775-PMLP648794-Gurlitt_-_The_First_Lessons_Op_117.pdf',edition:'G. Schirmer, New York, 1895, No.324',license:'Public Domain',gradeUrl:'https://www.pianistmagazine.com/blogs/professionaladvice/learn-how-to-play-11-beginner-piano-pieces/',gradeEvidence:'Op.117为The First Lessons初学曲集；No.13 MCPP入门教学录音，No.15 Pianist beginner/Level1教师示范。'},
  turk1797:{file:'research/primer/turk-handstucke-1797.pdf',sha256:'96c56d4a2473831b4d43d5e9ced30b0c47b7cc6f6cb4dc0c8773ae329798df7a',label:'Schwickert / Hemmerde und Schwetschke 1797 · IMSLP #299257 · 公版原谱',url:'https://imslp.org/wiki/120_Handst%C3%BCcke_f%C3%BCr_angehende_Klavierspieler_(T%C3%BCrk,_Daniel_Gottlob)',downloadUrl:'https://s9.imslp.org/files/imglnks/usimg/7/7d/IMSLP299257-PMLP173513-turk_60_handstucke_pt1_ed2.pdf',edition:'120 Handstücke, Volume 1, second edition, Leipzig/Halle, 1797',license:'Public Domain',gradeUrl:'https://imslp.org/wiki/120_Handst%C3%BCcke_f%C3%BCr_angehende_Klavierspieler_(T%C3%BCrk,_Daniel_Gottlob)#IMSLP601848',gradeEvidence:'MCPP录音标题和原文件标注Level1；以曲名、原调与开头音型确认1797版No.24对应现代No.23。'}
};

const audioDemo=(id,scoreId,title,file,imslp,sourceUrl,downloadUrl,coverage)=>({id,scoreIds:[scoreId],kind:'audio',title,performer:'Mississippi College Piano Pedagogy',instrument:'钢琴',year:2019,src:'./audio/demos/'+file,type:'audio/mpeg',sha256:audioHashes[file],sourceUrl:sourceUrl+'#IMSLP'+imslp,sourceLabel:'IMSLP · #'+imslp,downloadUrl,license:'CC BY-NC-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',attribution:title+'. Piano: Mississippi College Piano Pedagogy (2019). IMSLP #'+imslp+'. CC BY-NC-SA 4.0. Audio is unchanged.',coverage,mapping:null,verifiedOn:'2026-09-27'});
export const PRIMER_DEMOS = [
  audioDemo('gurlitt-op117-13-mcpp2019','gurlitt-op117-13','古尔利特 · 清晨的问候 Op.117 No.13','primer-gurlitt-op117-13-mcpp.mp3',601842,PRIMER_SOURCES.gurlitt.url,'https://ks15.imslp.org/files/imglnks/usimg/e/ed/IMSLP601842-PMLP648794-Morning_Greeting,_Op._117,_No._13_by_Cornelius_Gurlitt.mp3','完整真人钢琴示范。演奏中的反复和速度处理供演绎参考，本谱反复各弹一次；未校准跟谱。'),
  {id:'gurlitt-op117-15-john-maul-bilibili',scoreIds:['gurlitt-op117-15'],kind:'external',title:'狩猎 Op.117 No.15 · John Maul 示范与教学',performer:'John Maul',instrument:'数码键盘（真人弹奏）',sourceUrl:'https://www.bilibili.com/video/BV1pS4y1b7wc/',sourceLabel:'Bilibili · 风汉火龙转载 · Pianist magazine / John Maul',license:'原发布平台播放；未取得音视频再分发许可',licenseUrl:'',attribution:'C. Gurlitt: The Hunt, Op.117 No.15. Piano and teaching: John Maul, Pianist magazine, Issue 69, p.29. Bilibili uploader: 风汉火龙.',coverage:'教师现场示范与讲解。开场为双手完整演奏，随后进入教学；保留原平台片头。真人数码钢琴演绎参考，未校准小节或逐音跟谱。',mapping:null,verifiedOn:'2026-09-27'},
  audioDemo('turk-hunting-horns-echo-mcpp2019','turk-hunting-horns-echo','蒂尔克 · 猎号与回声','primer-turk-hunting-horns-mcpp.mp3',601848,PRIMER_SOURCES.turk1797.url,'https://s9.imslp.org/files/imglnks/usimg/7/70/IMSLP601848-PMLP173513-Level_1_-_turk_The_Hunting_Horns_and_the_Echo_from_Handst%C3%BCcke_f%C3%BCr_angehende_Klavierspieler,_Vol._1_(1).mp3','完整真人钢琴示范。录音标题编号23，对应1797第二版第一册同名作品No.24，已按D大调与开头D4/F#3音型核对。反复与速度采用演奏版本，未校准跟谱。'),
];
export const PRIMER_PIECES = [
  {
    id:'gurlitt-op117-13',title:'清晨的问候 · Op.117 No.13',composer:'C. Gurlitt',collection:'古尔利特初学钢琴曲 Op.117',
    meter:1.5,timeSignature:[3,8],key:'G',bpm:84,page:7,sourceKey:'gurlitt',
    gradeEvidence:'本应用依据《The First Lessons》初学教材定位、本曲24小节的双手交替与简单双音选作通用参考1级；MCPP提供对应真人演奏，未声称该曲获得RCM或其他考试机构一级认证',
    gradeUrl:'https://imslp.org/wiki/Anfangs-Stunden,_Op.117_(Gurlitt,_Cornelius)',
    right:'g4:.5 b4:.5 d5:.5~ | d5:.5 c5:.5 a4:.5 | g4:.5 b4:.5 d5:.5~ | d5:.5 c5:.5 a4:.5 | g4:.5 g5:.5 f#5:.5 | e5:.5 d5:.5 c5:.5 | b4:.5 c5:.5 a4:.5 | g4 r:.5 | f#4+a4:1.5 | g4+a4:1.5 | f#4+a4:1.5 | g4+a4:1.5 | f#4+a4 r:.5 | d4:.5 f#4:.5 a4:.5 | r:1.5 | d5:.5 c5:.5 a4:.5 | g4:.5 b4:.5 d5:.5~ | d5:.5 c5:.5 a4:.5 | g4:.5 b4:.5 d5:.5~ | d5:.5 c5:.5 a4:.5 | g4:.5 g5:.5 f#5:.5 | e5:.5 d5:.5 c5:.5 | b4:.5 c5:.5 a4:.5 | g4 r:.5',
    left:'g3+b3:1.5 | d3+a3:1.5 | g3+b3:1.5 | d3+a3:1.5 | g3+b3 r:.5 | r:1.5 | r d3+a3:.5 | g3+b3 r:.5 | d3:.5 f#3:.5 a3:.5~ | a3:.5 g3:.5 e3:.5 | d3:.5 f#3:.5 a3:.5~ | a3:.5 g3:.5 e3:.5 | d3:.5 f#3:.5 a3:.5 | r:1.5 | d4:.5 f#4:.5 a4:.5 | r:1.5 | g3+b3:1.5 | d3+a3:1.5 | g3+b3:1.5 | d3+a3:1.5 | g3+b3 r:.5 | r:1.5 | r d3+a3:.5 | g3+b3 r:.5',
    note:'反复各弹一遍；按原谱的高、低音谱号和中途换谱号录入实际音高。'
  },
  {
    id:'gurlitt-op117-15',title:'狩猎 · Op.117 No.15',composer:'C. Gurlitt',collection:'古尔利特初学钢琴曲 Op.117',
    meter:3,timeSignature:[3,4],key:'C',bpm:112,page:8,sourceKey:'gurlitt',
    gradeEvidence:'Pianist magazine 将 The Hunt 纳入11首初级钢琴教学作品；John Maul 演奏与教学页标为Level1，Pianist官方曲谱清单确认Op.117 No.15',
    gradeUrl:'https://www.pianistmagazine.com/blogs/professionaladvice/learn-how-to-play-11-beginner-piano-pieces/',
    right:'r:2 g4 | c5 r g4 | c5 r g4 | c5:3~ | c5 r g4 | c5 g4 e5 | c5 g4 e5 | d5:3~ | d5 r g4 | d5 r g4 | d5 r g4 | d5:3~ | d5 r g4 | d5 g4 f5 | d5 g4 f5 | e5:3~ | e5 r:2 | r:2 g4 | c5 r e5 | g5:3 | e5 r g4 | d5 r g4 | d5 r g4 | e5:3~ | e5 r:2 | r:2 g4 | c5 r e5 | g5:3 | e5 r g4 | d5 g4 e5 | d5 g4 e5 | c5:3~ | c5 r:2',
    left:'r:3 | c4+e4 r:2 | c4+e4 r:2 | c4+e4:3~ | c4+e4 r:2 | c4+e4 r:2 | c4+e4 r:2 | g3+d4:3~ | g3+d4 r:2 | g3+d4 r:2 | g3+d4 r:2 | g3+d4:3~ | g3+d4 r:2 | g3+d4 r:2 | g3+d4 r:2 | c4+e4:3~ | c4+e4 r c4 | e4 r:2 | r:3 | r:3 | r:3 | g3+b3+f4 r:2 | g3+b3+f4 r:2 | c4+e4:3~ | c4+e4 r c4 | e4 r:2 | r:3 | r:3 | r:3 | g3+b3+f4 r:2 | g3+b3+f4 r:2 | c4+e4:3~ | c4+e4 r:2',
    note:'原谱弱起一拍，应用在首小节前两拍补休止以保持后续小节线；保留32个完整小节、原谱延音和左右手休止。'
  },
  {
    id:'turk-hunting-horns-echo',title:'猎号与回声',composer:'D. G. Türk',collection:'初学者钢琴小品 · 第一册',
    meter:4,timeSignature:[4,4],key:'D',bpm:96,page:9,sourceKey:'turk1797',
    right:'d4 d4:.75 d4:.25 e4 d4:.5 e4:.5 | f#4:1.5 e4:.5 d4:.5 e4:.5 f#4:.5 g4:.5 | a4 a4:.75 a4:.25 a4 g4:.5 f#4:.5 | e4:2 r r:.5 f#4:.5 | e4:2 r:2 | e4 e4:.75 e4:.25 f#4 e4:.5 f#4:.5 | g4:1.5 f#4:.5 e4 f#4:.75 g4:.25 | a4:.75 d5:.25 a4:.75 g4:.25 f#4 e4:.75 e4:.25 | d4:2 r e4:.75 e4:.25 | d4:2 r:2',
    left:'f#3 f#3:.75 f#3:.25 a3 f#3:.5 a3:.5 | d4:1.5 a3:.5 f#3:.5 a3:.5 d4:.5 e4:.5 | f#4 f#4:.75 f#4:.25 f#4 e4:.5 d4:.5 | a3:2 r r:.5 d4:.5 | a3:2 r:2 | a3 a3:.75 a3:.25 c#4 a3:.5 c#4:.5 | e4:1.5 d4:.5 a3 d4:.75 e4:.25 | f#4~ f#4:.75 e4:.25 d4 a3:.75 a3:.25 | f#3:2 r a3:.75 a3:.25 | f#3:2 r:2',
    note:'依据1797第二版第一册第9页《Die Waldhörner und das Echo》No.24独立转录；现代目录和MCPP录音编号为No.23。同作品版本编号不同，按曲名、D大调与开头谱音核对。反复各弹一次。'
  },
];
