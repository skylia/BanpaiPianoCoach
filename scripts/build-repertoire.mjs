// Rebuild the curated collection from the audited Mutopia files in research/repertoire.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {parseMidi,midiToScore} from '../public/midi.mjs';
import {normalizeScore,barCount} from '../public/score-model.mjs';
import {createHash} from 'node:crypto';
const root=new URL('../research/repertoire/',import.meta.url), rows=[];
const pad=n=>String(n).padStart(2,'0');
const sch=(n)=>readdirSync(root).find(s=>s.startsWith('schumann-op68-'+pad(n)+'-'));
const defs={
 2:[...[1,3,4,5].map(sch),'anna-magdalena-03','anna-magdalena-04','anna-magdalena-05','anna-magdalena-07','BWV-120','anna-magdalena-22'],
 3:[...[2,6,7,8,9,10,14,16].map(sch),'25EF-01','25EF-05'],
 4:[2,3,4,6,7,8,9,10,11,13].map(n=>'25EF-'+pad(n)),
 5:[...[12,14,15,16,17,18].map(n=>'25EF-'+pad(n)),...[12,13,18,25].map(sch)],
 6:[1,2,3,4,6,7,8,10,13,14].map(n=>'bach-invention-'+pad(n)),
 7:[...[5,9,11,12,15].map(n=>'bach-invention-'+pad(n)),...[787,789,790,794,796].map(n=>'bwv'+n)],
 8:[788,791,792,793,795,797,798,799,800,801].map(n=>'bwv'+n),
 9:[3,5,8,10,12,14,17,19,22,23].map(n=>'Chop-28-'+n),
 10:['10-02-i','chopin-op-10-09-wfi','chp-10-01','chp-10-05','op-10-12-wfi','PS-chopin-25-02','chopin-op-25-01','Chop-28-16','Chop-28-24','Chop-28-18']
};
const schTitles={1:'旋律',2:'士兵进行曲',3:'哼唱的小曲',4:'圣咏',5:'小曲',6:'可怜的孤儿',7:'猎歌',8:'勇敢的骑士',9:'民歌',10:'快乐的农夫',12:'圣诞老人',13:'五月，可爱的五月',14:'小练习曲',16:'最初的忧愁',18:'收割者之歌',25:'剧场的回声'};
const burg=['坦诉','阿拉伯风格曲','牧歌','儿童联欢会','天真烂漫','前进','清澈的小溪','优美','狩猎','娇嫩的花','鹡鸰','再会','安慰','斯提利亚人','叙事曲','温柔的忧伤','饶舌','烦恼'];
for(const [grade,names] of Object.entries(defs))for(const name of names){
 const dir=new URL(name+'/',root),meta=JSON.parse(readFileSync(new URL('source.json',dir))),midi=readFileSync(new URL(name+'.mid',dir));
 if(createHash('sha256').update(midi).digest('hex')!==meta.sha256)throw Error(name+' source checksum mismatch');
 const sourceText=readdirSync(dir).filter(s=>/\.i?ly$/.test(s)).map(s=>readFileSync(new URL(s,dir),'utf8')).join('\n');
 const value=field=>sourceText.match(new RegExp('\\b'+field+'\\s*=\\s*"([^"\\n]+)"'))?.[1]||'';
 const license=value('license')||value('copyright'),maintainer=value('maintainer');
 if(!/^(Public Domain|Creative Commons Attribution(?:-ShareAlike)? (?:[34]\.0|2\.5))$/.test(license)||!maintainer)throw Error(name+' license requires review: '+license);
 const parsed=parseMidi(midi);if(parsed.tracks.length!==2)throw Error(name+' requires explicit hand review');
 if(parsed.warnings.some(w=>w.includes('换拍')))throw Error(name+' requires meter change support');
 const score=midiToScore(parsed,{rightTrackIds:[parsed.tracks[0].id],leftTrackIds:[parsed.tracks[1].id],quantize:0});
 let title,composer,category='piece',collection;
 if(name.startsWith('schumann')){const n=Number(name.match(/op68-(\d+)/)[1]);title=`${schTitles[n]} · Op.68 No.${n}`;composer='舒曼';collection='少年曲集';}
 else if(name.startsWith('25EF')){const n=Number(name.slice(-2));title=`${burg[n-1]} · Op.100 No.${n}`;composer='布格缪勒';collection='布格缪勒 Op.100';category='study';}
 else if(name.startsWith('bach-invention')){const n=Number(name.slice(-2));title=`二部创意曲 No.${n} · BWV ${771+n}`;composer='巴赫';collection='巴赫二部创意曲';category='polyphony';if(n===13)score.keySignature='Am';}
 else if(/^bwv/.test(name)){const n=Number(name.slice(3));title=`三部创意曲 No.${n-786} · BWV ${n}`;composer='巴赫';collection='巴赫三部创意曲';category='polyphony';}
 else if(name.startsWith('anna')||name.startsWith('BWV-')){title=(name==='anna-magdalena-22'?'缪塞特舞曲':name==='BWV-120'?'a 小调小步舞曲':'小步舞曲')+' · '+(value('mutopiaopus')||value('opus'));composer=['anna-magdalena-04','anna-magdalena-05'].includes(name)?'克里斯蒂安·佩措尔德':'《安娜·玛格达莱娜曲集》';collection='巴洛克小曲';category='polyphony';}
 else{composer='肖邦';collection=name.startsWith('Chop-28')?'肖邦前奏曲':'肖邦进阶作品';title=name.startsWith('Chop-28')?'前奏曲 · Op.28 No.'+name.slice(8):({'10-02-i':'练习曲 · Op.10 No.2','chopin-op-10-09-wfi':'练习曲 · Op.10 No.9','chp-10-01':'练习曲 · Op.10 No.1','chp-10-05':'黑键练习曲 · Op.10 No.5','op-10-12-wfi':'革命练习曲 · Op.10 No.12','PS-chopin-25-02':'练习曲 · Op.25 No.2','chopin-op-25-01':'练习曲 · Op.25 No.1','chopin_nocturne_op9_n3':'夜曲 · Op.9 No.3'})[name];if(title.includes('练习曲'))category='study';}
 const id='mutopia-'+name.toLowerCase().replace(/[^a-z0-9-]/g,'-');
 const footer=value('footer'),mutopiaId=footer.match(/-(\d+)$/)?.[1],page=mutopiaId?'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id='+mutopiaId:meta.midiUrl.replace(/[^/]+$/,'');
 const s=normalizeScore({...score,id,title,composer,collection,grade:Number(grade),category,grading:'general',level:`通用参考 ${grade} 级`,source:{label:`Mutopia · ${maintainer}`,url:page,note:`${license}（本条数据沿用该许可）；底本：${value('source')||'见来源页'}。收录所列 MIDI 的全部音符，按原上下谱表轨道分左右手，不按音高自动分手；反复及装饰以 MIDI 实际包含的内容为准，非原版完整记谱。保留原始音高、起音、时值及变速；谱面重新排版。${parsed.warnings.join('')}分级为半拍通用参考，未核实为央音第四套指定条目。`},tags:[grade+'级',category==='study'?'练习曲':category==='polyphony'?'复调':'乐曲','MIDI 全曲']});
 rows.push({score:s,source:{...meta,license,maintainer,page,grade:Number(grade),title,notes:s.notes.length,bars:barCount(s),handTracks:parsed.tracks.map(t=>({id:t.id,name:t.name})),warnings:parsed.warnings}});
}
writeFileSync(new URL('../public/repertoire-expanded.mjs',import.meta.url),'// Generated by scripts/build-repertoire.mjs; provenance: research/REPERTOIRE-MANIFEST.json\nexport const EXPANDED_REPERTOIRE='+JSON.stringify(rows.map(r=>r.score))+';\n');
writeFileSync(new URL('../research/REPERTOIRE-MANIFEST.json',import.meta.url),JSON.stringify(rows.map(r=>r.source),null,2));
console.log('Built',rows.length,'Mutopia scores; total notes',rows.reduce((n,r)=>n+r.score.notes.length,0));

const {REPERTOIRE}=await import('../public/repertoire.mjs');
const repertoireLines=['# 1–10 级分级曲库','', '每级 10 首，共 100 首。等级全部为通用参考难度，不是央音指定教材清单。1 级为公版旋律的入门编配，主题／副歌节选已标明；2–10 级完整保留所列 MIDI 的全部音符，反复和装饰以源 MIDI 为准，软件重新排版。原有 9 个基础条目另存旧版区，不计入本表。','', '| 参考等级 | 曲目 | 作曲者 | 收录版本 |','| --- | --- | --- | --- |'];
for(const score of REPERTOIRE.filter(s=>s.grade).sort((a,b)=>a.grade-b.grade))repertoireLines.push(`| ${score.grade} | ${score.title} | ${score.composer} | ${score.source.url?'[MIDI 转录与许可]('+score.source.url+')':'半拍入门旋律编配 · CC0'} |`);
repertoireLines.push('', '来源下载、SHA-256、转录者、许可和左右手轨道见 research/REPERTOIRE-MANIFEST.json；本地源文件见 research/repertoire。可用 npm run repertoire:build 重建。');
writeFileSync(new URL('../REPERTOIRE.md',import.meta.url),repertoireLines.join('\n')+'\n');
