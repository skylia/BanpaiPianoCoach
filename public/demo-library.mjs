// Recording copyrights are separate from the project's MIT code license.
// Keep this metadata with the audio when redistributing it.
import {LICENSED_DEMOS} from './demo-recordings.mjs';
import {EXTERNAL_DEMOS} from './demo-external.mjs';
import {PRIMER_DEMOS} from './primer-repertoire.mjs';
export const DEMO_LIBRARY = [{
  id: 'clementi-op36-no1-kolodin-2021',
  scoreIds: [1, 2, 3].map(n => `mutopia-clementi-op36-no1-movement${n}`),
  title: 'Op.36 No.1 · 三个乐章完整演奏',
  performer: 'Luis Kolodin',
  instrument: '钢琴',
  year: 2021,
  src: './audio/demos/clementi-op36-no1-luis-kolodin.m4a',
  type: 'audio/mp4',
  sourceUrl: 'https://imslp.org/wiki/6_Piano_Sonatinas,_Op.36_(Clementi,_Muzio)#IMSLP847065',
  sourceLabel: 'IMSLP · #847065',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  attribution: 'Muzio Clementi: Sonatina in C major, Op.36 No.1. Piano: Luis Kolodin (2021). IMSLP #847065. CC BY-SA 4.0.',
  coverage: '完整钢琴演奏，按当前练习乐章定位。乐章边界根据录音静音区间与源谱起音核对；尚未逐小节对齐。',
  segments: {
    'mutopia-clementi-op36-no1-movement1': {startTime: 1.5, endTime: 117},
    'mutopia-clementi-op36-no1-movement2': {startTime: 119.3, endTime: 179.3},
    'mutopia-clementi-op36-no1-movement3': {startTime: 179.65, endTime: 228.18}
  },
  mapping: null,
  sha256: '925ca8920581a93f249d2592c7e01725230fd3cfa4a7f3080dc86eada4acb7ce'
}, ...LICENSED_DEMOS, ...EXTERNAL_DEMOS, ...PRIMER_DEMOS];

// The supported external catalogue uses Bilibili. Retired providers must never
// reappear if an older generated catalogue is accidentally loaded.
export const demosForScore = scoreId => DEMO_LIBRARY
  .filter(demo => !/youtu(?:be|\.be)/i.test([demo.src, demo.sourceUrl, demo.embedUrl].join(' ')))
  .filter(demo => demo.scoreIds.includes(scoreId))
  .map(demo => demo.segments?.[scoreId] ? {...demo, ...demo.segments[scoreId]} : demo);
