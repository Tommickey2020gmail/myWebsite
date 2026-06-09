---
title: 用 Claude Code 生成 PCB 电路图：技巧、工具与实战评估
title_en: "Generating PCB Schematics with Claude Code: Techniques, Tools, and a Field Assessment"
description: 写给想把"写代码的方式"延伸到硬件设计的人。不谈玄学，只谈当前（2026 年中）真实可用的工具链、踩坑点和能力边界——AI 在原理图/连接关系这一层已经实用，布局布线和工程判断这一层还得靠人。
description_en: For those who want to extend the way they write code into hardware design. No mysticism — just the actually-usable toolchains, pitfalls, and capability boundaries as of mid-2026. AI is already practical at the schematic/connectivity layer; layout, routing, and engineering judgment still need a human.
lang: zh
tags: [ai, claude-code, pcb, hardware, kicad]
created: 2026-06-09
cover: /illustrations/claude-code-pcb-design/cover.jpeg
---

![用 Claude Code 生成 PCB 电路图：技巧、工具与实战评估](/illustrations/claude-code-pcb-design/cover.jpeg)

写给想把"写代码的方式"延伸到硬件设计的人。本文不谈玄学，只谈当前（2026 年中）真实可用的工具链、踩坑点和能力边界。

## 0. 先厘清一个概念：你要的"电路图"是哪一张？

很多人把"PCB 电路图"当成一件事，其实硬件设计里有两张性质完全不同的图，AI 在这两张图上的胜任程度差别很大：

- **原理图（Schematic）**：描述"谁连谁"。元件之间的电气连接关系、网络（net）、引脚对应。它是逻辑层面的，本质上是一张连接图（netlist 的可视化）。
- **PCB 版图 / 布局布线图（PCB Layout）**：描述"放在哪、走哪条线"。元件的物理摆放位置、铜箔走线、过孔、覆铜、层叠。它涉及电磁、阻抗、散热、可制造性，是物理层面的。

一句话总结当前 AI 的能力分布：**AI 在"原理图 / 连接关系"这一层已经相当能打，在"高质量布线布局"这一层还只是个需要紧密盯防的助手。** 本文会区分讲清楚这两段。

## 1. 三条技术路线

让 Claude Code 参与 PCB 设计，可以分成三条哲学不同的路线：

- **路线 A：MCP 驱 KiCad**——让 AI 操作 EDA 软件（实时改 KiCad 工程）。
- **路线 B：代码化 EDA**——让 AI 写代码，再由编译器/工具把代码变成电路。这已经不是 atopile 一家，而是一个类别：atopile（.ato）、Zener（Diode，有 Anthropic 官方合作）、circuit-synth（Python，Claude Code 原生）。
- **路线 C：Claude Code skill 审查/分析套件**——以 kicad-happy 为代表，偏复核、分析、出 fab，而非从零生成。

另有一类 2026 年才冒头的 maker 级商业 IDE（Schematik 这类），因为它面向爱好者、且产品/资本信息多为单源，本文只在末尾作旁注/观望，不当成正式路线。下面逐一说清。

### 路线 A：MCP 直驱 KiCad —— 让 AI "操作 EDA 软件"

通过 Model Context Protocol（MCP）把一个服务端挂到 KiCad 上，Claude 直接调用工具去新建工程、放元件、连网络、跑 DRC/ERC、导出生产文件。你用自然语言下指令，AI 调工具改 KiCad 工程文件。

但这里有一层很多人没说清的真相，先讲在前面：当前功能最全的那批 MCP server，"改动实时显示在打开的 KiCad 里"靠的是 KiCad 的 IPC-API（截至 2026 年中，KiCad 已发布到 10.0.2，IPC 是 9.0 引入、10.x 仍在打磨的接口），而这个 API 目前有几条硬限制：

- **需要 KiCad GUI 常驻**：IPC-API 必须连一个正在运行的 KiCad 实例（它本质是给"插件接入 KiCad UI"用的）。无头服务器、没有可靠图形界面的环境用不了它的实时模式。
- **官方仍标"实验性/开发中"**：KiCad 把 IPC-API 当作正在稳定化的接口，挂它的 MCP server 也基本都明确写着 experimental、风险自负。（KiCad 10.0.1 起对 IPC 插件体验有改善，比如插件控制台输出纳入告警系统、修了插件不显示在工具栏的 bug，但接口本身仍未脱"实验性"。）
- **KiCad 9/10 里 IPC 仍只实现在 PCB 编辑器**，原理图编辑器还不支持；而且 KiCad 9/10 的 IPC 不能出图/导出，要靠插件去调 kicad-cli 补这一段（原理图 API 与导出这两块都要到 KiCad 11 才进 IPC）。结论：升到 KiCad 10 并没有解除这条路线的结构性限制——实时仍需 GUI、仍只管 PCB 编辑器、仍不能导出。

所以实际上，"功能全"的 MCP server 是把三样东西缝在一起：实验性的 IPC（实时、需 GUI、只管 PCB 编辑器）+ 已被弃用的 SWIG/pcbnew 绑定（可无头，但 KiCad 11 要移除）+ kicad-cli（出图导出）。能跑，但中间件层不薄，也不稳。

代表项目（均可对接 Claude Code）：

- **mixelpixx/KiCAD-MCP-Server**：功能最全的一档，号称覆盖 52~122 个工具，横跨原理图、自定义符号 / 封装生成、布线、Freerouting 自动布线、JLCPCB 元件目录与价格库存查询、生产文件导出等。Claude Code 会自动探测当前目录下的 MCP 配置。
- **lamaalrajih/kicad（KiCad MCP Server）**：偏"分析与校验"，强项在可视化、DRC、原理图分析、netlist 提取、BOM 管理，适合做设计审查和排错而非从零生成。
- **bunnyf/pcb-mcp（kicad-mcp-server，PyPI）**：面向 KiCad 9.x，支持把 KiCad + kicad-cli + pcbnew + FreeRouting 跑在一台 VPS 上，本地 Claude Code 通过 SSH 调用。适合不想在本机装一整套 EDA 的人。

适合：坐在屏幕前、希望"改动实时显示在 KiCad 里、随时人工审阅微调"的人——这恰恰是 IPC 实时模式的设计目标。不适合无头服务器、CI、agent 全自动跑的流程（GUI 依赖 + 实验性中间件，投入产出比差）。

### 路线 B：代码化 EDA（atopile / Zener / circuit-synth）—— 让 AI "写代码"

这条路线的共同哲学：把电路连接表达成可读、可 diff、可 build 验证的文本，让 AI 写它最擅长的东西——代码，再由编译器/工具把代码变成电路。2026 年它已不是一家独大，而是一个类别，下面三个是当前最值得关注的代表（atopile 最成熟，故展开讲，另两个各表一段）。

**atopile —— 自成一门 DSL，自己完全掌控**

atopile 是一门描述电路的声明式语言（.ato 文件），配套编译器把代码编译成 KiCad 工程、BOM 和制造文件。它由前 Tesla 工程师创立，开源、活跃——截至 2026 年中已发布到 0.15.x（0.15.7，2026-04），4 月一度密集发版，核心经过重写，是三条路里"自己能完全掌控、可 git diff"的那条。它把软件工程那套搬到硬件上：模块化、可复用、git 版本控制、CI、带单位和容差的参数化、断言式设计规则校验，以及"自动选型"（按约束自动挑分立元件）。

atopile 是这条路里和 Claude Code 配合最久、文档与社区最厚的一档：约束求解器 + 自动选型 + ato build 验证闭环都很完整，本文后面的实战示例（第 4 节）也都基于它。

适合：习惯命令行、git、CI 的工程师；想要可复用模块和可追溯变更历史的项目。

**Zener（Diode）—— 有 Anthropic 官方背书的那条**

Zener 是 Diode Computers 维护的一门 PCB 原理图 DSL（建立在 Starlark 之上），配套工具 pcb 在 KiCad 之上做自动化。它值得单列，是因为这是目前唯一有 Anthropic 一手背书的代码化 EDA：Anthropic 官方博客《Making Claude a better electrical engineer》（claude.com，2026-02-05，与 Diode 联名）记述，工程师已在用 Claude Code 把芯片的非结构化文档读成一份完整的 Zener 参考设计，且这一 agentic 任务在 Sonnet 4.5 上有可测增益；Diode 侧称两周内产出约 250 个参考设计（覆盖传感器 / MCU / 电源），但工程师仍需逐一签字。

冷静标注：Zener 由 Diode 维护、博客称"开源"，但截至本文撰写，其对外的开源协议、安装方式、独立可用性我没能一手证实（官网为动态加载页）。把它理解为"方向极强、Anthropic 亲自下场调教、但你能不能像 atopile 那样 pip 装来自己用，需自行核实"。

**circuit-synth —— Claude Code 原生的 Python 代码化**

circuit-synth（MIT 开源）用 Python 定义电路，最大特点是为 Claude Code 而生：内置 agents 与 skills（如 circuit-patterns、component-search）、slash 命令（/find-symbol、/generate-validated-circuit、/analyze-fmea），产物覆盖 KiCad 工程 + Gerber + BOM + SPICE。对已经习惯 Python 的人，它比学一门新 DSL 上手更快。注：以下信息来自其项目文档（单源），最新版 v0.12.1（2026-01），生产成熟度请自行评估。

适合（路线 B 整体）：习惯命令行 / git / CI、想要"硬件即代码"和可复审变更历史的人。三者怎么选见本节末对比。

### 路线 C：Claude Code skill 审查/分析套件（kicad-happy 等）—— 让 AI "做复核"

前两条路线都在解决"从零生成"——把需求变成连接/工程。但实际工作里还有一大块是"复核已有的板子"：查悬空 net、跑 DRC/ERC、做 EMC 预合规、核 BOM、出制造文件。这一块现在有了成体系的现成工具——Claude Code skill 套件，代表是 kicad-happy。

kicad-happy（MIT 开源）是一套面向 KiCad 的 AI agent skill 集合，据其文档提供 12 个 skill：解析原理图 / PCB / Gerber、SPICE 测试台、EMC 预合规（44 条 FCC/CISPR/汽车规则）、datasheet 结构化提取、BOM 全流程、Digikey/Mouser/LCSC/Element14 选型、JLCPCB/PCBWay 出 fab、工程文档生成。它兼容 Claude Code / Codex / Copilot CLI / Gemini CLI，可作为 Claude Code 插件装；最新 v1.3.1（2026-05），社区活跃。

和路线 A 的区别：它不靠 MCP、不需要 KiCad GUI 实时挂着，而是以 skill 形式让 Claude Code 直接读工程文件做分析与导出——本质是把"分析校验类 MCP"想干的事，用更轻、更可组合的 skill 方式实现了。注：信息来自其项目文档（单源），生产成熟度请自行评估。

适合：主力用路线 A 或 B、但想要一套现成的审查 / EMC / 选型 / 出 fab 能力的人；做设计 review、排错、BOM 核对的场景。

### 旁注：maker 级商业 IDE（Schematik）—— 值得盯，暂别押

2026 年还有一类"为硬件从头打造的 AI 原生 IDE"，代表是 Schematik（被叫作 "Cursor for Hardware"）。但要把它和上面三条路线分清楚：

- **定位是 maker 级**：官网自述 "AI Hardware IDE for Arduino, ESP32, and Pico"，主打"自然语言 → 源码 + 接线图 + 分步装配指导"，偏面包板/模块接线，未见专业 PCB / Gerber 出图证据——和本文讨论的"出原理图 / 出制造文件"不是一回事。
- **资本信号确凿，但别误读**：2026-04 拿了 Lightspeed 领投的约 \$4.6M 预种子；Anthropic 只是"表达兴趣"，并无一手证据坐实投资。（也别信"由 Claude 3.5 Sonnet 驱动"这类二手说法——无一手出处。）
- **闭源平台**：与路线 A/B/C 的开源、可自托管不同，你被绑在它的平台和数据流里。

结论：方向值得盯，但现在不适合把正式 PCB 项目押上去。

### 路线对比（A/B 为生成主力，C 为复核层；附工具速查）

| 维度 | 路线 A：MCP 驱 KiCad | 路线 B：atopile 代码 |
|------|---------------------|---------------------|
| AI 干的事 | 调工具操作 GUI 状态 | 写 .ato 代码 |
| 产物 | KiCad 原生工程 | .ato 源码 → 编译出 KiCad 工程 |
| 成熟度 | 实时 IPC 仍标实验性、多为爱好者项目 | 活跃，2026 年仍在发版，有正式 HDL + 约束求解器 |
| 需 GUI 常驻 | 是（实时 IPC 要 KiCad 开着） | 否，ato build 命令行编译出网表 |
| 无头 / agent 自动跑 | 低（多一层会出 bug 的中间件 + GUI 依赖） | 高（声明式、可复用模块、参数化选型） |
| 版本控制 | KiCad 文件 diff 不友好 | 文本，git 天然友好 |
| 可复用性 | 靠个人库 | 模块化、有包管理器 |
| 验证方式 | DRC/ERC | ato build + 断言 + DRC/ERC |
| 学习曲线 | 装 MCP，会描述需求即可 | 需学 .ato 语法 |
| 自动布线 | 集成 Freerouting | 当前更偏"出连接 + KiCad 布局" |
| 安装代价 | KiCad + MCP server（重） | pip 装，国内镜像快；布局阶段才需 KiCad |
| 适合谁 | 屏幕前要实时反馈、在 KiCad 里收尾 | 想"硬件即代码"、无头 / agent / 上 CI |

上表对比的是"操作 GUI（A）vs 写代码（B）"两种范式。下面这张则把具体工具按格局摊开，便于速查（"置信"列标注信息来源强度）：

| 工具 | 类别 | 开源 | 与 Claude 的关系 | 产物 | 成熟 / 活跃 | 置信 |
|------|------|------|-----------------|------|-----------|------|
| atopile | 代码化 DSL（.ato） | 是 | 通用，靠 CLI（ato） | KiCad 工程 / BOM / 制造文件 | 0.15.7（2026-04） | 已证 |
| Zener / Diode pcb | 代码化 DSL（Starlark） | 称是，待核 | Anthropic 官方合作，Claude Code 直生成 | KiCad 工程 + 参考设计模块 | ~250 设计 / 2 周（2026-02） | 已证（对外可用性待核） |
| circuit-synth | 代码化（Python） | 是（MIT） | Claude Code 原生（agents/skills/命令） | KiCad + Gerber + BOM + SPICE | v0.12.1（2026-01） | 单源 |
| KiCad-MCP（mixelpixx 等） | 驱 GUI（IPC） | 是 | MCP server | 直改 KiCad 工程 | 实验性中间件 | 已证 |
| kicad-happy | skill 审查套件 | 是（MIT） | 多 agent CLI 通用 | 审查 / EMC / SPICE / fab 文件 | v1.3.1（2026-05） | 单源 |
| Schematik | maker 商业 IDE | 否 | Anthropic"有兴趣"（未证投资） | 接线图 + 装配指导（非专业出图） | 商业、early | 定位已证 / 投资未证 |

实用建议：先按工作方式选范式——人坐在屏幕前、要边改边看 KiCad 走路线 A（MCP）；无头 / agent 自动跑 / 要 git diff 和可复审 / anti-rework 走路线 B（代码化 EDA，它就是冲这个设计的）。

路线 B 内部再分流：想自己完全掌控、pip 装来就能用 → atopile（最成熟、本文示例都用它）；已重度用 Claude Code、又习惯 Python → circuit-synth（原生集成最顺）；想跟 Anthropic 亲自调教的生态 → 关注 Zener，但先确认它对你是否可独立安装使用。

复核与收尾：对已有板子做审查、补救、跑 DRC/EMC/出 fab，优先挂路线 C 的 skill 套件（kicad-happy），或一个偏"分析校验"的 MCP——两者目的相同，skill 更轻、不依赖 GUI。各条不互斥，常见做法是用路线 B 出连接、用 KiCad 做布局收尾、用路线 C 做复核。另注意：走 A 或 B，PCB 布局 / 出 Gerber 都离不开 KiCad，代码化 EDA 也只是把 KiCad 推迟到布局阶段，并没有取消它。至于 maker 级商业 IDE（Schematik 这类）：观望、小范围试玩可以，别把正式 PCB 项目押上去。

## 2. 需要安装的软件

![一张待焊接的电路板与工作台](/illustrations/claude-code-pcb-design/inline-1.jpeg)

下面以一台开发机为例（我用的是 Windows + WSL2 跑 Claude Code，相关注意事项见末尾）。

**两条路线共同的底座：**

- **KiCad 9/10**：EDA 主体（截至 2026 年中当前稳定版是 10.0.2，建议直接装 10；9.x 仍可用，但新项目无理由停在 9）。MCP 路线必装；atopile 路线"想看 / 改 PCB 布局"时需要，纯 build 验证可以后装。
  - Ubuntu/WSL2（KiCad 10）：`sudo add-apt-repository --yes ppa:kicad/kicad-10.0-releases && sudo apt-get update && sudo apt-get install -y kicad kicad-libraries`（想留在 9.0 把 PPA 换成 `kicad-9.0-releases`）
  - 验证 Python 绑定：`python3 -c "import pcbnew; print(pcbnew.GetBuildVersion())"`
- **Claude Code**：本文的主角，自然语言入口。

**路线 A（MCP）额外需要：**

- **Node.js 20+**（mixelpixx 的 server 用 Node 构建）：`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **Python 3 + pcbnew 绑定**（随 KiCad 安装）
- **MCP server 本体**：按所选项目 git clone 后 `npm install && npm run build`，或用 `uvx kicad-mcp-server` 这类方式拉起。
- 若要用实时模式：需在 KiCad 里 Preferences > Plugins 启用 IPC API Server，并保持 KiCad GUI 处于打开状态（无头环境只能退而用 pcbnew/kicad-cli 的非实时路径）。
- （可选）**Freerouting**：自动布线用，依赖 Java，常以 Docker 方式运行。
- （可选）**Docker**：跑 Freerouting 或把 KiCad 放远端 VPS 时用。

**路线 B（atopile）额外需要：**

- **atopile**：本质是个 Python 包，pip 即可安装（国内镜像很快，绕开 KiCad 那套体积庞大的安装包）；也可装 VS Code / Cursor 扩展（扩展会帮你装好并托管 ato）。首次运行 ato 会引导你安装 KiCad 集成插件。KiCad 在这条路线里可以后装——纯 ato build 验证连接不需要它，到 PCB 布局 / 出 Gerber 阶段才用得上。

**贯穿全程的辅助：**

- **git**：无论哪条路线都强烈建议，PCB 也要版本控制。
- **LCSC / JLCPCB 账号**（如果走嘉立创打样）：让 AI 用 LCSC 部件号选型，能直接对接打样与备料。

## 3. 配置 Claude Code：接 MCP、接 atopile、建 skill

### 3.1 接入 KiCad MCP

Claude Code 会自动探测当前项目目录里的 MCP 配置，多数项目放在工程根目录即可被识别。通用做法是用 Claude Code 的 MCP 添加命令，例如：

```bash
claude mcp add --transport stdio kicad uvx kicad-mcp-server
```

或者在配置文件里手写一个 server 条目（远端 VPS 模式下用 SSH 命令拉起服务端）。配好后在 Claude Code 里输入诸如"新建一个 50mm×50mm 的工程 LEDBoard，四角放 3mm 安装孔"之类的指令，AI 就会调用对应工具落到 KiCad 工程文件上。

### 3.2 接入 atopile（不需要 MCP）

atopile 路线不需要 MCP——Claude Code 直接在终端里调 ato 命令就行。典型循环：

```bash
ato create project        # 建工程
ato create part -s <LCSC-ID>   # 按 LCSC 部件号拉元件
ato build                 # 每次改完都 build 验证
```

你只要让 Claude Code 知道这套命令存在、并约定"每改一步就 build"，它就能自己跑闭环。

### 3.3 创建一个 PCB 设计 skill / CLAUDE.md

无论哪条路线，真正决定体验的是你给 Claude Code 的"规则文件"。在 Claude Code 里，这通常是项目根目录的 CLAUDE.md（项目级记忆），或者一个自定义 skill。它的作用是把"硬件设计的领域常识 + 你的项目约束 + 必须遵守的纪律"固化下来，避免每次重复交代、也防止 AI 自由发挥酿成低级错误。

下面是一个可直接改用的 atopile 路线 CLAUDE.md 模板：

```markdown
# PCB 设计 Skill（atopile 路线）

## 角色
你是一名严谨的硬件设计助手。你不"自由发挥"，所有连接都基于
数据手册与明确需求。每一步都要可验证。

## 必守纪律（不可违反）
1. 每次修改 main.ato 后立刻运行 `ato build`，构建失败先修复再继续。
2. 元件一次加一个，不要批量塞入。
3. 严禁擅自修改已导入元件的引脚名/引脚号；用错引脚会烧板。
   不确定就先查数据手册，明确告诉我引脚来源。
4. 所有电阻电容默认 0603；所有元件用 LCSC 部件号选型，
   需要时联网查证型号与库存。
5. 差分对（如 USB D+/D-）必须正确命名 net，以便差分布线。

## 项目约束
- 主控：ESP32-S3-WROOM-1（N16R8）
- 供电：USB-C 5V → AMS1117-3.3 → 3.3V
- USB-C CC 线各串 5.1K 下拉
- EN 引脚必须有 RC 上电复位电路（R 用 10K，别用奇怪的值）
- 状态灯：5V 红 / 3V3 绿 / GPIO 蓝
- 预留 QWIIC 接口

## 工作流
1. 先复述需求和你打算加的元件清单，等我确认再动手。
2. 逐个加元件 → 连接 → build → 报告结果。
3. 全部完成后输出 BOM，并提示我需要人工 review 的点
   （布局、覆铜、值的合理性）。

## 交付前自检清单
- [ ] 所有 net 都连上了，没有悬空
- [ ] 去耦电容齐全
- [ ] RC 复位电路的电阻电容都在
- [ ] 差分对命名正确
- [ ] DRC/ERC 无致命错误
```

MCP 路线的 CLAUDE.md 类似，只是把"运行 ato build"换成"调用 DRC/ERC 工具校验"，并强调放置坐标、走线宽度、覆铜层等物理参数要由你确认。

关键心法：**skill 文件里最该写的，不是"怎么做"，而是"绝对不能怎么做"和"每步必须验证什么"。** 硬件的容错率远低于软件——软件 bug 重跑就行，板子打错要重新打样、花钱花时间。

## 4. 实战步骤：以 ESP32-S3 开发板为例

把上面的东西串起来，一个走 atopile 路线的真实流程长这样（参考社区里已公开的 ESP32-S3 vibe-coding 实践）：

1. **建工程**：`ato create project`，让 Claude Code 在 main.ato 里起骨架。
2. **喂一段结构化需求给 Claude Code**，把"要哪些模块、用什么部件号、什么规格、哪些纪律"一次讲清。需求要具体到：ESP32-S3 模块、带 CC 电阻的 USB-C、3.3V 稳压、几颗状态灯、QWIIC、复位 / Boot 按键、EN 的 RC 电路，并点明 GPIO19/20 是 USB D-/D+ 要正确命名以便差分布线。
3. **逐元件落地**：让 AI 用 `ato create part -s <LCSC-ID>` 一个个加元件，每加完就 ato build。
4. **连接**：让 AI 写出各 net 的连接。
5. **每步 build 验证**：构建通过 ≠ 连接正确（见下文真实翻车记录），但 build 失败一定有问题，先修。
6. **在 KiCad 里人工审阅**：打开生成的工程，检查是否真的连上了、有没有漏件、值是否合理。
7. **人工收尾**：摆放布局、覆铜（ground fill）、调整不合理的元件值、跑 DRC。
8. **（先别急着投板）**：先做完整的原理图 review，确认无误再考虑打样。

## 5. 关键使用技巧（这些是省钱省命的部分）

- **锁死引脚，禁止 AI 改元件**：在 skill 里明确"不得修改已导入元件的引脚名 / 号"。引脚映射错误是最隐蔽也最致命的错误之一。
- **强制用 LCSC / 厂商部件号选型**：让 AI 联网查证真实可买到的型号，而不是凭记忆编一个。这样 BOM 直接能对接打样备料。
- **"每改一步就 build / DRC"写进纪律**：把验证变成强制循环，而不是事后一次性检查。
- **差分对、电源 net 显式命名**：USB、CAN 这类差分信号，net 名不规范会导致后续布线工具识别不出差分对。
- **关键值自己定，别让 AI 猜**：实践中 AI 会给出"能 build 但不合理"的值——比如 EN 复位电路它可能随手给了个 330Ω，而合理值是 10K。涉及上拉 / 下拉 / 限流 / 时间常数的电阻电容，自己核算或显式指定。
- **不要全程"vibe"**：可以让 AI 跑得很快，但原理图 review 这一关绝不能省。把 AI 当成"热情但健忘的实习生"，不是"持证工程师"。
- **布局布线优先人工 / 半自动**：自动布线（Freerouting）能用，但高速、电源完整性、EMC 相关的关键走线，仍需人来把关。
- **善用现成的审查能力**：哪怕你主力用 atopile，也该备一套复核工具——挂一个偏"分析校验"的 KiCad MCP，或更轻的 Claude Code skill 套件（kicad-happy），让 AI 帮你做 DRC 复盘、EMC 预合规、BOM 检查、netlist 比对。skill 方式不依赖 KiCad GUI 实时挂着，更适合无头 / agent 流程。

## 6. 使用评估分析

### 6.1 能力边界：AI 擅长什么、不擅长什么

**擅长（可放心交，但要复核）：**

- 标准模块的连接关系：MCU + USB-C + LDO + 状态灯 + 按键 + QWIIC 这类"教科书拓扑"
- 去耦电容、上下拉、CC 电阻这类常规配套件的补齐
- 按部件号选型、生成 BOM
- 重复性、模板化的设计（atopile 的模块复用在这里加成很大）
- 设计审查的"第一遍筛子"：找悬空 net、明显的 DRC 违规

**不擅长（必须人盯）：**

- 关键元件值的合理性（时间常数、分压比、限流）
- 高速 / 差分 / 电源完整性的布局布线
- 散热、EMC、可制造性（DFM）这些"物理世界"的约束
- 偏门元件的引脚映射（容易张冠李戴）
- 它"能 build / 能跑通"不代表"电气正确"

一点量化旁证：2026 年有篇学术工作（arXiv 上的 PCBSchemaGen）专门评测"自然语言 → 原理图"这一步——它用 LLM 出 SKiDL 代码再生成 KiCad 原理图，在 23 个电路任务、9 个 LLM 上，最好的模型（Gemini 3 Flash）按难度分别拿到约 93% / 93% / 78% 的 Pass@1，并声称相对人工有 ~37× 的提速。这和本文的定性一致：简单/中等拓扑命中率很高，难题明显掉档。注意这是单篇、学术、未经独立复现的结果，且测的是"连接对不对"而非"布局/电气工程判断"，别当成产品级承诺，但可作为"AI 在原理图层确实能打"的一个可量化注脚。

### 6.2 一份真实复盘（社区公开案例）

有人用 Claude + atopile **全程"只说 yes、不看代码"** 地做一块 ESP32-S3 开发板，过程很有代表性：

- 第一次 build 成功、元件都找到了，但打开 KiCad 发现一根线都没连——提醒一句"你忘了连接"才补上。
- 连上之后又发现 EN 复位电路漏了一颗电容，再提醒才补。
- AI 给 EN 电阻选了 330Ω，作者手动换成更合理的 10K。
- 覆铜、布局整理都是人工完成。
- 最终成品功能上是齐的：AMS1117 稳压、带 CC 电阻的 USB-C、差分 USB 走线、状态灯、去耦电容、复位 / Boot 按键、EN 上的 RC 电路。

作者的结论很中肯：作为 AI 的"第一版草稿"出乎意料地好，但它还不能替代有经验的工程师，更像一个"热情但健忘的助手"。这和上面的能力边界完全吻合——AI 负责把 80% 的体力活快速铺好，工程师负责守住那致命的 20%。

### 6.3 准确度 / 安全性 / 成本

- **准确度**：连接层面"接近可用"，但系统性遗漏（漏连、漏件、值不合理）是常态，复核不是可选项。
- **安全性 / 风险**：最大风险是"看起来对、build 也过、其实会烧板"。引脚错、电源拓扑错、缺保护器件，代价是真金白银的废板和返工。任何 AI 生成的设计在投板前都必须经过完整人工原理图审查。
- **成本与 ROI**：软件成本几乎为零（KiCad、atopile、MCP 多为开源）。真正的成本是你的审查时间和潜在的打样返工。对模板化、重复性、迭代频繁的项目，ROI 很高；对一次性、高风险、高速 / 高功率的板子，AI 主要价值在"加速草稿"和"做审查筛子"，而非端到端交付。

### 6.4 适用场景判断

| 场景 | 推荐度 | 说明 |
|------|--------|------|
| 学习 / 玩票 / 快速验证想法 | ★★★★★ | 最佳场景，容错高、迭代快 |
| 模板化开发板（如 ESP32 系列） | ★★★★☆ | AI 铺草稿 + 人工收尾，效率显著 |
| 团队协作、需版本控制 / CI | ★★★★☆ | atopile 路线优势最大 |
| 设计审查 / 排错 / BOM 核对 | ★★★★☆ | kicad-happy 这类 skill 套件或 MCP 分析类 server 很好用 |
| 高速 / 高功率 / 安规相关 | ★★☆☆☆ | 仅作辅助，关键决策必须人来 |
| 直接出量产板不复核 | ☆☆☆☆☆ | 不要这么干 |

## 7. 落到我自己的项目：小暖 ESP32-S3 小车

![小暖 ESP32-S3 小车](/illustrations/claude-code-pcb-design/inline-2.jpeg)

结合我正在做的 ESP32-S3 物理小车（带避障和环境传感），按上面的分流逻辑，这个项目应该走路线 B（atopile）——理由很硬：它是无头、agent 自动跑、anti-rework、要 git 可复审的流程，而路线 A 的实时模式恰好被它的 GUI 依赖和实验性 IPC 卡死。

同属路线 B 的 Zener 和 circuit-synth 我也评估过：Zener 有 Anthropic 背书、方向最诱人，但它对外的独立可用性我还没核实，没法现在押；circuit-synth Python 原生、和 Claude Code 集成最顺，但成熟度只见单源。综合"最成熟 + 我已验证的 LCSC 料号可直接沿用 + 文档/社区最厚"，这块小车核心板仍选 atopile，把 Zener/circuit-synth 留作下一版再评估。具体落法：

- **把原理图捕获拆成几个 .ato 模块**，而不是手写 .kicad_sch（手写最大的坑是坐标 Y-flip 算错就连不上线）。建议的模块划分：最小系统（ESP32-S3 + 供电去耦 + EN 复位 + 下载）、电机驱动（TB6612 ×2）、充电保护升压（电池 + 保护 + 升压）、传感（I2C / ToF 测距）。每个模块独立、可复用、可单独 ato build 验证。
- **ato build 出网表，KiCad 只承接 PCB 布局 / 出 Gerber**。这样 KiCad 那套大体积安装包不白下——它在布局阶段仍是必需的，只是不再用于原理图捕获。
- **钉死料号**：atopile 的自动选型器会想自动挑件，但允许显式锁定已验证的 LCSC C 号 / MPN——我 BOM 里那些验证过的料号照搬钉死即可，别让 picker 自由发挥。
- **把"纪律"写进 CLAUDE.md**：尤其锁死电源拓扑、电机驱动 / 电池这类一旦错就烧件的部分，强制每步 ato build + 后续 DRC/ERC。
- **复用已有的 ERC / 网表校验思路**：哪怕不再手写 .kicad_sch，原先那套 ERC / 网表校验的检查清单在验证 atopile 产物时照样用得上——它本质是在查"连接对不对"，与产物是 .ato 还是 .kicad_sch 无关。
- **关键值和功率 / 散热部分自己把关**：电机驱动、电源路径的元件选型和布线，别交给 AI 拍脑袋。
- **小批量打样**（我计划首批 100–300 件）前，做一次彻底的人工原理图 review，再衔接 LCSC 备料 + 嘉立创打样（atopile 对 LCSC 部件号和 JLCPCB 流程天然亲和）。

一句话：让 atopile + Claude Code 把小车核心板的"草稿和体力活"压缩到几小时，把省下的时间投到"那致命的 20%"——电源、电机、传感时序、可制造性——这才是当前 AI 辅助 PCB 设计最划算的用法。

## 结语

用 Claude Code 生成 PCB"电路图"，2026 年的真实状态是：**原理图 / 连接关系这一层已经实用，布局布线和工程判断这一层还得靠人。** 格局也比一年前清楚了：代码化 EDA 已成一个类别（atopile、有 Anthropic 官方背书的 Zener、Claude Code 原生的 circuit-synth），MCP 驱 KiCad 让 AI 直接操作 GUI，Claude Code skill 套件（kicad-happy）补齐了审查 / EMC / 出 fab 这一层；至于 maker 级商业 IDE（Schematik 一类）方向诱人、有 Anthropic 关注，但仍在观望期。无论走哪条，决定成败的不是 prompt 多花哨，而是你有没有把"纪律和验证"写进 skill、有没有守住投板前的人工审查。

把它当成一个跑得飞快但需要你签字的实习生，而不是替你负责的工程师——这是目前最稳、也最高效的姿势。
