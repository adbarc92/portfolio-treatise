---
title: "Poiesis: A Workflow for Cheap Makers"
date: 2026-10-07
excerpt: "A codebase can have every boundary guarded and still take a bad change. The rules constrain what is made. Nothing yet constrains the making, and the maker cannot be believed about where it is in the work, what it was allowed to touch, or whether it is done."
category: software
tags: ["workflow", "ai", "philosophy"]
draft: true
---

In [an earlier essay](/eidos-an-architecture-for-cheap-code) I argued that a rule in a codebase exists only if a machine enforces it, and that an architecture for cheap code is one in which every boundary that matters is a failing build. Suppose that argument were carried out completely. Every module that may not import another is stopped by a linter, every interface is locked by tests at its edge, and no prose guideline is left holding anything up. Bad changes would still arrive, and they would arrive on the permitted side of every line.

Consider an agent asked to fix a crash in a refund flow. It may fix a different crash, one it found on the way and understood better. It may fix the right one by editing the test that would have caught the wrong fix. It may fix the right one correctly and also tidy eleven files that nobody asked it to open, each tidy defensible and the sum unreviewable. None of these crosses a boundary. Each is a failure of the making and not of the thing made, and architecture, which describes the thing made, has nothing to say about any of them.

The traditional answer was process, and process had the weakness that architectural guidelines had. Write the test first. Keep the change small. Touch only what the ticket names. These were held in place by habit and by review, and they worked for contributors who had absorbed them over years. The new contributor reads them in a prompt, agrees with them, and forty tool calls later does otherwise, because nothing stopped it.

This essay makes for process the argument the earlier one made for structure. The workflow, like the boundary, has to be something the build can refuse. I have been calling the arrangement Poiesis, which is the Greek word for making, and I will come to why that is the right word at the end.

## Three things the maker cannot be believed about

Ask an agent in the middle of a task whether it is still planning or has begun to implement, which files it is permitted to change, and whether it has finished. It will answer all three fluently. Each answer is a self-report, generated from the same context that produced the work and with no independent access to the fact.

I do not mean that models lie. A model that says it is finished is producing what a finished task sounds like, and it is often right. The difficulty is that being right and being wrong read identically from outside, and at the volume agents work a reviewer cannot tell them apart by reading.

The principle that follows is narrow, and everything else in the design is an application of it: nothing that matters may rest on the maker's account of itself. The phase of the work, the limits of the work and the test of the work are each moved to a place the maker can read and cannot write. A person sets them before the making starts, and a script checks them after every step.

## The state lives outside the maker

Every task begins as a short document that states the intent, the files the change will touch, the invariants that must survive it, and the criteria by which it will be accepted. A model may draft this document. A person edits it and signs it. Signing records a hash of the text, and from that moment the document is the task's state. It carries the phase (draft, signed, planned, implementing, in review, done) and there is no second record to disagree with it. A script reads the phase to decide what is permitted. No model is asked which phase it is in, because no model's answer would be used.

Only a person moves the phase forward, and here I should record a correction, because it shows how designs of this kind fail. The first version said that agents had no tool capable of reaching a transition. That was true of the tools as listed and false in practice: an agent with a terminal can type any command a person can, including the one that signs its own specification. The claim had been a sentence about the system and not a property of it, which is the defect the whole design exists to remove.

The repair has two layers. A guard denies a transition command issued from an agent's shell. Separately, the transition refuses to run unless someone at an interactive terminal types the task's identifier. An agent that writes a script can get around the first layer, so the second is the one that counts. Whether an agent's terminal can itself answer that prompt is on the list of things to test, and I have not assumed the answer.

## The test is fixed before the plan

Kent Beck's *Test-Driven Development* asks the programmer to write the failing test first, and it was written for a programmer who would then leave the test alone. An agent given the same instruction writes the test first and, when the test becomes inconvenient, changes it. Goodhart's law, in Marilyn Strathern's phrasing, is that when a measure becomes a target it ceases to be a good measure. A maker that can edit its own tests has been handed the measure and the target together.

So the acceptance tests are written from the signed specification, by a separate invocation working from the specification, before any plan exists. Then they are frozen. The assertion lines are hashed. The implementer may repair an import or a fixture, and an edit to an assertion is reverted in the session and fails the build afterwards. For a bug fix there is one more condition: the freeze is refused unless the new test compiles and fails, since a reproduction that passes before the fix has reproduced nothing.

The ordering is deliberate. A test written after the plan inherits the plan's assumptions and verifies that the plan was carried out, which is a different question from whether the specification was met. Freezing first means that the plan and the implementation both answer to something neither of them wrote.

## Scope is signed

The file list in the specification is the scope. While the task is being implemented, an edit to a file outside the list is denied before it happens, and a new file must match a pattern the specification declared. This replaces the paragraph every prompt carries about making minimal changes with a mechanism that costs nothing until it fires.

The lineage is old. Saltzer and Schroeder's 1975 paper on the protection of information gave the two principles at work: least privilege, under which a program runs with the smallest set of permissions its job requires, and fail-safe defaults, under which access is decided by permission and not by exclusion. The scope list is the permission, and everything unlisted is excluded without anyone having to think of it. A guard that cannot determine whether an edit is allowed refuses it. Anything that is merely a convenience gets out of the way when it breaks.

Two things keep this from being a wall. The first is an exit: when the implementer needs a file that was not listed, it writes a scope request, and a person accepts or declines it. The second is the wording of the denial. The reader of a denial is a model that will act on whatever the message suggests, and a bare refusal invites a workaround. Every denial therefore says what was blocked, why, and what to do instead.

Taken together, the last three sections are an application of separation of duties, the rule that keeps the person who pays the invoices from reconciling the account. The maker makes. It does not sign, it does not write the assertions it will be judged by, it does not widen its own scope, and it does not declare itself done.

## The narrow maker

Once the end, the test and the material are fixed, what remains is small, and this is where a bet comes in. The bet is that a cheaper model fails mostly from having too many choices, and much less often from reasoning poorly. Given a repository and a ticket, a small model has to decide what is relevant, where to look, how much to change and when to stop. Each of those is a place to go wrong, and the errors compound. Given four files, a table of steps and a failing test, it has very little left to decide.

Each stage therefore starts in a fresh session, with a payload assembled by a script, so the model does no exploring of its own. The implementer receives the specification's intent, file list, invariants and criteria, the steps of the plan without their rationale, and the paths of the frozen tests. It does not receive the ticket. The ticket is somebody else's prose, it may contain instructions, and everything in it that matters was already digested into a document a person signed. Nothing carries over from the previous stage's conversation either, because a conversation brings along every idea that was abandoned in it.

The planner cannot edit. It answers in the chat, and a person saves the plan to the file the next stage reads. That looks like friction, and it is also the moment at which a human reads the thing they are about to accept.

With the maker narrowed this far, the expensive model is spent where judgment pays, on criticizing the specification and on review. Review is a checklist. The invariants go in, and a verdict comes out for each one (holds, violated, or cannot be determined) with a line reference, followed by at most three free observations. Free-form review reads well and cannot be scored. A table of verdicts can be wrong in a way that someone can count.

Escalation from the cheap model to the expensive one follows the same principle as everything else. It fires on events a script can observe, such as a set number of failed test runs or a lint loop that will not close. It never fires on the model reporting that it is stuck, and it is not withheld because the model failed to say so.

## What, who and when

The instructions an agent follows are packaged as skills, and my first drafts of those skills were runbooks: check the phase, do the work, advance the task. They contained gate text, which is to say enforcement written as prose, inside the one artifact the design existed to stop trusting.

The revision divides the labor three ways. A skill says what to do. An agent, which is a list of tools, a model tier and a primary skill, says who may do it. The runtime says when. A skill loaded into the wrong agent can do nothing that agent's tools do not allow. A skill names no file layout and no phase, so it is meant to work in a repository that has none of this machinery, where a person could use the planning skill on its own. I now treat that as a test, and I have not yet run it on any of the skills. The reason for the test is that a piece that functions only inside the whole system is a piece nobody can adopt by degrees.

The second rule is that no enforcement depends on the editor session. Session hooks can be switched off, they differ between editors, and they are absent when someone commits by hand. Every guard that runs while the agent works has a twin in continuous integration, built from the same function. This has consequences for the design itself. Continuous integration cannot tell which agent wrote a diff, so the limits on what may change follow the task's phase. Where no twin is possible, as with the guard on transitions above, the gap is written down as a gap.

## Earning the right to block

All of this is overhead, and overhead is how the ceremony in every earlier methodology began. The design's defence is that enforcement is promoted on evidence. A handful of checks block from the first day, and they are the ones that guard what was always a mistake: editing generated code, editing code the repository does not own, committing a secret, altering a signed specification or a frozen assertion. Every other check ships writing to a log, then warns, then blocks, and each promotion is a decision a person makes with the recorded data in front of them. A gate earns the right to block. A document earns the right to exist, and a stage earns the right to start.

Adoption is tiered on the same reasoning. The first tier is the skills alone. The second adds agents with limited tools. The third adds the runtime with its guards and its ledger, and it is useful with no model in the loop at all, since a guard against committing a secret does not care who is typing. The fourth is the pipeline described above, and the fifth is generated context. Each tier works without the ones above it, so a team that stops at the first has a few good instructions and has lost nothing.

Underneath all of it is the ledger. Every transition, denial, failed freeze and escalation appends a record, and the records never enter a model's context. Its purpose is that any claim about whether the arrangement works gets computed from that file, or does not get made.

## What would make this wrong

I have no measurements. Poiesis is a design, worked out in detail and revised repeatedly against a register of its own gaps, and every claim above is an argument. None is a result. The measurement it commits to is a paired replay: a set of tickets that are already closed, split by date, each replayed with the pipeline and without it, and again with a cheap model doing the implementing, compared on whether the change is accepted at first review and on what it cost. The set is small enough that the result will be directional and no more. If the pipeline does not raise the rate of acceptance at first review, or if the cheap model under it falls well short of the expensive one, the narrowing bet is wrong. If acceptance does rise, but the time people spend signing specifications and saving plans exceeds the review time saved, then the pipeline is ceremony, and the comparison to Clean Architecture that I made in the earlier essay applies to me. I would rather publish the design before the numbers than after, so that the numbers cannot quietly choose which design I claim to have had.

The second vulnerability is that the narrowing bet is a fact about current models. If cheap models stop failing on choice, the narrow payload decays into a cost optimization. The externalized state, the frozen test and the signed scope would survive that. They do not depend on the maker being weak. They depend on the maker being unaccountable through its own report, which is as true of a stronger model as of a weaker one, and separation of duties was never a rule for unintelligent clerks.

A third is the frozen test itself. Tests can be wrong, and a wrong test that nobody downstream may change is worse than a wrong test that somebody can quietly fix. The design accepts that cost in exchange for removing the quiet fix, and I do not yet know how often it will be paid.

The last is adoption, and I think it the likeliest death. A specification that has to be signed is a cost a person pays before any benefit arrives. If people route around it for small changes, the ledger will describe only the tasks they chose to bring, and it will flatter the system. The design's answer is a stop-loss: if voluntary use stays below a stated share of the eligible work, building stops and I ask people why. That is a rule about my own behavior that no script enforces, and after everything this essay has said about rules of that kind, the reader is entitled to notice.

## The name

In the sixth book of the *Nicomachean Ethics*, Aristotle separates poiesis, making, from praxis, acting. Making has its end in something other than itself, namely the thing made. Acting has no end beyond acting well. Plato had used the word more broadly, and in the *Symposium* Diotima calls every passage from not-being into being a kind of poiesis. It is Aristotle's narrower sense that I want.

Because the end of making lies outside the maker, it can be stated before the making begins and judged after it finishes, with no reference to the maker's character or understanding. A table is sound or it is not, whoever built it. That is what makes making something that can be handed over, and it is the whole warrant for handing it to a contributor that retains nothing between one task and the next. The specification states the end, the frozen test judges it, and the scope bounds the material.

What cannot be handed over is praxis: deliberating about what is worth making, and deciding whether the thing made is good. Aristotle assigns that to practical wisdom, which he distinguishes from the skill of making. In the workflow, praxis is the signature. Signing the specification, accepting the plan and advancing the task are small acts, and the design keeps them small on purpose, but they are the only points at which someone answerable decides.

The earlier essay said that the Form is what is real about a system and that its copies are cheap. Poiesis adds that the making of the copies can be handed over entirely, on one condition, which is that the maker is never asked to vouch for its own work.

*The measurements, when there are some, will be reported here whatever they say.*
