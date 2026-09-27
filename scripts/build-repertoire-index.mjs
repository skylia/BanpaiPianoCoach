import {writeFileSync} from 'node:fs';
import {REPERTOIRE} from '../public/repertoire.mjs';
import {demosForScore} from '../public/demo-library.mjs';

const graded = REPERTOIRE.filter(score => score.grade).sort((a, b) => a.grade - b.grade);
const counts = Array.from({length: 10}, (_, i) => graded.filter(score => score.grade === i + 1).length);
const countsByPlayer = {audio: 0, external: 0, missing: 0};
const rows = graded.map(score => {
  const demo = demosForScore(score.id)[0];
  countsByPlayer[demo ? demo.kind === 'external' ? 'external' : 'audio' : 'missing']++;
  const recording = demo ? `[${demo.performer} · ${demo.kind === 'external' ? '原平台演奏' : '内置录音'}](${demo.sourceUrl})` : '待核实';
  return `| ${score.grade} | ${score.title} | ${score.composer} | [曲谱来源](${score.source.url}) | ${recording} |`;
});
const lines = [
  '# 1–10 级分级曲库', '',
  `共 ${graded.length} 个乐曲条目，各级数量：${counts.join(' / ')}。三级包括克列门蒂 Op.36 No.1 三个完整乐章。等级为通用参考难度，不是任何考级机构的指定教材清单。`, '',
  '一级采用十首经来源和程度核对的混合原作，并为每首配备可分发的真人录音或对应作品的哔哩哔哩真人演奏。各曲保留原音高与时值，反复、弱起和版本处理分别写在曲谱说明中；没有把预备级片段直接标作正式一级。旧入门旋律及上一版古尔利特条目的 ID、谱面和历史记录保留在兼容曲库。', '',
  '2–10 级共 93 份 Mutopia MIDI 转录，保留全部音符与原始速度数据；显示与评分注释另外保存。哈农、五指、音阶、琶音等在基本功区，继续使用标准音符示范。', '',
  `真人示范覆盖：${countsByPlayer.audio} 首可在本地播放器收听，${countsByPlayer.external} 首通过哔哩哔哩的单曲、分P或已核对时间入口播放${countsByPlayer.missing ? `，${countsByPlayer.missing} 首待核实` : ''}。外部播放器需要网络和原平台可用；所有作品仍保留标准音符示范和本地老师录音导入。真人演奏用于聆听表达，不作为逐毫秒评分模板。`, '',
  '| 参考等级 | 曲目 | 作曲者 | 收录版本 | 真人演奏来源 |',
  '| --- | --- | --- | --- | --- |',
  ...rows, '',
  '谱面溯源：`research/REPERTOIRE-MANIFEST.json`、`research/repertoire/`、`research/primer/`。录音许可和核对依据：[`research/demos/README.md`](research/demos/README.md)；内置音频逐份署名：[`public/audio/demos/NOTICE.md`](public/audio/demos/NOTICE.md)。', '',
  '运行 `npm run repertoire:build` 一次重建 Mutopia 转录、一级谱面及本表；单独重建一级使用 `node scripts/build-primer.mjs`，单独刷新本表使用 `node scripts/build-repertoire-index.mjs`。'
];
writeFileSync(new URL('../REPERTOIRE.md', import.meta.url), lines.join('\n') + '\n');
