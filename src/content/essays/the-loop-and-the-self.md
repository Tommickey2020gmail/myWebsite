---
title: The loop and the self
description: On strange loops, predictive brains, and why an LLM is not (yet) a self.
lang: en
created: 2026-05-02
tags: [philosophy, ai, consciousness, cognitive-science]
---

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
