# 一级混合原作曲库与历史兼容

当前一级入口收录十首完整原作，保留原调、音区和双手内容。难度依据逐曲记录在 `source.json` 的 `gradeEvidence` 与 `gradeUrl` 中，包括 RCM 2022 官方大纲的 Level 1 条目、原录音教学项目的 Level 1 分类，以及 Pianist 的初级教学曲目。古尔利特 Op.117 No.13 则依据初学教材定位、24 小节的双手交替和简单双音，由本应用选为通用参考一级；未声称该曲得到考试机构一级认证。半拍使用通用参考分级，不声称所有谱本都是某考试的指定版本。

| 当前作品 | 所据谱本 | 真人示范 |
| --- | --- | --- |
| 古尔利特《清晨的问候》Op.117 No.13 | Schirmer 1895 历史公版 | Mississippi College Piano Pedagogy，内置录音 |
| 古尔利特《狩猎》Op.117 No.15 | Schirmer 1895 历史公版 | John Maul，哔哩哔哩原平台演奏与教学 |
| 蒂尔克《猎号与回声》 | 1797 年第二版 No.24，现代教学编号 No.23 | Mississippi College Piano Pedagogy，内置录音 |
| 蒂尔克《芭蕾舞》 | 1797 年第二版 No.19，现代教学编号 No.18 | Mississippi College Piano Pedagogy，内置录音 |
| 贝多芬降 E 大调苏格兰舞曲 WoO 86 | Breitkopf 贝多芬全集历史公版 | Mississippi College Piano Pedagogy，内置录音 |
| 莫扎特 F 大调小步舞曲 K.2 | Breitkopf 1878 历史公版 | Jewgeni Smirnow，数码键盘真人录音 |
| 莫扎特降 B 大调快板 K.3 | Breitkopf 1878 历史公版 | Jewgeni Smirnow，数码键盘真人录音 |
| 克里格 a 小调小步舞曲 | Klaus Heidtmann 2022，CC BY-SA 4.0 | Mississippi College Piano Pedagogy，内置录音 |
| J. C. 巴赫 F 大调咏叹调 W.A 22 / BWV Anh.131 | RSB 2012，CC BY 3.0 | Mississippi College Piano Pedagogy，内置录音 |
| J. S. 巴赫圣咏 BWV 514 | Bach-Gesellschaft 1894 历史公版 | Piano with Beth，哔哩哔哩独立演奏 |

## 转录与许可

`scripts/primer-*.mjs` 保存各曲按原谱读出的科学音高、以四分音符为单位的时值、左右手及来源。`scripts/build-primer.mjs` 检查声部每小节拍数、两声部总长、延音关系、源 PDF 和音频哈希，再生成 `public/primer-repertoire.mjs`。原文件在本目录，下载出处、版本、SHA-256 与逐曲许可在 `source.json`。

历史公版谱本的独立机器可读转录以 CC0 提供；克里格条目沿用 Klaus Heidtmann 版本的 CC BY-SA 4.0，W.A 22 沿用 RSB 版本的 CC BY 3.0，并保留编辑者署名。不能把这两首机器可读谱面统一标成 CC0。曲谱许可、真人录音许可与应用代码 MIT 许可分别处理。

标准音符示范按转录数据播放；真人录音保留演奏者自己的反复、装饰音和乐句处理，不作为逐毫秒评分模板。谱面省略部分指法、力度、断连奏或原始声部排版；具体范围写在各曲 `source.note`。默认 BPM 是练习设置。

## 版本与显示边界

- 各段反复通常只演奏一遍；WoO 86 采用两个第二结尾，避免单遍演奏停在要求返回的第一结尾。
- 弱起前以休止补足应用的首小节；K.3、W.A 22 和《芭蕾舞》的段际弱起与前段未满小节衔接，未插入额外停顿。因此显示小节号可能与原谱正拍小节号不同。
- K.2 的三连音保留精确 `1/3` 拍；克里格左手三个内声部长音与低音重新起奏保留重叠时值。
- K.3 和《芭蕾舞》的小音符倚音暂按短音分配实现，来源中明确这一限制。目前尚无独立倚音记谱和任意时值容差，不把固定分配称为所有正确演奏的唯一标准。
- BWV 514 采用历史原谱的旋律和低音两声部，按实际音高转换原女高音 C 谱号，不自动填充数字低音和弦；不保留歌词、低音数字和延长记号。Beth 的钢琴演奏版本可能补充和声，仅作为演绎参考。
- W.A 22 来源标题仍写 J. S. Bach / BWV Anh.131，应用采用现行 J. C. Bach / W.A 22 的作品署名。
- 《芭蕾舞》历史版 No.19 与现代编号 No.18 的对应，已通过源谱与真人录音开头音高核对；证据在 `../demos/turk-ballet-identity.json`。

## 真人录音

八首使用取得明确分发许可的内置 MP3，另两首使用已核对作品编号与真人弹奏画面的哔哩哔哩原页。完整署名、文件名、许可和哈希见 [`public/audio/demos/NOTICE.md`](../../public/audio/demos/NOTICE.md)，外部核验见 [`primer-bilibili-verification.json`](../demos/primer-bilibili-verification.json)。

《狩猎》的 John Maul 视频开场先演奏完整小曲，之后进入教学；不将全视频六分多钟都称为连续作品演奏，也未凭空指定精确自动截断边界。BWV 514 为 36 秒独立演奏。第三方视频只提供原平台播放，未复制或再分发；当前演奏目录没有 YouTube 入口。所有本组真人录音的 `mapping` 为空，未宣称小节或逐音跟谱同步。

## 历史兼容

上一版古尔利特 Op.117 第 1–10 首已退出当前一级入口。原十首的 ID、音符、元数据完整保存为 `PRIMER_ARCHIVE` 并加入 `LEGACY_REPERTOIRE`，旧计划与成绩仍可解析。完整快照回归测试锁定其内容不变；原来源和当时的外部视频核验资料保存在 `archive-source.json` 与 `performance-metadata.json`，仅作历史审计，未进入当前示范目录。更早的十首简化旋律也仍保留在兼容曲库。

重建：`node scripts/build-primer.mjs`；整体重建：`npm run repertoire:build`。测试覆盖来源文件、许可区分、古尔利特旧快照、三连音、弱起、重叠声部、特定升降号和标准输入跟弹。源谱核查、媒体解码与程序验证不代替老师对教学适用性、音乐表达及真人录音逐音版本差异的复核。
