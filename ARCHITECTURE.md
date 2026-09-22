# 半拍 0.3：技术结构与数据约定

## 运行边界

原生 ES Modules 单页应用。Node.js 提供开发静态服务器及构建复制；采集、曲谱导入、五线谱排版、播放和规则分析均在浏览器执行。没有模型服务、后端音乐 API、服务端数据库或运行时 npm 安装步骤。VexFlow 4.2.5 与 Bravura 随源码提供。

托管平台负责私密登录访问。`server.mjs` 不含独立认证，默认监听 `0.0.0.0:3000`。源代码不依赖当前托管平台，可迁到本地或其他具备访问控制的 HTTPS 静态托管服务。

## 模块职责

| 文件 | 职责 |
| --- | --- |
| `public/index.html` | 练习室、曲谱库、记录，以及导入 / 帮助 / 编辑弹窗的结构 |
| `public/app.mjs` | 界面状态、采集生命周期、练习范围 / 循环、反馈、导入与存储协作 |
| `public/inputs.mjs` | Web MIDI 设备与琴键事件适配；Web Audio 合成播放 |
| `public/score-model.mjs` | v2 谱子校验、JSON、旧格式转换、变速积分、目标时间轴 |
| `public/import-ui.mjs` | 文件/粘贴预览、轨道手别、容量限制、备份与逐首保存 |
| `public/midi.mjs` | 纯 JavaScript SMF 读取、分轨、量化、MIDI 导出 |
| `public/repertoire.mjs` | 有来源说明的 9 条内置谱子 |
| `public/notation.mjs` | VexFlow 五线谱、调号 / 时值 / 休止 / 和弦 / 延音线、游标与跟谱 |
| `public/editor.mjs` | 图形卷帘编辑、属性检查、撤销 / 重做、即时谱面预览 |
| `public/analysis.mjs` | 音符名称、兼容旧旋律、和弦起音分组与稀疏序列匹配 |
| `public/storage.mjs` | IndexedDB 版本 2、原子批写、详细记录与摘要同事务保存 |
| `public/progress-model.mjs` | 纯统计、日期、摘要校验、学习计划证据及备份协议 |
| `public/progress.mjs` | 成长视图、补记/清单/计划、目标与进度备份交互 |
| `public/curriculum.mjs` | 五个阶段、六类能力、60 项自主学习目标 |
| `public/utils.mjs` | DOM、转义、ID、图标与界面共用函数 |
| `public/style.css`、`public/notation.css`、`public/studio.css` | 应用与谱面响应式样式 |
| `examples/` | 可导入的双手练习 JSON / MIDI 对照示例 |
| `tests/` | 算法、格式、输入、曲库、谱面及浏览器验证 |
| `SOURCES.md` | 曲谱底本、许可、转录范围与复核信息 |
| `build.mjs` | 清理 `dist/` 并复制 `public/`，不编译音乐数据 |

## 统一谱子格式 v2

谱子不使用秒保存目标音乐。**`beat`、`duration`、`totalBeats` 都以四分音符为 1 拍**，即使 `timeSignature` 为 `6/8` 也一样：一小节为 3 个四分音符拍。`bpm` 同样以四分音符计速。

```json
{
  "schemaVersion": 2,
  "id": "my-study",
  "title": "两小节练习",
  "composer": "",
  "collection": "我的曲谱",
  "level": "入门",
  "bpm": 72,
  "timeSignature": [4, 4],
  "keySignature": "C",
  "notes": [
    { "id": "r1", "pitch": 60, "beat": 0, "duration": 1, "hand": "right", "finger": 1 },
    { "id": "l1", "pitch": 48, "beat": 0, "duration": 4, "hand": "left" },
    { "id": "rest1", "pitch": null, "beat": 1, "duration": 3, "hand": "right" }
  ],
  "totalBeats": 8,
  "source": { "label": "原创练习", "url": "", "note": "来源与改编说明" },
  "tempoMap": [{ "beat": 0, "bpm": 72 }],
  "tags": ["双手"]
}
```

| 字段 | 约定与校验 |
| --- | --- |
| `schemaVersion` | 导出为 `2`；兼容旧旋律输入；不支持的显式版本报错 |
| `id` / `notes[].id` | 长度最多 96，字母数字开头，后续允许点、冒号、下划线、短横线；音符 ID 不得重复 |
| `title` | 非空，最多 120 字符；作者与曲集各最多 120，难度最多 40 |
| `bpm` | 有限数值 10–1000；界面采用更窄的练习 / 编辑速度范围 |
| `timeSignature` | `[分子, 分母]`，分子 1–16；分母为 1、2、4、8、16、32 |
| `keySignature` | 标准调名，如 `C`、`F#`、`Bb`、`Am`；支持大调 / 关系小调 |
| `notes[].pitch` | 整数 21–108（A0–C8），或 `null` 表示休止；中央 C 为 60 |
| `notes[].beat` | 从 0 起的有限非负四分音符拍 |
| `notes[].duration` | 正四分音符拍，至少 0.000001；终点不得超出曲终 |
| `notes[].hand` | `right` / `left`；手别不等同于音高高低 |
| `notes[].finger` | 可选 1–5，谱面提示，不用于手指识别 |
| `totalBeats` | 正数，至少覆盖全部音符终点；允许末尾休止、非整小节结束 |
| `tempoMap` | 可选 `{beat,bpm}` 数组，最多 1024 项；同一拍不能重复设置；按拍排序 |
| `source` | 可选来源名称、http(s) 网址及改动说明；各限制 200 / 2048 / 2000 字符 |
| `tags` | 最多 24 个，每个最多 40 字符 |

`normalizeScore(raw)` 返回新对象，补足默认元数据并排序；不会修改调用者数据。未知附加字段不进入标准导出。数字必须是真正的有限数字，不把数字字符串、NaN、Infinity 当成有效时间。最多 4096 个音符 / 休止、256 小节。`parseScoreJSON(text)` 检查 2 MB 上限，接受 UTF-8 BOM；错误以适合界面显示的中文消息抛出。

旧格式 `{pitches:[60,62], lengths:[1,1], bpm:72, title:"..."}` 按顺序累加转换为右手音符。`toLegacyExercise(score)` 仅允许连续右手单音且无末尾空白 / 复杂变速，避免双手与休止被静默丢弃。普通保存应使用 `serializeScore(score)` 输出 v2。

`examples/beginner-study.json` 为完整导入示例，包含双手、休止、不同音长与指法；对应 MIDI 适合验证导入预览和左右手轨道。

## 目标时间轴、分段与变速

主要接口：

```js
normalizeScore(raw)
parseScoreJSON(text)
serializeScore(score)
beatsPerBar(score)
barCount(score)
beatToSeconds(beat, score, bpmOverride = score.bpm)
scoreToTimedNotes(score, { bpm, hand = 'both', startBar = 1, endBar } = {})
scoreDuration(score, { bpm, hand, startBar, endBar } = {})
```

`beatToSeconds` 对 `tempoMap` 分段积分。练习 BPM 改变时，全部速度乘以 `bpmOverride / score.bpm`，保留相对变速。编辑器修改谱子 BPM 则清除变速，代表明确改成匀速。

`scoreToTimedNotes` 只返回所选手别、所选小节内起音的非休止音。结果包含 `id / pitch / hand / finger / index / beat / bar / time / duration / beats`。`beat` 与 `bar` 保留原谱位置，`index` 对应标准谱子中的原索引；`time` 是相对所选起始小节的秒数，`duration` 为积分后的秒数，`beats` 是截取后的四分音符时值。

区间终点会截短延音；区间前已经按下的延音不会当作区间内的新目标按键。练习从中间小节开始时，长延音应结合原谱和分手目的判断。`scoreDuration` 根据范围终点计算完整时长，包括休止和末尾留白，不能用最后一个目标起音代替。

应用将这条时间轴交给示范、录制比较和循环调度。每次循环独立生成 take，先保存上一遍，再以四拍倒数启动下一遍，最多重复 5 遍；保存过程中锁定练习设置。原始谱子是独立数据，导入方式和实时输入方式无需改变评分接口。

## MIDI 文件输入与输出

```js
const parsed = parseMidi(arrayBuffer, { title });
// parsed.tracks: {id, index, name, channel, notes}[]
// parsed also has bpm, timeSignature, keySignature, tempoMap,
// warnings, durationBeats, format, ticksPerBeat.
const score = midiToScore(parsed, {
  trackIds, rightTrackIds, leftTrackIds,
  quantize: 0.25, title
});
const bytes = exportMidi(score); // Uint8Array
```

支持 SMF 类型 0 / 1、PPQ、1–4 字节变长数字、running status、速度、拍号、调号、轨名和音符配对。Note On 的力度为 0 时按 Note Off 处理。同一音高重叠按键按先入先出配对。一个原始轨道有多个通道时，拆为独立可选项，ID 为 `track-${index}-ch-${channel}`。

parser 限 16 MB、128 个原始轨道、32768 次按键、500000 个事件，避免损坏文件占用无限资源；应用入口可使用更小的文件限制。谱子保存仍受 4096 音符 / 256 小节限制。超大曲目应先在音乐软件中裁剪。

导入会跳过第 10 通道打击乐及 88 键范围以外的音符，并通过 `warnings` 告知。踏板不转换为延音时值；缺少抬键的音在轨道末尾结束并提示；孤立抬键忽略并提示。完整 MIDI 文件中的未知元事件和设备设置可跳过，但截断数据、非法状态、无效头、零速度、无效数字等报错。

`midiToScore` 支持轨道筛选、显式左右手和量化。导入界面先识别轨道名中的 Right hand/右手、Left hand/左手作为默认值；未指定手别时按音高低于 60 归左手，此分法只是方便导入，左手高音与交叉手需要用户修正。量化 0 表示保留原始起音 / 时值；默认 0.25 拍。分到同一手的同音同起拍层叠轨会合并，避免要求同一琴键同时触发两次。总长度按所选最后一个音向上补齐整小节；文件末尾纯空轨时间不纳入练习。

导出为类型 1，480 PPQ，含元数据轨、右手轨（通道 1）及左手轨（通道 2）。保留速度变化、拍号、调号、琴键起音、时值与曲终。休止表现为时间空隙。指法、作品来源、连奏线、表情、复杂声部分配不属于本应用 MIDI 导出内容；需无损迁移请用 JSON。

类型 2 与 SMPTE 明确拒绝。换拍、转调目前只使用首个并提示。MIDI 的音符数据不能恢复扫描谱或编辑软件的原排版。

## 谱面与图形编辑器

`buildNotationBars(score, options)` 为纯准备层；显示按每拍 8 格（三十二分音符）划分，源谱数据不变。长音跨小节拆分并连延音线；空隙填显示休止，和弦保留所有音高。复杂复调共用谱干 / 和弦时会提示，合并显示的重叠同音不改变分析目标。

`renderNotation(container, score, options)` 生成自适应 SVG 高低音谱表，返回 `setProgress(absoluteQuarterBeat, {follow})`、`selectNote(id)` 和 `destroy()`。可设显示缩放、小节范围、指法、音名及目标手别。DOM 点击通过音符 ID 回调，不以页面字符猜音高。ResizeObserver 负责宽度变化重排，结束使用时销毁观察器。

编辑器以四分 / 八分 / 十六分网格添加音符，支持左右手、和弦、休止、时值、指法、键盘微调、拖动、复制小节及 60 步撤销 / 重做。修改保存为新副本，最后经过 `normalizeScore` 校验。谱面错误不会被当成可正常保存的非法目标数据。

## 实时输入与采集

`MidiInput` 监听 Web MIDI Note On / Off，不请求 SysEx；用户点击连接后才请求设备权限。它把数据转换为：

```js
{
  type: 'on',             // 'on' | 'off'
  pitch: 60,
  velocity: 80,
  at: performance.now()   // 与采集一致的单调时钟，毫秒
}
```

应用增加 `source: 'midi' | 'virtual' | 'demo'` 后统一采集。记录事件使用 `{pitch, time, duration, velocity}`，`time` / `duration` 是相对于倒数完成时刻的秒数。倒数期间不计分。实琴输入不额外合成同音以免重音；屏幕输入、示范和回听通过 Web Audio 发声。

没有收到音符的采集不产生分数，历史显示为空录制，不计入个人次数/时长统计。每遍最多 8192 个按键事件。取消倒数不生成记录。主动结束、设备断线、后台切换或输入上限会结束本次采集；未抬起的键在结束时补齐时间。硬件输入按音高管理，当前不实现按 MIDI 通道分离同音持键或完整踏板录音。

Mac / Windows 使用桌面 Chrome 或 Edge 与 USB-MIDI。只有音频的内录线没有琴键事件，需要另建音频采集、起音检测和多音识别层。当前没有该层。手机界面可以使用屏幕键盘，但未验证手机实琴接线。

## 分析口径

`analyze(timedNotes, events, bpm, {interrupted})` 独立于 DOM、设备和存储。将目标同时起音归组，将实际相近起音归组，对和弦中的相同音高优先匹配，避免同一和弦按键先后改变识别结果。

组间采用稀疏加权序列对齐，通过 Fenwick tree 保存最佳路径；不分配 `目标音数 × 演奏音数` 的完整矩阵。时间窗口与候选数量上限限制异常密集事件的工作量。配对成本结合音高与起音偏差，未配对目标为漏音，未配对演奏为多音。

准确度为 `正确音数 / (目标音数 + 多音数)`。节奏贴合度按已对齐音的偏差是否落在 `max(0.12 秒, 60 / bpm × 0.22)` 内计算；少于 3 个对齐音不计算节奏。原始偏差与平均偏差仍可定位具体小节和音符。

提前结束仍以所选整段作为分母；未演奏的尾段同样列为漏音，界面会说明该口径。未完成尾段尚未作为独立类别统计。当前容差按所选基础 BPM 设置，并非按每个 tempoMap 段动态改变容差。没有自由速度追随、整体起弹偏移抵消或设备延迟校准。复杂琶音、极大时间漂移或交叉手的结果需要人工核对。

分析不推断手指、手型、力度控制、踏板与音乐性。“AI 教练”是产品方向；当前算法没有大语言模型或训练模型。

## 数据存储与迁移

数据库名 `banpai-studio-v2`，IndexedDB 版本 2：

| 对象仓库 | keyPath | 数据 |
| --- | --- | --- |
| `scores` | `id` | 自定义谱子 |
| `takes` | `id` | 最近 100 条详细演奏，完整曲谱与音符快照 |
| `activities` | `id` | 长期演奏摘要与手动补记 |
| `settings` | `id` | `learning`：目标、等级清单、曲目计划、记录起点 |

个人曲谱最多 100 首；每条 take 携带当次曲谱的完整快照及 options，删除曲谱不破坏既有记录。应用保留最近 100 次练习；模拟记录有来源标识，统计默认分离。0.1 的 `banpai-practices-v1` localStorage 不作为新版主存储，符合条件的旧记录会一次性迁入 takes，ID 加 legacy- 前缀并标记 legacy:true；banpai-v1-migrated 为迁移标志，原 localStorage 保存至清空历史。旧记录仍可能基于旧模型，不能假定所有历史反馈的分析口径完全一致。

导出协议：曲库备份为 `{schemaVersion:2,type:'banpai-library',exportedAt,scores:[完整曲谱...]}`，导入上限 64 MB / 100 首；单曲 JSON 仍限 2 MB。单次练习为 `{schemaVersion:2,type:'banpai-take',id,score,options,bpm,source,date,events,elapsed,interrupted,reason,analysis}`。详细演奏音符没有批量恢复入口；长期摘要由独立进度备份恢复。

IndexedDB 按网站来源与浏览器配置隔离，部署网站与本地地址之间没有自动同步。源码压缩包不含个人 IndexedDB。迁移需分别备份曲库、成长进度，并另外导出需要保留完整音符的练习 JSON。新站点先导入曲谱并恢复进度；单次练习 JSON 仍是离线留存资料。

存储失败时需提示用户导出保留；不能把当前内存仍可显示解释为已持久保存。代码不向服务器上传琴键事件；平台登录、静态资源请求和基础访问日志仍存在。


## 长期摘要、学习计划与进度备份

数据库从版本 1 原位升到版本 2，只创建缺失仓库，不删除曲谱或练习。初始化先为仍有完整快照的旧记录补建摘要，然后才裁剪最近 100 条详细记录。`saveTake(take, activity)` 通过同一个 IndexedDB 事务保存两者；只有事务成功后更新界面成长统计。清空练习记录同时清空 `takes` 和 `activities`，保留曲谱、等级清单和计划，操作前明确说明并确认。

`take.startedAt` 在倒数开始时由单调时钟目标时间换算成真实开始 ISO 时间，结束缓冲不挪动其日期。旧记录缺少开始时间时按结束时间减采集时长估算。日期按采集开始时的本机日历日保存；跨午夜的一遍归开始日，不拆到两天。以后切换时区不重新分配已存日期。

`activities` 的两类记录：

- `capture`：`id=take:<take.id>`，来源为 `midi` / `virtual`，保存曲谱内容标识、采集范围、声部、BPM、日期与秒数、是否完整结束、目标/正确/多音/匹配/合拍计数以及 `analysisVersion=banpai-onset-1`。不再依赖详细快照的生命周期；模拟和空录制不建摘要。
- `manual`：独立 ID、日期、1–360 分钟、学习阶段、分类、名称与笔记。只有投入时长，没有伪造的音符成绩。

图表对活动 ID 去重，排除未来日期。完整采集片段准确率为 `Σ正确 / Σ(目标 + 多音)`；提前结束只贡献已记录时长。无准确率数据保持 `null`。连续天数允许今天尚未练时从昨天起算；周目标按周一至今天，最长连续和累计日数按全部摘要。

学习清单每级 12 项，完成比例只按本人记录的 `done / 12`。根据老师反馈记录仍是用户自行填写，不是教师账号签名。模型不会根据音符分数自动完成手型、表达或听觉等能力。

曲目计划的稳定证据检查：同内容指纹、同声部、全曲、BPM 不低于目标、分析版本一致、目标至少 8 音；近 30 天最近 3 条唯一完整记录均满足准确率 ≥95%、起音合拍率 ≥85%，且至少来自 2 天。时间按解析后的绝对时间排序。指纹不含标题、ID 或指法，包含音符、时值、手别、调拍与变速信息。它是本机音乐内容标识，非密码学认证。导入后新曲谱 ID 不同也可汇总同一内容的演奏；打开计划时先找 ID+内容匹配，再找唯一内容匹配，歧义时要求重新关联。

进度备份协议 `{type:'banpai-progress',schemaVersion:1,exportedAt,learning,activities}`，导入与导出一致限制 128 MB / 200000 条。严格验证日期、数值、整数小节/等级、任务 ID、时间顺序及重复记录。恢复采用原子事务：设置/清单/计划使用备份版本，摘要只新增本机尚无的 ID；重复 ID 保留本机内容。互斥锁防止两个恢复对话并行，确认后重新核算新增记录。存储加载失败时不允许导出看似完整的空备份。

`progress-model.mjs` 不依赖 DOM 或 IndexedDB，可用于未来手机端、服务端汇总与版本迁移。持久层不做跨设备同步；任何云端同步都还需要明确的权限、冲突与删除规则。

## 可继续扩展的位置

- 手机、蓝牙或其他输入：新增适配层，输出相同琴键事件；每个平台独立验证权限与计时。
- 音频内录 / 麦克风：增加音频采集、单音 / 多音识别、起音检测与置信度，再转换成统一事件；需要延迟评估。
- MusicXML、照片识谱：先转换为 v2 或扩展版本，明确保留 / 丢弃哪些声部和记谱语义。
- 智能讲解：以可核验的逐音结果为事实输入；云端授权、失败回退与隐私另行设计。
- 云端同步：建立用户、权限、版本与冲突解决；浏览器本地存档不能直接变成多人共享数据库。
- 专业谱面：扩展多声部、装饰、反复、表情、指法版本管理等音乐语义，不能仅修改显示样式。

## 验证范围

`npm test` 可脱离真实电钢琴运行，覆盖格式与边界、JSON / MIDI 往返、变速 / 休止 / 区间、和弦与错漏音、输入状态、曲库数据与谱面准备。浏览器检查用于验证导入、编辑、采集、反馈、记录和不同尺寸布局。

实体 USB、Mac / 琴型驱动、实际 MIDI 权限、真实音频延迟及手机接线不由模拟测试证明。当前仍保留实体电钢琴待接线验收这一边界。
