import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStaff} from '../scripts/build-primer.mjs';
import {PRIMER_JCBACH_PIECES} from '../scripts/primer-jcbach.mjs';

test('W.A22 keeps the bass B flats under the F-major key signature despite earlier treble naturals',()=>{
  // RSB 2012, lower system: these four B2 noteheads have no natural signs.
  // The treble's explicit B naturals in the upper system do not affect them.
  const p=PRIMER_JCBACH_PIECES[0],left=parseStaff(p.left,'left',4,p.id).notes,right=parseStaff(p.right,'right',4,p.id).notes;
  assert.equal(p.key,'F');
  assert.deepEqual(left.filter(n=>[42,43,48,55].includes(n.beat)).map(n=>[n.beat,n.pitch]),[[42,46],[43,46],[48,46],[55,46]]);
  assert(!left.some(n=>n.pitch===47));
  assert.deepEqual(right.filter(n=>n.pitch===71).map(n=>n.beat),[20,27.5,28.25]);
});
