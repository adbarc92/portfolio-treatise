---
title: "ContextCurator: The Evaluation That Told Me to Delete My Feature"
date: 2026-11-23
excerpt: "ContextCurator's semantic relevance policy was meant to be the whole differentiator. A pre-registered evaluation showed it losing to BM25, and pointed at what actually works."
category: software
tags: ["context-curator", "claude-code", "evaluation", "retrieval"]
draft: true
---

**I spent weeks building the one feature that made my tool "differentiated." Then I ran the evaluation I'd committed to in advance, and it told me to delete it.**

I'm building **[ContextCurator](https://github.com/adbarc92/context-curator)** — a tool that gives Claude Code a durable memory across sessions, re-loading the *relevant* prior context when you start a new task. My design doc was explicit about where the value lived: a semantic relevance policy (embed every stored chunk with a `bge` model, embed the current task, re-load by cosine similarity). In my own words, that policy was "the entire differentiated build." Everything else was plumbing.

So I did the thing most side projects skip. Before collecting data, I **pre-registered** the test: a minimum effect worth shipping (+0.10 nDCG@10 over cheap baselines), a session-clustered confidence interval, and a precision gate that refuses to render a verdict when the sample is underpowered. "Gold" wasn't my opinion of relevance — it was defined mechanically as *what the session actually went back and re-read.*

The pilot looked great: **+0.129**. Green light.

Then power caught up with it. On a properly powered synthetic corpus (which I'd deliberately rigged to *favor* semantics): **+0.056** — half my bar. On real sessions from five different projects: **−0.053**. Semantic similarity didn't just fail to win. It **lost to BM25** — 1970s keyword matching.

The pilot's green was a textbook underpowered false positive. Pre-registration is the only reason I caught it instead of shipping it.

Here's the tempting takeaway: *"fancy neural embedding loses to dumb keyword search."* Cute, and wrong.

Because `bge-small` isn't the "learning" here. It's a **frozen, off-the-shelf encoder** that adapts to nothing about coding sessions. It's a hand-encoded human guess — "relevance means semantic similarity" — wearing an ML costume. That guess *is* the baked-in prior. BM25 won because it assumes *less* about meaning and instead tracks the data's actual structure: when a session re-reads a file, it re-reads it by its *identifier* — a path, a symbol — and exact-match beats fuzzy 384-dimensional cosine every time.

That's Sutton's **bitter lesson**, with the AI-looking component playing the role of the human prior. The lesson was never "reach for the neural net." It's "let the data, at scale, choose the representation."

So I finally tested *actual learning*. A plain logistic regression over cheap features — BM25 score, recency, chunk length, tool type. No embeddings. No model server.

**nDCG@10: 0.306 — versus BM25's 0.102 and the embedding's 0.091.** +0.203. Roughly twice my original bar.

Three things I'm keeping:

1. **Pre-register, or you'll ship your own false positives.** My pilot was +0.129 and dead wrong.
2. **The "AI" part of your system can be the dumb human prior.** Frozen features are assumptions, not learning.
3. **The evaluation harness that proves you wrong is the most valuable thing you'll build.** Mine killed my headline feature and pointed at the real one. That's not a failure — that's the whole job.
