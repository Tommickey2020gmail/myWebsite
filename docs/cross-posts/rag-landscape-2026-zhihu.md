# RAG 技术全景与流派分析:从检索增强生成到上下文工程

> 本文首发于个人站 <https://tommickey.cn/essays/rag-landscape-2026/> ,欢迎转载,请保留原文链接。
>
> 从 2020 年 Lewis 的 RAG 论文到 2026 年的 Context Engineering ,六年的演进、六大流派的对比、四类落地场景的差异化方案,一次性掰开讲清楚。

## 摘要

自 2020 年 Lewis 等人正式提出 RAG(Retrieval-Augmented Generation,检索增强生成)至今,特别是 2022 年末 ChatGPT 引爆 LLM 浪潮以后,RAG 从一项学术上的"非参数化记忆"补充技术,迅速演变为企业级 AI 落地的事实标准基础设施。**2024 年被业内称为"RAG 之年",2025 年则在"长上下文是否会取代 RAG"的争论中完成了从"可用"到"可控、可观测、可工程化"的产业化跨越**。截至 2026 年初,RAG 正经历从"检索增强生成"这一具体模式,向以"智能检索"为核心能力的"上下文引擎(Context Engine)"的整体性蜕变。

本文系统梳理 RAG 的演进脉络(朴素 RAG → 高级 RAG → 模块化 RAG → GraphRAG → Agentic RAG → Context Engineering),对当前的六大主流流派进行系统对比,并针对**个人事务助理、老人陪伴、公司项目管理、企业客服**等典型场景,给出差异化的架构选型与落地建议。

## 一、RAG 的源起与发展脉络

### 1.1 起源:从开放域问答到非参数化记忆(2017—2020)

RAG 的思想根基可追溯至开放域问答的早期工作。2017 年 DrQA 等"检索+阅读"管道证明:将外部文档作为知识源、用神经网络阅读理解,可在维基百科尺度的语料上做问答。

2020 年迎来两个里程碑——REALM 将一个可微分的检索器嵌入到语言模型预训练中;同年,Facebook AI 的 Lewis 等人正式提出"Retrieval-Augmented Generation"框架,使用 BART 作生成器、DPR 作检索器,将参数化记忆(模型权重)与非参数化记忆(外部向量索引)系统化地结合。

此时 RAG 还是小众的学术议题,服务对象是 BERT/BART 规模的模型,解决的问题是开放域 QA 的事实正确性与可更新性。

### 1.2 引爆:LLM 时代的"刚需补丁"(2022 底—2023)

2022 年 11 月 ChatGPT 问世,迅速暴露了大模型在企业落地中的"四宗罪":**知识截止、私域无知、幻觉严重、不可追溯**。RAG 从学术名词被工程界重新发掘,成为最直接的"补丁"——无需昂贵的 fine-tuning,只要把企业知识切片入库、查询时检索拼接到 prompt 中,就能让模型回答自己原本不知道的事情,且答案可引用、可审计。

值得一提的是,"RAG"这个名词在 2023 年初并未广泛流行,业界更多使用"外部记忆""外部知识库""长期记忆"等临时叫法。直到 LangChain、LlamaIndex 等开源框架将"loader → splitter → embedding → vector store → retriever → prompt → LLM"这一整套管线标准化,"RAG"才真正成为通用术语。

### 1.3 "RAG 之年":技术分层与首次系统化(2024)

2024 年是 RAG 真正意义上的爆发年。标志性事件:

- Naïve RAG 暴露的问题使 **Hybrid Search + Rerank** 成为生产环境的事实底线
- **Microsoft 开源 GraphRAG**,将知识图谱重新拉回检索增强主舞台
- **Anthropic 提出 Contextual Retrieval**,为每个 chunk 生成上下文增强后再嵌入,召回准确率显著提升
- **Self-RAG / CRAG / Adaptive RAG** 等"自反思"型方法相继出现
- 评测从"看 Demo"走向系统化——**Ragas、ARES、ARAGOG、TREC 2024 RAG Track** 把 RAG 拉入了可比较、可复现的工程学科

到 2024 年底,业内基本形成共识:RAG 不是单一算法,而是一整条由"索引—召回—重排—生成—评测—反馈"组成的工程管线,其架构层次可清晰划分为 **Naïve / Advanced / Modular** 三层。

### 1.4 Agent 化与图化:流派分化(2025)

2025 年,故事线变得复杂。一方面,**长上下文模型**(Gemini 1.5 的 1M 窗口、Claude 200K+ 、GPT-4 Turbo 128K)的成熟,引发了"长上下文是否会取代 RAG"的激烈辩论。实测:在延迟、成本不敏感、查询模式相对固定的场景中,长上下文确实可以绕开 RAG 的召回噪声;但在 TB 级知识库、多用户并发、强权限隔离场景下,RAG 仍是经济上、工程上不可替代的方案。

另一方面,**Agentic RAG** 成为关键词。传统 RAG 是"一次检索—一次生成"的固定管线,Agentic RAG 让 LLM 作为决策核心,主动判断查询复杂度、自主选择检索工具、必要时多轮迭代检索与自我纠错。

同时,**GraphRAG 持续演化**——Microsoft 发布的 LazyGraphRAG 将索引成本降低到原版的 0.1%,使大规模语料上的 GraphRAG 变得经济可行。

到 2025 年底,业内主流观点是:**单一 RAG 架构正在解体,取而代之的是"自适应 RAG"**——由一个 query classifier 决定每条查询走哪条管线。

### 1.5 上下文工程:RAG 的下一站(2026)

RAGFlow 在 2025 年末提出的 **"From RAG to Context"** 观点,代表了一个更宏观的视角:RAG 正在从一个具体技术,演化为"上下文引擎(Context Engine)"——为 Agent 提供"恰当的知识 + 恰当的工具描述 + 恰当的历史记忆 + 恰当的用户画像"的统一基础设施。

在 MCP(Model Context Protocol)大规模铺开后,企业内可被调用的工具/API 常常有数百上千个,"工具选择"本身就是一个检索问题。RAG 的内核——"在巨量上下文候选中找到此刻最该呈现给模型的那一小撮"——天然适合扩展到这个更广的语境。

**2026 年的 RAG 并不是"被取代",而是"被泛化"**:它不再仅仅是"为生成提供知识",而是"为智能体提供恰当的上下文"。

**RAG 演进里程碑(汇总表)**

| 阶段 | 时间 | 代表性技术 | 核心特征 |
| --- | --- | --- | --- |
| 开放域 QA 前史 | 2017—2019 | DrQA、ORQA、BERT-QA | 检索+阅读两阶段 |
| RAG 提出 | 2020 | REALM、Lewis RAG、DPR | "参数+非参数"双记忆 |
| 工程化萌芽 | 2023 | LangChain、LlamaIndex | Naïve RAG 标准化 |
| RAG 之年 | 2024 | GraphRAG、Contextual Retrieval、Self-RAG、Ragas | 分层 + 评测体系成型 |
| 流派分化 | 2025 | Agentic RAG、LazyGraphRAG、Adaptive RAG | Agent 化决策 + 自适应路由 |
| 上下文工程 | 2026— | Context Engine、MCP 工具检索 | RAG 泛化为 Agent 上下文供给基础设施 |

## 二、RAG 的核心组件与基础架构

不论流派如何分化,所有 RAG 系统在底层都共享同一个流程骨架。

### 2.1 离线索引(Indexing)

- **文档解析**:PDF(含扫描件、表格、公式)、Word、PPT、HTML、Markdown、代码、数据库表等异构源的统一抽取。这是 RAG 的"第一道生死关"——解析错了,后面所有环节都白做。
- **文档清洗**:去重、去乱码、去模板套话、归一化术语。
- **切片(Chunking)**:固定长度、递归字符切分、按语义切分、按文档结构切分、Late Chunking、Contextual Chunking 等。切片粒度过粗会引入噪声,过细则丢失上下文,是 RAG 调优的核心痛点之一。
- **嵌入(Embedding)**:中文场景下 bge-m3、bge-large-zh、Qwen-Embedding 是主流;英文场景下 text-embedding-3-large、Cohere Embed v3、Voyage-3 较常用。
- **入库**:Milvus、Qdrant、Weaviate、Pinecone、Chroma、pgvector 等,通常同时建立稀疏倒排(BM25/SPLADE)和元数据过滤索引。

### 2.2 在线检索(Retrieval)

- **查询改写**:HyDE(生成假设性答案再去检索)、Query Expansion、Multi-Query、Sub-Query Decomposition。
- **混合检索(Hybrid Search)**:稠密向量 + 稀疏关键词(BM25/SPLADE),通过 RRF 融合。**混合检索通常比纯向量检索准确率高 15-30%**,对专有名词、产品型号、精确数值类查询尤为关键。
- **元数据过滤**:按文档时间、部门、权限、文档类型等结构化条件先过滤再检索。
- **重排(Reranking)**:用 Cross-Encoder(bge-reranker、Cohere Rerank、Jina Reranker)或 Late Interaction 模型(ColBERT)做精排。**重排被业内公认为"性价比最高的 RAG 优化"**。

### 2.3 生成与后处理(Generation)

- **提示构造**:注意上下文窗口预算、片段顺序("中间遗忘"现象)、引用格式。
- **引用与可溯源**:强制模型输出 citation tag,把每个事实主张映射到具体源 chunk。
- **后置校验**:用规则、模型或独立校验器(Self-Check、NLI 判别器)核查生成内容是否"被检索证据支持"。
- **评估闭环**:Recall@K、MRR、Faithfulness、Answer Relevancy、Context Precision、Context Recall(Ragas 五件套)。

## 三、当前 RAG 的六大主流流派

以下六大流派并非互斥,而是在不同复杂度、成本与场景下的最佳实践。**一个成熟的企业 RAG 系统,往往是几种流派的组合而非择一**。

### 3.1 Naïve RAG(朴素 RAG)

**典型流程**:Query → Embedding → Top-K 向量检索 → 拼接到 prompt → LLM 输出。

**优点**:实现成本极低;技术栈成熟;对简单事实型问答效果尚可。

**局限**:**在生产环境中失败率高达 40%**。召回精度不足、切片丢上下文、缺乏权限控制、无法回答全局/跨文档问题、对多跳推理无能为力。

**适用场景**:个人知识库、PoC、低风险 FAQ 机器人。**不建议作为面向客户/合规要求高的生产系统**。

### 3.2 Advanced RAG(增强型 RAG)

**关键增强**:语义切片、Contextual Chunking、Hybrid Search、HyDE/Multi-Query、Cross-Encoder Reranker、LongLLMLingua 上下文压缩、引用-生成对齐。

**适用场景**:**绝大多数企业落地的"主力架构"**。性价比最高、可维护性最强。

### 3.3 Modular RAG(模块化 RAG)

**核心价值**:把 RAG 拆解为可替换、可编排的独立模块,通过 DAG 或 Flow 定义任意组合方式。**把"算法选型"和"业务流程"解耦**——同一套底座可以服务多个业务,只需配置不同模块。

**代表框架**:LlamaIndex Query Engine + Router、Haystack Pipeline、DSPy、RAGFlow。

**适用场景**:中大型企业的 RAG 平台层。

### 3.4 GraphRAG(图增强 RAG)

**定位**:不再以"文档切片"为最小单位,先用 LLM 从语料中抽取实体与关系,构建知识图谱,然后通过图遍历 + Community Summary 来回答查询。

**关键变体**:
- Microsoft GraphRAG:开山之作,索引成本高但效果显著
- LazyGraphRAG(2025):**将索引成本降至原版的 0.1%**,使大规模语料经济可行
- HippoRAG / NodeRAG:受神经科学启发的图结构变体
- Hybrid GraphRAG:图检索 + 向量检索混合(Neo4j、Weaviate、LlamaIndex 已原生支持)

**优势**:解决 Naïve RAG 在跨文档、全局摘要、多跳关系类问题上的结构性缺陷。例:监管合规中跨多份条文的关联分析、医药研发中跨论文的实体关系挖掘、金融反欺诈中跨账户的关系网络。**索引比向量索引更稳定**——"张三是 A 项目负责人"这种事实不会因为周报更新而变化。

**适用场景**:金融反欺诈、医药研发、法律分析、情报分析、企业组织/项目知识网络等"关系即价值"的场景。

### 3.5 Agentic RAG(智能体 RAG)

**核心能力**:
- 查询复杂度判断(要不要做检索?做几次?)
- 工具选择(向量库?SQL?外部 API?搜索引擎?)
- 多步骤检索(Chain-of-Retrieval)
- 自反思(Self-RAG:检索证据够不够?)
- 自纠错(CRAG:低置信度时回退到 Web 搜索或拒答)

**代价**:**成本和延迟显著上升**。一次 Naïve RAG 查询约 $0.001,Hybrid+Rerank 约 $0.005,Agentic RAG 则常在 $0.02—$0.10。延迟从亚秒级跳到 5—30 秒。

**适用场景**:**确实需要多步推理的高价值查询**:复杂客服工单诊断、研报撰写、数据分析助手、合规审查。对简单事实型问题用 Agentic RAG 是纯粹的浪费。

### 3.6 Adaptive RAG / Context Engine(自适应 / 上下文工程)

**典型路由**:

- 简单事实 → Advanced RAG
- 关系/全局型 → GraphRAG
- 复杂多跳 → Agentic RAG
- 结构化数据 → Text-to-SQL
- 无需检索 → 直接走 LLM 参数化记忆

更进一步的 Context Engine 视角:RAG 的内核能力是"在巨量上下文候选中精准选取此刻该呈现的那一小撮",这一能力可扩展到知识、工具描述、对话历史、用户画像等所有上下文要素。**在 MCP 普及、单一 Agent 可调用工具数量动辄上百的今天,"工具检索"本身就是一种 RAG**。

### 3.7 六大流派对比矩阵

| 流派 | 复杂度 | 单次成本 | 延迟 | 最适合的问题 | 不适合的问题 |
| --- | --- | --- | --- | --- | --- |
| Naïve RAG | ★ | $0.001 | <1s | 简单 FAQ、PoC | 全局/多跳/精确名词 |
| Advanced RAG | ★★ | $0.005 | 1-2s | 企业知识问答、客服 | 复杂跨文档推理 |
| Modular RAG | ★★★ | $0.005-0.02 | 1-3s | 平台层、多业务复用 | —(架构层选择) |
| GraphRAG | ★★★★ | 构建昂贵 / 查询中等 | 2-5s | 关系/全局/多跳 | 实时性强、简单事实 |
| Agentic RAG | ★★★★ | $0.02-0.10 | 5-30s | 复杂推理、研报 | 简单事实、成本敏感 |
| Adaptive/Context | ★★★★★ | 按路由分摊 | 按路由 | 全场景平台 | 小团队、初期项目 |

## 四、关键专题:几个值得单独讨论的子方向

### 4.1 长上下文 vs RAG:互补而非替代

Google 研究表明,在资源充足时长上下文(LC)模型在多数任务上略优于 RAG;但 RAG 的成本优势依然显著。**Self-Route 类工作提出"按需路由"**——简单问题用 RAG,复杂综合任务用 LC,由模型的自反思动态决定。

结论:长上下文不会"杀死"RAG,但会改变 RAG 的角色——chunking 可以更粗,生成阶段可以塞更多候选,从而显著降低召回噪声敏感度。

### 4.2 多模态 RAG

- **统一嵌入派**:CLIP/SigLIP/Cohere Multimodal 等模型把图像和文本嵌入同一空间,做统一向量检索
- **视觉文档派**:ColPali、ColQwen-VL 等"视觉文档"模型直接用 VLM 处理整页 PDF/PPT 截图,跳过 OCR。这是 2024—2025 的明显趋势——**尤其在表格、公式、图表密集的文档上效果显著优于"OCR + 文本 RAG"**

### 4.3 Long-Term Memory(长期记忆)与 RAG 的关系

LTM 和 RAG 在工程上高度重叠但思想取向不同。RAG 通常面向"静态知识库",LTM 则面向"动态交互记忆"——每次对话都在写入、更新、遗忘。代表方案:MemoryBank、Letta(MemGPT)、Mem0、Charlie Mnemonic。这一块我在《[从 Claude Code 到小暖:两类 AI 的记忆哲学之辨](https://tommickey.cn/essays/claude-code-vs-xiaonuan-memory/)》里有专门展开。

### 4.4 评测:RAG 从"看 Demo"走向工程学科

**常用框架**:Ragas、ARES、TruLens、DeepEval、Phoenix。

**核心指标**:

- 检索侧:Recall@K、MRR、NDCG、Context Precision、Context Recall
- 生成侧:Faithfulness、Answer Relevancy、Answer Correctness
- 业务侧:Deflection Rate、AHT、FCR、CSAT/NPS

**把评测视为 RAG 项目的"一等公民"**——每次切片策略、嵌入模型、Reranker 的变更都要在固定测试集上跑回归。

## 五、典型场景的 RAG 选型与落地建议

针对四类有代表性的场景,给出从架构选型、组件配置到运营建议的差异化方案。**原则:先评估查询复杂度分布、再选型;先跑 Advanced RAG 打基线、再按瓶颈引入 GraphRAG/Agentic 等更重方案**。

### 5.1 个人事务助理

**画像**:个人化、低并发、跨设备、强隐私、多模态输入、上下文随时间演化。

**推荐架构**:
- 流派组合:**Advanced RAG(静态资料层) + LTM(动态记忆层)**,可选轻量 Agentic RAG 用于复杂查询
- 索引分层:静态资料(邮箱、笔记、Drive、收藏) + 动态记忆(对话历史、偏好、待办、人际关系)。两层独立索引、独立更新
- 嵌入:本地优选 bge-m3、Qwen-Embedding;云端可用 Cohere Embed v3、text-embedding-3-large
- 向量库:Chroma、Qdrant(本地)、LanceDB(嵌入式)
- 记忆:重要性评分、遗忘曲线、定期整合
- 多模态:语音用 Whisper / FunASR / SenseVoice;图片 VLM caption;PDF 优先 ColPali

**特别注意**:
- 隐私优先:能本地化的尽量本地化
- 低延迟:单次响应建议 <2 秒
- **避免"过度 Agent 化"**:90%+ 查询是简单事实,Agentic RAG 只在"整理这周会议要点并起草周报"这类任务上启用

### 5.2 老人陪伴

**画像**:语音为主、对话开放式、**情感价值 ≥ 知识价值**、用户表达模糊、知识需要绝对安全(医疗/用药不容出错)、强家属/照护者协同。

**推荐架构**:
- 流派组合:**Advanced RAG(医疗/政策安全知识层) + LTM(个人记忆) + 严格 Guardrail 层**;不建议引入复杂 Agentic RAG
- 索引分层:权威知识(医疗百科、用药指南、当地养老政策) + 个人记忆(家庭关系、爱好、健康档案) + 家属共享(备注、医嘱、紧急联系人)
- 检索严格度:医疗类启用"**高置信度阈值 + 强制权威来源 + 必要时拒答兜底**"——宁可不答,也不能给错误医疗建议
- 情感对话:**纯闲聊路径绕开 RAG,直接走 LLM**;只在涉及具体事实/健康/操作时触发检索
- ASR:CosyVoice/FunASR/SenseVoice 对老人方言/口音友好;TTS 自然、慢速、温和

**特别注意**:
- 分级响应:日常陪伴 → 一般咨询 → 健康紧急(触发 CRAG + 自动通知家属)
- 家属可见性 + 老人隐私边界
- 低教育水平友好:查询改写要能处理"那个治高血压的白药片"这种口语化表达
- 权威医疗知识至少季度审核

### 5.3 公司项目管理

**画像**:多项目、多角色、**强关系性**(人-项目-任务-文档-需求-缺陷-依赖)、跨工具系统、强权限隔离。

**推荐架构**:
- 流派组合:**GraphRAG(项目关系网络) + Advanced RAG(文档内容) + Agentic RAG(跨系统综合查询)**。是"必须用 Graph"的典型场景
- 知识图谱建模:节点(项目、人、任务、需求、缺陷、文档、会议、客户);边(负责、参与、依赖于、引用、跟进、合并自)。由 Jira/GitLab API 同步实时更新
- 文档 RAG:Confluence、PRD、设计文档,按章节/标题层级切片
- Agent:支持"项目 A 本周的风险点是什么?""谁负责模块 X 的最新接口变更?""把昨天的会议纪要拆成行动项"
- 权限:所有检索带 user_id/project_id 过滤;多租户每个项目独立 namespace
- 引用强制:每个回答给出 Jira ticket、Confluence 页面、Git commit 源链接

**特别注意**:
- 时效性:CDC 流式同步而非全量重建
- **结构化查询占比高**:"按状态/负责人/截止日期筛选"应路由到 Text-to-SQL 或 API,不要硬走向量检索
- 会议纪要尤其重要——很多决策只存在于会议中

### 5.4 企业客服

**画像**:高并发、低延迟、可量化 ROI、严格 Guardrail、跨产品线、多语言、人工坐席接管。

**推荐架构**:
- 流派组合:**Advanced RAG(核心) + Modular RAG(多业务复用) + Adaptive 路由**
- 知识源分层:公开知识 + 客户私有数据(强权限) + 操作指令(可执行客服动作)
- **混合检索 + 强 Rerank 是底线**——客服查询里专有名词、型号、错误码极多
- Guardrail:竞品提及拦截、价格/承诺审核、敏感话题转人工
- 人在环路:低置信度自动转人工;坐席处理结果回流形成飞轮
- 评测:Deflection Rate、AHT、FCR、CSAT,以及"幻觉率""引用准确率"

**特别注意**:
- 严控幻觉:**宁可"我没找到相关信息,请稍候为您转人工"也不要编造**
- 多语言:bge-m3、Cohere multilingual + 语种检测路由
- ROI:成熟企业 RAG 客服可降低 70-90% 幻觉率、提升 20-40% 自助率,常达到 $3-4 返回每 $1 投入

### 5.5 场景架构选型速查表

| 维度 | 个人助理 | 老人陪伴 | 项目管理 | 企业客服 |
| --- | --- | --- | --- | --- |
| 核心流派 | Advanced + LTM | Advanced + Guardrail + CRAG | GraphRAG + Advanced + Agentic | Modular + Advanced + Adaptive |
| 是否需图谱 | 否 | 否 | **强需要** | 弱 |
| 是否 Agent 化 | 轻 | 极轻(避免) | 中 | 选择性 |
| 延迟要求 | <2s | <3s(语音) | <5s | <2s(高并发) |
| 首要风险 | 隐私 | 医疗安全 / 情感伤害 | 权限泄露 | 幻觉 / 合规承诺 |
| 关键评测 | 满意度 | 安全率 / 拒答得当率 | 引用准确率 / 关系正确率 | Deflection / AHT / CSAT |
| 典型部署 | 本地+云混合 | 本地优先 | 私有云 + 系统集成 | 云端 + 多租户 |

## 六、落地建议:从 0 到 1 的工程实践要点

### 6.1 分阶段路线图

- **Stage 0 — 业务前置**:明确至少一个有可量化收益的具体场景。绘制 50—200 条真实查询作为评测基准
- **Stage 1 — 基线**:Advanced RAG 跑通端到端,重点投资 Parsing、Hybrid Search、Reranker。**不要在 Naïve RAG 上浪费时间**。目标:Answer Correctness >60%、延迟 <2s
- **Stage 2 — 优化**:Contextual Chunking、查询改写、引用强制、Guardrail。建立 Ragas 评测流水线。目标:Answer Correctness >75%、幻觉率 <5%
- **Stage 3 — 流派分化**:根据失败 case 模式定向引入 GraphRAG / Agentic RAG。引入 query classifier 做 Adaptive 路由
- **Stage 4 — 平台化**:Modular RAG 作为公司级 AI 中台,所有业务共用一套底座

### 6.2 七个容易踩的坑

1. **迷信 Naïve PoC** — 一个能跑的 PoC 离生产可用有 10 倍距离,Naïve RAG 生产成功率仅 10-40%
2. **Chunk 策略一刀切** — 不同文档类型(合同、手册、对话、代码)应有不同切片策略
3. **忽视 Parsing** — PDF 表格、扫描件、PPT 图表是大多数 RAG 系统的隐形杀手,投资在文档解析的回报往往**高于换更贵的嵌入模型**
4. **没有评测就调优** — 每个改动必须在固定测试集上量化
5. **过度 Agent 化** — Agentic RAG 成本和延迟是 Advanced 的 5-20 倍,若 90% 查询是简单事实,全量 Agent 化是巨大浪费
6. **忽视权限和合规** — 多租户隔离、PII 脱敏、可追溯引用应在 Day 1 就做架构设计
7. **把 RAG 当作"上线就完事"** — RAG 是动态系统,需要持续运营团队

### 6.3 技术栈推荐(参考组合)

| 层级 | 推荐组件 |
| --- | --- |
| 文档解析 | 小:Unstructured.io、PyMuPDF;大:Azure Document Intelligence、AWS Textract、ColPali |
| 切片 | LlamaIndex SemanticSplitter、Contextual Retrieval、Late Chunking |
| 嵌入 | 中:bge-m3、Qwen-Embedding;英:text-embedding-3-large、Cohere Embed v3、Voyage-3 |
| 向量库 | 起步:Chroma、pgvector;规模化:Milvus、Qdrant、Weaviate;托管:Pinecone |
| 稀疏检索 | Elasticsearch、OpenSearch(BM25)、SPLADE |
| Reranker | bge-reranker-v2-m3、Cohere Rerank、Jina Reranker、ColBERTv2 |
| 编排 | LangChain/LangGraph、LlamaIndex、Haystack、DSPy、RAGFlow、Dify |
| 知识图谱 | Neo4j、TigerGraph、NebulaGraph;实现:Microsoft GraphRAG、LightRAG |
| 评测 | Ragas、ARES、TruLens、Phoenix、DeepEval |
| 可观测性 | Langfuse、LangSmith、Helicone、Arize Phoenix |

## 七、展望:从 RAG 到上下文工程

回顾 2020—2026 的演进,RAG 完成了一个完整的"S 曲线":从学术补丁,到工程标配,到流派分化,再到平台化与泛化。**每一波 LLM 能力的升级(更长上下文、更强 Agent 能力、更好的多模态),都没有"杀死"RAG,反而让 RAG 的内核——"在巨量候选中精准提供恰当上下文"——变得更加不可或缺**。

展望 2026 及以后,几条值得关注的趋势:

1. **上下文工程(Context Engineering)将取代 RAG 成为更准确的描述词**,把知识检索、工具检索、记忆检索、用户画像检索统一为 Agent 的上下文供给体系
2. **多模态视觉文档 RAG(ColPali 系)将逐步取代"OCR+文本 RAG"** 成为复杂文档处理的主流
3. **GraphRAG 与 Agentic RAG 的边界进一步模糊**,"Agent on Graph" 成为常见模式
4. **评测和可观测性会变得和模型本身同等重要**
5. **端侧/小模型 RAG 会因隐私和成本驱动迎来新发展**,老人陪伴、个人助理类场景尤为典型

最后想强调:**RAG 从来不是单一算法,而是一种"让大模型与真实世界知识动态对齐"的工程哲学**。流派的选择不是技术信仰之争,而是基于业务场景、查询模式、成本预算、合规要求的工程权衡。本文给出的所有架构建议都不是"最优解",而是在多个约束下"足够好且可演进"的起点——**真正的 RAG 工程,始于场景理解,成于持续迭代**。

## 附录:核心术语对照

| 术语 | 英文 | 简要说明 |
| --- | --- | --- |
| 朴素 RAG | Naïve RAG | "检索-拼接-生成"三步管线 |
| 增强 RAG | Advanced RAG | 每个环节叠加优化 |
| 模块化 RAG | Modular RAG | 拆为可编排模块,便于多业务复用 |
| 图增强 RAG | GraphRAG | 知识图谱替代/补充向量索引 |
| 智能体 RAG | Agentic RAG | LLM 作为决策核心,多轮检索、自我纠错 |
| 自适应 RAG | Adaptive RAG | 分类器路由不同查询到不同管线 |
| 上下文工程 | Context Engineering | RAG 的泛化形态 |
| 混合检索 | Hybrid Search | 稠密向量 + 稀疏 BM25 融合 |
| 重排 | Rerank | Cross-Encoder 精排 |
| RRF | Reciprocal Rank Fusion | 排名倒数融合多路检索的算法 |
| 上下文检索 | Contextual Retrieval | Anthropic 方案:chunk 增强后再嵌入 |
| 晚交互 | Late Interaction | ColBERT:token 级查询时匹配 |
| 长期记忆 | Long-Term Memory (LTM) | 面向动态记忆,与静态 RAG 互补 |
| MCP | Model Context Protocol | Anthropic 主导的工具上下文标准 |

---

**原文链接(含完整 JSON-LD、参考文献、持续更新版本):** <https://tommickey.cn/essays/rag-landscape-2026/>

**关于作者:** Tommy(tommickey),在哲学、AI、机器人、EEG 生物反馈、心理学、认知衰退预防与科幻的交点上思考与构建。

更多文章:<https://tommickey.cn> · GitHub:<https://github.com/Tommickey2020gmail> · 个人公众号:专心公益

**相关阅读:**
- 《[GEO 与 SEO:当搜索引擎不再返回链接,而是直接说出答案](https://tommickey.cn/essays/geo-vs-seo/)》——RAG 是 GEO 的底层架构,理解 RAG 才能理解 AI 怎么"选择"引用源
- 《[从 Claude Code 到小暖:两类 AI 的记忆哲学之辨](https://tommickey.cn/essays/claude-code-vs-xiaonuan-memory/)》——RAG 与 LTM(长期记忆)的分野,以及陪伴 AI 为什么需要混合架构
