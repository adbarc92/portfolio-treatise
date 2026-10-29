---
title: "Reqdrive: A Draft Until It Earns Otherwise"
date: 2026-10-28
excerpt: "Reqdrive turns a written requirement into a pull request using Claude Code, and is meant to open that pull request as a draft unless the work is proven done. An audit of my own code found that the gate does not yet hold."
category: software
tags: ["reqdrive", "agents", "bash", "open-source"]
draft: true
---

> **Editor's note. Delete this note before publishing.** Reqdrive has no tagged release. Its README and `install.sh` clone a placeholder URL (`github.com/user/reqdrive.git`), so the install command fails as written. The repo's own drift report (`docs/canon/requirements/drift-report.md`, DES-002, critical) says the draft gate fails open four ways, and no code has changed since. This post says so. Decide whether to fix the gate before publishing, and update the post if you do. Resolve every `[CONFIRM]` below.

[Reqdrive](https://github.com/adbarc92/reqdrive) is an open-source command-line tool that turns a requirement written in markdown into a GitHub pull request. It is written in Bash and MIT-licensed.

## What it does

You write a requirement as a short markdown file. Reqdrive asks Claude Code to break it into user stories and then works through them one at a time, retrying a story that fails. Reqdrive runs your test command itself; it does not take the model's word that the tests passed. At the end it opens a pull request.

The pull request is meant to open as a draft unless three conditions all hold: the story list exists, no story is incomplete, and the test command actually passed. That rule is the point of the tool.

## Why it is built this way

Anyone can connect an agent to a repository and have it open pull requests. The hard part is the handoff, where the machine's confidence becomes a reviewer's problem. A draft pull request is an honest way to say "not proven yet", so the design makes draft the default and makes the work earn its way out.

Two other choices come from the same idea:

- **Reqdrive's own tests are frozen.** Its test suite is pinned by a hash in CI, and CI plants a violation on purpose to check that the pin catches it.
- **Requirement text goes into prompts carefully.** The prompt is a fixed template with explicit placeholders. Placeholder tokens are stripped from the requirement text, so a requirement cannot forge one.

## What I learned

**My tests could not fail.** The old test suite ran with `set -e`, which stops a script at the first error. As a result, the suite could not report a failure: it either passed or stopped before it reported anything. Every green run I had trusted was green by construction.

**The gate does not hold yet.** I later audited the code against its own requirements. The worst finding was about the feature the tool exists for: the draft gate fails open in four ways, and a pull request could open as ready for review with real work left incomplete. The audit found other defects as well. A Claude timeout or crash exits with success. The documentation promised path-traversal checks that don't exist. A refactor I had described as a simplification left the code larger than the version it replaced. None of these is fixed yet. [CONFIRM: update this paragraph if you fix the gate before publishing.]

**I wrote my own claims ahead of the code.** None of these defects was subtle. Each sat in a gap between what a document said and what the code did, and I had been reading the document. That is the reason for the audit, and for publishing the result here.

The review step has a limit too. It uses the same model that wrote the code, and it runs after the pull request is created, so it is not an independent check.

The code and the full drift report are at [github.com/adbarc92/reqdrive](https://github.com/adbarc92/reqdrive).
