---
title: 预测处理 101
title_en: Predictive processing 101
description: 我反复回到的一个框架的工作摘要。
description_en: A working summary of the framework I keep returning to.
lang: zh
status: seedling
created: 2026-05-02
tags: [neuroscience, philosophy, ai, free-energy]
---

大脑不是一台刺激-反应机器。它是一台**预测机器**——持续向感觉输入发出自上而下的假设，仅当预测误差熬过几层抑制后才修改这些假设。

## 极简描述

1. 皮层维持一个关于世界（以及关于身体）的层级生成模型。
2. 高层预测低层的活动。
3. 低层只回传那些*没有*被预测到的部分——残差。
4. **学习**是这些残差的长期最小化；**感知**是它们的短期最小化；**行动**则是"通过改变世界使其匹配预测"来最小化。

这就是**主动推断**（active inference）的框架（Karl Friston 及其同伴）。自由能原理称：任何在波动世界中维持自身边界的自组织系统，都*表现得仿佛*在最小化变分自由能。

## 我为什么反复回到这里

- 它溶解了感知、行动、注意之间的人为切分。三者成为同一个预测误差回路的三种状态。
- 它对**无聊**与**新奇**的体验质感给出了一个干净的、形式化的解释。
- 它是可计算执行的：你可以用 PyTorch 写一个小小的主动推断智能体，然后看它形成习惯、产生好奇、在模型崩溃时陷入恐慌。

## 我想咀嚼的开放问题

- *意识*是否是预测层级中的某种特定模式（全局工作空间作为高精度的注意瓶颈），还是与之正交？
- 这个框架如何处理**语言**——一半是运动行为，一半是符号底质？
- 我们应该多严肃地对待"LLM 在做某种相关的事——在学到的生成模型上做序列预测"这一说法？而那张图里*缺失*的是什么（具身、稳态）？

交叉链接：[[Attention as relation, not state]], [[The loop and the self]]。

---

## English

The brain is not a stimulus-response machine. It is a **prediction
machine** that issues continuous top-down hypotheses about its sensory
input and revises them only when prediction error survives several
levels of suppression.

## The minimal sketch

1. The cortex maintains a hierarchical generative model of the world
   (and of the body).
2. Higher levels predict the activity of lower levels.
3. Lower levels return only what was *not* predicted — the residual.
4. Learning is the long-run minimisation of these residuals; perception
   is the short-run minimisation; action is "minimisation by changing
   the world to match the prediction".

This is the **active inference** framing (Karl Friston and friends).
The free-energy principle says any self-organising system that
maintains its boundary against a fluctuating world will *behave as if*
it were minimising variational free energy.

## Why I keep coming back to it

- It dissolves the artificial split between perception, action, and
  attention. They become three regimes of the same prediction-error
  loop.
- It gives a clean, formal account of why **boredom** and **novelty**
  feel the way they do.
- It is computationally executable; you can write a small active-
  inference agent in PyTorch and watch it form habits, get curious,
  and panic when its model collapses.

## Open questions I want to chew on

- Is *consciousness* a particular pattern in the prediction hierarchy
  (the global workspace as a high-precision attentional bottleneck), or
  orthogonal to it?
- How does this framework handle **language**, which is half motor act,
  half symbolic substrate?
- How seriously should we take the claim that LLMs are doing a
  related thing — sequence prediction in a learned generative model —
  and what does *missing* in that picture (embodiment, homeostasis)?

Cross-links: [[Attention as relation, not state]], [[The loop and the self]].
