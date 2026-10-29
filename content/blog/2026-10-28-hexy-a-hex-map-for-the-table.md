---
title: "Hexy: A Hex Map You Run at the Table"
date: 2026-10-28
excerpt: "Hexy is a desktop hex map maker for tabletop RPGs. You paint the map on your screen and a second screen shows the players only what they have found."
category: software
tags: ["hexy", "tauri", "games", "shipped"]
draft: true
---

> **Editor's note. Delete this note before publishing.** Resolve every `[CONFIRM]` below. The price was cut from $15 to a $7 minimum on 2026-10-25; check the itch page before publishing.

[Hexy](https://redgalt.itch.io/hexy) is a hex map maker for tabletop roleplaying games. Version 1.0 has been on itch.io since 2026-09-07, for Windows, macOS and Linux. A free browser demo lets you try the editor. Display mode, plugins and custom icons need the desktop app.

## What it is

You paint terrain one hex at a time, or generate a random map and edit it. You can add labels and icons, draw borders along individual hex edges, and cover the map with fog of war. Maps are saved as plain `.hexy` files on your own disk. There is no account, no cloud sync and no telemetry.

The feature the rest of the app is built around is Display mode. It shows the map on a second screen, such as a TV or a projector, and updates it live as you edit, leaving out everything the players have not found yet. You keep the full map on your laptop, and the players see only the part they have explored.

## Why I built it

In a hex-crawl campaign, the map the referee needs and the map the players may see are two different maps. Online tabletops handle this by putting everyone on a computer, which makes for a different kind of game night. At a physical table, people handle it with paper cutouts and a good memory. Hexy is for the table: the players are in the room, and a second screen does the hiding.

It was inspired by Hex Kit, and it is not the only tool with a player view; Hex Kit and others have one. What Hexy aims at is running a map during a session, not only drawing one beforehand. [CONFIRM: anything personal to add, such as the campaign that prompted it.]

## What I learned shipping it

- **An unset secret is not always an absent one.** In CI, a signing secret that had never been set reached the build as an empty string, not as a missing variable. The packaging tool read an empty string as "configured" and ran the signing step with an empty identity. The fix was to set the signing variables only in the steps that actually sign, and only when the secrets exist.
- **Check the store page logged out.** The page you see as the creator on itch.io is not the page a buyer sees, and an automated request misses the parts that render in the browser. Only a logged-out browser window shows the real page.
- **macOS runners are billed at a multiple of Linux ones.** On a private repository that adds up fast. The spending limit ran out twice, and the symptom was jobs that died without ever being assigned a runner.
- **Price against what already exists.** Hexy launched at $15. A competitor with many ratings sells the same core feature at that price, so I lowered Hexy to a pay-what-you-want minimum of $7.

It is built with Tauri 2, SvelteKit and PixiJS. A single tag push builds the three desktop versions and the browser demo and publishes all four to itch. The source is closed; the [catalogue entry](/writing/projects/hexy) has more detail.

Hexy is on [itch.io](https://redgalt.itch.io/hexy), and the browser demo is free.
