---
title: "Halyard: A Release Is a State Machine, Not a Pipeline"
date: 2026-10-28
excerpt: "A CI job cannot wait the days an App Store review takes. Halyard models each platform's release as a durable state machine with transitions that are safe to repeat and gates that fail closed."
category: software
tags: ["halyard", "release-engineering", "typescript", "open-source"]
draft: true
---

[Halyard](https://github.com/adbarc92/halyard) is an open-source tool for releasing one app to several platforms at once: iOS, Android, web and desktop. It is made of a TypeScript command-line tool, a library and a set of GitHub Actions workflows. Version 0.1.0 was released on 2026-09-02 under the MIT licence.

## Why a state machine

A release pipeline is usually drawn as a line: build, test, upload, ship. That model breaks as soon as a mobile store review is involved, because no CI job can stay open for the hours or days a review takes. So Halyard does not run a release as one long job. It records each platform's release as a state that lives in git. For a mobile app, the happy path is `tagged → built → tested → uploaded → in_review → shipped_dark → live`. Web and desktop releases skip the review states, and there are states for releases that are rejected, rolled back or dead. Each transition is a short, separate step that can run whenever the outside world is ready for it.

The last step is a deliberate one. "Shipped dark" means the build is in users' hands behind a feature flag. Going live means a person flipping that flag on purpose.

## The rules it keeps

- **It mirrors, it does not own.** The store consoles, the flag provider and the error tracker hold the truth. Halyard's records copy what they report and never override it.
- **Repeating a step changes nothing.** Every transition has a deduplication key, so running a handler a second time is safe. That is what makes the design durable: anything can crash and be run again.
- **Gates are yes-or-no checks.** No model decides whether to ship or to flip a flag. AI agents in Halyard only draft text and sort items into a queue for a person to approve.
- **Secrets are references.** Configuration names a secret; it never contains one. A raw secret in a config file is rejected when the file loads.
- **The diagram is tested.** A test checks the state diagram in the README against the transition table in the code, so the documentation cannot drift from the behaviour.

## What I learned

The most useful work came after the features were done. Writing tests to prove the gates failed closed turned up a case where they didn't: a re-run could deploy a release whose own record said it was dead. That was fixed, and the README gained a "Limits" section listing what Halyard still does not do. One limit: a failed gate ends that platform's release but does not stop the whole launch. Another: a failure recorded inside a CI run is not written back, so running the workflow again starts fresh.

A smaller lesson was that documented facts drift. At one point the test count quoted in the docs was off by 160.

## Try it

The demo runs offline and needs no accounts:

```
npm install && npm test && npm run demo
```

It is not published to npm. The code is at [github.com/adbarc92/halyard](https://github.com/adbarc92/halyard).
