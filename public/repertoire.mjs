// Canonical v2 repertoire. Musical time is measured in quarter-note beats.
// The Hanon transcription data is adapted from Mutopia-2015/07/23-2037,
// by Steve Taylor and Javier Ruiz-Alma, CC BY-SA 4.0. See ../SOURCES.md.
// No original composition is presented as a Hanon or Czerny exercise.
import { EXERCISES } from './analysis.mjs';

const HANON_URL = 'https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/virtuoso-pianist-pt1-a4.pdf';
const CZERNY_URL = 'https://archive.org/download/imslp-exercises-for-beginners-op599-czerny-carl/PMLP08821-Practical_Method_for_Beginners.pdf';
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const pitchAt = degree => 48 + Math.floor(degree / 7) * 12 + NATURAL[((degree % 7) + 7) % 7];
const ordered = notes => notes.sort((a, b) => a.beat - b.beat || b.pitch - a.pitch);

function hanon(number, ascending, descending, descendingGroups) {
  const id = `hanon-${number}`;
  const right = [];
  let beat = 0;
  for (let group = 0; group < 14; group++) {
    for (const offset of ascending) {
      right.push({ id: `${id}-r-${right.length}`, pitch: pitchAt(group + offset), beat, duration: .25, hand: 'right' });
      beat += .25;
    }
  }
  for (let group = 0; group < descendingGroups; group++) {
    for (const offset of descending) {
      right.push({ id: `${id}-r-${right.length}`, pitch: pitchAt(18 - group + offset), beat, duration: .25, hand: 'right' });
      beat += .25;
    }
  }
  right.push({ id: `${id}-r-${right.length}`, pitch: 48, beat, duration: 2, hand: 'right' });
  const left = right.map((n, i) => ({ ...n, id: `${id}-l-${i}`, pitch: n.pitch - 12, hand: 'left' }));
  return {
    schemaVersion: 2, id, title: `哈农第 ${number} 条 · 全曲单遍`, composer: 'C. L. Hanon',
    collection: '哈农', level: '基础', bpm: 60, timeSignature: [2, 4], keySignature: 'C',
    notes: ordered([...right, ...left]), totalBeats: beat + 2,
    source: {
      label: 'Mutopia · Schirmer 1900 版 · CC BY-SA 4.0', url: HANON_URL,
      note: `第 ${number} 条全部音符，反复段仅弹一遍。保持原调、原音区、十六分音符时值；右手从 C3、左手从 C2 开始。省略表情、连线与指法，跨谱表记谱按左右手分开显示。转录来源 Steve Taylor / Javier Ruiz-Alma（2015）；本条曲谱数据改编采用 CC BY-SA 4.0。`
    }, tags: ['双手', '手指练习', '十六分音符', '公版作品', '全曲单遍']
  };
}

function line(id, pitches, durations, hand = 'right', start = 0) {
  let beat = start;
  return pitches.map((pitch, index) => {
    const duration = Array.isArray(durations) ? durations[index] : durations;
    const note = { id: `${id}-${hand}-${index}`, pitch, beat, duration, hand };
    beat += duration;
    return note;
  });
}

// Independently transcribed from the 1893 Schirmer scan, printed p. 3.
// These first reading exercises use TREBLE clefs in BOTH original staves.
// One pitch in a bar = whole note; two pitches = two half notes.
function czerny(number, rightBars, leftBars, rightFingers, leftFingers, excerpt = false) {
  const id = `czerny-599-${number}`;
  const notes = [];
  for (const [hand, bars, fingers] of [['right', rightBars, rightFingers], ['left', leftBars, leftFingers]]) {
    bars.forEach((pitches, bar) => pitches.forEach((pitch, index) => notes.push({
      id: `${id}-${hand}-${bar}-${index}`, pitch, beat: bar * 4 + index * 4 / pitches.length,
      duration: 4 / pitches.length, hand, finger: fingers[bar][index]
    })));
  }
  return {
    schemaVersion: 2, id, title: `车尔尼 599 第 ${number} 条 · ${excerpt ? '前 8 小节' : '全曲单遍'}`,
    composer: 'Carl Czerny', collection: '车尔尼 599', level: '入门', bpm: 80,
    timeSignature: [4, 4], keySignature: 'C', totalBeats: rightBars.length * 4, notes: ordered(notes),
    source: {
      label: 'Schirmer 1893 · Buonamici 校订 · 公版扫描', url: CZERNY_URL,
      note: `Op.599 第 ${number} 条${excerpt ? '第 1–8 小节节选，不是全曲' : '全部 16 小节，各反复段只弹一遍'}。根据 1893 年 Schirmer 版第 3 页逐音录入；保留原音区、时值和该版指法，未移调。原谱左右手均为高音谱号。默认速度为本测试版的练习设置。`
    }, tags: ['双手', '读谱', '二分音符', '全音符', '公版作品', excerpt ? '原谱节选' : '全曲单遍']
  };
}

const czernyStudies = [
  czerny(1,
    [[72], [74,76], [72], [74,76], [72,76], [79,77], [76,74], [72],
     [74,76], [77,74], [76,77], [79,76], [74,76], [77,74], [72,76], [72]],
    [[60,64], [67], [60,64], [67], [60], [64,65], [67,65], [64],
     [67], [67], [60,62], [64,60], [67], [67], [64,67], [60]],
    [[1], [2,3], [1], [2,3], [1,3], [5,4], [3,2], [1],
     [2,3], [4,2], [3,4], [5,3], [2,3], [4,2], [1,3], [1]],
    [[5,3], [1], [5,3], [1], [5], [3,2], [1,2], [3],
     [1], [2], [5,4], [3,5], [1], [2], [3,1], [5]]),
  czerny(2,
    [[79,84], [83,81], [79,79], [79], [83], [83], [84,79], [79]],
    [[64,60], [65,60], [64,60], [64,60], [62,67], [65,62], [64,67], [64,67]],
    [[1,4], [3,2], [1,2], [1], [3], [2], [3,1], [2]],
    [[3,5], [2,5], [3,5], [3,5], [4,1], [2,4], [3,1], [3,1]], true)
];

const originals = [
  {
    schemaVersion: 2, id: 'five-fingers-both', title: '双手五指 · 同步慢练', composer: '半拍原创练习', collection: '基础训练',
    level: '入门', bpm: 60, timeSignature: [4, 4], keySignature: 'C', totalBeats: 12,
    notes: ordered([
      ...line('five-fingers-both', [60, 62, 64, 65, 67, 65, 64, 62, 60], [1, 1, 1, 1, 1, 1, 1, 1, 4]),
      ...line('five-fingers-both', [48, 50, 52, 53, 55, 53, 52, 50, 48], [1, 1, 1, 1, 1, 1, 1, 1, 4], 'left')
    ]),
    source: { label: '半拍原创练习', url: '', note: '为测试版编写的五指练习，不属于哈农或车尔尼原谱。' },
    tags: ['双手', '五指', '原创']
  },
  {
    schemaVersion: 2, id: 'c-scale', title: 'C 大调 · 一组音阶', composer: '半拍原创练习', collection: '基础训练',
    level: '基础', bpm: 64, timeSignature: [4, 4], keySignature: 'C', totalBeats: 16,
    notes: line('c-scale', [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]),
    source: { label: '半拍原创练习', url: '', note: '通用 C 大调音阶的入门节奏编排，不是哈农音阶章节的转录。' },
    tags: ['右手', '音阶', '原创']
  }
];

const legacy = EXERCISES.map(exercise => ({
  schemaVersion: 2, id: exercise.id, title: `${exercise.title} · ${exercise.subtitle}`, composer: exercise.composer,
  collection: exercise.id === 'steps' ? '基础训练' : '入门旋律', level: exercise.level, bpm: exercise.bpm,
  timeSignature: [4, 4], keySignature: 'C', notes: line(exercise.id, exercise.pitches, exercise.lengths),
  totalBeats: exercise.lengths.reduce((sum, duration) => sum + duration, 0),
  source: {
    label: exercise.id === 'steps' ? '半拍原创练习' : '半拍入门旋律节选', url: '',
    note: exercise.id === 'steps' ? '保留测试版原有的五指练习，不是教材原谱。' : '保留测试版已有的右手旋律节选与节奏编排；不是作品的完整钢琴原谱。'
  }, tags: ['右手', '入门', exercise.id === 'steps' ? '原创' : '旋律节选']
}));

export const REPERTOIRE = [
  ...legacy,
  hanon(1, [0, 2, 3, 4, 5, 4, 3, 2], [0, -2, -3, -4, -5, -4, -3, -2], 15),
  hanon(2, [0, 2, 5, 4, 3, 4, 3, 2], [0, -3, -5, -4, -3, -4, -3, -2], 14),
  ...czernyStudies,
  ...originals
];
