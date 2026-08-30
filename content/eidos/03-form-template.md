---
title: "Form Template & Gate Registry"
order: 3
version: "0.2"
summary: "The canonical templates for a Form document and the gate registry, plus the parity check that makes the registry impossible to quietly falsify."
---

A Form document is written for two readers: the agent that consumes it at task start, and the parity check that verifies it at CI time. Keep it short enough that an agent reads all of it, and structured enough that a script can parse the gates table.

## Form document template

Save as `forms/<module-name>.md` in the repository.

```markdown
# Form: <module-name>

status: active | deprecated
owner: <human — Forms are never agent-owned>
level: E1 | E2 | E3          # highest drill this module has passed
last-drill: <date or never>   # last regenerability drill

## Purpose
One paragraph: what this module is for and what would break without it.

## Interface
The complete public surface. Signatures, types, events, error contract.
Anything not listed here is hidden implementation and may be regenerated
at will.

## Invariants
Numbered, testable statements that must hold across ALL implementations:
  I1. <e.g. "No state transition skips the PENDING_REVIEW state.">
  I2. <e.g. "All amounts are integer minor units; floats never cross this boundary.">

## Hidden decisions
Decisions deliberately concealed behind the interface (per Parnas), so an
agent does not "helpfully" surface them:
  - <e.g. "Storage engine choice. Callers must not know or care.">

## Gates
Fitness functions guarding this Form:
| ID | Guards | Mechanism | Location | Blocks |
|----|--------|-----------|----------|--------|
| G1 | I1 | <lint rule / dep-graph assertion / type constraint / CI script / hook> | <path or CI job name> | build / merge / commit |
| G2 | I2 | ... | ... | ... |

Every invariant MUST appear in the Guards column of at least one gate,
or have an entry under Unenforced.

## Unenforced (should be empty)
Invariants with no fitness function, each with a reason and a date.
These are debts.

## Regeneration notes
What an agent needs to rebuild the implementation from scratch: test
entry points, fixtures, environment assumptions, forbidden dependencies.
```

## Gate registry template

Save as `forms/registry.md`. One row per fitness function across the whole repo. This is the file the parity check reads.

```markdown
# Gate Registry

| ID | Form | Mechanism | Location | Verified-by |
|----|------|-----------|----------|-------------|
| payments.G1 | forms/payments.md | import-linter contract | .importlinter §payments | ci/parity |
| payments.G2 | forms/payments.md | mypy strict on module | pyproject.toml | ci/parity |
| atlas.G1 | forms/atlas.md | staleness audit | scripts/audit_staleness.py | ci/parity |
```

**Parity check (mandatory gate zero):** a CI script that fails when
(a) a registry row's mechanism does not exist or does not run in CI,
(b) a Form document declares a gate absent from the registry, or
(c) an invariant has neither a gate nor an Unenforced entry.
The registry lying is the one failure mode Eidos cannot tolerate.

## Writing guidance

- **Interfaces earn their width.** Every exported symbol is surface an agent must respect and a human must maintain. Prefer one deep entry point over five shallow ones.
- **Invariants are sentences a test can falsify.** "The module is well-designed" is not an invariant. "No public function performs I/O" is.
- **Hidden decisions are the soul of the Form.** If the section is empty, the module is probably shallow — reconsider whether it deserves a Form at all.
- **The Blocks column is never empty.** A gate that blocks nothing is prose.
