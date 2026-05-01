---
title: 脑电专注力训练器（概念）
title_en: EEG attention trainer (concept)
description: 一个闭环生物反馈装置，奖励"以任务为根的参与"而不是"特征模仿"。
description_en: A closed-loop biofeedback rig that rewards task-grounded engagement, not signature mimicry.
lang: zh
created: 2026-05-02
featured: true
stack: [Python, PyTorch, MNE, Muse 2 / OpenBCI, FastAPI]
tags: [eeg, biofeedback, attention, robotics]
---

一个长期的副项目，目前在慢炖模式。

## 为什么

大多数面向消费者的神经反馈应用奖励的是脑电特征：alpha/theta 比、前额叶不对称、SMR 上调。[[Attention as relation, not state]] 里我的论点是：这是**把工具当成了判据**。

这个项目是我尝试构建一台装置——*任务*才是判据，脑电只是一个让回路更快的工具。

## 当前架构草图

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│  Muse 2 /   │  raw  │  Preproc +   │ feat. │  Task engine │
│  OpenBCI    ├──────►│  bandpower   ├──────►│  (game/work) │
└─────────────┘       └──────────────┘       └──────┬───────┘
                                                    │ task-
                                                    │ grounded
                                                    │ score
       ┌────────────────────────────────────────────▼───────┐
       │  Reward shaper:  60% task perf  +  40% EEG align   │
       │  (alignment is checked against a per-user baseline,│
       │   not a population-mean signature)                 │
       └────────────────────────────────────────────────────┘
```

我要对抗的事：每个商业产品都把 **EEG 对齐** 当作主要奖励。我希望它是次要奖励，并且要在做完个人基线后才使用。

## 当前状态

- 数据流 + 频段功率提取流水线：✅ Muse 2 上跑通
- 个人基线校准：✅ 跑通（休息 + N-back 任务）
- 任务引擎：🚧 自适应难度的 dual-N-back 原型
- 奖励整形：🚧 在阅读 Goodhart 抗性奖励设计的文献，特别是从 RLHF 借灵感
- 硬件：长期偏好 OpenBCI Cyton 以获得 16 通道余裕；但 Muse 2 用于验证概念已足够

## 开放问题

- Transient hypofrontality 是有用的仪表对象，还是混杂因子（参见 [[心流与机器]]）。
- 上线方式：研究工具包（自带任务）还是打磨过的消费品（一个任务、调到极致）。
- 隐私：脑电是生物特征数据。默认本地优先，无显式同意不上云。

## 接下来

一个 dual-N-back 任务上的小公开原型，做足仪表化以便奖励整形器的行为可被检视。装置跑起来后，大概会写一篇配套随笔，谈 Goodhart 感知的奖励设计。

仓库：暂未公开。准备好后会与本站仓库并排存放。

---

## English

A long-running side project, currently in slow-cook mode.

## Why

Most consumer neurofeedback apps reward EEG signatures: alpha/theta
ratios, frontal asymmetry, SMR uptraining. The argument in
[[Attention as relation, not state]] is that this is an **instrument
mistaken for a criterion**.

This project is my attempt to build a rig where the *task* is the
criterion and the EEG is merely an instrument that gets the loop
faster.

## Architecture (current sketch)

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│  Muse 2 /   │  raw  │  Preproc +   │ feat. │  Task engine │
│  OpenBCI    ├──────►│  bandpower   ├──────►│  (game/work) │
└─────────────┘       └──────────────┘       └──────┬───────┘
                                                    │ task-
                                                    │ grounded
                                                    │ score
       ┌────────────────────────────────────────────▼───────┐
       │  Reward shaper:  60% task perf  +  40% EEG align   │
       │  (alignment is checked against a per-user baseline,│
       │   not a population-mean signature)                 │
       └────────────────────────────────────────────────────┘
```

The thing I'm fighting against: every commercial product makes
**EEG-alignment** the primary reward. I want it to be the secondary
reward, and only after individual baselining.

## Current status

- Streaming + bandpower extraction pipeline: ✅ working with Muse 2
- Per-user baseline calibration: ✅ working (resting + N-back tasks)
- Task engine: 🚧 prototype dual-N-back with adaptive difficulty
- Reward shaper: 🚧 reading literature on Goodhart-resistant reward
  designs, especially scrutinising RLHF for ideas
- Hardware: prefer OpenBCI Cyton long-term for 16-channel headroom,
  but Muse 2 is fine for proving the concept

## Open questions

- Whether transient hypofrontality is a useful instrumentation target
  or a confound (see [[心流与机器]]).
- Whether to ship as a research toolkit (BYO task) or a polished
  consumer artefact (one task, well-tuned).
- Privacy: EEG is biometric data. Local-first by default, no cloud
  sync without explicit opt-in.

## What's next

A small public prototype on the dual-N-back task, instrumented enough
that the reward shaper's behaviour can be inspected. Probably a
companion essay on Goodhart-aware reward design once the rig is
running.

Repo: not yet public. Will live alongside this site's repo when ready.
