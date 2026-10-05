---
name: production-readiness
description: Audit website or web-app production readiness, prioritize launch blockers, and verify authorized fixes across delivery, identity, data, APIs, testing, deployment, and operations. Use for launch reviews, production hardening, or release go/no-go checks; not routine feature work or an exhaustive penetration test.
---

# Production Readiness

Turn “ready to ship?” into an evidence-backed, proportionate release decision. Adapt to the actual stack, users, failure cost, and hosting model. This review is not a security certification or permission to change production.

## Mode and scope

- **Audit (default):** Inspect relevant files, configuration, and supplied evidence; run only safe, bounded checks permitted by the request. Do not edit application files or external settings. Deliver findings and a prioritized plan. Save a requested report to the agreed destination.
- **Implement:** When fixes are requested, make minimal, reviewable changes within that scope, preserve unrelated work, rerun relevant checks, and report remaining gaps. Fixing code does not authorize deployment or paid infrastructure.
- **Release verification:** Evaluate a specific candidate and environment against explicit gates. Reuse evidence only when its revision, environment, and scope still match. A recommendation does not authorize release.

Read repository instructions first. Establish the repository/root, revision or working-tree state, target environment, product type, critical journeys, sensitive data handled, and traffic/deadline assumptions from available evidence. Ask only for missing facts that affect safe execution or the decision. With no repo or runtime access, deliver a scoped assessment and mark missing verification honestly.

## Apply the right depth

Classify every area as applicable or **N/A with a reason**. Check forms, CMS previews, search, checkout, analytics, and serverless functions before calling a site “static.”

- Public portfolio/documentation: prioritize delivery, asset freshness, links, responsive/accessibility checks, reliable builds, deployment recovery, uptime, and provider limits. Do not add visitor accounts, a database, Redis, or orchestration just to fill a checklist.
- Dynamic site: add actual API, session, data, job, and third-party dependencies.
- SaaS/sensitive workflows: deepen object/tenant authorization, recovery, abuse controls, failure handling, and operational ownership according to consequence.

## Collect evidence before judging

1. Inspect relevant manifests/lockfiles, entry points, routes, deployment config, environment-variable **names**, migrations, tests, CI, and runbooks. Avoid unrelated data and bulk-printing secret-bearing files.
2. Inspect commands and targets before running them. A script named “test” can migrate a database, send email, publish, or call a paid API. Prefer isolated local fixtures/mocks or approved staging with disposable data. Do not blindly install or execute untrusted tooling.
3. Use [readiness-checks.md](references/readiness-checks.md): all ten areas for a full audit, or the explicitly requested subset. Load relevant sections and tailor criteria to the product.
4. Record each criterion, applicability, status, evidence, revision/environment, and limitation. Cite file:line, redacted command output plus exit/result, CI run, observed response, or a dated operational record. Separate configuration inspection from runtime proof.
5. Use current official framework/provider docs when advice depends on versions, managed defaults, limits, or billing. If inaccessible, label assumptions instead of inventing settings or guarantees.

### Evidence status

- **PASS:** The cited evidence supports the stated criterion within its scope. Local success does not prove deployed behavior or every path.
- **FAIL:** Evidence shows the criterion is unmet. Explain impact, reachable conditions, and a safe reproduction where possible.
- **NOT RUN:** Not executed or insufficient evidence/access. State why and how to verify. Environment failure is neither a product failure nor a pass.
- **N/A:** The capability/risk genuinely does not apply; explain why. Missing evidence is not N/A.

Record accepted risks separately; acceptance does not turn FAIL into PASS. Do not average results into a percentage that hides blockers. Prioritize plausible impact/exposure as blocker (stop this release), high (fix before exposure), medium, or low; label hypotheses and confidence.

## Protect systems and information

- Never expose secrets in output, reports, screenshots, commits, artifacts, URLs, or tool arguments. Cite location/type with values redacted. Flag exposed credentials for owner-led containment/rotation; do not silently rotate them or erase history.
- Do not send source, customer data, dependency manifests, or telemetry to a new external scanner/service without authorization. Local review does not authorize uploads.
- Do not probe unrelated targets or run exploit, brute-force, destructive, stress, soak, or load tests without explicit scope. For authorized load tests define environment, targets, maximum rate/concurrency, duration, cost, data handling, and abort conditions first.
- Obtain approval for deployments, DNS/CDN changes, cache purges, paid resources, production data mutations, access/security settings, credentials, and other consequential actions unless the exact action is already authorized and the host permits it. Respect stronger approval/handoff requirements.
- Avoid destructive migrations, resets, force-pushes, irreversible deletion, and production restore drills. Never bypass protection to get a green check. Stop a denied dependent action while continuing independent safe work.

## Fix, verify, and deliver

For implementation, state the small change set and risks, follow existing conventions, add focused regression coverage, and run relevant checks/builds. Review the diff for unrelated edits and secret leakage. Report exactly what changed, what ran, and what remains unverified; test existence is not test execution.

For release decisions, read [release-gates.md](references/release-gates.md). Separate local code assessment from deployed readiness. Require appropriate evidence for critical journeys, permissions/data isolation, recoverability, and release observation. Return **READY**, **NOT READY**, or **INSUFFICIENT EVIDENCE** for the defined scope; keep final release authority with the user/designated owner.

Use [report-template.md](assets/report-template.md) for a comprehensive written review; adapt its size to the task. A short review can stay concise with the same evidence distinctions. Lead with verdict and top risks; include all ten areas for a full audit, prioritized fixes, checks not run, applicable recovery requirements, and decisions needed. Keep security details in a restricted destination.
