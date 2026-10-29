---
title: "AppForge: Workers That Never Collide"
date: 2026-10-28
excerpt: "AppForge is a multi-agent orchestration engine. A single state server and a pool of independent worker processes move a product idea through six phases, with human approval gates and a budget that downgrades models as it runs low."
category: software
tags: ["appforge", "agents", "mcp", "python", "open-source"]
draft: true
---

> **Editor's note. Delete this note before publishing.** Resolve every `[CONFIRM]` below.

[AppForge](https://github.com/adbarc92/appforge) is an engine for coordinating many AI agents on one project. Version 1.0.0 was released on 2026-07-25 under the MIT licence, and the project is now finished and frozen.

## What it is

AppForge takes a product idea through six phases: Clarify, Design, Code, Test, Deploy and Iterate. Each phase is a set of tasks with dependencies between them. A roster of specialized agents does the work, among them a product manager, an architect, frontend and backend engineers, QA and a technical writer.

The point of the project is the orchestration, not the app it produces. By default the agents run in a mock mode, which is free, fast and repeatable. A mode that calls a real model exists, but the tests don't exercise it. The README is direct about this: AppForge is not a finished app generator.

## Why it is built this way

Most demos of an "AI dev team" are one process running agents in a loop. AppForge is built the other way round, to make three properties true and testable:

- **Parallel by default.** Any task whose dependencies are met can be claimed at once by any free worker.
- **Coordinated, not chaotic.** One MCP state server owns the task graph and is the only process that writes to the database. Workers are separate operating-system processes. A worker claims a task with an atomic compare-and-swap, so two workers can never take the same one. Leases, heartbeats and a reaper mean a task may be attempted more than once, but it takes effect exactly once.
- **Safe to run unattended.** People approve the work at gates after Clarify and after Design. At 85% of the budget, later agents are switched to cheaper models. At 95% the run pauses for a person to acknowledge it, and at 100% it stops.

Each claim has a test behind it. The headline one starts eight real worker processes against twelve contested tasks, then checks the database to prove each task ran exactly once.

## What I learned

AppForge was rewritten in July 2026. The first version used a single supervisor process built on LangGraph, which is the one-loop design described above. Replacing it with a state server and independent workers is what made the concurrency claims testable at all.

After the rewrite, an end-to-end job in CI turned red. I first blamed a "database is locked" error, which fitted the new design's riskiest part. The real cause was older: browser tests still exercised the retired flow. The error message pointed at the part I was most nervous about, not at what had actually changed.

To try it, run `uv sync`, then `uv run appforge run "Build a todo app" --workers 4`. The [release](https://github.com/adbarc92/appforge/releases/tag/v1.0.0) and a documented sample run are in the repository. [CONFIRM: anything to add about why you stopped at 1.0.]
