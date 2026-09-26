import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {REPERTOIRE, LEGACY_REPERTOIRE} from '../public/repertoire.mjs';
import {PRIMER_SONGS} from '../public/primer-songs.mjs';
import {DEMO_LIBRARY, demosForScore} from '../public/demo-library.mjs';

test('every offered musical piece has a specific human performance and keeps the ten-grade coverage', () => {
  const graded = REPERTOIRE.filter(score => score.grade);
  assert.equal(graded.length, 103);
  for (const score of graded) {
    const demos = demosForScore(score.id);
    assert(demos.length > 0, `Missing human performance: ${score.id}`);
    for (const demo of demos) {
      assert(demo.performer && demo.attribution && demo.coverage && demo.license, score.id);
      assert(['钢琴','数码键盘（钢琴音色）','数码键盘（真人弹奏）'].includes(demo.instrument), `Explicit piano performance instrumentation: ${demo.id}`);
      assert.equal(demo.mapping, null, 'Unverified recording/score alignment must not be invented');
    }
  }
  for (let grade = 1; grade <= 10; grade++) {
    assert.equal(graded.filter(score => score.grade === grade).length, grade === 3 ? 13 : 10);
  }
});

test('bundled recordings match their attributed original audio files byte for byte', () => {
  const bundled = DEMO_LIBRARY.filter(demo => demo.kind !== 'external');
  const notice = readFileSync(new URL('../public/audio/demos/NOTICE.md', import.meta.url), 'utf8');
  const packaged = readdirSync(new URL('../public/audio/demos/', import.meta.url)).filter(name => /\.(?:mp3|m4a|ogg|wav)$/i.test(name));
  assert.deepEqual(packaged.sort(), [...new Set(bundled.map(demo => demo.src.split('/').at(-1)))].sort(), 'No uncredited or rejected candidate audio should be packaged');
  for (const demo of bundled) {
    const bytes = readFileSync(new URL('../public/' + demo.src.replace(/^\.\//, ''), import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), demo.sha256, demo.id);
    assert(bytes.length > 10_000, demo.id);
    assert.match(demo.license, /^(CC BY|EFF Open Audio)/, demo.id);
    assert(demo.licenseUrl.startsWith('https://'));
    assert(notice.includes(demo.attribution), `Packaged attribution must accompany ${demo.id}`);
    assert(notice.includes(demo.src.split('/').at(-1)), `Missing redistribution notice: ${demo.id}`);
    assert(notice.includes(demo.sha256), `Missing attributed file hash: ${demo.id}`);
    assert(notice.includes(demo.licenseUrl), `Missing license link: ${demo.id}`);
    if (demo.license === 'EFF Open Audio License') assert(demo.attribution.startsWith('(O) '));
  }
});

test('external recordings point to exact Bilibili works or verified collection parts', () => {
  for (const demo of DEMO_LIBRARY.filter(demo => demo.kind === 'external')) {
    const source = new URL(demo.sourceUrl);
    assert.equal(source.hostname, 'www.bilibili.com');
    assert.match(source.pathname, /^\/video\/BV[A-Za-z0-9]{10}\/?$/);
    if (demo.page !== undefined) {
      assert(Number.isInteger(demo.page) && demo.page > 0, demo.id);
      assert.equal(Number(source.searchParams.get('p') || 1), demo.page, demo.id);
    }
    if (demo.embedUrl) {
      const embed = new URL(demo.embedUrl);
      assert.equal(embed.hostname, 'player.bilibili.com');
      assert.equal(embed.pathname, '/player.html');
      assert.equal(embed.searchParams.get('bvid'), source.pathname.split('/')[2]);
      if (demo.page !== undefined) assert.equal(Number(embed.searchParams.get('p') || embed.searchParams.get('page') || 1), demo.page);
    }
    if (demo.startTime !== undefined) {
      assert(demo.startTime >= 0 && demo.endTime > demo.startTime, demo.id);
    }
  }
});

test('active human demos contain no retired YouTube resources', () => {
  assert.doesNotMatch(JSON.stringify(DEMO_LIBRARY), /youtube|youtu\.be/i);
});

test('retired simplified melody scores remain readable for earlier history and plans', () => {
  const ids = new Set(PRIMER_SONGS.map(score => score.id));
  const old = LEGACY_REPERTOIRE.filter(score => ids.has(score.id));
  assert.equal(old.length, 10);
  assert(old.every(score => !REPERTOIRE.some(active => active.id === score.id)));
});

test('Clementi selection starts the correct movement inside the complete recording', () => {
  const starts = [1.5, 119.3, 179.65];
  for (let movement = 1; movement <= 3; movement++) {
    const [demo] = demosForScore('mutopia-clementi-op36-no1-movement' + movement);
    assert.equal(demo.startTime, starts[movement - 1]);
    assert(demo.endTime > demo.startTime);
  }
});
