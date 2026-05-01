---
title: Predictive processing 101
description: A working summary of the framework I keep returning to.
lang: en
status: seedling
created: 2026-05-02
tags: [neuroscience, philosophy, ai, free-energy]
---

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
