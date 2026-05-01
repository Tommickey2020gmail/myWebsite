---
title: EEG attention trainer (concept)
description: A closed-loop biofeedback rig that rewards task-grounded engagement, not signature mimicry.
lang: en
created: 2026-05-02
featured: true
stack: [Python, PyTorch, MNE, Muse 2 / OpenBCI, FastAPI]
tags: [eeg, biofeedback, attention, robotics]
---

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
