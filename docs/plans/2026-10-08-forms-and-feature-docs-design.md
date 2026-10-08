# Forms and feature documents: two decompositions, one checked cross-reference — Design

**Date:** 2026-10-08
**Status:** position agreed in conversation. Not yet stated in either essay or in the specification, and none of the checks below exists.
**Repo:** `adbarc92/portfolio-treatise`
**Touches, when it is written up:** [`content/blog/2026-08-10-eidos-an-architecture-for-cheap-code.md`](../../content/blog/2026-08-10-eidos-an-architecture-for-cheap-code.md), [`content/blog/2026-10-07-poiesis-a-workflow-for-cheap-makers.md`](../../content/blog/2026-10-07-poiesis-a-workflow-for-cheap-makers.md), [`content/eidos/01-architecture.md`](../../content/eidos/01-architecture.md), [`content/eidos/03-form-template.md`](../../content/eidos/03-form-template.md)

---

## Goal

Reduce the surface that needs human attention to the documents only a human can get right, and
put that attention where it returns the most. The candidate for that surface is the **feature
document**: the place a feature's requirements live.

## The problem

Agents produce documentation at the rate they produce code. A project that treats documentation
as a first-class citizen without sorting it ends up with a body of prose as unsustainable for a
human to maintain as the generated code is. Making documentation first-class is right. Treating
all of it as one category is the mistake.

Eidos already names a human surface, the Form, which is structural. The feature document is a
second one, and it is behavioural. Before this note nothing said how the two relate, and
cross-cutting requirements such as security and performance fitted neither cleanly.

## Fixed decisions

Settled in conversation on 2026-10-08.

1. **Forms and feature documents coexist.** Neither absorbs the other.
2. **They are two decompositions of the same system.** Forms cut it by what stays stable. Feature
   documents cut it by what it is for. A feature document is the vertical slice done as a
   document, so the code can stay conventionally laid out (Eidos's first commitment) while a
   person still has one place per feature. The Eidos essay grants the vertical-slice camp its
   point in the second paragraph and never resolves it; this is the resolution.
3. **Each reflects the other, at a different tempo.**
   - *Form to feature, on every task.* A feature document is written in the vocabulary the Forms
     define. It names Forms and cites their invariants by ID. It never restates them, which is
     what keeps it short.
   - *Feature to Form, rarely.* A Form is what the features have in common, held still. When an
     acceptance criterion recurs across features, or must outlive its feature, a person promotes
     it to an invariant. The specification already calls a Form change "an event".
4. **The reflection is machine-checked.** An unchecked cross-reference is more prose, and the
   specification's own rule applies: a rule that exists only in a document is a defect.
5. **The human reads the residue.** What no check can settle is whether the intent, the non-goals
   and the acceptance criteria are right. That is the whole of the human surface.
6. **Cross-cutting requirements are invariants on Forms.** Features inherit them by naming the
   Form.

In the essays' own terms: the Form is the formal cause, what the thing is, and the feature
document is the final cause, what it is for. Poiesis already says "the specification states the
end". Aristotle observes in *Physics* II.7 that the two often coincide.

## Three kinds of documentation

| Kind of content | Where it lives | Human attention |
| --- | --- | --- |
| Intent: what the feature is for, what counts as done | Feature document | Yes |
| Derivable from code: architecture descriptions, module summaries | Regenerated on demand, not stored | No |
| Enforceable: conventions, boundaries, invariants | A check that fails | Only when it fires |

## How the two documents correspond

| Form document | Feature document | Relation |
| --- | --- | --- |
| Purpose ("what would break without it") | Intent | A Form's purpose is the set of features that name it |
| Invariants | Acceptance criteria | An invariant is a criterion every feature must meet |
| Interface | Forms named | A feature may only speak through declared interfaces |
| Gates | Frozen tests | Each is the machine check for its side |

## What the machine checks

1. Every Form and every invariant ID a feature document cites exists.
2. Every acceptance criterion has a frozen test.
3. A task's file scope falls inside the Forms its feature names.
4. A Form that no feature names is flagged as speculative.

## Open

- **Task specification against feature document.** Poiesis's specification is per task and ends
  at "done". The feature document is durable. Proposed, and not yet confirmed by Alex: the
  feature document is the lasting record, and the Poiesis specification is a signed amendment to
  it, merged in when the task closes. This changes what Poiesis currently says.
- **Learning during implementation.** Poiesis has an exit for scope (the scope request) and none
  for "building this showed the specification was wrong". If the proposal above is taken, that
  exit is a signed change to the feature document.
- **Which text carries this.** Candidates: a feature-document template beside the Form template
  in the specification; a paragraph in each essay; a third essay. Undecided.
- **No template for a feature document exists yet.**

## Where the industry is, as of 2026-10-08

The premise is widely shared and the conclusion mostly is not. Human attention is agreed to be
the bottleneck and specifications are agreed to be where it should go, but the mainstream
practice built on that agreement multiplies documents.

- **Spec-driven development is the mainstream form** (Spec Kit, Kiro, Tessl, BMad). Birgitta
  Böckeler's taxonomy is the working vocabulary: spec-first, spec-anchored, spec-as-source. The
  position above is closest to spec-anchored at feature granularity. Her own review found that
  spec-kit "created a LOT of markdown files for me to review" and concluded "I'd rather review
  code than all these markdown files".
  [martinfowler.com, 2025-10-15](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- **The sprawl is studied as its own failure.** A position paper diagnoses agents updating too
  many files until authoritative truth erodes, and offers governance as the remedy without
  specifics.
  [Markdown Mayhem, ACM CAIS 2026](https://research.ibm.com/publications/markdown-mayhem-taming-the-agentic-documentation-explosion).
  A preliminary study found stale code references in 23.0% of sampled repositories.
  [arXiv 2606.09090](https://arxiv.org/abs/2606.09090)
- **The reducing position appears in fragments.** Markus Eisele argues specifications should
  shrink: keep rationale, non-goals and acceptance criteria, delete prose that restates code.
  [O'Reilly Radar, 2026-07-17](https://oreilly.com/radar/the-right-amount-of-spec-for-agentic-development).
  Roman Stranghöner argues for moving safeguards into tests, linters and architecture rules.
  [INNOQ, 2026-04-08](https://www.innoq.com/en/blog/2026/04/versteckte-kosten-spec-driven-development/)
- **Specifications as the reviewed artifact.** One paper frames them as "the contract substrate
  between humans and agents".
  [arXiv 2609.00252](https://arxiv.org/abs/2609.00252)
- **The feedback objection.** Kent Beck is reported to have objected in January 2026 that
  writing the whole specification first assumes nothing is learned during implementation, and
  Martin Fowler to have endorsed him. **Read secondhand only**, from
  [a summary](https://levelup.gitconnected.com/sdd-kent-beck-and-martin-fowler-why-spec-anchored-development-wins-a4c838d5be11).
  Find the originals before citing either in an essay.

Not found in the survey: anyone ranking documents by whether a human must read them, or anyone
checking a cross-reference between a structural document and a behavioural one.
