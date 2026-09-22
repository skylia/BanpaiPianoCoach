import { normalizeScore, barCount, SCORE_LIMITS } from './score-model.mjs';
import { parseMidi, midiToScore } from './midi.mjs';
import { $, escapeHTML as esc, uid, notify } from './utils.mjs';

const MAX_MIDI_BYTES = 16 * 1024 * 1024;
const MAX_LIBRARY_JSON_BYTES = 64 * 1024 * 1024;
const MAX_BACKUP_SCORES = 100;
const HAND_OPTIONS = [
  ['auto', '自动分手'], ['right', '全部右手'], ['left', '全部左手'], ['ignore', '不导入'],
];

function defaultTrackHand(track) {
  const name = String(track.name || '');
  const right = /(?:\bright[\s_-]+hand\b|右手)/iu.test(name);
  const left = /(?:\bleft[\s_-]+hand\b|左手)/iu.test(name);
  return right === left ? 'auto' : right ? 'right' : 'left';
}

function exampleScore() {
  const melody = [60, 62, 64, 67, 62, 64, 65, 69, 65, 67, 69, 65, 64, 62, 60, 60];
  return {
    schemaVersion: 2, title: '我的四小节练习', composer: '', collection: '我的曲谱',
    bpm: 72, timeSignature: [4, 4], keySignature: 'C', totalBeats: 16,
    notes: [
      ...melody.map((pitch, beat) => ({ id: `right-${beat}`, pitch, beat, duration: 1, hand: 'right' })),
      ...[48, 50, 53, 48].map((pitch, index) => ({ id: `left-${index}`, pitch, beat: index * 4, duration: 4, hand: 'left' })),
    ],
  };
}

function readJSON(text) {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_LIBRARY_JSON_BYTES) throw new Error('曲谱库 JSON 备份不能超过 64 MB。');
  let raw;
  try { raw = JSON.parse(text.replace(/^\uFEFF/u, '')); }
  catch { throw new Error('JSON 格式不正确，请检查引号、逗号与括号。'); }
  if (raw?.type === 'banpai-library') {
    if (raw.schemaVersion !== 2) throw new Error('曲谱库备份需要 schemaVersion: 2。');
    if (!Array.isArray(raw.scores) || !raw.scores.length) throw new Error('备份的 scores 数组中没有曲谱。');
    if (raw.scores.length > MAX_BACKUP_SCORES) throw new Error('一次最多导入 100 首曲谱，请拆分备份文件。');
    return raw.scores.map((score, index) => {
      try { return normalizeScore(score); }
      catch (error) { throw new Error(`备份中第 ${index + 1} 首曲谱无效：${error.message}`); }
    });
  }
  if (bytes > SCORE_LIMITS.jsonBytes) throw new Error('单曲 JSON 不能超过 2 MB；曲谱库备份最多 64 MB。');
  return [normalizeScore(raw)];
}

function scoreSummary(score) {
  const notes = score.notes.filter(note => note.pitch !== null);
  const left = notes.filter(note => note.hand === 'left').length;
  return `${notes.length} 个音符 · ${barCount(score)} 小节 · ${score.timeSignature.join('/')} 拍 · ${score.keySignature} · ${Math.round(score.bpm * 100) / 100} BPM · 右手 ${notes.length - left} / 左手 ${left}`;
}

export function setupImport({ onSave }) {
  if (typeof onSave !== 'function') throw new Error('setupImport 需要 onSave(score) 保存回调。');
  const required = id => {
    const element = $(`#${id}`);
    if (!element) throw new Error(`导入界面缺少 #${id}。`);
    return element;
  };
  const dialog = required('import-dialog');
  const preview = required('import-preview');
  const errorBox = required('import-error');
  const confirm = required('confirm-import');
  const fileInput = required('score-file');
  const paste = required('json-paste');
  const fileTab = required('import-file-tab');
  const pasteTab = required('import-paste-tab');
  const filePane = required('import-file-pane');
  const pastePane = required('import-paste-pane');
  let generation = 0, parsedMidi = null, scores = [], copies = null;
  let saving = false, reading = false, cancelRequested = false, retrying = false;
  const announce = message => { if ($('#toast')) notify(message); };

  preview.setAttribute('aria-live', 'polite');
  const fileHelp = filePane.querySelector('.micro');
  if (fileHelp) fileHelp.textContent = '单曲 JSON 最多 2 MB；曲谱库备份最多 64 MB；MIDI 最多 16 MB · 每首最多 4096 音符 / 256 小节 · 备份最多 100 首';

  function clearError() { errorBox.hidden = true; errorBox.textContent = ''; }
  function showError(error) {
    errorBox.textContent = typeof error === 'string' ? error : error?.message || '暂时无法读取，请检查文件后重试。';
    errorBox.hidden = false;
  }
  function updateConfirm() {
    confirm.disabled = saving || reading || !scores.length;
    if (saving) return;
    confirm.textContent = scores.length > 1
      ? `${retrying ? '重试保存' : '保存到曲谱库'}（${scores.length} 首）`
      : retrying ? '重试保存' : '保存到曲谱库';
  }
  function resetPreview() {
    generation++; parsedMidi = null; scores = []; copies = null; retrying = false; reading = false;
    preview.replaceChildren(); clearError(); updateConfirm();
  }
  function selectTab(tab, clear = true) {
    if (saving) return;
    if (clear) resetPreview();
    const isFile = tab === 'file';
    fileTab.classList.toggle('active', isFile);
    pasteTab.classList.toggle('active', !isFile);
    fileTab.setAttribute('aria-selected', String(isFile));
    pasteTab.setAttribute('aria-selected', String(!isFile));
    filePane.hidden = !isFile; pastePane.hidden = isFile;
  }
  function open() {
    if (saving) { announce('正在保存这批曲谱，请稍等。'); return; }
    resetPreview(); selectTab('file', false);
    if (!dialog.open) dialog.showModal();
  }
  function setSaving(value) {
    saving = value;
    // The application's existing close / .dialog-done buttons remain usable.
    dialog.querySelectorAll('input, select, textarea, button').forEach(element => {
      if (element.matches('.dialog-done, .dialog-close')) return;
      element.disabled = value;
    });
    updateConfirm();
  }

  function jsonPreview(imported, label = '') {
    parsedMidi = null; scores = imported;
    const noteCount = scores.reduce((total, score) => total + score.notes.filter(note => note.pitch !== null).length, 0);
    const emptyCount = scores.filter(score => !score.notes.some(note => note.pitch !== null)).length;
    preview.innerHTML = `<div class="import-summary">
      <h3>${scores.length === 1 ? '这一首，准备好了' : `曲谱库备份 · ${scores.length} 首`}</h3>
      ${label ? `<p>${esc(label)}</p>` : ''}
      <p>${noteCount} 个音符 · 确认后保存为新副本，已有曲谱不会被覆盖。</p>
      ${scores.length === 1
        ? `<label>曲名<input id="import-score-title" maxlength="120" value="${esc(scores[0].title)}" aria-label="导入曲谱名称"></label><p>${esc(scoreSummary(scores[0]))}</p>${scores[0].composer ? `<p>作者：${esc(scores[0].composer)}</p>` : ''}`
        : `<div class="track-list">${scores.map(score => `<div class="track-row"><div><b>${esc(score.title)}</b><small>${esc(scoreSummary(score))}</small></div><span>${esc(score.composer || '未填写作者')}</span></div>`).join('')}</div>`}
      ${emptyCount ? `<p class="import-warning">其中 ${emptyCount} 首只有休止或尚未添加音符；可保存后编辑，暂不能用于演奏评分。</p>` : ''}
    </div>`;
    const title = $('#import-score-title');
    if (title) title.oninput = () => {
      scores[0].title = title.value;
      if (!title.value.trim()) { showError('请填写曲名后保存。'); confirm.disabled = true; }
      else { clearError(); updateConfirm(); }
    };
    updateConfirm();
  }

  function refreshMidiPreview() {
    if (!parsedMidi || saving) return;
    scores = []; copies = null; retrying = false; clearError();
    const choices = [...preview.querySelectorAll('[data-midi-track]')];
    const idsFor = role => choices.filter(element => element.value === role).map(element => parsedMidi.tracks[Number(element.dataset.midiTrack)].id);
    try {
      const score = midiToScore(parsedMidi, {
        trackIds: choices.filter(element => element.value !== 'ignore').map(element => parsedMidi.tracks[Number(element.dataset.midiTrack)].id),
        rightTrackIds: idsFor('right'), leftTrackIds: idsFor('left'),
        quantize: Number($('#import-quantize').value), title: $('#import-midi-title').value.trim(),
      });
      if (!$('#import-midi-title').value.trim()) throw new Error('请填写曲名后保存。');
      scores = [score];
      $('#import-midi-summary').textContent = scoreSummary(score);
    } catch (error) {
      $('#import-midi-summary').textContent = '调整轨道选择或整理原文件后，再查看导入结果。';
      showError(error);
    }
    updateConfirm();
  }

  function midiPreview(parsed, filename) {
    parsedMidi = parsed;
    preview.innerHTML = `<div class="import-summary">
      <h3>MIDI 已读取，确认一下左右手</h3><p>${esc(filename)} · ${parsed.tracks.length} 个含音符的轨道</p>
      <label>曲名<input id="import-midi-title" maxlength="120" value="${esc(parsed.title)}" aria-label="MIDI 曲谱名称"></label>
      <label>节奏整理<select id="import-quantize" aria-label="MIDI 节奏量化精度"><option value="0.25">对齐到十六分音符（¼ 拍）</option><option value="0.5">对齐到八分音符（½ 拍）</option><option value="0">保留原始起音与时值</option></select></label>
      <p class="micro">轨道名明确标注左右手时会优先保留；其余轨道自动按音区分手：中央 do（C4）以下为左手，其余为右手。可按原谱修改每条轨道。</p>
      <div class="track-list">${parsed.tracks.map((track, index) => `<div class="track-row"><div><b>${esc(track.name || `轨道 ${index + 1}`)}</b><small>${track.notes.length} 个音符 · 通道 ${track.channel + 1}</small></div><select data-midi-track="${index}" aria-label="${esc(track.name || `轨道 ${index + 1}`)}的导入声部">${HAND_OPTIONS.map(([value, label]) => `<option value="${value}" ${value === defaultTrackHand(track) ? 'selected' : ''}>${label}</option>`).join('')}</select></div>`).join('')}</div>
      <p id="import-midi-summary"></p>
      <p class="import-warning">MIDI 不包含可靠的指法信息；自动分手与量化结果请按原谱核对。只有点击保存，才会加入曲谱库。</p>
      ${parsed.warnings.length ? `<div class="import-warning"><b>文件读取提示</b><ul>${parsed.warnings.map(warning => `<li>${esc(warning)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
    $('#import-midi-title').oninput = refreshMidiPreview;
    $('#import-quantize').onchange = refreshMidiPreview;
    preview.querySelectorAll('[data-midi-track]').forEach(element => { element.onchange = refreshMidiPreview; });
    refreshMidiPreview();
  }

  async function file(selectedFile) {
    if (saving) { announce('正在保存这批曲谱，请稍等。'); return false; }
    open();
    if (!selectedFile) { showError('请选择一个 JSON 或 MIDI 文件。'); return false; }
    const token = generation;
    reading = true; updateConfirm();
    try {
      const extension = selectedFile.name?.match(/\.([^.]+)$/u)?.[1].toLowerCase();
      if (!['json', 'mid', 'midi'].includes(extension)) throw new Error('请选择 .json、.mid 或 .midi 文件。');
      if (!Number.isFinite(selectedFile.size) || selectedFile.size < 0) throw new Error('无法读取文件大小，请重新选择文件。');
      if (extension === 'json') {
        if (selectedFile.size > MAX_LIBRARY_JSON_BYTES) throw new Error('曲谱库 JSON 备份不能超过 64 MB；单曲 JSON 最多 2 MB。');
        const text = await selectedFile.text();
        if (token !== generation || !dialog.open) return false;
        jsonPreview(readJSON(text), selectedFile.name);
      } else {
        if (selectedFile.size > MAX_MIDI_BYTES) throw new Error('MIDI 文件不能超过 16 MB。');
        const bytes = await selectedFile.arrayBuffer();
        if (token !== generation || !dialog.open) return false;
        midiPreview(parseMidi(bytes, { title: selectedFile.name.replace(/\.(mid|midi)$/iu, '').slice(0, 120) || '导入的 MIDI 练习' }), selectedFile.name);
      }
      return scores.length > 0;
    } catch (error) {
      if (token === generation && dialog.open) showError(error);
      return false;
    } finally {
      if (token === generation) { reading = false; updateConfirm(); }
    }
  }

  function previewPaste() {
    if (saving) return;
    resetPreview();
    try { jsonPreview(readJSON(paste.value)); }
    catch (error) { showError(error); }
  }

  confirm.onclick = async () => {
    if (saving || reading || !scores.length) return;
    clearError();
    try {
      // IDs are created only after confirmation. Keep remaining IDs on a retry so
      // a save callback that wrote before failing cannot create duplicate copies.
      if (!copies) copies = scores.map(score => normalizeScore({ ...score, id: `custom-${uid()}` }));
      else copies = copies.map(score => normalizeScore(score));
    } catch (error) { showError(error); return; }
    cancelRequested = false;
    setSaving(true);
    const total = copies.length;
    let saved = 0, failure = null;
    try {
      while (copies.length && !cancelRequested) {
        confirm.textContent = `正在保存 ${saved + 1} / ${total}…`;
        await onSave(structuredClone(copies[0]));
        copies.shift(); saved++;
        if (!dialog.open) cancelRequested = true;
      }
    } catch (error) { failure = error; }
    finally { setSaving(false); }
    if (failure) {
      scores = copies;
      retrying = true;
      jsonPreview(scores, `本批已保存 ${saved} 首；剩余 ${scores.length} 首可重试，不会重复导入已保存部分。`);
      const message = `保存未完成：${failure.message || '浏览器存储暂时不可用。'}`;
      if (dialog.open) showError(message); else announce(message);
    } else if (cancelRequested) {
      announce(`已保存 ${saved} 首，后续导入已停止。`);
    } else {
      scores = []; copies = null; updateConfirm(); dialog.close();
      announce(`已将 ${saved} 首曲谱保存到曲谱库。`);
    }
  };

  dialog.addEventListener('close', () => {
    // A queued close event may arrive after the caller has reopened the dialog.
    if (dialog.open) return;
    generation++; reading = false;
    if (saving) cancelRequested = true;
  });
  dialog.addEventListener('cancel', () => { if (saving) cancelRequested = true; });
  dialog.addEventListener('click', event => {
    if (saving && event.target.closest?.('.dialog-done, .dialog-close')) cancelRequested = true;
  }, true);
  fileTab.onclick = () => selectTab('file');
  pasteTab.onclick = () => selectTab('paste');
  paste.oninput = () => { if (!saving) resetPreview(); };
  required('parse-json-paste').onclick = previewPaste;
  required('load-json-example').onclick = () => {
    if (saving) return;
    paste.value = JSON.stringify(exampleScore(), null, 2);
    previewPaste();
  };
  required('import-button').onclick = open;
  required('pick-score-file').onclick = () => { if (!saving) fileInput.click(); };
  fileInput.onchange = () => {
    const selectedFile = fileInput.files?.[0]; fileInput.value = '';
    if (selectedFile) void file(selectedFile);
  };
  const drop = required('import-drop');
  const chooseFile = () => { if (!saving) { open(); fileInput.click(); } };
  drop.onclick = chooseFile;
  drop.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseFile(); } };
  drop.ondragover = event => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = saving ? 'none' : 'copy';
    if (!saving) drop.classList.add('dragover');
  };
  drop.ondragleave = () => drop.classList.remove('dragover');
  drop.ondrop = event => {
    event.preventDefault(); drop.classList.remove('dragover');
    if (saving) return;
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    if (files.length !== 1) { open(); showError('请一次选择一个文件；导入多首曲谱可使用曲谱库 JSON 备份。'); return; }
    void file(files[0]);
  };
  updateConfirm();
  return { open, file };
}
