---
title: "Seven Deaths of the Meadow: A Game in 13 Kilobytes"
date: 2026-10-28
excerpt: "My js13kGames 2026 entry: a pastel meadow, a unicorn shrine, and a run that ends in about ninety seconds. The only thing that carries over between runs is what you worked out."
category: software
tags: ["games", "js13k", "javascript"]
draft: true
---

> **Editor's note. Delete this note before publishing.** Resolve every `[CONFIRM]` below. Do not list the browsers the screenshot tests use. One of their names is on the content gate's retracted list, and the build will fail.

[Seven Deaths of the Meadow](https://js13kgames.com/2026/games/seven-deaths-of-the-meadow) is my entry for js13kGames 2026, a game jam in which the whole game must fit in a 13-kilobyte zip file. The theme was "Unicorns and Rainbows". You can [play it in the browser](https://play.js13kgames.com/seven-deaths-of-the-meadow).

## What it is

You wake in a sunlit meadow with a unicorn shrine at its centre, and you die in about ninety seconds. Nothing carries over between runs except what you personally worked out. There is one action, and you choose what it does by how long you press: tap to take, hold to give. On a phone you drag to walk and press to interact.

The theme invites one of two easy readings, sincerely cute or cute turned to gore. I wanted neither. The unease in the game comes from counting, not from anything shown on screen.

## How it fits in 13 kilobytes

- **No assets.** Everything is drawn on a canvas in code. There are no images and no audio files.
- **Two builds, ship the smaller.** The build makes one plainly minified version and one compressed with roadroller, zips both, and keeps whichever is smaller. Going over the 13,312-byte limit fails the build. The submitted zip is about 5.3 KB [CONFIRM final size].
- **Tests that cost nothing.** Test hooks sit inside a marked block that the build strips out, so they add no bytes to the shipped game. The test suite drives the real game state under Node, with no browser.
- **Test the entry, not the source.** The final smoke test unzips the submitted file and plays that, with real key presses. In a jam, the file you submit is the game; the file you develop is not.

## What I learned

The first playtest found a dominant strategy: holding everything, which means giving everything away, beat the game without any thought. It also showed that a win didn't read as a win. Players reached the ending and didn't realize they had succeeded. Both problems were in the design, not the code, and only someone playing it could have found them. [CONFIRM: whether the submitted build fixed these, or whether the fix is in the post-jam update.]

Writing the design down before building helped more than I expected. The repository includes a list of things that look like oversights but are deliberate, so a later change, mine or an agent's, does not "fix" them.

The source is on [GitHub](https://github.com/adbarc92/seven-deaths-of-the-meadow). [CONFIRM: jam results, if you want to mention them.]
