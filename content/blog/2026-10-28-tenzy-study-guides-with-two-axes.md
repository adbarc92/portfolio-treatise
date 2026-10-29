---
title: "Tenzy: Study Guides with Two Axes"
date: 2026-10-28
excerpt: "Tenzy is a study app built on one idea: a set of facts is easier to learn as a grid than as a stack of cards. It is live on iOS, Android and the web."
category: software
tags: ["tenzy", "mobile", "react-native", "shipped"]
draft: true
---

Tenzy is a study app. It is live on the [App Store](https://apps.apple.com/us/app/tenzy/id6761376913), on [Google Play](https://play.google.com/store/apps/details?id=com.tenzy.app) and on the web at [tenzy.app](https://tenzy.app). The current version is 1.4.2. It is published by OpenBarclay, the name I ship products under.

## What it is

Most study apps are flashcard apps. Each card holds one fact, and you flip through them one at a time. Tenzy is built around a different unit, which it calls a 2D study guide. A guide is a grid: terms run down the side and categories run across the top, and each cell holds one fact about one term. A guide to the planets might have the planets as rows and mass, moons and distance from the sun as columns. When you learn from the grid you learn how the facts relate to each other, not just each fact on its own.

There are five ways to study a guide: Flashcard, Matching, Written, Random and Review. Review schedules cards by spaced repetition. Goals, streaks and progress tracking sit around those modes, and a guide syncs between phone and browser. The free tier gives you one guide of your own plus the public guides. A subscription, or a one-time lifetime purchase, removes that limit.

## Why I built it

Flashcards hide the structure of a subject. If you are learning which drug belongs to which class, what each class does and what each one interacts with, the facts make a table. Cutting that table into cards throws away the part that helps you remember it. Tenzy keeps the table.

The hardest part of the idea turned out to be teaching it. The most common mistake when building a guide is to use categories as groups ("Inner planets", "Outer planets") rather than as attributes ("Mass", "Moons"). A grid only works when its columns are attributes.

## What I learned shipping it

- **Read the store, not your notes.** At one point Android went public on an older build than I thought, and that build's release notes said in-app purchases were not active yet. The fix was to promote a build that already existed. The lesson was to check what a store is actually serving by asking the store, not by reading my own release notes.
- **Check the assets, not just the code.** Three of the five fonts bundled with the app turned out to be saved GitHub "404 Not Found" pages, not font files. Body text and some headings had quietly fallen back to the system font, on the web as well as on phones. No test caught it, because nothing tested whether a font was actually a font. The fix ships in the next release.
- **One commit, both stores.** Each release candidate builds iOS and Android from the same commit and gets a tracking issue and a tester checklist. A shared guide also opens on the web, with nothing to install.

The stack is React Native with Expo, Convex for the backend, Clerk for sign-in and RevenueCat for subscriptions.

Tenzy is on the [App Store](https://apps.apple.com/us/app/tenzy/id6761376913) and [Google Play](https://play.google.com/store/apps/details?id=com.tenzy.app), and you can [use it in a browser](https://tenzy.app) without installing anything.
