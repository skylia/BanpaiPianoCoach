import {noteName} from './analysis.mjs';
import {escapeHTML as esc,downloadFile,icon,formatTime} from './utils.mjs';

export function renderFollowFeedback(root,t,result,{onReplay,onStop,onRetry}) {
 const f=result.follow,bars=[...new Set(result.steps.filter(s=>s.firstTime!==null).map(s=>s.bar))];
 const delta=s=>s.delta===null?'—':`${s.delta>0?'+':''}${Math.round(s.delta*1000)} ms`;
 root.innerHTML=`<div class="result-heading"><div><p class="eyebrow">FOLLOW YOUR PLAYING</p><h3>${result.empty?'这次还没有听见琴键':'跟弹练习已保存'}</h3><p>${esc(t.score.title)} · 跟弹 · ${t.options.hand==='left'?'左手':t.options.hand==='right'?'右手':'双手'} · 第 ${t.options.startBar}–${t.options.endBar} 小节 · 参考 ${t.bpm} BPM</p></div><span class="result-badge">${t.source==='demo'?'模拟结果':t.unsaved?'尚未保存':t.interrupted?'提前结束':'跟弹反馈'}</span></div>
 ${t.interrupted?`<p class="result-warning">${esc(t.reason)}：已通过 ${f.completedGroups} / ${f.totalGroups} 组。未尝试的部分标为“未练”，不会虚增错误次数。</p>`:''}
 <div class="metrics follow-metrics"><div class="metric"><strong>${f.errorAttempts}<small> 次</small></strong><span class="metric-label">错误尝试</span><p>含错音 ${f.wrongAttempts} 次 · 缺音 ${f.incompleteAttempts} 次（可重叠）</p></div><div class="metric"><strong>${result.rhythm??'—'}${result.rhythm===null?'':'<small>%</small>'}</strong><span class="metric-label">首次起音合拍率</span><p>${result.rhythm===null?'至少尝试 3 组后评分':`${f.rhythmSteady} / ${f.rhythmCount} 组首次起音合拍`}</p></div><div class="metric"><strong>${result.empty?'—':result.pitch}${result.empty?'':'<small>%</small>'}</strong><span class="metric-label">首次通过率</span><p>一次通过 ${f.firstPassGroups} / ${f.totalGroups} 组</p></div></div>
 <p class="follow-summary">已通过 ${f.completedGroups} / ${f.totalGroups} 组 · 实际练习 ${formatTime(t.elapsed)} · 纠错等待 ${f.correctionSeconds.toFixed(1)} 秒</p>
 <div class="result-advice">${icon('spark')}<p>${result.empty?'先试弹一个音，确认连接后再开始。':f.errorAttempts?'先单独练错误较多的小节；和弦需在一次起音中弹齐，错了再完整重弹。':result.rhythm!==null&&result.rhythm<80?'音符已能顺利通过。保持所选 BPM，留意长短音和休止之间的间距。':'保持当前速度，把这段连贯地弹一遍，再试固定速度模式。'}</p></div>
 <p class="form-hint">同一起音的音或和弦算一组。错音、额外音或和弦缺音会记一次错误，等你重试；和弦起音允许最多约 120 ms 的自然先后。节奏按本组首次尝试与上一组弹对的起音间距评分，参考所选 BPM 和谱面时值；纠错等待单列，不把后续整段都判为迟到。持续时值、力度与踏板暂不评分。</p>
 ${bars.length?`<div class="bar-feedback"><p>点选小节，再练一遍</p><div class="row">${bars.map(bar=>`<button data-follow-bar="${bar}" class="${result.steps.some(s=>s.bar===bar&&s.errors)?'has-error':''}">${bar}</button>`).join('')}</div></div>`:''}
 <div class="result-actions"><button id="replay-button" class="button" ${!t.events.length?'disabled':''}>${icon('play')}回听本次</button><button id="replay-stop" class="button" hidden>停止回听</button><button id="retry-take" class="button">按这次设置再练</button><button id="export-take" class="text-button">导出练习记录</button></div>
 <details class="detail-disclosure"><summary>逐组记录 · ${f.totalGroups} 组</summary><div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>小节</th><th>目标音 / 和弦</th><th>错误次数</th><th>错音 / 缺音</th><th>首次起音误差</th><th>通过情况</th></tr></thead><tbody>${result.steps.slice(0,400).map(s=>`<tr><td>${s.bar}</td><td>${s.pitches.map(noteName).join(' + ')}</td><td>${s.errors}</td><td>${s.wrongPitches.slice(0,12).map(noteName).join('、')||'—'} / ${s.missingPitches.map(noteName).join('、')||'—'}</td><td>${delta(s)}</td><td>${s.passedTime!==null?'已通过':s.firstTime!==null?'待通过':'未练'}</td></tr>`).join('')}</tbody></table></div>${result.steps.length>400?'<p>显示前 400 组，完整数据请导出。</p>':''}</details>`;
 root.querySelector('#replay-button').onclick=onReplay;root.querySelector('#replay-stop').onclick=onStop;
 root.querySelector('#retry-take').onclick=()=>onRetry();
 root.querySelectorAll('[data-follow-bar]').forEach(b=>b.onclick=()=>onRetry(Number(b.dataset.followBar)));
 root.querySelector('#export-take').onclick=()=>downloadFile(JSON.stringify({...t,type:'banpai-take',analysis:result},null,2),'Banpai-Practice-'+t.date.slice(0,10)+'.json');
}
