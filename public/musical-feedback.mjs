import {escapeHTML as esc, icon, downloadFile} from './utils.mjs';
import {noteName} from './analysis.mjs';

export function renderMusicalFeedback(root, take, result, {onReplay, onStop, onRetry}) {
  const following = take.options.practiceMode === 'follow';
  const observations = result.observations || [];
  const rows = result.rows || [];
  const steps = result.steps || [];
  const issueBars = [...new Set([
    ...rows.filter(r => r.status !== 'correct').map(r => r.expected.bar),
    ...steps.filter(s => s.errors).map(s => s.bar),
    ...observations.filter(o => o.type !== 'tempo').map(o => o.bar),
  ].filter(Number.isInteger))].sort((a, b) => a - b);
  const noteIssues = following ? result.follow.errorAttempts : result.wrong + result.missing + result.extras.length;
  const headline = result.empty ? '还没有收到演奏' : issueBars.length ? '从这些小节，接着练' : '回听这一遍，听听乐句的走向';
  const advice = result.empty ? '先弹一个音确认输入信号，再开始练习。' : issueBars.length
    ? '先选一个提示较集中的小节，核对音符与节奏关系，再接上前后乐句。速度变化也可能是有意的处理，可以和老师一起判断。'
    : '这一遍没有发现明显的主干音问题。可以回听旋律、伴奏和句尾的连接；这些记录不代表已经评价了音乐感染力。';
  const passageNotes = result.ornamentResults || [];
  const modeText = following ? '跟弹 · 弹对再前进' : '完整演奏';
  root.innerHTML = `<div class="result-heading"><div><p class="eyebrow">LISTEN, NOTICE, PRACTICE</p><h3>${headline}</h3><p>${esc(take.score.title)} · 第 ${take.options.startBar}–${take.options.endBar} 小节 · ${modeText}</p></div><span class="result-badge">${take.source === 'demo' ? '模拟 · ' : ''}乐曲反馈${take.unsaved ? ' · 未保存' : ''}</span></div>
    ${take.interrupted ? '<p class="result-warning">这次未完成所选范围。后面的未练部分单独看待，先关注已经弹过的小节。</p>' : ''}
    <div class="result-advice">${icon('spark')}<p>${advice}</p></div>
    ${!result.empty&&observations.length?`<p class="musical-note-summary">${following?`完成 ${result.follow.completedGroups} / ${result.follow.totalGroups} 组 · 错误尝试 ${result.follow.errorAttempts} 次`:`错音 ${result.wrong} 个 · 漏音 ${result.missing} 个 · 多音 ${result.extras.length} 个`}</p>`:''}
    <div class="musical-observations">${observations.length ? observations.slice(0, 12).map(o => `<p><b>${Number.isInteger(o.bar) ? '第 ' + o.bar + ' 小节' : '演奏观察'}</b><span>${esc(o.message || '')}</span></p>`).join('') : `<p><b>这一遍的记录</b><span>${result.empty ? '暂无有效音符。' : following ? `完成 ${result.follow.completedGroups} / ${result.follow.totalGroups} 组，错误尝试 ${result.follow.errorAttempts} 次。` : `错音 ${result.wrong} 个、漏音 ${result.missing} 个、多音 ${result.extras.length} 个。`}</span></p>`}</div>
    ${issueBars.length ? `<div class="bar-feedback"><p>选择一个小节继续练习</p><div class="row">${issueBars.map(bar => `<button class="has-error" data-musical-bar="${bar}">${bar}</button>`).join('')}</div></div>` : ''}
    <p class="form-hint">节奏按局部速度与音符间隔关系观察，允许平滑变速。停顿与句尾呼吸需结合谱面判断；本次不评判情感、音色、手型或踏板。</p>
    <div class="result-actions"><button id="replay-button" class="button" ${!take.events.length ? 'disabled' : ''}>${icon('play')}回听本次</button><button id="replay-stop" class="button" hidden>停止回听</button><button id="retry-take" class="button">按这次设置再练</button><button id="export-take" class="text-button">导出练习记录</button></div>
    ${result.empty ? '' : `<details class="detail-disclosure"><summary>查看辅助数值与音符记录</summary><p>${following ? '首次通过率' : '主干音准确率'} ${result.pitch}% · 节奏关系参考 ${result.rhythm === null ? '样本不足' : result.rhythm + '%'} · ${following ? '错误尝试' : '错漏与多音合计'} ${noteIssues} 次。新乐曲口径与旧版固定时间分数分别统计。</p>${passageNotes.length ? `<p>已按装饰音片段识别 ${passageNotes.length} 处颤音，不要求与示范交替次数相同。</p>` : ''}<div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>小节</th><th>目标音</th><th>${following ? '错误尝试' : '实际音'}</th><th>核对结果</th></tr></thead><tbody>${following ? steps.slice(0, 400).map(s => `<tr><td>${s.bar}</td><td>${s.pitches.map(noteName).join(' + ')}</td><td>${s.errors}</td><td>${s.passedTime !== null ? '已通过' : s.firstTime !== null ? '待通过' : '未练'}</td></tr>`).join('') : rows.slice(0, 400).map(r => `<tr><td>${r.expected.bar}</td><td>${noteName(r.expected.pitch)}</td><td>${r.played ? noteName(r.played.pitch) : '—'}</td><td>${r.status === 'correct' ? '音符对应' : r.status === 'wrong' ? '错音' : '漏音 / 未练'}</td></tr>`).join('')}</tbody></table></div></details>`}`;
  root.querySelector('#replay-button').onclick = onReplay;
  root.querySelector('#replay-stop').onclick = onStop;
  root.querySelector('#retry-take').onclick = () => onRetry();
  root.querySelectorAll('[data-musical-bar]').forEach(b => b.onclick = () => onRetry(Number(b.dataset.musicalBar)));
  root.querySelector('#export-take').onclick = () => downloadFile(JSON.stringify({...take, type:'banpai-take', analysis:result}, null, 2), 'Banpai-Practice-' + take.date.slice(0, 10) + '.json');
}
