---
title: "Command-Center: Running Coding Agents Is an Operations Problem"
date: 2026-10-28
excerpt: "One coding agent is a demo. A fleet of them is a system that crashes, overspends and loses track of itself. Command-Center is a Rust control plane built to keep the facts straight when that happens."
category: software
tags: ["command-center", "agents", "rust", "open-source"]
draft: true
---

[Command-Center](https://github.com/adbarc92/command-center) runs coding agents in disposable Docker containers and supervises them. It is open source under the MIT licence, and the repository has been public since 2026-07-25.

## What it is

A daemon written in Rust, `fleetd`, takes a unit of work and runs an agent on it inside a throwaway container. It drives the agent through building, checking and review, under hard limits on spending (in US dollars) and on wall-clock time, and then opens a pull request. A desktop app built with Tauri and Svelte watches the fleet live.

## Why I built it

The README states it in one line: running autonomous coding agents well is a systems problem, not a prompting problem. Once you run more than one agent, the hard questions are about operations. What happens when the machine reboots mid-run? Who notices a container left running? What stops a loop that spends money all night? Command-Center answers each of these in code, not in a prompt.

## How it holds together

- **One source of truth.** Every unit's phase and its full event log live in SQLite, written by the daemon. If the daemon crashes, a restart replays the log and nothing is lost.
- **A reconcile loop.** Every 30 seconds, and at startup, the daemon compares its records with what Docker reports. It removes stray containers and halts stranded runs, and it leaves alone any unit with a live driver.
- **Budgets with teeth.** There is a spending cap per unit and a rolling 24-hour cap for the whole fleet. When an agent keeps hitting rate limits, it is parked for a person to look at instead of retrying forever.
- **A frozen oracle.** The acceptance tests are hashed when they are frozen, during the spec phase. An agent that changes its own tests is sent to a person, and the check comes back armed after every restart.
- **A free demo.** A fake runner lets the whole system run with no Docker and no API key, at no cost.

## What I learned

- **Check that CI runs the tests you think it runs.** The desktop app's Rust tests lived in a separate workspace, and CI had never run them. Five of seven test tiers were advisory rather than required until I fixed that.
- **A flaky test is not always a race.** A test that failed intermittently looked like a race in the spending cap. It was a bug in the test scenario, and the cap was fine.
- **Package the thing, then use it.** The packaged desktop build shipped without the folder its plugins load from, so no packaged build could load a plugin. Only a manual run of the packaged app found it.
- **Localhost is not private.** Any website you visit can send requests to a server on your own machine. So the daemon's allowed-origins list is never "allow everything".

You can try the demo mode from source today. The code is at [github.com/adbarc92/command-center](https://github.com/adbarc92/command-center).
