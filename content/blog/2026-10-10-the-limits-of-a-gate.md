---
title: "The Limits of a Gate"
date: 2026-10-10
excerpt: "An architecture that rests on mechanical enforcement owes an account of where enforcement stops: which rules deserve a gate, who guards the gates, and what a passing gate proves."
tagline: "Which rules deserve a gate, who guards the gates, and what a passing gate proves."
category: software
tags: ["architecture", "ai"]
---

In [an earlier essay](/eidos-an-architecture-for-cheap-code) I argued that when agents write most of the code, a rule exists only if a machine can reject its violation. That essay calls the human-designed interface, with its invariants and the decisions hidden behind it, a Form, and it calls the checks that guard a Form gates. Mechanical enforcement was the commitment it leaned on hardest, so it is the one whose limits most need stating. There are three: which rules deserve a gate, who guards the gates, and what a passing gate proves.

## Not every rule deserves a gate

A layering rule of the familiar kind, that controllers may not touch the database, is easy to enforce mechanically, but an agent blocked by it will often take the cheapest compliant route, which is a service method that does nothing except forward the query, and the result is precisely the pass-through layer John Ousterhout identified as cost without benefit. The gates belong on the Forms, on the invariants of interfaces that hide something worth hiding, and not on the scaffolding of layers that hide nothing.

## A gate is code

A gate is itself code. The example in the earlier essay was a payments module that accepts only a money type whose sole constructor takes an integer, so that an agent passing a float gets a failed build. The agent could as easily have satisfied that build by deleting the check as by obeying it. Listing the gates in a registry, with a further check that fails when a listed gate goes missing, closes the obvious route, but only the obvious one, since a sufficiently thorough change can remove the gate, its registry entry, and the registry check together. No further check ends this regress, because every check is subject to the same objection. What ends it is a permission: the Forms, the gates, and the configuration that runs them must sit where the agent writing the code cannot write, behind ownership rules and branch protection that only a person can satisfy. Separation of duties is less a fourth commitment than the condition under which mechanical enforcement means anything. I should add that it holds only where the agent does not carry its operator's credentials, since an agent at a person's terminal can do whatever that person can.

It also settles a question the Platonic vocabulary tends to obscure, which is how a Form changes. Forms are not eternal, since systems evolve and their interfaces with them, but a change to a Form is a change to the rules, and it passes through the same door as any other: a person approves it, and the machine records that a person did.

## What a passing gate proves

I should say exactly what verification buys. A gate verifies conformance: that the boundary held, and that the invariants someone took the trouble to write down still hold. It cannot establish that the change was the one that was wanted, which is the distinction Barry Boehm drew between verification, building the product right, and validation, building the right product. Validation is a question about how the work is done rather than about the shape of what is made, and it wants an argument of its own.

Verification also comes in two strengths, which the word "deterministic" tends to blur. A type or an import contract is complete over its domain, since no float will cross a boundary whose type forbids one. An invariant such as "no refund exceeds the charge it reverses" is checked by tests, and tests sample. Property-based tests sample more cleverly, but they still sample, and an agent iterating against a suite will find whatever the suite does not cover, as any optimizer finds the slack in its objective. Two practices narrow the gap. The tests that judge an invariant are frozen, held behind the same permission boundary as the Form, so that the agent cannot improve its result by editing its examiner; and the gates themselves are tested by sabotage, deliberately breaking each invariant and confirming that something fails. Neither makes a sampled check complete. Together they make it likelier that the team finds a gap before the agent does.

*This is a companion to [Eidos: An Architecture for Cheap Code](/eidos-an-architecture-for-cheap-code). The specification [is here](/eidos).*
