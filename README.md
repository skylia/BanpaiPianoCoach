# 半拍 · Banpai Piano Coach

**连接你的琴，看着谱练，把每一次进步留在本机。**

半拍是一款本地优先的钢琴练习工具。通过 USB / MIDI 连接电钢琴，在浏览器中读谱、听示范、分段练习，查看错音与节奏反馈；也可以使用跟弹模式，弹对当前音符或和弦后再继续。

基础练习无需账号、API Key 或云端数据库。可选接入 DeepSeek，依据最近 7 / 30 天的练习摘要生成阶段点评，并导出为排版好的 PDF。

`v0.4` · `Node.js 22+` · `原生 JavaScript / ES Modules` · `项目代码 MIT`

[快速开始](#快速开始) · [主要功能](#主要功能) · [配置 AI 点评](#配置-ai-点评) · [数据与隐私](#数据与隐私) · [参与贡献](#参与贡献) · [许可证与致谢](#许可证与致谢)

## 主要功能

| 功能 | 当前支持 |
| --- | --- |
| 实琴输入 | Web MIDI 设备连接、输入反馈、左右手与和弦；无琴时可用屏幕琴键、电脑键盘或模拟练习 |
| 两种练习模式 | 固定速度练习连贯性；跟弹模式等你弹对，记录错误尝试、首次通过率与起音节奏 |
| 五线谱阅读 | 双手谱面、缩放、多行阅读、自动跟谱、专注看谱、音名与已有指法提示 |
| 示范与回听 | 本地三角钢琴采样、温暖音色、暂停与继续；播放来源已有的按键力度 |
| 分级曲库 | 1–10 级通用参考难度，每级至少 10 个条目，共 103 个；包含克列门蒂 Op.36 No.1 三个乐章 |
| 曲谱编辑 | 图形化增删和拖动音符、休止、撤销重做，JSON / MIDI 导入导出 |
| 成长记录 | 练习时长、连续天数、练习日历、手动补记、曲目计划与 120 项自主学习清单 |
| AI 阶段点评 | 先预览摘要再发送，生成 7 / 30 天报告，保存历史并导出 PDF 或 JSON |

当前版本面向电脑浏览器和日常练习。**曲库等级是通用参考难度，学习清单是自主记录，不代表官方考级曲目归属或能力认证。** 详细曲目与来源见 [分级曲库](./REPERTOIRE.md)、[学习路线](./LEARNING-ROADMAP.md) 和 [资源来源](./SOURCES.md)。

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/en/download) 22 或更新版本，安装时包含 npm。
- 桌面版 Chrome 或 Edge。实琴连接使用 Web MIDI，需要浏览器设备权限。
- 可选：支持 MIDI 的电钢琴或 MIDI 键盘，以及可传数据的 USB 连接线。

项目没有运行时 npm 依赖安装步骤。谱面组件、钢琴采样和 PDF 所需字体已包含在源码中。

### 下载并启动

```bash
git clone https://github.com/skylia/BanpaiPianoCoach.git
cd BanpaiPianoCoach
npm start
```

也可以在 GitHub 点击 **Code → Download ZIP**，解压后在含有 `package.json` 的目录打开终端，运行 `npm start`。

看到下面的提示后，用 Chrome 或 Edge 打开 [http://localhost:3000](http://localhost:3000)：

```text
Banpai: http://localhost:3000
```

练习时保持终端运行，可以最小化；停止服务按 **Ctrl+C**。下次进入项目目录，再运行 `npm start` 即可。不要直接双击 `public/index.html`。

### 不接琴也能体验

选择曲谱后，点击 **体验模拟练习**，可以先了解读谱和反馈流程。模拟记录单独标记，不计入个人成长统计。

也可以选择 **使用屏幕 / 电脑键盘**，再开始练习：

| 操作 | 按键 |
| --- | --- |
| 白键 | `A S D F G H J K` |
| 黑键 | `W E T Y U` |
| 切换八度 | `Z / X` |

鼠标和触屏也可以按页面琴键。双手和弦练习建议使用真实 MIDI 琴键。

### 连接电钢琴

1. 打开琴，用数据线将琴的 **USB TO HOST** 接口连接电脑。
2. 在 Chrome / Edge 中打开本地页面，点击 **连接琴键**，允许访问 MIDI 设备。
3. 弹一个音，确认页面出现输入音名和琴键高亮。
4. 选择曲目、声部、小节范围和速度，点击 **开始练习**。

琴的耳机口或 AUX OUT 输出的是音频，不能代替 MIDI 输入。设备接口和驱动要求以厂商说明为准。Web MIDI 需要安全上下文，普通局域网 HTTP 地址不能直接代替 `localhost`；详见 [Web MIDI 权限说明](https://developer.chrome.com/blog/web-midi-permission-prompt)。

## 怎样练习

### 固定速度与跟弹

| | 固定速度 | 跟弹 · 弹对再前进 |
| --- | --- | --- |
| 谱面推进 | 按所选速度连续前进 | 当前音符或完整和弦弹对后前进 |
| 弹错之后 | 继续演奏，结束后查看错漏音 | 记录一次错误尝试，停在当前组等待重试 |
| 节奏评价 | 起音与目标时间轴比较 | 首次尝试与上一组弹对的起音间距比较 |
| 适合用途 | 连贯演奏与稳定性验证 | 读谱、找音和困难片段练习 |

两种模式都支持分手、分段和循环。跟弹时单纯停顿不会增加错误次数，纠错等待单独记录；和弦需要在一次尝试中弹齐。跟弹与固定速度的统计分别展示，不混作同一种成绩。

**听示范和回听都支持暂停、继续、停止。** 示范根据来源 MIDI 已有的力度播放，源文件没有强弱变化时不会自动补造。它不替代专业演奏示范。

### 成长进度

练习时长、天数和演奏指标根据本机记录自动统计。等级圆环表示所选等级的**学习清单完成度**：每级 12 项，手动确认“已经掌握”的项目数除以 12。它不会因为多弹几遍就自动升级。

完整评分、曲目计划的复核条件、曲谱编辑与数据容量限制，参见 [使用手册](./docs/USER_GUIDE.md)。

## 配置 AI 点评

AI 是可选功能，使用你自己的 DeepSeek API Key；账户调用费用由 DeepSeek 收取。

首次配置时，将项目根目录的 `.env.example` 复制为 `.env`。已有 `.env` 时直接编辑，避免覆盖原配置。

macOS / Linux：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

在 `.env` 中填写：

```dotenv
DEEPSEEK_API_KEY=你的_API_Key
DEEPSEEK_MODEL=deepseek-flash
```

模型名称以账户可用的模型为准。保存后在终端按 **Ctrl+C** 停止，再运行 `npm start`；只刷新网页不会重新读取 Key。

进入 **成长进度 → AI 阶段报告**：

1. 选择近 7 天或近 30 天。
2. 点击 **整理本机练习数据**，查看将发送的摘要。
3. 点击 **发送摘要并生成报告**。
4. 打开新报告或历史报告，选择 **导出 PDF** 或 **备份报告数据（JSON）**。

PDF 使用 A4 中文排版，包含点评、练习数据、依据附页和页码，支持文字复制与打印。导出在本机完成，不会再次调用 AI。首次导出按需加载约 10 MB 的中文字体，日常练习不加载该字体。

## 数据与隐私

| 数据 | 保存或发送方式 |
| --- | --- |
| 个人曲谱、练习记录、成长进度 | 当前网站、当前浏览器的 IndexedDB |
| AI 报告 | 当前浏览器，最近 20 份；可单独导出 |
| API Key | 根目录 `.env`，由本机服务读取并用于 DeepSeek 请求鉴权 |
| AI 请求 | 仅手动生成时发送预览过的统计摘要，不包含原始录音、逐音事件或自由文字笔记 |
| PDF 导出 | 浏览器本机排版，不上传报告 |

项目没有云端账号数据库或跨设备同步。**换浏览器、换端口、换域名或清除网站数据后，原进度不会自动出现。** `localhost` 与 `127.0.0.1` 也属于不同来源，日常使用请保持同一地址和浏览器配置。

迁移前分别备份个人曲谱、成长进度和需要保留的 AI 报告。详细按键事件只保留最近 100 次，长期练习摘要继续保留。完整的备份与恢复步骤见 [使用手册](./docs/USER_GUIDE.md#保存备份与迁移)。

`.gitignore` 已排除 `.env`、个人练习与曲谱备份、AI 报告 JSON / PDF，以及 `private-data/`、`artifacts/` 和 `dist/`。自行重命名的个人文件建议放入 `private-data/`。提交 Issue、截图或 PR 前，请检查是否含 Key 或个人记录。

## 开发与验证

```bash
npm test
npm run build
```

| 命令 | 用途 |
| --- | --- |
| `npm start` | 启动本地应用，默认 `127.0.0.1:3000` |
| `npm test` | 运行 Node.js 自动化测试 |
| `npm run build` | 将静态应用复制到 `dist/` |
| `npm run repertoire:build` | 根据仓库内的来源文件和清单重新构建分级曲库 |
| `node scripts/serve-qa.mjs` | 在独立端口 3001 启动浏览器测试页面，使用模拟服务 |
| `node scripts/qa-coach-pdf.mjs` | 生成模拟 PDF 样例，保存到忽略的 `artifacts/` |

当前版本记录了 **141 项自动化测试通过**，另有跟弹、MIDI 模拟输入、谱面和 PDF 的浏览器验证。已有一次用户反馈的实琴流程测试，但尚未覆盖所有琴型、驱动和操作系统。验证范围与复测入口见 [VALIDATION.md](./VALIDATION.md)。

### 项目结构

```text
BanpaiPianoCoach/
├── public/             # 浏览器应用、谱面、音源、内置曲库及本机数据逻辑
├── server/             # DeepSeek 统计摘要校验与调用
├── scripts/            # 曲库构建、浏览器 QA、PDF 样例生成
├── tests/              # 自动化测试与模拟浏览器场景
├── research/           # 曲谱源文件、逐首来源清单与校验值
├── examples/           # 可导入的 JSON / MIDI 示例
├── docs/               # 详细使用手册
├── server.mjs          # 本地静态服务与 AI 接口
├── build.mjs           # 静态构建
└── .env.example        # 空白 API 配置模板
```

模块职责和数据约定见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

### 部署边界

`dist/` 可以部署到 HTTPS 静态网站。静态部署支持练习、曲谱、成长统计，以及已保存报告的 PDF 导出；**AI 生成需要本地 Node.js 服务**，不会因为上传 `dist/` 就获得后端接口。

当前 `server.mjs` 仅监听回环地址，AI 接口限制本机同源访问。它按个人本地使用设计，未提供公开多人服务的账号、鉴权、配额或密钥管理；准备部署多人版时，需要另行设计这些能力。

## 常见问题

**`npm` 找不到，或提示 `process.loadEnvFile is not a function`？** 先检查 `node -v`，安装 Node.js 22+ 后重新打开终端。

**提示端口 3000 已占用？** 先打开 `http://localhost:3000`，确认是否已经启动了半拍。也可以停止原来的服务后再启动。改用其他端口会切换浏览器数据来源，原进度需要备份后迁移。

**连接琴后没有输入？** 确认线材支持数据传输、琴的 MIDI 功能可用、浏览器已授权；优先使用桌面版 Chrome / Edge 和 `localhost`。其他浏览器、蓝牙 MIDI 与特定驱动组合尚未完整验证。

**能用录音、麦克风或乐谱照片练习吗？** 当前输入来自 MIDI 或页面琴键，尚未支持音频识别、录音转谱或照片识谱。

**谱面和原版印刷谱不完全一样？** 程序根据音符数据重新排版，MIDI 通常不能完整保留分声部、连奏线、指法、表情或反复结构。复杂作品请同时参考原谱。

**为什么不能评价手型、踏板、音色和感情？** 当前系统主要比较音高与起音节奏，没有采集这些方面所需的信息；AI 点评也只依据已有数据，不会把未观察到的表现当成事实。

## 参与贡献

欢迎通过 [Issue](https://github.com/skylia/BanpaiPianoCoach/issues) 反馈问题和建议，通过 [Pull Request](https://github.com/skylia/BanpaiPianoCoach/pulls) 提交改进。

- 反馈问题时附上复现步骤、浏览器与操作系统版本；MIDI 问题请补充琴型和连接方式。
- 功能改动保持范围集中，并说明如何验证。音乐分析、MIDI 或存储逻辑的改动请补充相应测试。
- 增补曲目时提供可核验来源、转录者、底本、许可与改动说明，并更新来源清单；勿将不明版权的扫描谱或 MIDI 直接加入仓库。
- 继续保持“基础练习本机完成、AI 摘要手动发送”的数据边界；测试使用模拟数据和模拟接口。
- 提交前运行适用的检查，确认没有 API Key、`.env`、个人练习备份或真实报告。

## 许可证与致谢

**本项目自己编写的程序代码采用 [MIT License](./LICENSE)。** 仓库内单独标注许可的曲谱、字体、采样与第三方组件继续适用各自许可。

| 内容 | 许可与来源 |
| --- | --- |
| 半拍程序代码 | [MIT](./LICENSE) |
| 分级曲库与旧版曲谱数据 | 依各条目分别采用 CC0、Public Domain、CC BY 或 CC BY-SA 等，详见 [SOURCES.md](./SOURCES.md) 与 [来源清单](./research/REPERTOIRE-MANIFEST.json) |
| Salamander Grand Piano 采样 | Alexander Holm，CC BY 3.0；见 [采样说明](./public/audio/salamander/README.txt) |
| VexFlow 谱面组件 | [MIT](./public/vendor/VEXFLOW-LICENSE.txt) |
| Noto Sans SC 字体 | [SIL OFL 1.1](./public/fonts/OFL.txt)；完整报告字体见 [对应许可](./public/fonts/NOTO-REPORT-OFL.txt) |
| pdf-lib、fontkit 与相关 PDF 依赖 | 各依赖许可与来源见 [PDF-DEPENDENCIES.md](./public/vendor/PDF-DEPENDENCIES.md) |

感谢 Mutopia Project 及各位曲谱转录者、VexFlow、Noto、Salamander Grand Piano、pdf-lib 和 fontkit。使用或再分发相应资源时，请保留其署名、许可证及改动说明。
