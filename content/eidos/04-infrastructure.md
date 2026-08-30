---
title: "Eidos for Infrastructure"
order: 4
version: "0.2"
summary: "Where declarative tooling already separates Form from implementation, drift is the enemy, and six fitness functions buy an E2 estate in a weekend."
---

## Why infrastructure is Eidos's home turf

Infrastructure has the best natural fitness-function story of any domain: declarative tools already separate Form from implementation. A Terraform config, a Docker Compose file, an Ansible playbook, a NixOS config — each *is* a Form, and `plan`/`diff`/`validate` *is* a fitness function. The philosophy doesn't need to be imported into infra; it needs to be made explicit and completed, because infra also has the worst failure mode: **drift** — reality silently diverging from the declared Form until the declaration is fiction.

The Eidos statement for infrastructure: **the declared state is the Form; the running system is the implementation; drift detection is the fitness function; and an agent may reshape the running system freely so long as the Form is satisfied.**

## The three commitments, translated

### Maximal Convention
- Prefer the tool the corpus knows: Docker Compose over bespoke shell orchestration, Terraform/OpenTofu over hand-rolled provisioning scripts, standard Tailscale ACL syntax over custom VPN glue. An agent has seen a million Compose files; it has seen zero copies of your custom `deploy.sh`.
- One repo (or one clearly-bounded directory) that declares everything. Scattered per-machine configs are prose-in-heads with extra steps.

### Mechanical Enforcement
- **Validation gates (pre-apply):** `terraform validate` + policy-as-code (OPA/Conftest, Sentinel), `docker compose config`, lint on every declarative file. These run in CI and in hooks, and they block.
- **Drift gates (post-apply, the important ones):** scheduled `terraform plan -detailed-exitcode`, container state vs. compose file comparison, config-file checksums on hosts. Drift detection that only reports is a warning; the Eidos-conformant version *fails a scheduled CI job* and creates work that cannot be ignored.
- **Invariant gates:** scripted assertions of the invariants that matter — "only ports X,Y exposed beyond the tailnet," "every service has a healthcheck," "backups restored successfully within N days." Each is a cron-driven check that goes red, not a wiki page.

### Human-Designed Seams
The Forms worth authoring for a small infra estate are few:

1. **Network Form** — the topology: what is on the tailnet, what is exposed, ACLs as the interface. Invariants like "no service reachable from WAN except through the reverse proxy." Gate: an external port-scan assertion plus ACL file linting.
2. **Service Form (one per service class, not per service)** — what every deployed service must provide: healthcheck, resource limits, restart policy, log destination, backup annotation. Gate: a Compose/K8s manifest linter that rejects nonconforming services.
3. **Data Form** — what is stateful, where it lives, how it's backed up, restore SLO. Gate: automated restore drills on a schedule; a backup that has never been restored is Unenforced debt.
4. **Secrets Form** — where secrets live and the invariant that they appear nowhere else. Gate: secret-scanning in CI and on the hosts.

Everything else — which container image, which internal wiring, how a service is implemented — is implementation. Delete and regenerate freely.

## The regenerability drill, infra edition

The E3 acid test translates directly and is *more* achievable in infra than in application code: **can an agent rebuild a machine from the repo alone?** Pick one host, wipe it (or provision a fresh VM), hand the agent the Forms, and see if the estate converges with all gates green. Every manual step you perform during recovery is an undocumented Form — write it down or automate it, then re-run.

For a multi-machine tailnet lab, the drill order is: least-critical node first, then one node per month. A home lab that survives node-wipe drills is, structurally, better run than most production estates.

## Starter gate set (first week)

| Gate | Mechanism | Blocks |
|---|---|---|
| Declarative files valid | terraform validate / compose config / yamllint in CI + pre-commit hook | commit, merge |
| No secrets in repo | gitleaks or trufflehog in CI + hook | commit, merge |
| No drift | scheduled plan/diff job, non-zero exit on drift | scheduled job goes red |
| Exposure invariant | external scan asserting only declared ports respond | scheduled job goes red |
| Service conformance | manifest linter enforcing the Service Form | merge |
| Restores work | scheduled restore drill of one datastore | scheduled job goes red |

Six fitness functions, all deterministic, all blocking. That is E2 for an infrastructure estate, and it is roughly one weekend of work.
