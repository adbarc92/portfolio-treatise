---
title: "Eidos Architecture"
order: 1
version: "0.2"
summary: "The canonical specification: Forms and implementations, the three commitments, the vocabulary, and the conformance levels that measure a repository against them."
---

*(v0.2: vocabulary settled — Eidos and Form are the only coined terms; established terminology reused and credited elsewhere.)*

## Thesis

When code production is cheap and most changes are written by machines, the winning architecture is not the one with the best arguments. It is the one where correctness is cheapest to verify.

Eidos Architecture holds that a software system consists of two kinds of material with different owners:

- **Forms** — the durable, human-designed structure: an interface, its invariants, and the decisions deliberately hidden behind it. Forms are what is *real* about the system. They change slowly and deliberately, and a human owns every one.
- **Implementations** — the code that fills the Forms: function bodies, glue, tests, configuration. Implementations are cheap, regenerable, and increasingly agent-written. An implementation is correct exactly insofar as it conforms to its Form.

A Form without enforcement is a suggestion. Therefore every Form is guarded by **fitness functions** (Ford, Parsons & Kua, *Building Evolutionary Architectures*): deterministic, automated checks that reject nonconforming implementations — a compile error, a lint rule, a dependency-graph assertion, a CI gate. If no machine can reject a violation, the Form does not exist.

Forms live at **seams** (Feathers, *Working Effectively with Legacy Code*): the places where behavior can be altered without editing code at that place. Agents fill the implementations; they are capable, tireless, and fallible — which is precisely why the fitness functions exist. Trust an agent to fill volume; never trust it to hold a boundary.

## The Three Commitments

### 1. Maximal Convention

Prefer the boring, corpus-dense way of doing everything. The primary contributor to your codebase has a prior trained on millions of repositories; every place your structure matches that prior, understanding is free. Every place it deviates, you pay a context tax on every change, forever.

**Rules:**
- Use the framework's blessed structure. Do not invent a folder layout the framework did not ask for.
- When two designs are close in merit, choose the one with more tutorial coverage.
- Novelty must be justified in writing, in the Form registry, with the misfit it resolves named explicitly.

### 2. Mechanical Enforcement

Any rule that matters must fail deterministically. Prose guidelines, review-comment culture, and tribal memory are dead letters when the author of most changes generates faster than humans can review.

**Rules:**
- Every architectural boundary is encoded as a fitness function (type system > build graph > lint/static analysis > CI script > hook, in order of preference — earlier is cheaper).
- A rule that exists only in a document is a defect. File it as such.
- Fitness functions fail loudly and block. No warnings-only mode; a warning is prose with extra steps.
- The gate registry (see [Form Template & Gate Registry](/eidos/form-template)) is the single source of truth for what is enforced and where.

### 3. Human-Designed Seams

The irreducibly human work is deciding where the boundaries go. Humans author deep modules (Ousterhout): small, carefully designed interfaces hiding large volumes of implementation. Agents fill the volumes.

**Rules:**
- Every module of consequence has a written Form: its interface, its invariants, its hidden decisions, and the fitness functions that guard it.
- Interfaces are designed for regenerability: the implementation behind a Form should be safely rewritable from scratch by an agent using only the Form and its locked-down tests.
- Changing a Form is an event: it requires a human decision, a written rationale, and a migration of its gates. Changing an implementation is routine and requires only that the gates pass.

## Vocabulary

Eidos coins two terms and borrows the rest, with credit:

| Term | Status | Meaning | Concrete artifact |
|---|---|---|---|
| **Eidos** | coined | The philosophy itself | This document |
| **Form** | coined | A human-designed boundary: interface + invariants + hidden decisions | A Form document (`forms/<name>.md`) + the interface code it describes |
| **Fitness function** | borrowed (Ford, Parsons & Kua) | A deterministic automated check guarding a Form | Type constraint, lint rule, dep-graph assertion, CI gate, hook |
| **Seam** | borrowed (Feathers) | The location where a Form separates two bodies of implementation | Module boundary, service boundary, layer edge |
| **Deep module** | borrowed (Ousterhout) | Small interface, large hidden implementation — the preferred shape of a Form | — |
| **Agent** | common usage | A code-producing model working from Forms | Claude Code session, CI agent, pipeline stage |

## Conformance Levels

A repository's Eidos conformance is measured, not asserted:

- **E0 — Prose.** Architecture exists in heads and documents only. No mechanical enforcement.
- **E1 — Gated.** CI blocks at least one class of architectural violation (dependency direction, layer access, doc staleness).
- **E2 — Formed.** Every load-bearing module has a written Form with at least one fitness function. The gate registry exists and CI verifies registry ↔ enforcement parity.
- **E3 — Regenerable.** Any single module's implementation can be deleted and regenerated by an agent from its Form and tests, passing every gate, without human authorship. This is the philosophy's end state and its acid test.

## What Eidos Is Not

- **Not Clean Architecture.** Eidos keeps the guardrails but discards the ceremony: no interface without a fitness function behind it, no layer that exists for purity. A pass-through abstraction with no enforced invariant is an implementation cosplaying as a Form — delete it.
- **Not vibe coding.** Regenerability is earned through Forms and gates, not hoped for.
- **Not framework-agnostic.** Eidos is deliberately framework-coupled (Commitment 1). The framework's conventions are inherited Forms — you adopt them instead of writing them.
- **Not documentation-driven.** Documents that no machine reads or verifies are E0 material. Eidos documents exist to be consumed by agents at task start and verified by gates at task end.

## Provenance

Eidos is an arrangement of known ideas for a new economy, and claims novelty only for the arrangement. The lineages: Parnas's information hiding (1972) for what a Form conceals; Feathers's seams for where Forms live; Ousterhout's deep modules for their shape; Ford, Parsons & Kua's fitness functions for how they're guarded; and the Rails school's convention-over-configuration for everything a Form need not say. The name is Plato's word for Form, and the metaphor is meant seriously: the Form is what endures; implementations are copies produced by a capable, fallible craftsman — the demiurge of the *Timaeus*, who copies the Forms as faithfully as the material allows; it took the Gnostics, centuries later, to conclude his copies could not be taken on faith — and because the craftsman is fallible, every copy is measured against the Form by rule rather than accepted on trust.
