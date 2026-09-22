// Use only recorded note-on velocity. Missing expression is not invented.
export const EVEN_PLAYBACK_VOLUME = .12;
export const hasVelocity = value => Number.isInteger(value) && value >= 1 && value <= 127;

export function velocityVolume(velocity) {
  if (!hasVelocity(velocity)) return EVEN_PLAYBACK_VOLUME;
  // Keep the strongest sample below PianoSound's gain ceiling so forte values
  // remain distinct. This controls loudness, not a multi-layer piano timbre.
  return .18 * (velocity / 127) ** .9;
}

export function dynamicsInfo(notes) {
  const sounding = notes.filter(note => note.pitch !== null);
  const recorded = sounding.filter(note => hasVelocity(note.velocity));
  const values = [...new Set(recorded.map(note => note.velocity))];
  return { recorded: recorded.length, missing: sounding.length - recorded.length,
    varied: values.length > 1, min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null };
}
