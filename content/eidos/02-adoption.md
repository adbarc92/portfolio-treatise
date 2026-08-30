---
title: "Adopting Eidos"
order: 2
version: "0.2"
summary: "The playbook for existing projects: assessment, a first gate, forming the load-bearing modules, regenerability drills, and the anti-patterns that undo all four."
---

## The order of operations

Adoption is incremental and always in the same order: **find the seams — write the Forms — build the fitness functions — then, and only then, delegate the implementations.** Teams fail by inverting this — delegating heavily to agents first, then discovering their architecture was prose all along.

## Phase 0 — Assessment (one session per repo)

Answer these in writing; the answers become the seed of the Form registry.

1. **What is already conventional?** List everything the framework or ecosystem already decided (folder layout, naming, DI, routing). These are inherited Forms — free, already enforced by the framework. Do not re-document them; reference them.
2. **What is load-bearing and bespoke?** List the modules where a wrong change is expensive: money movement, auth, state machines, published APIs, data migrations. These need authored Forms first.
3. **What rules currently live in prose or heads?** Every "we always…" or "never…" a maintainer would say in review. Each is either promoted to a fitness function or deliberately dropped. There is no third state.
4. **What is the current conformance level?** Almost every repo starts at E0 or E1. Be honest; the level is a measurement.

## Phase 1 — First gate (target: E1, one day)

Ship one deterministic architectural gate before writing any Form documents. This proves the enforcement channel works and establishes the pattern.

Good first fitness functions, by ecosystem:

- **Dependency direction:** dependency-cruiser (JS/TS), import-linter (Python), ArchUnit (JVM), a SwiftLint custom rule or a build-graph assertion (iOS).
- **Boundary visibility:** package/module access modifiers enforced in CI; Bazel-style visibility if the build system supports it.
- **Doc-code parity:** a staleness audit that fails CI when a Form's interface drifts from its document (Atlas's `audit_staleness.py` pattern generalizes here).

The gate must **block**, not warn. Wire it into CI and, where the execution environment supports it, into hooks so agents hit the wall locally before CI does.

## Phase 2 — Form the load-bearing modules (target: E2)

For each module from Assessment item 2, in risk order:

1. Write its Form using the [Form template](/eidos/form-template): interface, invariants, hidden decisions, gates.
2. For every invariant, either build a fitness function or write down why one is impossible. "Impossible" should be rare and embarrassing.
3. Lock the boundary with tests at the interface — behavior tests an agent cannot game by editing internals.
4. Register the Form in `forms/registry.md` and add a CI check that every registered gate actually exists and runs (registry ↔ enforcement parity).

Do not Form everything. Implementations that are cheap to regenerate and low-blast-radius (view code, scripts, glue) stay unformed on purpose. Over-Forming is Clean Architecture ceremony returning through the back door.

## Phase 3 — Regenerability drills (target: E3)

Pick one Formed module per month and run the acid test: delete its implementation, hand an agent the Form and the tests, and see whether the regenerated implementation passes every gate without human authorship.

Every failure is a defect in the Form, not the agent: an undocumented invariant, an interface leaking hidden decisions, a missing fitness function. Fix the Form, re-run. A module that survives the drill is E3; a system whose load-bearing modules all survive is done adopting and starts compounding.

## Anti-patterns

- **Prose promotion theater.** Writing beautiful Form documents with no fitness functions behind them. That's E0 with better typography.
- **Warning-level rules.** A warning is a gate that has already decided to lose.
- **Forming the volatile edge.** UI experiments and prototypes churn too fast to Form. Form the seams *around* them instead.
- **Agent-authored Forms.** Agents may draft, but a human owns every Form decision. Delegating seam design to the entity that will be constrained by it defeats the design.
- **Registry drift.** A registry that claims gates that no longer run is worse than no registry — it teaches agents the documents lie. The parity check is itself a mandatory gate.

## Sequencing across a portfolio

For a multi-project portfolio, adopt in this order:

1. **The pipeline projects first** (anything that itself runs agents — requirements-to-code pipelines, orchestration platforms). These multiply every downstream benefit and every downstream defect.
2. **Infrastructure second** (see [Eidos for Infrastructure](/eidos/infrastructure)) — infra has the best natural fitness-function story of any domain and the worst consequences for drift.
3. **Product codebases third**, load-bearing modules first within each.
4. **Prototypes and experiments never**, beyond inheriting the portfolio's shared gates.
