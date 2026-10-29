---
title: "Reqdrive: A Draft Until It Earns Otherwise"
date: 2026-10-28
excerpt: "Reqdrive turns a written requirement into a pull request using Claude Code. The pull request opens as a draft unless the harness has evidence that the work is done."
category: software
tags: ["reqdrive", "agents", "bash", "open-source"]
draft: true
---

> **Editor's note. Delete this note before publishing.** Reqdrive has no tagged release yet. Its README and `install.sh` also clone a placeholder URL (`github.com/user/reqdrive.git`), so the install command fails as written. Fix the URL, and tag a release if you want one, before this goes out. Then resolve every `[CONFIRM]` below.

[Reqdrive](https://github.com/adbarc92/reqdrive) is an open-source command-line tool that turns a requirement written in markdown into a GitHub pull request. It is written in Bash and MIT-licensed.

## What it does

You write a requirement as a short markdown file. Reqdrive asks Claude Code to break it into a list of user stories. It then implements the stories one at a time, one model call per story, in a fixed order. Reqdrive runs your test command itself; it does not take the model's word that the tests passed. At the end it opens a pull request.

The pull request is a draft by default. It opens as ready for review only when three conditions all hold: the story list exists, no story is left incomplete, and the test command actually passed. Anything missing keeps it a draft.

## Why it is built this way

Anyone can connect an agent to a repository and have it open pull requests. The hard part is the handoff, where the machine's confidence becomes a reviewer's problem. Reqdrive is built for that handoff, and for not overstating what it did.

Three more choices follow from that:

- **The tests are frozen.** The test suite is pinned by a hash, so an agent that edits or deletes a test to make it pass is caught. CI also plants a violation on purpose and checks that the freeze actually catches it.
- **Requirement text is untrusted input.** A requirement file is screened for prompt-injection and path tricks before it reaches a prompt or a shell, and placeholder tokens are stripped from it so it cannot forge one.
- **It is plain Bash.** It needs only bash, jq, git and gh, so it runs the same on Linux, WSL and Windows with MSYS2. An earlier version had seventeen scripts and shipped nothing. It was cut to five.

## What I learned

The most useful lesson was about my own tests. The old suite ran with `set -e`, which stops a script at the first error. As a result, the suite could not report a failure: it either passed or stopped before it got to report anything. Every green run I had trusted was green by construction. Rewriting it found that the draft gate had been failing open in three separate ways.

The review step has a limit I have not solved. It uses the same model that wrote the code, and it runs after the pull request is created, so it is not an independent check. I would rather say that here than have it look like one.

The code is at [github.com/adbarc92/reqdrive](https://github.com/adbarc92/reqdrive). [CONFIRM: version number to quote once a release is tagged; 0.3.0 is in the source.]
