# Production readiness review

## Decision

- Verdict: READY / NOT READY / INSUFFICIENT EVIDENCE
- Scope: [local code / staging / production; full or selected areas]
- Candidate: [commit/artifact and relevant uncommitted work]
- Environment and date: [target, timestamp/time zone]
- Product and critical journeys: [what must work; users affected]
- Traffic/data assumptions: [known requirements; label estimates]
- Top risks: [finding IDs]
- Decision owner: [known or unassigned]

## Journey coverage and evidence freshness

| Journey/capability | Actor, entry point, permission boundary | Data/side effects, failure/recovery | Sample and rationale | Evidence, gaps, next check |
| --- | --- | --- | --- | --- |
| | | | | |

- Coverage boundary: [routes/capabilities inspected; important uncovered paths and limits]
- Controls: [legitimate success; denied access; unchanged state after denied writes where applicable]
- Stopping decision: [critical gates supported or explicitly unresolved; why further sampling would or would not change the verdict]
- Reused evidence: [original candidate/environment/date, relevant configuration identities, what still matches]
- Rechecks needed: [changed artifact, identity/provider settings, migrations or other relevant dependencies; no universal expiry]

## Area summary

Use PASS, FAIL, NOT RUN, or N/A. Split mixed evidence into individual checks; never conceal a failed critical check in a passing summary.

| Area | Status | Evidence/check IDs | Limitation or N/A reason |
| --- | --- | --- | --- |
| Caching | | | |
| CDN and delivery | | | |
| Authentication and authorization | | | |
| Security and privacy | | | |
| Database and durable state | | | |
| APIs and integrations | | | |
| Testing and user experience | | | |
| CI/CD and release mechanics | | | |
| Monitoring and operations | | | |
| Scaling and cost | | | |

## Findings, highest consequence first

### [ID] [Title]

- Priority/confidence: [blocker, high, medium, low / evidence confidence]
- Conditions/scope: [component, route, environment, users]
- Impact: [plausible consequence]
- Evidence: [file:line, redacted output, CI run, dated record]
- Observed vs inferred: [facts versus hypotheses]
- Smallest fix: [within existing architecture]
- Verification: [safe check to establish the criterion]
- Owner/timing/approval: [known or unassigned]

## Checks and commands

| ID | Criterion | Status | Environment/revision | Evidence or command + exit/result | Limits/next step |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Include actual commands/results, checks not run and why, external settings not inspected, and pre-existing failures. Redact sensitive output. Configuration and test existence are not runtime evidence.

## Optional machine-readable evidence

When using the Tinkerplum synthetic adapter, link the report and record its schema version, candidate revision/dirty state/source digest, environment/tool versions, timestamps, and limits. Validate it with the matching validator. Keep local-fixture results separate from any release decision; internal consistency is not proof of authenticity or deployed behavior. If no adapter was run, say so rather than inventing a report.

## Changes (implementation mode)

- Files/reasons: [minimal scope]
- Post-change verification: [specific evidence]
- Remaining failures/unknowns: [explicit]

## Gates and recovery

- Critical journey and access/data evidence: [checks/gaps]
- Previous good artifact and recovery mechanism: [known or unverified]
- Migration/data compatibility and restore evidence: [applicable facts]
- Observation: [owner, signals, thresholds, window]
- Abort triggers and post-recovery checks: [specific plan]
- Accepted non-blocking risks: [owner, reason, scope, revisit date]
- Outstanding approvals/decisions: [exact action and target]

## Next actions

1. [Smallest blocker fix or evidence-gathering step]
2. [Next useful action]

This review covers the stated scope and evidence. It is not security certification, a compliance determination, or deployment authorization.
