---
title: Robots don't have bodies. Yet.
description: Why current humanoids are still disembodied, and what would change that.
lang: en
status: seedling
created: 2026-05-02
tags: [robotics, ai, embodiment, philosophy]
---

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
