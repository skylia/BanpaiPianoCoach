# 真人演奏来源与核对记录

核对日期：2026-09-26–27。曲谱版权、演奏录音版权与应用代码 MIT 许可分开处理。只有明确允许分发的音频保存在 `public/audio/demos/`；其他演奏通过已核对的哔哩哔哩原页面提供，未下载、转码或再分发。

## 收录范围

- 分级曲库为 103 首：1–10 级每级至少 10 首，3 级另含克列门蒂三个乐章。
- 55 个独立音频文件覆盖 57 首，其中克列门蒂的一份完整录音分别定位三个乐章。音频保持原文件字节，实际为 ISO BMFF 的文件更正扩展名为 `.m4a`。
- 另有 46 首使用哔哩哔哩单曲视频或已核对的曲集章节：一级 2 首、二至十级 44 首。103 首均有对应真人演奏来源，没有把 MIDI、谱页播放器或未经确认的合成演奏标为真人录音。
- 作品、演奏者、完整性、许可分别核对；录音可能采用不同反复、装饰音或校订版本。所有 `mapping` 均为空，尚未声称逐小节或逐音跟谱同步。
- 基本功训练继续使用合成示范。旧入门旋律不再出现在分级入口，但保留 ID 与谱面以读取旧记录。

## 内置音频

逐份作品、作者、文件、许可证链接、SHA-256 在 [`public/audio/demos/NOTICE.md`](../../public/audio/demos/NOTICE.md)；原批次下载地址、字节数与文件格式在 [`DOWNLOAD-AUDIT.json`](DOWNLOAD-AUDIT.json)，新增一级来源在 [`research/primer/source.json`](../primer/source.json)。原有克列门蒂来源为 [`clementi-kolodin.json`](clementi-kolodin.json)。

| 作品 | 演奏者 / 发布方 | 录音许可 |
| --- | --- | --- |
| 舒曼 Op.68 第 1、5、8、10 首 | Mississippi College Piano Pedagogy | CC BY-SA 4.0 |
| 舒曼 Op.68 第 14 首 | Luis Kolodin | CC BY-SA 4.0 |
| 布格缪勒 Op.100 第 2、6、15 首 | Mississippi College Piano Pedagogy | CC BY-SA 4.0 |
| 布格缪勒 Op.100 第 1、3、18 首 | Luis Kolodin | CC BY-SA 4.0 |
| 巴赫二部创意曲第 1、4、8、13 首 | Luis Kolodin | CC BY-SA 4.0 |
| 巴赫三部创意曲全部 15 首 | Randolph Hokanson / Pandora Records / Al Goldstein Archive | EFF Open Audio License |
| 肖邦 Op.28 第 3、5、10、12、14、17、22、23、24 首 | Ivan Ilić；录音 Judith Carpentier-Dupont，巴黎 2005 年 10 月 | CC BY 3.0 |
| 肖邦 Op.10 第 1、2、5、9、12 首 | Chiara Bertoglio | CC BY 3.0 |
| 肖邦 Op.25 第 1、2 首 | Martha Goldstein / Pandora Records / Al Goldstein Archive | EFF Open Audio License |
| 克列门蒂 Op.36 No.1 三个乐章 | Luis Kolodin，2021 | CC BY-SA 4.0 |
| 贝多芬 WoO 86、J. C. Bach W.A 22 | Mississippi College Piano Pedagogy | CC BY-SA 4.0 |
| 莫扎特 K.2、K.3 | Jewgeni Smirnow，2024；真人弹奏数码键盘 | CC BY 4.0 |
| 古尔利特 Op.117 No.13、Krieger a小调小步舞曲、Türk《芭蕾舞》《猎号与回声》 | Mississippi College Piano Pedagogy，2019 | CC BY-NC-SA 4.0，含非商用条件 |

许可原文：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)、[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)、[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)、[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)、[EFF Open Audio License](https://imslp.org/wiki/IMSLP:EFF_Open_Audio_License)。EFF 文件署名保留 `(O)` 标记及原发布方。含 NC 的录音只按相应非商用许可使用和再分发，不随应用代码转为 MIT。所有这些录音均以独立文件聚合，未混音成衍生作品；播放器变速不修改分发文件。

Türk《芭蕾舞》的现代录音编号18与1797版第19首不同，已按弱起与双手开头音高核对同曲；依据保存在 [`turk-ballet-identity.json`](turk-ballet-identity.json)。这是原谱与频谱核对，不是老师试听或逐音演奏评价。

## 哔哩哔哩资源

应用的外部演奏资源使用哔哩哔哩。外部演奏全部指向具体哔哩哔哩作品或已核对的分P；它们未取得本项目重新分发音视频的许可，因此不下载、不截取复制、不当作项目 MIT 资源。元数据将钢琴演奏者和站内上传者分开标明；“能在原平台播放”不表示本项目拥有这份录音。

- **布格缪勒 Op.100**：12 首使用 [爱荷华大学钢琴教育项目25首合集](https://www.bilibili.com/video/BV1rK4y187gL/)。曲号与分P一一对应，已核对全部分P标题，浏览器在P4实际显示真人双手演奏Steinway钢琴。上传者 JeremyWeasley；来源说明为大学 UIPianoPed 项目。项目包含不同钢琴家，未把整个合集错误署名为同一个人；当前按项目署名。
- **舒曼 Op.68**：11 首使用 [Jörg Demus 43首分曲录音](https://www.bilibili.com/video/BV1Gb411Y766/)，上传者 ChochoAngel。浏览器核对页面演奏者声明和全部所用曲号/标题；所用分P与作品曲号相同。
- **巴赫二部创意曲**：10 首使用 [吴元讲解与示范合集](https://www.bilibili.com/video/BV1o7411b7ef/)中的独立“示范”分P，避开讲解页；上传者孤独的天才少女。该合集第七首示范只有26秒，未用作完整演奏；第七首改用 [淇淇的完整1分56秒演奏](https://www.bilibili.com/video/BV1x8411R7yM/)，指导教师徐念枷，2022-10-23录制。浏览器已核对标题并起播。
- **肖邦 Op.28 第8首**：使用 [李名强1960年肖邦比赛录音第12分P](https://www.bilibili.com/video/BV1fH4y1Z7hS/?p=12)，标题明确为 Prelude Op.28 No.8，时长1分47秒。
- **肖邦 Op.28 第16首**：使用 [Ivo Pogorelich 的两版本对照](https://www.bilibili.com/video/BV1rj411R7of/)，源页注明00:00为1990年DG录音，01:06为1988年现场录音；明确提示原页会继续播放第二个版本。


- **肖邦 Op.28 第18、19首**：使用 [Éric Heidsieck 1972年录音合集](https://www.bilibili.com/video/BV1QG4y1a7fq/?p=1&t=1707)，按原页面发布的28:27与29:23定位。浏览器实测时间参数能从目标起点播放；原平台继续播放后续曲目，不会自动在片段末停止，平台可能要求登录。
- **安娜·玛格达莱娜曲集六首**：Anh.113和120使用 Daniil Trifonov 的2021年DG录音，页面明确署名演奏、制作、录音和母带人员；Anh.126使用沈文裕本人发布的完整演奏；Anh.114、115、116使用新爱琴自发布的独立演奏示范。六首均核对精确BWV编号和时长，浏览器确认起播；新爱琴三首和沈文裕视频可见真人双手演奏。Anh.116片头署名陈若涵，其余新爱琴两首未核实个人姓名，按教学机构署名，没有猜测。
- **一级两首外部示范**：古尔利特《狩猎》Op.117 No.15 使用 [John Maul 的 Pianist 教师演奏与讲解](https://www.bilibili.com/video/BV1pS4y1b7wc/)，真人弹奏 Roland LX-15 数码钢琴，开场演奏后进入教学；巴赫 BWV514 使用 [Piano with Beth 的独立钢琴示范](https://www.bilibili.com/video/BV1tf4y1s7uw/)。作品编号、演奏者声明和真人键盘画面核对记录见 [`primer-bilibili-verification.json`](primer-bilibili-verification.json)。BWV514 的钢琴和声实现可能与应用的历史旋律及低音版本不同；不据此要求逐音模仿。

逐项来源记录在 [`BILIBILI-AUDIT.json`](BILIBILI-AUDIT.json)。默认通过核验的原站 URL 和 `?p=` 参数定位；未验证的嵌入地址不写入目录。外站的清晰度登录要求、网络条件和资源下架由平台决定。页面可用性、真实演奏者来源及作品标识均不同于逐音试听验收。

## 未采用的候选

- IMSLP #110303：写作 Op.28 第 18 首，却标为 C 小调（原作 F 小调）。未把这个调性矛盾当作已确认，改用曲号与F小调明确对应的外部真人录音。候选音频已从公开目录移除，仅保留审计记录。
- Alan Chan 的 Gurlitt Op.117 全集：画面为谱页，未找到足以确认真人录音的演奏者声明，因此不作为真人示范；它只用于最初的曲号/难度资料检索。
- 古尔利特 Op.117 No.15 的20秒成人刷谱候选：上传者说明仍有双手配合问题，未将其作为正式演奏示范；改用作品身份经 Pianist 官方目录确认的 John Maul 教师示范。
- 未将仅标“公版作品”却没有确认录音许可的商业录音打包分发；商业录音如被采用，只提供已核对的原平台页面。未将羽管键琴版本冒称本应用的钢琴录音。

## 验证边界

`tests/demo-coverage.test.mjs` 检查每首当前乐曲有人类演奏来源、各级数量、文件字节哈希、外部精确 BVID/分P、无旧平台入口、章节边界、旧曲保留及克列门蒂乐章定位。浏览器媒体解码与起播检查由 `tests/browser-demos.cjs` 记录。资源溯源和解码不等于老师逐音试听验收；此处没有声称完成听感质量或各校订版本逐音一致性验收。
