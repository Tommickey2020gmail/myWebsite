---
title: 机器人还没有身体
title_en: Robots don't have bodies. Yet.
description: 为什么当下的人形机器人仍然是脱离具身的，以及什么会改变这一点。
description_en: Why current humanoids are still disembodied, and what would change that.
lang: zh
status: seedling
created: 2026-05-02
tags: [robotics, ai, embodiment, philosophy]
---

2026 年的人形机器人有作动器、传感器，越来越多还运行着一颗在板载 GPU 上跑的基础模型作为"大脑"。它能走路、能操作物体，能回答关于自己刚才做了什么的问题。

但它仍然没有**身体**——不是在具身认知所说的那种意义上的身体。

## "拥有身体"真正要求的是什么

借用 Andy Clark、Linda Smith 和更早的实施认知主义者的观点：

1. **通过世界闭合的感觉-运动耦合。** 身体不是大脑指挥的外设；身体是大脑*预测进入*的底质。预测、误差、行动构成一个单一的回路。
2. **可供性地景。** 世界是按身体能对它做什么来被感知的。一段楼梯之所以"可攀登"，只在腿长和扭矩预算的相对意义上成立。
3. **稳态（homeostasis）。** 身体有筹码——它会损耗、会疼、会饿。没有这些，"自我保存"就只是一条指令，而不是一种驱力。

当下的人形机器人对 #1 的满足是弱的（回路存在，但被 LLM 的文本世界模型主导）；对 #2 是脆弱的、由数据学到的方式；而对 **#3 完全没有满足**。电池百分比是最接近的类比，但它对能动性的构成性远不如疼痛之于我们。

## 真正有趣的前沿

有趣的问题不是要不要把模型做得更大。是我们能否做出这样的机器人：它的策略网络以**自身的稳态状态**作为主要损失函数，任务奖励只是次要的。这是一个非常不同的优化曲面，可能会产出在质上不同的行为：会*累*的机器人，会*偏好*某条路线（出于能量原因）的机器人，会*回避*伤害（不是因为被指令所要，而是因为伤害真的疼）的机器人。

我会论证：那才是"机器人"不再是"自动机器"的隐喻、而开始更接近"主体"的时刻。

相关：[[Predictive processing 101]], [[The loop and the self]]。

---

## English

A humanoid robot in 2026 has actuators, sensors, and increasingly a
foundation-model "brain" running on a beefy onboard GPU. It can walk,
manipulate, and answer questions about what it just did.

It still does not have a **body**, in the sense embodied cognition
means it.

## What "having a body" really demands

Drawing from Andy Clark, Linda Smith, and the older enactivists:

1. **Sensory-motor coupling that closes through the world.** The body
   isn't a peripheral that the brain commands; it is the substrate that
   the brain *predicts into*. Predictions, errors, and actions form a
   single loop.
2. **Affordance landscapes.** The world is perceived in terms of what
   the body can do with it. A staircase is "climbable" only relative
   to leg length and torque budget.
3. **Homeostasis.** Bodies have stakes — they degrade, hurt, hunger.
   Without that, "self-preservation" is an instruction, not a drive.

Current humanoids satisfy #1 weakly (the loop exists, but is dominated
by the LLM's textual world-model), #2 in a brittle, learned-from-data
way, and **#3 not at all**. Battery percent is the closest analogue,
and it is not constitutive of agency the way pain is for us.

## The interesting frontier

The interesting question isn't whether to scale models bigger. It's
whether we can make robots whose policy networks are trained against
**their own homeostatic state** as a primary loss, with task rewards
as secondary. That is a very different optimisation surface, and
might produce qualitatively different behaviour: robots that get
*tired*, that *prefer* one route over another for energetic reasons,
that *avoid* damage not because instructed to but because damage hurts.

That, I'd argue, is when "robot" stops being a metaphor for
"automated machine" and starts being something closer to "agent".

Related: [[Predictive processing 101]], [[The loop and the self]].
