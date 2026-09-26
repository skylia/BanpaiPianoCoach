import {dayKey, shiftDay, validDay} from './progress-model.mjs';

export function summarizePractice({scoreId, activities = [], takes = [], learning = {}, today = dayKey()}) {
  const first = shiftDay(today, -6);
  const date = new Date(today + 'T12:00:00');
  const monday = shiftDay(today, -((date.getDay() + 6) % 7));
  const unique = [...new Map(activities.filter(Boolean).map((a, i) => [a.id || i, a])).values()];
  const real = unique.filter(a => ['capture', 'manual'].includes(a.kind) && a.source !== 'demo' && Number.isFinite(a.seconds) && a.seconds > 0 && validDay(a.date) && a.date <= today);
  const piece = real.filter(a => a.kind === 'capture' && a.scoreId === scoreId && a.date >= first);
  const latest = takes.filter(t => t.score?.id === scoreId && ['midi', 'virtual'].includes(t.source) && t.events?.length && Number.isFinite(Date.parse(t.date)) && dayKey(t.date) <= today)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0] || null;
  return {
    todaySeconds: real.filter(a => a.date === today).reduce((sum, a) => sum + a.seconds, 0),
    weekSeconds: real.filter(a => a.date >= monday).reduce((sum, a) => sum + a.seconds, 0),
    weeklyMinutes: learning.weeklyMinutes || 120,
    pieceSessions: piece.length,
    pieceSeconds: piece.reduce((sum, a) => sum + a.seconds, 0),
    latest,
  };
}

// Keep the brief factual and point back to the full feedback instead of grading expression.
export function recentPracticeIssues(result) {
  if (!result || result.empty) return [];
  const issues = new Map();
  const add = (bar, label) => {
    if (!Number.isInteger(bar)) return;
    if (!issues.has(bar)) issues.set(bar, new Set());
    issues.get(bar).add(label);
  };
  for (const row of result.rows || []) if (row.status !== 'correct') add(row.expected?.bar, row.status === 'wrong' ? '核对音符' : '漏音 / 未练');
  for (const step of result.steps || []) if (step.errors) add(step.bar, '错误重试');
  for (const observation of result.observations || []) {
    const label = {pause:'回听停留', rhythm:'核对节奏关系', ornament:'核对装饰音', extra:'核对多音'}[observation.type];
    if (label) add(observation.bar, label);
  }
  const entries = [...issues].sort((a, b) => a[0] - b[0]).slice(0, 3).map(([bar, labels]) => `第 ${bar} 小节：${[...labels].join('、')}`);
  if (!entries.length && result.extras?.length) entries.push(`多音 ${result.extras.length} 个，回听确认位置`);
  return entries;
}
