// Familiar melodies arranged for first-stage reading; these are not exam editions.
// Numbers are C-major scale degrees; :n is duration in quarter-note beats.
const tunes = [
 ['joy-theme','欢乐颂（主题）','3 3 4 5 5 4 3 2 1 1 2 3 3:1.5 2:.5 2:2 3 3 4 5 5 4 3 2 1 1 2 3 2:1.5 1:.5 1:2 2 2 3 1 2 3:.5 4:.5 3 1 2 3:.5 4:.5 3 2 1 2 5-:2 3 3 4 5 5 4 3 2 1 1 2 3 2:1.5 1:.5 1:2'],
 ['twinkle-full','小星星','1 1 5 5 6 6 5:2 4 4 3 3 2 2 1:2 5 5 4 4 3 3 2:2 5 5 4 4 3 3 2:2 1 1 5 5 6 6 5:2 4 4 3 3 2 2 1:2'],
 ['frere-jacques','两只老虎（Frère Jacques）','1 2 3 1 1 2 3 1 3 4 5:2 3 4 5:2 5:.5 6:.5 5:.5 4:.5 3 1 5:.5 6:.5 5:.5 4:.5 3 1 1 5- 1:2 1 5- 1:2'],
 ['mary-lamb','玛丽有只小羊','3 2 1 2 3 3 3:2 2 2 2:2 3 5 5:2 3 2 1 2 3 3 3 3 2 2 3 2 1:4'],
 ['london-bridge','伦敦桥','5:1.5 6:.5 5 4 3 4 5:2 2 3 4:2 3 4 5:2 5:1.5 6:.5 5 4 3 4 5:2 2:2 5:2 3 1:3'],
 ['little-bee','小蜜蜂','5 3 3:2 4 2 2:2 1 2 3 4 5 5 5:2 5 3 3:2 4 2 2:2 1 3 5 5 3:4 2 2 2 2 2 3 4:2 3 3 3 3 3 4 5:2 5 3 3:2 4 2 2:2 1 3 5 5 1:4'],
 ['saints','圣徒进行曲（主题）','1 3 4 5:5 1 3 4 5:5 1 3 4 5:2 3:2 1:2 3:2 2:4 3 3 2 1:5 1 3 5 5 4:4 3:2 4 5:2 3:2 1:2 2:2 1:4'],
 ['new-year','新年好（传统曲调）','1 1 1:2 5-:2 3 3 3:2 1:2 1 3 5:2 5:2 4 3 2:4 2 3 4:2 4:2 3 2 3:2 1:2 1 3 2:2 5-:2 7- 2 1:4'],
 ['jingle-bells','铃儿响叮当（副歌）','3 3 3:2 3 3 3:2 3 5 1:1.5 2:.5 3:4 4 4 4:1.5 4:.5 4 3 3 3:.5 3:.5 3 2 2 3 2:2 5:2 3 3 3:2 3 3 3:2 3 5 1:1.5 2:.5 3:4 4 4 4:1.5 4:.5 4 3 3 3:.5 3:.5 5 5 4 2 1:4'],
 ['auld-lang-syne','友谊地久天长（主题）','5- 1:1.5 1:.5 1 3 2:1.5 1:.5 2 3 1:1.5 1:.5 3 5 6:3 6 5:1.5 3:.5 3 1 2:1.5 1:.5 2 3 1:1.5 6-:.5 6- 5- 1:3']
];
export const PRIMER_SONGS=tunes.map(([id,title,text])=>{let beat=0;const scale=[60,62,64,65,67,69,71];const notes=text.split(' ').map((token,i)=>{const [name,d]=token.split(':'),duration=Number(d||1),pitch=scale[Number(name[0])-1]+(name.endsWith('-')?-12:name.endsWith('+')?12:0),n={id:`${id}-${i}`,pitch,beat,duration,hand:'right'};beat+=duration;return n;});return {schemaVersion:2,id,title:title+' · 入门旋律版',composer:id==='jingle-bells'?'J. L. Pierpont':id==='joy-theme'?'贝多芬':'传统曲调',collection:'入门乐曲',level:'通用参考 1 级',grade:1,category:'piece',grading:'general',bpm:72,timeSignature:[4,4],keySignature:'C',notes,totalBeats:Math.ceil(beat/4)*4,source:{label:'公版旋律 · 半拍入门编配',url:'',note:'按常见公版旋律制作的右手阅读练习；移调至 C 大调，以四分音符计拍重新组织练习小节。不是原版钢琴谱或央音指定教材；标注主题或副歌的条目为节选。此练习编配以 CC0 提供。'},tags:['1级','旋律','入门编配','右手']};});
