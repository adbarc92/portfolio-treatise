---
title: "mcp-browser-bridge: Eleven Tools and No More"
date: 2026-10-28
excerpt: "An MCP server and a browser extension that let a coding assistant see and drive the browser you already have open, through a small, fixed set of tools."
category: software
tags: ["mcp", "browser", "typescript", "open-source"]
draft: true
---

> **Editor's note. Delete this note before publishing.** Resolve every `[CONFIRM]` below. Do not name the browser vendor's extension store in this post: that phrase is on the content gate's retracted list, and the build will fail.

[mcp-browser-bridge](https://www.npmjs.com/package/mcp-browser-bridge) gives an AI coding assistant control of a real Chrome browser. It works with Claude Code, Cursor, Windsurf, Cline and other clients that speak the Model Context Protocol. It is on npm, currently at version 1.2.2, under the MIT licence.

## Why I built it

When something breaks in a web app, the assistant cannot see it. You end up switching windows, copying error messages and describing the page in words. The README puts the aim as: "so your assistant can see what you see". It should read the console, take a screenshot or click the button itself.

## How it works

There are two parts. An MCP server runs locally and talks to the assistant. A browser extension runs in your Chrome. The two connect over a WebSocket on localhost. The server offers eleven tools. They check the connection, navigate, take a screenshot, run JavaScript, click, fill a form field, read page text or HTML, list tabs, read the console, wait for an element to appear, and send a custom message to the extension. It also ships two ready-made workflows as MCP prompts, `browse` and `qa-runner`, so any client can use them.

A few decisions shaped it:

- **The tool set is closed.** There are exactly eleven tools, and a test fails if a twelfth appears. Giving an assistant a real browser is a lot of power, so the set of things it can do is kept small and deliberate.
- **It only listens locally.** The socket binds to 127.0.0.1 and allows one client at a time. The origin check is looser than it should be: it accepts any browser extension, and connections with no origin header at all. [CONFIRM: tighten the check to this extension's ID before publishing, or keep this sentence.]
- **Form fills work with React.** Setting an input's value directly doesn't trigger React's change handling, so the fill tool uses the browser's native value setter instead.

## What I learned

- **Chrome suspends extension background workers.** The service worker behind the extension was put to sleep and silently dropped its socket. Version 1.2.1 added a keepalive and a reconnect on startup, and a regression test now covers it.
- **npm shows the README from the published version.** A documentation fix merged after a release stays invisible on npm until the next version is cut. Version 1.2.2 exists partly for that reason.
- **Publishing is part of the product.** The publish workflow uses npm's trusted publishing, and it now runs the type checker and the test suite before it publishes. No released version has gone through that gated workflow yet. 1.2.1 was published before the test step existed, and 1.2.2 was published by hand while the workflow was broken. The next release will be the first to take the gated path. [CONFIRM: update this if 1.2.3 ships first.]

## Install

The server installs with `npx`, and you load the extension unpacked from the repository. The [README](https://github.com/adbarc92/mcp-browser-bridge) has both steps. [CONFIRM: link the product page at alexanderdbarclay.com/mcp-browser-bridge/ as well?]
