# 哈农基本功曲库

当前发布 **60 个编号、228 个可练习入口**。多调音阶、琶音、不同指法和长篇震音按原谱调性或段落拆开，因此 228 不是 228 首作品。全部入口默认 `category: technique`、`evaluationProfile: technique`，使用固定节拍评价和合成音符示范。

| 编号 | 发布入口 | 数据来源与组织 |
|---|---:|---|
| 1–20 | 20 | Mutopia 原 RH/LH 声部，普通反复单遍 |
| 21–38 | 19 | Schirmer 印刷第22–49页；38条同向、反向分别进入 |
| 39–43 | 70 | 全部原谱调性与变式，见 scales-transcription.md |
| 44–55 | 63 | 同音、双音、八度、指法与原谱各调，保留独立左手声部 |
| 56–57 | 48 | 每条24个连续调性段，末调含全条终止和弦 |
| 58–59 | 2 | 持续声部及明确写出的交替音完整保留，见 sustained-transcription.md |
| 60 | 6 | 印刷第110–115页连续六段，见 tremolo-transcription.md |

## 来源与许可

- **第1–20条**：Steve Taylor / Javier Ruiz-Alma，Mutopia-2015/07/23-2037，底本 Schirmer 1900。[Mutopia 来源](https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/)，[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。本仓库保存原 `.ily`、`.ly` 和 `.mid`；保留原文件版权声明。转换后的这些曲谱数据继续采用 CC BY-SA 4.0，不因项目代码采用 MIT 而改为 MIT。改动包括：提取双手声部、转换为应用 JSON 格式、保留指法、将初始练习速度设置为60 BPM。
- **第21–60条**：独立按 C. L. Hanon, *The Virtuoso Pianist in Sixty Exercises*，Schirmer，1900 的公版扫描转录。[原始扫描](https://s9.imslp.org/files/imglnks/usimg/1/1b/IMSLP91547-PMLP03129-Hanon_Final.pdf)，本地为 `Schirmer-1900-complete.pdf`，SHA-256 `2387c55d95b6c81b3594633b63ba0525223ceb8602dfed047908edc973808139`。新录入音符数据以 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) 提供；生成程序代码为 MIT。PDF页码比印刷页码大1。
- 第60条最后一页一个模糊高音和弦另参照 Ricordi plate E.R.381a 第119页（扫描PDF第120页）视读，具体核对点和链接保存在 `tremolo-transcription.md`。该扫描只用于比对原始音高，没有复制页面、现代排版或附加编辑内容进应用。

每个应用入口保留来源链接、具体编号/页码、反复处理说明；`MANIFEST.json` 记录来源文件 SHA-256、音符数、小节数。`complete` 表示该入口所标的原谱段落已转录，**并不表示整册以一个入口演奏、已获教师验收或用户已经掌握**。

## 可复现构建与验证

在项目根目录依次运行：

```sh
node scripts/transcribe-hanon-scales.mjs
node scripts/build-hanon-advanced.mjs
node scripts/build-hanon-final.mjs
node scripts/transcribe-hanon-sustained.mjs
node scripts/build-hanon.mjs
node --test tests/hanon-*.test.mjs
```

第21–38条直接由 `public/hanon-transcendent.mjs` 生成。第60条由 `scripts/hanon-tremolo-{outer,middle,closing}.mjs` 汇入主曲库。主构建逐项比较第1–20条原 MIDI 的音高、起音与时值，拒绝缺失任何编号或第60条任何页面的输出。

测试覆盖生成一致性、所有入口/编号、来源指纹、音域、时值、手别、容量限制及已记录的源谱关键点。这是结构与源谱转录验证；尚未进行整册教师逐音校订或真实钢琴演奏验收。指法只在已转录之处提供；力度、踏板、8va 原版版式和详细文字教法应同时参阅源谱，合成示范不声称复制教师演奏。

## 兼容历史

旧入门旋律和旧哈农入口的历史快照由 `LEGACY_REPERTOIRE` 与本地保存的谱面维持可读；本次没有清理练习历史。第1、2条仍使用原 `hanon-1`、`hanon-2` 标识。谱面指纹变化会区分旧转录和新版，不把旧版本成绩直接当作新谱稳定掌握证据。
