# 内置曲谱来源与版本说明

复核日期：2026-09-21。曲谱数据位于 `public/repertoire.mjs`，使用 schemaVersion 2，所有 `beat` 与 `duration` 均以四分音符一拍计。左右手按演奏手分组，不以高低音区猜测。

## 0.4 分级曲库与采样

2026-09-22 新增分级曲库 100 首，逐首目录见 [REPERTOIRE.md](./REPERTOIRE.md)。原有 9 条保留在旧版区，不参与每级计数。

- 1 级：10 首公版旋律入门编配，包括《欢乐颂》主题、《小星星》《两只老虎》《玛丽有只小羊》等。代码在 `public/primer-songs.mjs`，编配数据使用 [CC0](https://creativecommons.org/publicdomain/zero/1.0/)。移调至 C 大调、只保留右手旋律、以四分音符为拍组织练习小节。标注主题／副歌的条目是节选，不声称为完整钢琴作品或指定考级版本。
- 2–10 级：90 首 Mutopia 转录。保留来源 MIDI 的所有音高、起音、时值、变速；明确按上下谱表轨道分手，没有按音高猜分手。MIDI 的反复与装饰未必等于印刷谱全部标记；网站重新生成五线谱，复调共用符干和延音线，细微时值按显示网格近似，未还原原版指法、力度、踏板和声部记谱。
- 本地保存来源 MIDI、LilyPond 文件及 `source.json`，详见 `research/repertoire/`。逐首转录者、出处、底本、许可、SHA-256、手别轨道和导入提示记录在 [来源清单](./research/REPERTOIRE-MANIFEST.json)。构建脚本核对哈希和许可，再生成曲库；90 首均逐事件验证未改变源 MIDI 的音高／时间／手别。
- 各条转录数据与其派生数据**分别沿用清单所列许可**，包括 Public Domain、[CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/)、[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)、[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)、[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)、[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。保留署名、来源、同许可共享义务与改动说明；不将这些许可扩大到无关程序代码。

钢琴采样：**Salamander Grand Piano，Alexander Holm，Yamaha C5**，来自 [Tonejs/audio 的 salamander 目录](https://github.com/Tonejs/audio/tree/master/salamander)，许可 [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)。本项目取 30 个 MP3 单力度层样本，本地文件与原始 README 存于 `public/audio/salamander/`；`manifest.json` 记录下载地址、大小与 SHA-256。软件通过临近样本变调、滤波、音量与释放包络播放，未复制完整 SFZ、多力度层、踏板噪声或共鸣系统。

分级参考中央音乐学院第四套的等级框架，但上述条目的官方教材归属未逐首核实，全部采用通用参考难度；见 [LEARNING-ROADMAP.md](./LEARNING-ROADMAP.md)。

## 旧版基础教材内容

| 条目 ID | 收录范围 | 拍号 | 单遍小节数 | 总拍数 | 音符数（双手合计） |
| --- | --- | --- | ---: | ---: | ---: |
| `hanon-1` | 哈农第 1 条，全部音符，反复不展开 | 2/4 | 30 | 60 | 466 |
| `hanon-2` | 哈农第 2 条，全部音符，反复不展开 | 2/4 | 29 | 58 | 450 |
| `czerny-599-1` | 车尔尼 Op.599 第 1 条，两个反复段各弹一遍 | 4/4 | 16 | 64 | 51 |
| `czerny-599-2` | 车尔尼 Op.599 第 2 条，第 1–8 小节节选 | 4/4 | 8 | 32 | 28 |

这些是所标版本的音符转录。网站为练习重新排版，并非扫描谱的完整复刻；本版没有收录哈农 60 条或车尔尼 599 全册。节选和不展开反复均在曲目标题及来源中明示。

## 哈农第 1、2 条

- 作品：Charles-Louis Hanon，*The Virtuoso Pianist, Part I*。
- 转录依据：[Mutopia Project 曲谱与文件目录](https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/)。
- [原转录 PDF](https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/virtuoso-pianist-pt1-a4.pdf)，第 2、3 页。
- [第 1 条 LilyPond 源码](https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/virtuoso-pianist-pt1-lys/hanon01.ily)。
- [第 2 条 LilyPond 源码](https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/virtuoso-pianist-pt1-lys/hanon02.ily)。
- [版本头信息](https://www.mutopiaproject.org/ftp/HanonCL/virtuoso-pianist-pt1/virtuoso-pianist-pt1-lys/hanon-book.ly)标注底本为 Schirmer, 1900；转录者 **Steve Taylor 和 Javier Ruiz-Alma**；版本标识 **Mutopia-2015/07/23-2037**。
- 原转录许可为 [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/)。本项目中这两个条目的改编曲谱数据亦以 **CC BY-SA 4.0** 提供。转载这两个条目时须保留上述署名、来源、许可证链接与改动说明。这里的许可声明针对该转录及其数据改编，不声称对公版作曲本身增加权利，也不将其他程序模块一并声明为此许可。

改动说明：转为音高、起拍和时值数据；反复仅保留一遍；省略原书文字、表情与指法；原转录中的跨谱表符干记谱按左右手分别显示。没有移调，没有把十六分音符改成八分音符。第 1 条和第 2 条右手起音均为 **C3（48）**、左手为 **C2（36）**。末尾二分音符保留。默认四分音符速度 60 与所用第 1 条谱头的起始速度一致。

复核方法：实际下载 PDF，渲染第 2、3 页检查起音、上行/下行交界、末音、八度与拍号；另用独立的 LilyPond 相对音高解析逐音比对程序生成数据。第 1 条右手 233 音、第 2 条右手 225 音全部相符，左手在此两条中为右手低一个八度，已对照原转录检查。

## 车尔尼 Op.599 第 1 条及第 2 条节选

- 作品：Carl Czerny，*Practical Method for Beginners on the Pianoforte*, Op.599。
- 底本：**Giuseppe Buonamici 校订、指法版；Schirmer, 1893，版号 11038**。本次使用的是该版的再版扫描；扫描封面有现代 ISBN，没有将封面再版日期误写为 1893。
- [IMSLP 作品及版本目录](https://imslp.org/wiki/Practical_Exercises_for_Beginners,_Op.599_(Czerny,_Carl))列出该版 #105466，标注 **Public Domain**。
- 实际读取：[Internet Archive 收藏页](https://archive.org/details/imslp-exercises-for-beginners-op599-czerny-carl)。
- [实际下载的扫描 PDF](https://archive.org/download/imslp-exercises-for-beginners-op599-czerny-carl/PMLP08821-Practical_Method_for_Beginners.pdf)，文件名 `PMLP08821-Practical_Method_for_Beginners.pdf`，PDF 第 3 页／印刷页码 3。

复核方法：先检查扫描封面的作曲者、作品号和 Buonamici 署名，再将第 3 页以 3800 像素长边渲染，分区域核对两个练习的音符位置、谱号、时值与指法，按小节手工转录。音高和时值不是根据记忆、试听或自动生成的“仿教材”旋律填入的。

特别注意：这两个条目的原谱上下谱表均使用 **高音谱号**。第 1 条右手从 C5（72）、左手从 C4（60）开始；不能因左手身份而把原谱误读成低音谱号。若界面把左手重排到低音谱号，音高仍须保持。第 2 条开头为右手 G5–C6、B5–A5，左手 E4–C4、F4–C4。本版保留该版已核对的指法，不声称这些编辑指法是作曲家原稿。

改动说明：保留音高、时值和已核实指法；第 1 条两个反复段各弹一遍；第 2 条仅截取首行 8 小节。软件默认速度 80 是测试版的练习速度设置，不是声称原书含此节拍器标记。

### 第 1 条逐小节音高校对表

一格内一个音为全音符（4 拍），两个音为二分音符（各 2 拍）。中央 C = C4 = MIDI 60。

| 小节 | 右手 | 左手 |
| --- | --- | --- |
| 1 | C5 | C4 E4 |
| 2 | D5 E5 | G4 |
| 3 | C5 | C4 E4 |
| 4 | D5 E5 | G4 |
| 5 | C5 E5 | C4 |
| 6 | G5 F5 | E4 F4 |
| 7 | E5 D5 | G4 F4 |
| 8 | C5 | E4 |
| 9 | D5 E5 | G4 |
| 10 | F5 D5 | G4 |
| 11 | E5 F5 | C4 D4 |
| 12 | G5 E5 | E4 C4 |
| 13 | D5 E5 | G4 |
| 14 | F5 D5 | G4 |
| 15 | C5 E5 | E4 G4 |
| 16 | C5 | C4 |

## 其他入门内容

- `joy`：保留原测试版《欢乐颂》右手旋律第一句及其节奏编排；不是贝多芬作品的完整钢琴原谱。
- `star`：保留原测试版《小星星》开头两句右手旋律；不是完整曲谱。
- `steps`：保留半拍原有原创《五指小步走》。
- `five-fingers-both`：为半拍编写的双手五指同步练习，非哈农／车尔尼原谱。
- `c-scale`：通用 C 大调音阶的入门节奏编排，非哈农音阶章节的转录。

## 源文件校验值

以下 SHA-256 用于以后确认所核对的是同一份下载文件；应用运行不依赖在线下载这些 PDF。

| 文件 | SHA-256 |
| --- | --- |
| `virtuoso-pianist-pt1-a4.pdf` | `215ee4c3926107d77dc0cef244c3b2290c7f5614b582b9c3876bd1b724af4959` |
| `hanon01.ily` | `1ae96a5a0209cbad0087f159056157b9eaa2db65fbd2d0776437478829194c94` |
| `hanon02.ily` | `4ad9998b9ad32e36d5226fa34c2dbc8a8e420ac6764f9ca377c8f59c406ca083` |
| `PMLP08821-Practical_Method_for_Beginners.pdf` | `a24a9d33d16e435b7a56e7d1e42b2da5b26bb7b6479439f7eaca74f8db0a1b03` |

旧版 9 条均检查了唯一音符 ID、钢琴音域、非负起拍、正时值、曲终范围、左右手分类与最大 4096 音符／256 小节限制。曲谱中没有通过填充空音符伪造完整曲目。
