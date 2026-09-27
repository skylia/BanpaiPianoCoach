// Schirmer 1900, printed pp.114–115. Independent transcription, CC0.
// The reprise on p.114 reuses the same printed notes as pp.110–111;
// p.115 has its own accidental, bass-inversion, octave and tied-coda details.
import {TREMOLO_OPENING} from './hanon-tremolo-outer.mjs';
import {TREMOLO_111_ROW1,tremoloCell as c,tremoloMiddleScore} from './hanon-tremolo-middle.mjs';

export const TREMOLO_114=[...TREMOLO_OPENING,...TREMOLO_111_ROW1];
const opening=c('C5 E5 G5','G4','C3 E3 G3','C4');
opening.l[0]=[48];opening.l[1]=[52];
const dominant=c('D5 E5 G#5','G#4','B2 D3 E3','B3');
// The low G is natural on its first attack; the next one has its own sharp.
dominant.r[1]=[67];
const ending=c('E6 G6 C7','C6','C2 E2 G2','C3',16);
// The final fast C is tied into the half-note chord, then a half rest follows.
// Its sustain must not be represented as an extra note-on at the cadence.
for(const key of ['r','l']){
 const last=ending[key].at(-1),chord=ending[key].at(-2);
 ending[key][ending[key].length-1]={pitches:last,duration:.125,sustain:2.125};
 ending[key].push({pitches:chord,duration:2},{pitches:[],duration:2});
}
export const TREMOLO_115=[
 // System 1: C major through E7 and A minor to D minor.
 opening,dominant,c('C5 E5 A5','A4','A2 C3 E3','A3'),
 c('A5 D6 F6','F5','D2 A2','D3',4),c('A5 D6 F6','F5','F2 A2','D3',4),
 // System 2: the left-hand inversion rises for only the third beat.
 c('G5 C6 E6','E5','G2 C3 E3','G3'),c('G5 B5 D6','F5','G2 B2 D3','G3'),
 c('E5 G5 C6','C5','C3 E3 G3','C4'),
 c('E5 G5 C6','C5','E3 G3 C4','E4',4),c('E5 G5 C6','C5','C3 E3 G3','C4',4),
 // System 3: the second bar starts the written right-hand 8va line.
 c('G5 C6 E6','E5','G2 C3 E3','G3'),
 c('G5 C6 E6','E5','C3 E3 G3','C4',4),c('G5 C6 E6','E5','G2 C3 E3','G3',4),
 c('C6 E6 G6','G5','E2 G2 C3','E3'),
 c('C6 E6 G6','G5','G2 C3 E3','G3',4),c('C6 E6 G6','G5','E2 G2 C3','E3',4),
 // System 4: final four-beat tremolo, tied half-note chord, half rest.
 ending,
];
export const HANON_TREMOLO_CLOSING=[tremoloMiddleScore(5,114,TREMOLO_114),tremoloMiddleScore(6,115,TREMOLO_115)];
