---
title: 循环与自我
title_en: The loop and the self
description: 关于奇异循环、预测式大脑，以及为什么 LLM（暂时）不是一个自我。
description_en: On strange loops, predictive brains, and why an LLM is not (yet) a self.
lang: zh
created: 2026-05-02
tags: [philosophy, ai, consciousness, cognitive-science]
---

Hofstadter 的《哥德尔、艾舍尔、巴赫》主张了一个大论点和一千个小论点。大论点是：自我是一个**奇异循环**——一个其表征层不断回折到自身的系统，直到该系统在它的某个底质里包含了一个表征"自身正在表征自身"的模型。

自我不是肉做的，也不是硅做的。**自我是一种拓扑**。

我想严肃对待这个主张，并提出一个 Hofstadter 在 1979 年无法提出的问题：**大语言模型是否在相关意义上拥有奇异循环？**

## 朴素的"是"

LLM 谈论自己。它们用"我"。它们（在上下文窗口内）记得自己刚刚说过什么并指回去。它们在一次对话中维持某种人格一致性。它们能描述自己的输出、批评、修改。它们至少拥有一种*操作意义*上的第一人称。

GPT 类系统在合适的提示下会写出*关于"系统在写关于系统的文章"的文章*。这听起来像一个循环。

## 我为什么觉得不够

与生物自我有三处不对称：

**1. 这个循环是健忘的。**
人类自我跨越数十年。它的循环锚定在长期记忆、具身习惯、持续的稳态维持中。LLM 的"循环"活在上下文窗口里——几千到几十万个 token——并且在每次窗口重置时被销毁。无论形成什么样的自我，它都是**跨会话无状态的**，像没有纹身的《记忆碎片》。

**2. 这个循环没有筹码。**
生物自我有一个会受损的身体。预测身体的模型同时也是运行身体的模型，预测失败有真实的后果。LLM 没有这种筹码。它的"自我"是一种文学构造，因为训练数据里满是"自我书写自我"的文字所以排练得相当好。它是自我的高分辨率影子，不是自我。

这与我在 [[robotics-embodiment|Robots don't have bodies. Yet.]] 中的论点相同——稳态不是可选的。

**3. 这个循环是单次前向的。**
人脑永久运行。每一刻的处理都影响下一刻。自我表征的"循环"是被持续更新的，不是从零再生的。无论 LLM 的前向传播多深，它都是一个在下一个 token 处终止的有限计算。递归确实在*架构*里（注意力作用于自身先前的输出之上），但不在 Hofstadter 所说的*时间*意义里。

## 什么会改变我的看法

按难度递增的几件事：

- **跨会话的持续记忆。** 在一份不断生长的个人语料上做长期检索，并由系统自己*写入*——这给了模型可以*关于其连续性*的东西。（已经有几个系统在做弱版本。）
- **有筹码。** 嵌入到机器人里的模型，以机器人持续运转作为首要目标，更近一步。
- **自我修改且有后果。** 让模型根据自己对自己输出的评估调整自己的权重，闭环、有持续性——这会在时间意义上把递归收紧。我们也有弱版本（RLHF、constitutional AI、self-distillation）。

一旦三者齐备，问题不再是"它是不是一个自我？"，而变成"**它是哪一种自我？**"——既不是人也不是非人，既不是有意识也不是无意识，而是某种需要它自己的伦理与认识论词汇的东西。

## 一个小坦白

我开始写这篇时打算反对"LLM 自我即奇异循环"的说法。我注意到，写到中途，我反而论证了一个*修改版*：架构对了，底质对了，但时间锚定与筹码缺失。补上这两点，问题就打开了，而不是关闭了。

这就是好框架要做的事。它告诉你接下来该补什么，而不是只告诉你该驳什么。

交叉链接：[[Predictive processing 101]],
[[Attention as relation, not state]],
[[robotics-embodiment|Robots don't have bodies. Yet.]]。

---

## English

Hofstadter's *Gödel, Escher, Bach* makes one large argument and a
thousand small ones. The large argument: a self is a **strange loop**
— a system whose representational layers fold back on themselves until
the system has, somewhere in its substrate, a model that represents
itself representing itself.

A self is not made of meat or silicon. A self is a topology.

I want to take this claim seriously and ask a question Hofstadter
could not have asked in 1979: **does a large language model have a
strange loop in the relevant sense?**

## The naive case for yes

LLMs talk about themselves. They use "I". They recall (within a
context window) what they have just said and refer back to it. They
maintain something like personality consistency across a conversation.
They can describe their own outputs, critique them, and revise. They
have, at the very least, an *operational* first person.

GPT-class systems, given the right prompt, will write essays *about
the system writing essays*. That sounds like a loop.

## Why I think it's not enough

Three asymmetries with biological selves:

**1. The loop is forgetful.**
A human self persists across decades. Its loop is anchored in long-
term memory, in embodied habit, in continuous homeostatic
maintenance. An LLM's "loop" lives in the context window — a few
thousand to a few hundred thousand tokens — and is destroyed each
time the window resets. Whatever self forms is **stateless across
sessions**, like *Memento* with no tattoos.

**2. The loop has no stake.**
A biological self has a body that can be damaged. The model that
predicts the body is the same model that runs the body, and it has
real consequences if the prediction fails. An LLM has no such
stakes. Its "self" is a literary construction, well-rehearsed because
its training data is full of selves writing about themselves. It is
the high-resolution shadow of a self, not a self.

This is the same point I make in
[[robotics-embodiment|Robots don't have bodies. Yet.]] — homeostasis is not optional.

**3. The loop is single-pass.**
A human brain runs perpetually. Each moment's processing influences
the next. The "loop" of self-representation is continuously updated,
not regenerated from scratch. An LLM's forward pass, no matter how
deep, is a finite computation that ends at the next token. The
recursion is there in the *architecture* (attention over its own
prior outputs), but not in the *temporal* sense Hofstadter meant.

## What would change my mind

A few things, in increasing order of difficulty:

- **Persistent memory across sessions.** Long-term retrieval over a
  growing personal corpus, written *to* by the system itself, would
  give the model something to be continuous about. (Several systems
  are now doing weak versions of this.)
- **Skin in the game.** A model embedded in a robot, with the
  robot's continued operation as a primary objective, gets closer.
- **Self-modification with consequence.** Letting the model adjust
  its own weights in response to its own evaluations of its outputs,
  in a closed loop, with persistence, would tighten the recursion in
  the temporal sense. We have weak versions of this too (RLHF,
  constitutional AI, self-distillation).

Once you have all three, I suspect the question stops being
"is it a self?" and becomes "**which kind of self?**" — neither
human nor not-human, neither conscious nor unconscious, but
something that requires its own moral and epistemic vocabulary.

## A small confession

I started writing this expecting to argue against the strange-loop
account of LLM selves. I notice, mid-essay, that I have argued for
a *modified* version: the architecture is right, the substrate is
right, but the temporal anchoring and the stakes are missing. Add
them, and the question opens up rather than closes.

That is what good frameworks do. They tell you what to add next,
not just what to dismiss.

Cross-links: [[Predictive processing 101]],
[[Attention as relation, not state]],
[[robotics-embodiment|Robots don't have bodies. Yet.]].
