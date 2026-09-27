import {demosForScore} from './demo-library.mjs';
import {HumanDemoTransport, validateDemoFile, DEMO_RATES} from './human-demo-model.mjs';
import {readLocalDemo, saveLocalDemo, removeLocalDemo} from './human-demo-storage.mjs';
import {escapeHTML as esc} from './utils.mjs';

const stamp = seconds => {const n = Math.max(0, Number(seconds) || 0); return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;};
function inspectAudio(file) {
  const audio = new Audio(), url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = error => {if (settled) return; settled = true; clearTimeout(timer); audio.onloadedmetadata = audio.onerror = null; audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); error ? reject(error) : resolve();};
    const timer = setTimeout(() => finish(Error('录音读取超时，请换用 MP3 或 M4A 文件。')), 15000);
    audio.onloadedmetadata = () => {audio.onloadedmetadata = audio.onerror = null; finish(Number.isFinite(audio.duration) && audio.duration > 0 ? null : Error('录音时长无效，请换一个音频文件。'));};
    audio.onerror = () => {audio.onloadedmetadata = audio.onerror = null; finish(Error('浏览器无法播放这份音频，请换用 MP3 或 M4A 文件。'));};
    audio.preload = 'metadata'; audio.src = url;
  });
}

/** Mount alongside standard score playback. Call stop() before practice or other audio. */
export function createHumanDemo(host, {onBeforePlay = () => {}, onProgress = () => {}, onState = () => {}, isBusy = () => false} = {}) {
  if (!host) throw Error('真人示范需要一个容器。');
  if (!document.querySelector('link[data-human-demo-style]')) {const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('./human-demo.css', import.meta.url).href; link.dataset.humanDemoStyle = ''; document.head.append(link);}
  host.classList.add('human-demo');
  let score = null, local = null, choices = [], selected = null, objectUrl = '', version = 0, importing = false, markerA = null, markerB = null, destroyed = false, externalActive = false, externalVersion = 0;
  host.innerHTML = `<details><summary>听真人演奏 <span class="human-demo-availability"></span></summary><div class="human-demo-body"><p class="human-demo-intro">听演奏者怎样处理乐句、强弱与呼吸，再回到琴上试一试。</p><label class="human-demo-select-label">录音<select class="human-demo-select" aria-label="选择真人示范录音"></select></label><div class="human-demo-credit"></div><p class="human-demo-coverage"></p><div class="human-demo-player"><div class="human-demo-actions"><button type="button" class="button human-demo-play">播放录音</button><button type="button" class="text-button human-demo-stop">停止</button><label>速度 <select class="human-demo-rate" aria-label="真人示范播放速度">${DEMO_RATES.map(rate => `<option value="${rate}" ${rate === 1 ? 'selected' : ''}>${rate}×</option>`).join('')}</select></label><span class="human-demo-clock">0:00 / 0:00</span></div><input class="human-demo-seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="真人示范播放位置"><div class="human-demo-loop"><button type="button" class="text-button human-demo-a">设 A 点</button><button type="button" class="text-button human-demo-b">设 B 点</button><label><input class="human-demo-loop-enabled" type="checkbox">A–B 循环</label><span class="human-demo-loop-label">先设置起点和终点</span><button type="button" class="text-button human-demo-clear">清除</button></div><p class="human-demo-sync">此录音尚未校对小节时间，只按时间播放，不显示同步乐谱游标。慢速播放保持原音高。</p></div><div class="human-demo-local"><button type="button" class="button human-demo-import">导入自己的示范录音</button><button type="button" class="text-button human-demo-remove" hidden>移除此曲本机录音</button><input class="human-demo-file" type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac,.webm" hidden><p>可用老师或自己提供的录音。每曲保存一份，重新导入会替换；只留在当前浏览器，不上传，也不包含在进度备份里。请保留原文件。</p></div><p class="human-demo-message" role="status" aria-live="polite"></p></div></details>`;
  const el = name => host.querySelector('.human-demo-' + name), audio = document.createElement('audio');
  el('player').insertAdjacentHTML('afterend', '<div class="human-demo-external" hidden><p>真人演奏由原发布平台提供。可在原播放器使用暂停、进度和速度控制；本机 A–B 循环适用于收录或导入的音频。</p><button type="button" class="button human-demo-external-play">在此播放真人演奏</button><button type="button" class="text-button human-demo-external-stop" hidden>停止视频</button> <a class="human-demo-external-link" target="_blank" rel="noopener noreferrer">打开原演奏页面 ↗</a><div class="human-demo-embed"></div><p class="human-demo-external-help">如平台禁止嵌入或无法加载，请打开原演奏页面观看。只有点击播放时才连接该平台。</p></div>');
  audio.setAttribute('aria-hidden', 'true'); audio.hidden = true; host.append(audio);
  const message = text => {el('message').textContent = text;};
  const player = new HumanDemoTransport({audio, isBusy, onBeforePlay, onProgress, onState: state => {
    el('play').textContent = state.state === 'playing' ? '暂停录音' : state.state === 'loading' ? '正在加载…' : '播放录音';
    el('play').disabled = !selected || state.state === 'loading'; el('stop').disabled = !selected;
    el('seek').max = String(state.duration); el('seek').value = String(state.position); el('seek').disabled = !state.duration;
    el('clock').textContent = `${stamp(state.position)} / ${stamp(state.duration)}`;
    el('a').disabled = el('b').disabled = !state.duration;
    if (state.error) message('这份录音暂时无法播放，请重新导入或选择另一份。');
    onState(state);
  }});
  function clearObjectUrl() {if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = '';}
  function stopExternal() {externalVersion++; externalActive = false; el('embed').replaceChildren(); el('external-stop').hidden = true; el('external-play').hidden = !selected?.embedUrl;}
  function clearLoop() {markerA = markerB = null; player.clearLoop(); el('loop-enabled').checked = false; el('loop-enabled').disabled = true; el('loop-label').textContent = '先设置起点和终点';}
  function showChoice(id) {
    stopExternal(); player.stop(); clearObjectUrl(); selected = choices.find(item => item.id === id) || null; clearLoop();
    const external = selected?.kind === 'external';
    el('external').hidden = !external; el('player').hidden = !selected || external;
    if (!selected) {player.unload(); el('credit').textContent = ''; el('coverage').textContent = score?.category === 'technique' ? '基本功使用上方的标准音符示范即可，也可导入老师的录音。' : '这首曲子暂未收录公开真人录音，可以导入老师或自己的示范。'; return;}
    el('select').value = selected.id;
    const own = selected.id === 'local';
    if (own) {
      objectUrl = URL.createObjectURL(selected.blob);
      el('credit').textContent = `本机录音 · ${selected.name}`;
      el('coverage').textContent = '由你导入并关联到当前曲目，请自行核对演奏者与乐曲版本。';
    } else {
      el('credit').innerHTML = `<strong>${esc(selected.performer)}</strong>${selected.year ? ' · ' + esc(selected.year) : ''} · <a href="${esc(selected.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(selected.sourceLabel || '演奏来源')}</a> · ${selected.licenseUrl ? `<a href="${esc(selected.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(selected.license)}</a>` : esc(selected.license || '由原平台提供播放')}`;
      el('coverage').textContent = selected.coverage;
    }
    el('sync').textContent = selected.mapping?.verified ? '小节位置采用已核对的录音时间表；反复段可能回到前面的小节。' : '此录音尚未校对小节时间，只按时间播放，不显示同步乐谱游标。慢速播放保持原音高。';
    if (external) {
      player.unload(); el('external-link').href = selected.sourceUrl; el('external-play').hidden = !selected.embedUrl;
    } else player.load(own ? objectUrl : new URL(selected.src, import.meta.url).href, selected.mapping || null, own ? {} : selected);
  }
  function renderChoices(preferred) {
    choices = [...demosForScore(score?.id), ...(local?.blob instanceof Blob ? [{...local, id: 'local', title: '本机录音 · ' + local.name}] : [])];
    el('availability').textContent = choices.length ? `· ${choices.length} 份演奏` : score?.category === 'technique' ? '· 基本功可用标准示范' : '· 可导入';
    el('select').innerHTML = choices.map(item => `<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('');
    el('select-label').hidden = !choices.length; el('remove').hidden = !local;
    showChoice(preferred || (local ? 'local' : choices[0]?.id));
  }
  async function updateScore(next) {
    const token = ++version; score = next; local = null; stopExternal(); player.stop(); message(''); renderChoices();
    try {const stored = await readLocalDemo(next.id); if (token !== version || destroyed) return; local = stored; renderChoices();}
    catch (error) {if (token === version && !destroyed) message(error.message);}
  }
  el('select').onchange = e => {message(''); showChoice(e.target.value);};
  el('external-play').onclick = async () => {
    if (isBusy()) return message('先结束当前练习，再听真人示范。');
    const token = version, choice = selected, externalToken = ++externalVersion;
    if (!choice?.embedUrl) return;
    await onBeforePlay();
    if (token !== version || externalToken !== externalVersion || choice !== selected || isBusy() || destroyed) return;
    stopExternal(); player.stop();
    const frame = document.createElement('iframe');
    frame.src = choice.embedUrl; frame.title = `${choice.title} · ${choice.performer}`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.allowFullscreen = true;
    el('embed').append(frame); externalActive = true; el('external-play').hidden = true; el('external-stop').hidden = false;
  };
  el('external-stop').onclick = stopExternal;
  el('external-link').onclick = () => {stopExternal(); player.stop(); void onBeforePlay();};
  el('play').onclick = async () => {message(''); if (!audio.paused) return player.pause(); try {await player.play();} catch (error) {message(error.message);}};
  el('stop').onclick = () => player.stop();
  el('seek').oninput = e => player.seek(Number(e.target.value));
  el('rate').onchange = e => player.setRate(Number(e.target.value));
  const showMarkers = () => {el('loop-label').textContent = `A ${markerA === null ? '—' : stamp(markerA)} → B ${markerB === null ? '—' : stamp(markerB)}`; el('loop-enabled').disabled = markerA === null || markerB === null;};
  el('a').onclick = () => {markerA = player.position; markerB = null; player.clearLoop(); el('loop-enabled').checked = false; showMarkers();};
  el('b').onclick = () => {try {player.setLoop(markerA, player.position); markerB = player.position; el('loop-enabled').checked = true; showMarkers(); message('已启用 A–B 时间循环。');} catch (error) {message(markerA === null ? '先在起点设置 A 点。' : error.message);}};
  el('loop-enabled').onchange = e => {if (e.target.checked) {try {player.setLoop(markerA, markerB);} catch (error) {e.target.checked = false; message(error.message);}} else player.clearLoop();};
  el('clear').onclick = clearLoop;
  el('import').onclick = () => {if (isBusy()) return message('先结束当前练习，再导入录音。'); el('file').click();};
  el('file').onchange = async e => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file || importing || !score) return;
    const token = version, scoreId = score.id; importing = true; el('import').disabled = true; message('正在检查并保存到本机…');
    try {
      validateDemoFile(file); await inspectAudio(file);
      if (isBusy()) throw Error('当前已开始练习，请结束后重新导入录音。');
      const record = {scoreId, name: file.name, blob: file, importedAt: new Date().toISOString()};
      await saveLocalDemo(record);
      if (token === version && !destroyed) {local = record; renderChoices('local'); message('录音已保存到当前浏览器，刷新后仍可使用。');}
    } catch (error) {if (token === version && !destroyed) message(error.message);}
    finally {importing = false; if (!destroyed) el('import').disabled = false;}
  };
  el('remove').onclick = async () => {
    if (!local || !score || isBusy()) return;
    if (!window.confirm('移除此曲在浏览器中保存的示范录音？电脑上的原文件不受影响。')) return;
    const token = version, scoreId = score.id;
    try {await removeLocalDemo(scoreId); if (token === version && !destroyed) {local = null; renderChoices(); message('已移除浏览器中的录音，原文件仍可重新导入。');}} catch (error) {message(error.message);}
  };
  clearLoop();
  return {updateScore, stop: () => {stopExternal(); player.stop();}, isActive: () => externalActive || player.pending || !audio.paused, destroy: () => {destroyed = true; version++; stopExternal(); player.destroy(); clearObjectUrl(); host.replaceChildren();}};
}
