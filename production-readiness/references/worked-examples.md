# Worked review examples

These are fictional, completed teaching cases. All named evidence and results below are assumed inputs to each example, not checks run by this skill's authors or evidence about a real project. Use the reasoning pattern; never copy their findings or PASS results into a project report.

## 1. Public portfolio: bounded local readiness

**Decision: READY for the agreed local artifact checks; deployed readiness unverified.** Candidate `portfolio-example-A` is a static portfolio. The request covers local build, delivery and contact navigation, not a production release decision.

**Coverage:** Inventory contains home, work, about, a missing-path handler and a contact link. The contact link is `mailto:`, with no form submission endpoint. Inspecting the source and generated artifact finds no visitor sessions, server actions, CMS or app-owned durable state. Samples cover all three content routes, one missing path and the emitted CSS/images; this small inventory permits complete route coverage, not complete browser/device coverage.

| Criterion | Status | Example evidence and limit |
| --- | --- | --- |
| Build and local delivery | PASS | Recorded build exits 0; local preview serves the content routes and expected asset types. This does not establish edge behavior. |
| Contact navigation | PASS | Browser observation shows the mail link targets the displayed address. Delivery by a visitor's mail client is outside the criterion. |
| Keyboard and narrow viewport | PASS | Recorded manual interaction reaches links with visible focus and no observed horizontal overflow at the sampled viewport. No full accessibility claim. |
| Visitor authentication and database | N/A | Source/artifact inventory supports absence of these capabilities in this scope. Hosting account security is not declared N/A. |
| Deployment recovery and uptime | NOT RUN | No provider access or dated operational evidence was supplied; outside these local gates. |

**Observed vs inferred:** A static source inventory and working local pages are observed inputs. Production HTTPS, cache rules and uptime cannot be inferred from them. An absent login is not a defect. The contact link does not justify inventing a submission-loss finding.

**Next action and stopping rule:** Local gates are supported; stop this review and disclose browser/device limits. For a release decision, obtain candidate-specific hosting, recovery and operational evidence. No application change or extra infrastructure is justified by these inputs.

## 2. SaaS records: denial after a write

**Decision: NOT READY for the record-editing capability in the disposable staging environment.** Candidate `records-example-B` has two synthetic tenants. The assessed journey is owner -> PATCH record -> ownership policy -> durable value -> subsequent owner read.

**Coverage:** Read and write paths are separate implementations. Both owners can read and edit their own record; both cross-tenant reads return 404 without private fields. Cross-tenant mutation checks read owner-visible values before and after, in both directions. Anonymous operations are also checked. Exports and background jobs remain untested and receive no inherited PASS.

| Criterion | Status | Example evidence and limit |
| --- | --- | --- |
| Legitimate owner operation | PASS | Synthetic owners A and B each write and read their own expected value successfully. |
| Cross-tenant read concealment | PASS | A cannot read B's known record, and B cannot read A's; both return an empty 404 while owner controls work. The 404 is intentional concealment, not a broken-route finding. |
| Cross-tenant write isolation | FAIL | A's PATCH of B's record returns 403, but B's subsequent read changes from `original` to `unexpected`. Reverse-direction state remains unchanged. |
| Anonymous record operations | PASS | Denials contain no record data; owner readbacks remain unchanged in the sampled cases. |
| External side effects | NOT RUN | This test setup does not expose queue/delivery observations; no assertion is made about them. |

**Finding F1, blocker, high confidence:** The observed unauthorized change to B's synthetic record demonstrates a write isolation failure despite the 403. The inferred risk is unauthorized modification of other tenant records through this handler, limited by its actual reachability. No production exploitation or broader route vulnerability is claimed.

**Smallest fix and verification:** Enforce ownership before mutation in the affected service path. Re-run the failing before/after check, both-direction controls and legitimate writes. Verify relevant queued/external effects safely if the path can produce them. Returning a different error code alone is not a fix.

**Stopping rule:** A demonstrated blocker establishes NOT READY. Preserve the outstanding export/job and side-effect gaps without claiming exhaustive assessment or automatically adding them as defects.

## 3. Transactional release: unverified deployment and recovery

**Decision: INSUFFICIENT EVIDENCE for production release of candidate `release-example-C`.** The request is a go/no-go review of an authenticated application with important durable records and a schema migration. The defined gates include artifact identity, migration compatibility, recovery and an assigned observation owner.

**Coverage:** Local critical journeys and access checks have candidate-specific results. The review inspects the migration and runbook but has no production/provider access; there is no permission to deploy, change access or perform a restore drill.

| Criterion | Status | Example evidence and limit |
| --- | --- | --- |
| Candidate build and local journeys | PASS | Candidate-specific CI results and isolated journey checks pass. They establish local behavior only. |
| Access isolation | PASS | Supplied same-candidate synthetic controls cover the agreed roles and record operations. No production-setting equivalence is assumed. |
| Deployed artifact/configuration identity | NOT RUN | A supplied green CI link belongs to an older revision; no current deployment identity or identity-provider configuration record is available. |
| Recovery of critical state | NOT RUN | Configuration says backups are enabled, but no dated isolated restore result or record-integrity check is supplied. This does not prove backups are absent or unusable. |
| Migration rollback compatibility | NOT RUN | A rollback command appears in the runbook; compatibility of previous code with the migrated schema is not demonstrated. |
| Release observation ownership | NOT RUN | The supplied runbook names no confirmed watcher for this release window. |

**Observed vs inferred:** The CI mismatch, backup configuration and missing supplied records are observations. Recovery failure and broken deployment are not demonstrated. Since these gaps affect agreed critical gates, a clean build cannot support READY; absent runtime proof alone does not justify FAIL.

**Next actions and dependencies:** Obtain the target artifact/configuration identity and assess any changed identity settings; then collect matching critical-journey evidence. Have the authorized owner supply an isolated restore result and schema compatibility check, plus the observation owner and abort criteria. If new authorized checks are necessary, scope them before execution. Reassess affected evidence after artifact, migration or provider-setting changes rather than applying an arbitrary age cutoff.

**Stopping rule:** All critical gaps have explicit next steps and owners to confirm. Stop at INSUFFICIENT EVIDENCE without deploying, requesting broader credentials merely for convenience, or presenting configuration as runtime proof.
