// Source: research/repertoire/clementi-op36-no1-movement2/sonatina-1.ly,
// uppersecond bars 3, 21, 25 (trill plus written terminating grace notes).
// The original Mutopia MIDI does not realize the trill. Keep its notes intact;
// these annotations carry the missing notation and evaluation semantics.
export function annotateBuiltinScore(score) {
  if (score.id !== 'mutopia-clementi-op36-no1-movement2') return score;
  return {...score, ornaments: [
    {id:'andante-trill-3',type:'trill',noteId:'m1-6',auxiliaryPitch:69,endBeat:9,graceNoteIds:['m1-7','m1-8']},
    {id:'andante-trill-21',type:'trill',noteId:'m1-148',auxiliaryPitch:65,endBeat:63,graceNoteIds:['m1-149','m1-150']},
    {id:'andante-trill-25',type:'trill',noteId:'m1-188',auxiliaryPitch:69,endBeat:75,graceNoteIds:['m1-189','m1-190']},
  ], source:{...score.source,note:score.source.note+' 已依据同版源谱补回第 3、21、25 小节的颤音和结尾装饰音标记；颤音允许主音或上方辅助音起奏，具体风格请按老师的版本。'}};
}
