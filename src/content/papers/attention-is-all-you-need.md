---
title: Attention is All You Need
authors: [Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin]
venue: NeurIPS 2017
link: arXiv:1706.03762
lang: en
created: 2026-05-02
tags: [ai, transformers, attention, deep-learning]
---

The Transformer paper. Notable not just for what it did to NLP, but
for how completely it reorganised the field's intuitions about what
"sequence modelling" means.

## What I keep returning to

- The architectural courage of *removing* recurrence entirely. RNN
  hegemony in 2017 was complete; the move to pure self-attention was
  not gradual, it was absolute.
- The inductive bias is shockingly weak — no spatial structure, no
  temporal kernel, just learned positional encodings and pairwise
  interaction. Most of the prior work assumed strong sequence priors
  were necessary; this paper showed they were a crutch.
- The compute story matters at least as much as the algorithmic story.
  Self-attention is parallelisable along the sequence axis in a way
  RNNs are not. Without that compute property, Transformers would
  remain a curiosity, not the substrate of every frontier model.

## Misunderstandings to avoid

The "attention" in the paper title is **dot-product weighted
aggregation over learned representations**. It has, mechanistically,
almost no relationship to attention as understood in cognitive
neuroscience or psychology. Treating the two as the same concept is
an analogy, not an identity. (See [[Attention as relation, not state]]
for why this matters.)

## What it doesn't say

- It doesn't establish that scaling Transformers gives you general
  intelligence. That came later, empirically, and the authors didn't
  predict it.
- It doesn't address sample efficiency, alignment, interpretability,
  or any of the things that ended up dominating the next eight years
  of follow-on work.

But you don't fault a foundational paper for not foreseeing its own
descendants. You read it for the cleanness of the move.

Cross-link: [[The loop and the self]], for the question of whether
attention-as-aggregation is a candidate substrate for selfhood.
