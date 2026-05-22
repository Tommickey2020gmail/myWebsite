---
title: LiveKit 在语音陪伴 AI 中的深水区
title_en: LiveKit in the Deep End — Lessons from a Voice-Companion AI Project
description: 当你以为只是搭个 WebRTC 管道，实际上是在做实时分布式系统调度。从小暖项目踩过的坑说起,把 turn detection、代际管理、TTS 流式、中文多音字、打断生命周期、Dify 集成等问题讲到协议层和调度层。
description_en: You thought you were wiring a WebRTC pipe — you're actually scheduling a real-time distributed system. Lessons from the Xiao Nuan voice-companion project, dug down to protocol and scheduler level — turn detection, generation management, streaming TTS, Chinese prosody, barge-in, Dify integration, and the corners no one warns you about.
lang: zh
tags: [ai, voice, livekit, webrtc, engineering, xiaonuan]
created: 2026-05-22
---

副标题：当你以为只是搭个 WebRTC 管道，实际上是在做实时分布式系统调度

## 写在前面

LiveKit 在文档里给人的印象是"一行代码搭起语音 Agent"。但当你真正把它用到生产环境——尤其是面向老年人的语音陪伴应用——你会发现文档掩盖的复杂度比展示的多得多。

小暖（Xiao Nuan）是一个面向 55+ 用户的 AI 语音陪伴系统，技术栈是 Flutter + Go/GoFrame + Qwen3 + Dify + FunASR/SenseVoice + CosyVoice + LiveKit/WebRTC。在过去几个月的实际落地中，我们遇到了几乎所有 LiveKit 用户都会遇到的问题：重音字读错、前后两句话顺序错乱、用户开口被无视或被误打断、长文本播到一半"接不上气"……

这些问题表面上五花八门，本质上都指向同一个事实：LiveKit Agents 不是一个端到端的语音模型，而是一个由 STT、LLM、TTS、VAD、转写同步、音频传输等多个异步流水线拼接起来的实时调度系统。每一个"奇怪的 Bug"，几乎都能在流水线的某个接缝处找到根源。

本文不重复官方文档，而是把每一类典型问题拆到协议层、调度层、模型层去讲清楚为什么会发生、有哪些可选方案、各方案的代价是什么。

文中给出的具体数字（延迟毫秒数、阈值百分比等）多数是小暖项目或社区 issue 中的单点观察，不是普适常数，请结合自己的设备和场景理解。

## 一、先看清楚 LiveKit Agents 的真实结构

很多人把 LiveKit Agents 理解成"一个 SDK"，这是认知上的第一个偏差。它实际上是三层叠加：

**第一层：WebRTC 传输层。** 这是 LiveKit 起家的部分，SFU（Selective Forwarding Unit）架构，端到端最低 100ms 量级延迟，处理 NAT 穿透、抖动缓冲、Opus 编解码、自适应码率。这一层非常成熟，问题极少。

**第二层：AgentSession 编排层。** 这是 1.0 之后官方力推的抽象。它维护一个状态机：listening → thinking → speaking → listening，并在状态切换的瞬间插入插件钩子（VAD、Turn Detector、STT、LLM、TTS）。所有插件之间通过异步 channel 串起来，流水线并行运行。

**第三层：插件（Plugin）层。** STT/LLM/TTS 都是插件，每个插件有自己的连接池、超时、重试、流式/非流式协议适配。这一层是绝大多数 Bug 的来源——不是插件本身写得不好，而是不同插件的语义假设不一致。

理解了这三层，再看后面的所有问题就有了坐标系。

```
┌─────────────────────────────────────────────────────────┐
│  Plugin Layer:  STT │ LLM │ TTS │ VAD │ TurnDetector    │  ← 语义假设不一致的源头
├─────────────────────────────────────────────────────────┤
│  AgentSession:  状态机 + 异步 channel + 转写同步器       │  ← 调度时序问题的源头
├─────────────────────────────────────────────────────────┤
│  WebRTC/SFU:    Opus 编解码 + 抖动缓冲 + 拥塞控制        │  ← 这层基本可靠
└─────────────────────────────────────────────────────────┘
```

## 二、Turn Detection：那条最容易被低估的隐形主线

### 2.1 这不是一个技术细节，是整个系统的命脉

"Turn Detection"翻译成中文是"轮次检测"——判断用户是否说完了一句话、是否在打断 Agent。它看起来是个小模块，但它决定了你的语音 Agent 像不像人。

判断错了会怎么样？

- 判断太早（用户还在思考时就当对方说完了）→ Agent 抢话，老人会被吓一跳
- 判断太晚（用户已经说完很久还在等）→ Agent 反应迟钝，老人开始重复或者放弃
- 打断检测过于敏感（咳嗽、嗯哼、背景电视声都算打断）→ Agent 说话一直被切断，整个回答永远说不完
- 打断检测不够敏感（老人喊"停"也不停）→ 长输出场景下用户体验崩盘

小暖项目的早期版本几乎踩遍了上面所有坑。

### 2.2 LiveKit 提供的四种判断策略对比

LiveKit 支持多种检测策略。每种的工作原理和适用场景必须想清楚：

| 策略 | 工作原理 | 延迟特征 | 准确度 | 适合场景 |
|------|---------|---------|--------|---------|
| VAD only | 检测一段静默期就认为结束 | 最低 | 低 | 命令式短交互 |
| STT Endpointing | 用 STT 返回的句尾标记 | 中 | 中 | 通用，但依赖 STT 质量 |
| Turn Detector Model | 专门训练的轻量模型看上下文 | 中 | 高 | 多轮对话、自然交流 |
| Realtime Model 内置 | 让 OpenAI Realtime API 自己判断 | 由模型决定 | 高但不可控 | 用 OpenAI 全家桶时 |

VAD 是判断输入，不等同于轮次检测本身——这是个常被混淆的点。单纯依赖 VAD 的问题在于：

> "我想订一张去……呃……北京的机票"

VAD 在那个"呃"前面的停顿就触发了，导致 Agent 把"我想订一张去"当成完整一句话送进 LLM。更好的做法是用一个小分类器或 LLM 判断这段话从语义上是否完整。

### 2.3 小暖的实际选择与权衡

老年人说话有几个鲜明特征，跟做技术选型直接相关：

1. **语速慢，句中停顿长。** 一句话中间停 1 秒以上是常见的。
2. **常有"嗯""啊""那个"等填充词。** 这些既不是真正的内容也不是打断。
3. **思路常常跳跃。** 说着说着突然换话题，但话题之间的衔接没有明显语义边界。
4. **环境噪声多。** 电视、广播、家人说话，全在拾音范围内。

基于这些特征，小暖最终的策略是：

- **底层**：Silero VAD（轻量、低延迟、CPU 即可跑）
- **中层**：LiveKit 的 turn-detector 开源模型（基于上下文判断语义完整性）
- **上层**：自定义阈值——`min_endpointing_delay` 设到 800ms（默认 500），`max_endpointing_delay` 在老年场景下也需要相应放宽。具体数值要根据你的用户群体跑统计后再定，不要照搬。
- **打断策略**：用 LiveKit 的 Adaptive Interruption Handling

Adaptive Interruption Handling 是 LiveKit 推出的功能，专门训练了一个音频分类模型，在检测到用户说话后的几百毫秒内分析音频流，判断是真打断还是背景音、咳嗽、应答词。这个东西对小暖来说是雪中送炭——之前老人客厅里电视一响，Agent 就"住口"，体验非常糟糕。该模型在 LiveKit Cloud 数据中心直接部署，对 Cloud 用户免费且默认启用；自部署 LiveKit 需要单独部署该模型服务并自行配置接入，不是简单的"用不上"，但落地确实更折腾。

### 2.4 关于"误打断"的更深一层

很多人没意识到：当 TTS 正在播放时，Agent 麦克风听到的不全是用户的声音。即便有回声消除（AEC），扬声器音量较大、设备 AEC 不好、用户离麦克风近，都会让一部分 TTS 自己的声音回灌进 STT。

这个问题在 LiveKit 社区有完整的 issue（`livekit/agents #315`）：Agent 把自己的 TTS 输出当成了用户语音，触发回声循环。issue 原作者观察到"设备音量超过约 25–30% 时容易出现"——但这只是单一设备的报告值，实际阈值与扬声器灵敏度、麦克风距离、AEC 算法实现强相关，不要当成普适常数。在小暖测过的几款老年平板上，触发阈值从 15% 到 45% 都有。

我们的解法是分层：

1. **客户端（Flutter）**：强制开启 `echoCancellation: true, noiseSuppression: true, autoGainControl: true`
2. **Agent 端**：把 LiveKit 自带的 noise-cancellation 插件加上，再加一层语义过滤——如果 STT 识别出的文本和当前 TTS 正在播放的文本相似度超过一定阈值（小暖用的 0.7，按经验调），直接丢弃这次"用户输入"
3. **硬件层**：对推荐机型做了硬件 AEC 验证，AEC 不达标的设备直接不进推荐列表

不能只靠一层。

## 三、"前后语音混乱"的根因：异步流水线的时序问题

### 3.1 现象先描述清楚

小暖在早期出现过这样的现象：

- 用户问"今天天气怎么样"，紧接着不到 1 秒又问了"那明天呢"
- Agent 先回答了明天的天气，再回答了今天的
- 或者：今天的回答说到一半被打断，明天的回答开始播，今天的剩余部分又冒出来接在后面

这不是 LLM "脑子乱了"，是流水线没有正确处理"代际"（generation）。

### 3.2 为什么会发生

把语音 Agent 的流水线拆开看：

```
用户音频 → VAD → STT(流式) → 触发 LLM → LLM(流式) → 分句 → TTS(流式) → 音频帧 → 播放
  (T1)   (T1+δ)  (T1+δ')      (T2)        (T2+δ)   (T2+δ')   (T3)        (T4)
```

每一段都在独立的 asyncio 任务里跑。当用户连续问了两个问题（T1 和 T1'，间隔很短），如果第一轮的 turn detection 没完成、LLM 已经开始生成、TTS 已经开始合成，这时候第二轮的 STT 输出又来了……

如果没有正确的"打断 + 清理"机制，会出现：

- LLM-A 的最后几个 token 还在生成 → TTS 队列里被加入一段
- 同时 LLM-B 也开始生成 → TTS 队列被加入另一段
- TTS 是 FIFO 队列，谁先就绪谁先播——音频播放顺序与语义顺序脱钩

### 3.3 解决思路：generation_id 串联整条流水线

LiveKit 1.0 之后的 AgentSession 内部对此做了处理，每次新的用户 turn 完成都会分配一个 `generation_id`，传递到 LLM → TTS → 播放队列。当新一代开始时，老一代的所有 pending task 被 cancel。

但如果你做了自定义节点（比如插入 Dify 工作流，或者套了自己的 LLM 网关），就要自己维护这套契约：

```python
# 简化示例：自定义 LLM 节点中的代际管理
class XiaoNuanLLMNode:
    def __init__(self):
        self._current_gen = 0
        self._active_task: asyncio.Task | None = None

    async def on_user_turn_completed(self, ctx, new_msg):
        # 1. 取消上一代所有 in-flight 任务
        self._current_gen += 1
        gen = self._current_gen
        if self._active_task and not self._active_task.done():
            self._active_task.cancel()

        # 2. 启动新一代
        self._active_task = asyncio.create_task(
            self._run_generation(gen, ctx, new_msg)
        )

    async def _run_generation(self, gen: int, ctx, msg):
        async for token in dify_stream(msg):
            # 每次产出 token 前检查代际
            if gen != self._current_gen:
                return  # 我已经过时了
            yield token
```

这个模式在所有插入了自定义中间层的项目里都要写。小暖接 Dify 工作流的时候，第一版就忘了写这套，直接出现了"过期回答阴魂不散"的诡异现象。

### 3.4 chat_ctx 的更新时机：另一个常被忽视的陷阱

`chat_ctx` 是 Agent 的对话历史。问题在于：它什么时候更新？

错误的做法是 "TTS 开始播的时候更新"——如果用户中途打断，那段没播完的话就被错误地写进了历史。

LiveKit 默认的处理是：跟踪实际播放到哪个 token，被打断时只把已播部分加进 `chat_ctx`。但很多自定义实现没做这个对齐，导致 LLM 下一轮看到的历史是"自己说了但用户从没听过的话"。

小暖的处理是订阅 Agent 侧的"已确认提交"语义的事件（不同 LiveKit Agents 版本里事件名可能是 `speech_committed`、`agent_speech_committed` 或类似命名，请以你使用的 SDK 版本为准），事件里带的是真实播放完的 transcript，而不是 LLM 生成的完整 transcript。这一步省不得。

## 四、TTS 长文本的"接不上气"：分句、流式、协议三重门

### 4.1 现象

小暖播放养生知识科普类内容（通常 300–500 字）时，会出现：

- 中间某个地方突然停顿超过 1 秒，然后继续
- 停顿处的语调像被"切断"了，重新开始时升调或重音不自然
- 偶尔在停顿处插入一段不该有的尾音

老人对这种"机器人感"非常敏感，因为它和真人讲述方式不一样。

### 4.2 这是三层问题的叠加

**第一层：LLM 分句时机。** LiveKit 用一个分句 tokenizer 把 LLM 流式输出拆成"可送 TTS 的最小单元"。默认按句号、问号、感叹号切。问题是中文里有大量"，""；""——""……"等次级分隔符，按句号切会得到很长的一段；按逗号切又会太碎。

**第二层：TTS 是流式还是分块。** LiveKit 的 TTS 基类有两个方法：`synthesize()` 走 ChunkedStream（HTTP POST，一次性合成），`stream()` 走 SynthesizeStream（WebSocket，真正流式）。每个 Provider 的 `TTSCapabilities` 标明支不支持 streaming。

如果你的 TTS 不支持流式，LiveKit 会自动套一层 `StreamAdapter`：把文本按句切开，每句独立发一次 HTTP 请求。这就是"停顿"的真正来源——句子之间的 HTTP 往返时间 + TTS 启动时间，每次几百毫秒，连起来听就是"喘不上气"。

**第三层：协议兼容性。** 还有一个相对隐蔽的问题：如果你的 TTS server 把每个 chunk 当成独立 MP3 文件发出（每段都带 MP3 头），LiveKit 的解码器会在第二个 chunk 处报 `InvalidDataError: Invalid data found when processing input`。它期望的是"一条连续的音频流"，不是"一串完整的小文件"。

### 4.3 三个层次的针对性方案

**针对分句问题**（适合自部署 CosyVoice 的小暖场景）：

LiveKit 默认用 `blingfire` SentenceTokenizer，对中文支持一般。我们用了一个自定义 tokenizer：

```python
import re

class ChineseSentenceTokenizer:
    """中文友好的分句：长句到顶按强标点切，短句允许带次级标点。"""
    STRONG = "。！？；"
    WEAK = "，、"

    def __init__(self, min_len=20, max_len=80):
        self.min_len = min_len
        self.max_len = max_len

    def tokenize(self, text: str) -> list[str]:
        sentences = []
        buf = ""
        for ch in text:
            buf += ch
            if ch in self.STRONG:
                if len(buf) >= self.min_len:
                    sentences.append(buf); buf = ""
            elif ch in self.WEAK and len(buf) >= self.max_len:
                sentences.append(buf); buf = ""
        if buf:
            sentences.append(buf)
        return sentences
```

关键是给 TTS 既不要太碎（影响韵律）也不要太长（影响首字延迟）。20–80 字是小暖跑出来的经验值，不同 TTS 模型最佳区间不同，需要自己测。

**针对流式协议问题**（自部署 TTS）：

CosyVoice 2 及后续版本本身支持 bi-streaming，官方论文报告的流式模式延迟在 150ms 量级。但官方的 server 例子里有些版本会按句返回独立 wav 文件，要改成连续 PCM 帧返回。

正确的做法是 server 端只输出原始 PCM 帧序列（单一 sample_rate、单一 channels、单一 sample_width），让 LiveKit 客户端按帧组装。这样无论 LLM 输出多长，TTS 都是一条不间断的音频流。

**针对韵律断裂问题**（这个最难）：

即便流式没断，句子边界处的韵律仍然会被切断——因为 TTS 模型对每一段都从"句首"开始合成，没有承接上一段的语调上下文。

CosyVoice 2 引入了 chunk-aware causal flow matching 来缓解这个问题，通过统一流式和非流式合成框架，实现"无损流式合成"。但你必须在 server 端用流式 inference API（`inference_zero_shot_streaming` 或 `inference_cross_lingual_streaming`），而不是循环调 `inference_zero_shot`。这个差别非常大，是很多自部署 CosyVoice 的人没注意到的。

**小暖的最终方案**：

```
LLM 流式输出 → 自定义中文分句 → 缓冲到 20–80 字 → 推给 CosyVoice streaming API
                                                    ↓
                                  连续 PCM 帧（16/24 kHz, mono, s16）
                                                    ↓
                                       LiveKit AudioFrame 发送
```

### 4.4 一个权衡：要不要预合成？

对于固定话术（开机问候、断网提示、紧急救助引导），LiveKit 支持给 `session.say()` 传一段预合成的 audio，跳过 TTS，文本仍然进 transcript 和 chat context。

小暖把固定话术（约十几类）全部预合成成 wav 文件存在本地，包括：

- 唤醒应答（"我在呢""嗯，您说"）
- 思考占位（"让我想想""稍等啊"）
- 异常提示（"网络不好，我们再试一次"）
- 兜底应答（"这个我还没学过，能换种说法吗"）

这一项把感知延迟从 TTS 路径的几百毫秒降到本地播放的百毫秒以内，对老年用户的"被听到感"提升非常明显。代价是 TTS 风格或音色切换时这批音频要重新生成一遍。

## 五、重音字、多音字、特殊读法：中文 TTS 的"长尾难题"

### 5.1 这是哪一类问题

中文里：

- **多音字**："长大了"（zhǎng）vs "长江"（cháng）
- **数字读法**："2026 年 1 月"读"二零二六"还是"两千零二十六"
- **网络词**："yyds""dddd"——TTS 完全不知道怎么读
- **专有名词**：人名地名，"重庆"读 chóng 还是 zhòng
- **缩写**：API 读"A-P-I"还是"埃皮埃"
- **老年人特有的语境词**："拐杖""遗嘱""离休"——某些 TTS 在这些词上的训练样本不足

小暖给老人讲故事时，"还有""为了""都不"这类词出错频率最高——这些是"是否"问题（hái vs huán、wèi vs wéi、dōu vs dū），上下文依赖强。

### 5.2 四种解决路径的对比

| 方案 | 实现成本 | 维护成本 | 效果 | 副作用 |
|------|---------|---------|------|--------|
| A. 在 prompt 里让 LLM 输出注音 | 极低 | 极低 | 不稳定，LLM 经常忘 | 浪费 token，TTS 还要能解析 |
| B. 自定义文本替换（tts_node 拦截） | 低 | 中（要维护词表） | 高 | 覆盖率取决于词表大小 |
| C. SSML phoneme 标签 | 中 | 中 | 高 | 依赖 TTS 支持 SSML |
| D. TTS 自带 pronunciation dictionary | 中 | 低 | 高 | 不少 plugin（如 ElevenLabs）的 LiveKit 集成没暴露这个 API |

### 5.3 小暖的实际做法（方案 B + 部分 C）

我们的 `tts_node` 里做了一层正则替换，覆盖几百条高频易错词，分三类：

1. **多音字纠正词表**：针对"长、行、还、为、都、教、好"这类常见多音字的特定组合
2. **数字与时间归一化**：把"2026 年""1.5 公斤""下午 3 点半"等都转成 TTS 友好的明确表达
3. **专有名词词表**：主要是老年人熟悉的地名、医院名、药品名

代码骨架：

```python
async def tts_node(self, text: AsyncIterable[str], model_settings):
    async def normalize_stream():
        async for chunk in text:
            # 缓冲到完整词级别再替换，避免跨 chunk 错位
            yield self._apply_corrections(chunk)

    async for frame in Agent.default.tts_node(self, normalize_stream(), model_settings):
        yield frame

def _apply_corrections(self, text: str) -> str:
    for pattern, replacement in self._rules:
        text = pattern.sub(replacement, text)
    return text
```

有个关键陷阱：替换必须在 `tts_node` 里做，不能在 `chat_ctx` 里做。因为 `chat_ctx` 是要喂回给 LLM 的下一轮历史，里面有 SSML 或拼音替换会污染 LLM 的理解。

### 5.4 SSML 在中文 TTS 里的有限可用性

LiveKit 文档列了通用的 SSML 标签，但中文 TTS 对 SSML 的支持非常不均：

- **Azure TTS**：支持完整 SSML，包括 `<phoneme alphabet="sapi" ph="...">` 直接指定拼音
- **阿里云 TTS / CosyVoice**：支持有限的 SSML 子集，具体看版本
- **ElevenLabs**：SSML 标签解析在 LiveKit 集成的某些版本里出现过被剥离的回归问题（参见 `livekit/agents #3330`），中文支持总体仍弱

如果你用 Azure，可以这样做：

```xml
<phoneme alphabet="sapi" ph="zhong4 qing4">重庆</phoneme>
```

如果你用 CosyVoice，更简单粗暴：直接在替换层把"重庆"替换成拼音字符串或特殊 token——前提是你训练或微调时让它学会了这种标记。

小暖最终的策略是：用 CosyVoice 时纯走文本替换；万一上 Azure 多模态做某些场景，再开 SSML 路径。两条路并行维护一套词表，由 TTS 选择层决定走哪条。

## 六、打断与播放：barge-in 的微观工程

### 6.1 一次完整的打断生命周期

用户说"小暖小暖"时，Agent 正好在播一段菜谱。下面这条链上的每一步都不能掉链子：

```
T0    用户开始说话，麦克风采集到音频
T0+ε  AEC 处理：扣掉扬声器的 TTS 反馈
T0+α  VAD 触发 "speech detected"
T0+β  Adaptive Interruption Detector 判断：真打断 / 假打断
       ├─ 假打断（咳嗽、嗯哼）→ TTS 继续，可能记录事件
       └─ 真打断 → 进入下一步
T0+γ  TTS 立即停止（cancel SynthesizeStream，清空播放缓冲）
T0+δ  播放队列清空（已经在 jitter buffer 里的音频也要丢）
T0+ε' STT 切换到 active 状态，开始喂 user audio
T0+ζ  TTS 已播部分写入 chat_ctx（不是完整生成内容）
T0+η  Turn detector 启动，等待用户说完
```

每个箭头都是一次 IPC 或 channel 通信，加在一起是几百毫秒。任何一个环节漏掉就会出现"卡了一下""说了一半还接着说"等问题。

### 6.2 "停不下来"的常见原因

小暖排查过几次"Agent 不响应打断"的问题，原因按出现频率大致排序如下（具体比例和你的设备分布、网络质量强相关，这里只给定性排序）：

1. **客户端 AEC 不达标**（最常见）。用户的"打断声"被自家扬声器盖住了。
2. **Adaptive Interruption Handling 把它判成了假打断**。老人的"嗯啊"声音特征接近 backchannel，模型偏保守。
3. **TTS 播放缓冲过深**。Cancel 信号已发，但已在 jitter buffer 里的音频还要播完才能停。
4. **自定义节点没正确响应 cancel**。比如自己在 LLM 节点里跑了一个独立的协程，没监听 cancellation。
5. **网络抖动导致 cancel 信号丢失**。罕见但存在。

对应的调试动作：

- 装上 LiveKit 的 Agent Observability 工具，它把 audio playback、transcript、turn-by-turn trace 同步对齐到 timeline。
- 在 `agent_false_interruption` 事件上打 log，统计真假打断比例。
- 把 `interruption.mode="vad"` 临时切回去看是否问题在 Adaptive 模型。

### 6.3 "停太敏感"的对应

小暖另一个真实场景：老人在跟人聊家常，背景里 Agent 在播养生故事。家人偶尔搭一句话，Agent 就停了。

这种"我没在跟你说话"的打断是设计层面的难题。两种思路：

**思路 A：声纹识别 + 只回应注册主人。**

小暖采用的方案。后端维护一个 speaker embedding，采用独立的说话人识别模型——比如阿里开源的 3D-Speaker。注意 FunASR 本身主要提供 ASR 和 VAD，声纹验证不是它的核心模块，需要另外接入。STT 出来的每段语音先经过 verification，相似度低于阈值的直接丢弃（不进 turn detector）。

代价：第一次注册需要老人录一段声音（小暖让录 30 秒，太短模型不稳）；环境吵的时候 verification 也会误判，需要做置信度门限的兜底。

**思路 B：唤醒词模式。**

只有听到"小暖小暖"才进入对话。对老年人很自然（很多人本来就是这么叫的），打断逻辑简化了，但响应延迟会增加（要等唤醒词检测完成才能进入对话流），代价是体感上的"反应慢半拍"。

我们做了两种模式的 A/B：唤醒词模式打断更准，但"主动陪伴"场景（Agent 主动开口）下，用户回应时不会带唤醒词，体验割裂。最终主路径用声纹方案，唤醒词作为"专心模式"的备选。

## 七、LiveKit + Dify 集成的额外坑

小暖的 LLM 路径不是直连模型，而是走 Dify chatflow，因为 chatflow 里要做意图分类、记忆检索、TCM 知识 RAG、提醒入库等多重逻辑。这意味着 LiveKit 的 LLM 插件不直接对接 Qwen，而是对接一个 HTTP/SSE 接口。

这带来的问题：

### 7.1 First-token 延迟

Dify chatflow 里如果开了 RAG，第一个 token 出来通常要小一秒甚至更久。LiveKit 默认的 `min_endpointing_delay` 是 500ms，意味着用户说完后 500ms 触发 LLM，但 LLM 一秒后才有第一个字，加上 TTS 首字时间，端到端首字延迟轻松到 1.5 秒以上。老人感觉慢。

三个优化方向：

1. **Preemptive generation**：LiveKit 的 preemptive_generation 功能，在用户开始说话时就开始推测性生成响应，如果 chat_ctx 在 on_user_turn_completed 没变化就直接用，变了就重新生成。对小暖来说这个有用，但代价是会额外消耗 token——具体倍数取决于用户被打断的频率和推测响应的废弃率，长 dictation 场景下浪费明显，官方文档也明确建议这种场景下关掉。
2. **Dify 工作流分阶段**：把"快路径"和"慢路径"分开。快路径走轻量分类 + 模板回复（"好的""我看看""这事儿挺重要"），先吐出来；慢路径并行跑 RAG 和深度回复，吐回详细内容。这是个"双流"模式，挺折腾但效果显著。
3. **预合成开场白**：Dify 还没返回时，用 `session.say()` 播一句"我看看啊"——这一项是免费的，给后端 1–2 秒缓冲。

### 7.2 Dify 流式输出的解析

Dify 返回的 SSE 事件里有 `message`、`message_replace`（流式覆盖）、`workflow_finished` 等多种类型，不是直接的纯文本流。如果你简单地把 `data.answer` 拼接起来送给 TTS，会发生：

- 内容重复（workflow 阶段切换时会重发）
- 工具调用思考过程被读出来（"正在查询天气..."这种中间态被合成了）

正确的做法是只取 `message` 类型事件且过滤掉系统提示，送给 TTS。这个适配层 LiveKit 没有现成插件，要自己写。

### 7.3 chat_ctx 与 Dify 的 conversation_id 双轨

Dify 有自己的 conversation_id，维护对话历史在 Dify 服务端；LiveKit 的 chat_ctx 维护在 Agent 端。两边要保持一致是另一个坑：

- 用户打断了某次回复 → LiveKit 的 chat_ctx 只记录已播部分 → 但 Dify 那边记的是完整生成
- 下一轮 Dify 用了"它认为"的历史，跟 Agent 这边的认知不一致

小暖的做法是：让 Dify 不要记忆（关闭 memory），完整的对话上下文每次由 Agent 端从 chat_ctx 重组后整体喂给 Dify。这样状态只在一处，Dify 退化成"无状态计算"，trade-off 是每次调用 token 多点，但一致性问题彻底消失。

## 八、生产环境的"暗角"问题

下面这些问题不是必现的，但都真实发生过，知道了能省好几天。

### 8.1 Agent 加入房间时的首段音频丢失

我们和社区里都观察到：Agent 加入 LiveKit 房间后，首段音频会有秒级的延迟或部分丢失（`livekit/agents #3721` 里有一份完整的设备侧日志，作者实测约 3 秒）。原因是 DTLS 握手 + SCTP 初始化 + 第一个音频包到达之间的状态机不对齐。具体延迟值因网络、设备、是否 Cloud/自部署而异，不要把任何单一数字当成预期值。

对策：

- **预热房间**：用户开始连接前，让 Agent 提前 1–2 秒加入房间并开始 publish 一个静音 track。
- **首段重要音频走 prerecorded**：开场白用预合成 wav，不依赖 TTS。这样即便首段有抖动也是预录音频的丢失，损失最小。

### 8.2 长时间运行后音频开始"切断"

长时间运行 Agent 容器后，音频开始断断续续直到消失，必须重启容器（`livekit/agents #4076` 等 issue 里有类似报告）。这是个内存或资源泄漏问题，根因常常是：

- TTS 的 WebSocket 连接池没正确清理
- STT 流的 task 在打断后没被 await/cancel 干净
- Python 的 asyncio task 累积

对策：

- 监控 `asyncio.all_tasks()` 数量，超过阈值告警
- 在每次 session 结束做显式资源清理（不要依赖 GC）
- 容器加上 readiness probe，定期"重启自愈"

小暖的 GoFrame 后端管理 LiveKit token 时，会同时下发一个 `max_session_duration`，到点自动断开重连——既给 Python Agent 进程自然回收的机会，也防止某些边缘 bug 累积。

### 8.3 转写同步：用户看到的字幕和实际听到的音频不对齐

LiveKit 的 `TranscriptSynchronizer` 把 TTS 输出的 text 和 audio 帧对齐推送给前端。但如果用了非流式 TTS（StreamAdapter 包的那种），对齐是"伪对齐"——按句切的，句内字幕和音频对不上。

如果你的前端要展示实时字幕（小暖某些场景下展示），优先选择支持 `aligned_transcript` 的 TTS（如 Cartesia 的 `use_tts_aligned_transcript=True`）。中文场景里，CosyVoice 不原生支持 aligned_transcript，要自己做：在 server 端按 phoneme 时间戳输出，再在 client 端按时间戳渲染。这是工程量比较大的项，看需求严格性。

### 8.4 Token 与 Room 命名冲突

LiveKit 的 Room 是按 name 索引的，多端登录、用户重新打开 App 时如果用了相同的 room name 但旧 session 还没释放，新连接会被踢或者状态混乱。

小暖的方案是 room name 用 `user_id + timestamp + random_suffix`，保证唯一；旧 session 由后端在 token 下发逻辑里主动 disconnect。

## 九、给后续做语音 Agent 的人的几条建议

把上面所有内容压缩成可操作的建议：

1. **Turn Detection 必须用 Model-based 或 Adaptive，不要依赖 VAD-only。** VAD-only 适合 demo，不适合给真人用的产品。
2. **优先选支持原生流式（WebSocket/gRPC）的 TTS。** 如果只能用 HTTP TTS，做好心理准备：长文本会"喘气"，需要在自定义分句和缓冲上下大功夫。
3. **chat_ctx 的真实来源永远是"已播放确认的内容"，不是"LLM 生成的内容"。** 这个区别在打断频繁的场景下决定了你的对话连贯性。
4. **中文 TTS 不要指望 SSML 解决所有问题。** 词表 + 文本归一化是最稳的"老办法"，覆盖到生产质量需要持续维护。
5. **LiveKit + 自定义中间层（Dify、LangGraph、自家工作流）= 必须自己实现代际管理。** 默认的打断清理只覆盖原生插件，自定义节点是裸奔状态。
6. **老年人 / 儿童 / 特定方言用户群体，turn 参数必须重新校准。** 默认值是基于成年标准普通话或英语母语者样本训练出来的，照搬一定不对。
7. **把 Agent Observability 当成第一类工具，不是辅助。** 不会复现的诡异 bug 在那里能看到完整 timeline，比读 1000 行 log 高效得多。
8. **预录音频是被低估的优化。** 固定话术全部预录，节省 TTS 调用、降低延迟、提升一致性，几乎没有副作用。
9. **客户端 AEC 不达标的设备，直接拒绝接入。** 与其在服务端打补丁，不如在准入环节就过滤。
10. **不要相信 first-day demo 的延迟数字。** 跑一周、跑一个月，资源泄漏和边缘问题会陆续浮现，必须有可观测性和自愈机制兜底。

## 结语

LiveKit 是个非常优秀的实时通信基础设施，Agents 框架在 1.0 之后也成熟很多。但语音 AI 这个领域的复杂度，远超"接几个 API"的认知。真正的难度从来不在"能不能跑通"，而在"能不能给真实用户一种被理解、被尊重的对话体验"。

小暖项目走到今天，我们对一件事越来越笃定：好的语音 Agent 是工程品，不是模型秀。模型再强，调度、容错、协议、边界处理不对，体验就是断裂的。这些工作没有论文可以引用，也没有 benchmark 能衡量，只有一遍遍听老年人和系统对话、一次次问"刚才那一下为什么别扭"，才能慢慢逼近真正可用的状态。

希望这篇文章能帮后来者少走一些弯路。
