# Release gates and recovery

Use for go/no-go assessment or release work. Scope the decision to a candidate, environment, and intended exposure. A green build is one input.

## Proportionate gates

Use existing requirements for measurable success criteria. If absent, propose criteria and label them proposed; do not invent a business commitment.

1. **Critical journeys:** The candidate builds and key paths work in a sufficiently representative environment. Name paths and revision.
2. **Access/data:** Applicable isolation checks pass; no unresolved credible blocker involving secrets, unauthorized access, data loss, or other consequential behavior remains.
3. **Recovery:** Identify the previous artifact/configuration and recovery route. State changes need safe migration/compatibility and recovery plans. Critical durable state needs suitable restore evidence; explicitly disclose when unverified.
4. **Operations:** An owner, useful health signals, incident/rollback route, and limits compatible with demand/budget exist. Depth follows consequence.
5. **Authority:** Required release approvals exist. A readiness request is not deployment permission.

A decision-critical NOT RUN prevents READY. A demonstrated blocker means NOT READY even with other missing evidence. Otherwise decision-critical gaps mean INSUFFICIENT EVIDENCE. Optional improvements need not block a simple site.

## Verdicts

- **READY:** Evidence supports applicable agreed critical gates for this candidate/environment. Disclose residual risks and accepted non-blocking exceptions. This is a bounded recommendation, not a guarantee.
- **NOT READY:** A demonstrated blocker exists. State the smallest fix and verification needed.
- **INSUFFICIENT EVIDENCE:** Missing decision-critical evidence prevents a sound decision; no demonstrated defect is required.

For narrow local reviews, say “local checks passed; deployed readiness unverified.” Do not infer live state from configuration or stale CI results. Accepted risk does not change an individual failed check to PASS.

## Recovery plan before an authorized deployment

- Candidate and last-known-good artifact/commit; affected environments and config versions.
- Owner able to stop/roll back, approved mechanism, and access prerequisites without secrets.
- Signals, baseline, project-specific thresholds, observation window, and watcher.
- Abort triggers: critical-path failure, errors, permission leakage, or database degradation, with appropriate limits rather than universal percentages.
- Previous-code compatibility with new schema/data/jobs; irreversible steps. Code rollback does not restore lost data.
- Data-recovery strategy, RPO/RTO, and isolated restore evidence where relevant. Do not promise unevidenced recovery time.
- Post-rollback smoke and integrity checks; cache/service-worker behavior that can preserve failed code.

Prefer a known-good compatible artifact or authorized feature flag. A forward fix can be safer than reversing schema changes; explain the choice. Get an owner decision if no safe route exists.

## After an authorized release

Verify deployed version, critical paths, signals, and applicable migration results. Observe through the agreed window before claiming success. If continued observation is outside scope or unavailable, hand off explicitly with owner and pending checks. Report regressions promptly; do not claim unperformed monitoring or silently expand targets.
