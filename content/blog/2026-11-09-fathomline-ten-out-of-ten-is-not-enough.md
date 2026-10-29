---
title: "Fathomline: Ten Out of Ten Is Not Enough"
date: 2026-11-09
excerpt: "A robot policy that succeeds in ten of ten trials has shown only that its true success rate is probably above 69%. Fathomline is an evaluation harness that will not pass a policy on less evidence than its threshold needs."
category: software
tags: ["fathomline", "robotics", "evaluation", "statistics"]
draft: true
---

> **Editor's note. PUBLISH ON NOV 9, not before. Delete this note before publishing.** On launch day, check each claim against what actually shipped. In particular, check whether `reproduce` and the first published result are live, and cut or rewrite any paragraph marked `[CONFIRM at launch]`. Do not claim the container image is publicly pullable, or that results reproduce across machines, unless both are true on the day.

[Fathomline](https://github.com/adbarc92/fathomline) is an open-source harness for evaluating learned robot policies. It is meant to run as a gate in CI. It is MIT-licensed and written in Python.

## The problem

Robot-learning results are often reported as a success rate over a few episodes, commonly around ten. A policy that succeeds ten times out of ten looks perfect. But with ten trials, the most you can say is that its true success rate is probably above about 69.2%. That is the lower end of the two-sided 95% exact (Clopper–Pearson) confidence interval for ten successes in ten trials. A perfect score on a small sample proves much less than it seems to.

## What Fathomline does

Fathomline passes a policy only when three things hold. First, the lower bound of the success-rate interval clears a threshold declared in advance. Second, the run reaches a declared minimum number of episodes. Third, no monitor flagged the run as falling outside its declared conditions. A sample that is too small fails automatically. So does a flagged run, however well it scored. The monitor framework is built and the gate honours its flags, but which conditions are monitored is still open. [CONFIRM at launch: name the monitors that shipped, or keep this sentence.]

The harness, not the policy, is the product. The test policy is a fixture: SmolVLA on one LIBERO task, run in simulation, on CPU, inside a container. Fathomline owns the step loop, behind small `Env`, `Policy` and `Monitor` interfaces, and LeRobot sits behind a single adapter. LeRobot and every model artifact are pinned to an exact version. Each claim in the README is paired with the command that proves it. A command that is not built yet says so and exits with a distinct code; it does not pretend to work.

## What I learned building it

The early experiments are in the repository, and they changed the design more than any plan did.

- **Results depend on the library version.** The same checkpoint with the same seed gave different outcomes under different LeRobot versions, which is why every version is pinned exactly.
- **Identical containers are not identical machines.** The hash of the actions differed between CI runners using the same image. So Fathomline makes no claim of cross-machine determinism, and the README says so.
- **The fixture is a mediocre policy, and that is useful.** It succeeded on 27 of 50 baseline episodes, which is 54%, with an interval of roughly 39% to 68%. I then ran eight perturbed conditions, 30 episodes each. Dimming the lights, adding camera noise or nudging the objects a few centimetres cut success to between 7% and 10%. Swapping the two cameras, losing the action statistics or giving it another task's instruction took it to zero. Brighter light hurt less, and paraphrasing the instruction made no detectable difference.
- **Obvious safety bounds are often wrong.** A bound that looks sensible on the gripper action would have flagged healthy runs: the gripper value goes past ±1 on 68% of clean steps.

## What is there today

[CONFIRM at launch: describe exactly what shipped on Nov 9. The planned floor is one `docker run … reproduce` on a clean container that matches one published `result.json`, and the first published result is planned as a deliberate gate FAIL. If either slipped, say so plainly or cut this section.]

The limits are stated in the README. It covers simulation only and makes no claim about hardware. The LeRobot stack runs only on Linux. It is an early build. It is not a benchmark or a leaderboard.

The code is at [github.com/adbarc92/fathomline](https://github.com/adbarc92/fathomline).
