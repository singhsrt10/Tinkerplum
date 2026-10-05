# The ten-area review

This is a decision aid, not a list of services to install. Define each criterion from the site's actual needs. Examples are not universal requirements. Provider-managed controls can satisfy a need without duplicate infrastructure, but need appropriate evidence.

Contents: 1. Caching · 2. CDN · 3. Authentication · 4. Security · 5. Database · 6. APIs · 7. Testing · 8. CI/CD · 9. Monitoring · 10. Scaling

## 1. Caching

**Check:** Correct freshness and privacy across the caches actually present: browser, service worker, edge, application, and data.

- Separate public versioned/immutable assets from changing HTML and personalized responses. Long-lived caching needs content-addressed filenames and fresh references.
- Inspect cache keys/variation by query, locale, authentication, and tenant. Prevent private content entering a shared cache; do not assume `Vary` fixes an unsafe edge rule.
- Check updates, invalidation, revalidation, logout, and deploy behavior. Service workers can preserve old code after deployment.
- For backend caches, inspect stale tolerance, TTL, bounded size, stampedes, and failure handling. Do not accidentally use a cache as the only durable store.

**Evidence:** Config, observed headers for a small agreed route sample, asset naming, isolation tests, and a safe test-environment update. Headers alone do not prove every layer behaves correctly.

**Typical blocker:** Private data is publicly cached, or incompatible old/new assets break the release without recovery.

**Avoid:** Prescribing Redis or caching every response. `no-cache` permits storage with revalidation; `no-store` prohibits storage. See [MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching).

## 2. CDN and delivery

**Check:** Users reach intended content reliably through the actual hosting path.

- Identify existing managed edge behavior before proposing another CDN. Inspect domain/redirect intent, HTTPS, mixed content, certificate renewal responsibility, and origin-to-edge transport.
- Validate deep links, 404s, assets, compression, MIME types, and large images/fonts. SPA fallbacks must not turn missing assets or API routes into HTML 200 responses.
- Assess origin restriction only when the architecture requires it. Consider invalidation propagation, regions, and provider failure recovery in proportion to availability needs.
- Do not change DNS, purge caches, or enable a paid plan as an audit step.

**Evidence:** Hosting config, sampled routes/headers, TLS/domain observations, artifact paths, and actual provider configuration. Provider marketing is not project evidence.

**Typical blocker:** Broken production domain, redirect loop, failing critical assets, or unusable HTTPS. A second CDN is not a universal gate.

## 3. Authentication and authorization

**Check:** Identity and access controls match protected resources.

- Visitor authentication can be N/A for a public site; assess CMS/admin and integration access separately when relevant.
- Distinguish login from permission to access an object. Enforce server-side authorization on relevant routes/actions, files, exports, background jobs, and tenant queries.
- In an authorized environment with synthetic accounts, test anonymous, wrong-user, wrong-tenant, ordinary-user, and privileged-user cases. Hidden buttons are not access boundaries.
- Pair denials with successful owner/authorized-user controls and verify both directions of cross-user isolation where relevant. For denied writes, compare owner-visible state before and after; inspect relevant queued or external side effects through safe mocks. A 401/403/404 response alone does not prove the operation was prevented.
- Review the actual session/token model: verification, expiry, logout/revocation, cookie security, and CSRF defenses appropriate to credential transport. Recovery/verification must not bypass intended protection.
- Examine throttling/enumeration in sign-in/recovery. Prefer maintained identity implementations over custom cryptography.

**Evidence:** Permission model, middleware/data-access code, paired positive/negative authorization tests with state checks, redacted session/provider config. Frontend-only access cannot establish backend protection.

**Typical blocker:** Cross-user/tenant data access or privileged paths trusting client-supplied identity/role.

**Reference:** [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) supports least privilege, server-side enforcement, and permission tests. Public sites need not add login.

## 4. Security and privacy

**Check:** Plausible abuse paths and sensitive-data exposure within the review scope.

- Trace untrusted input to queries, HTML, files, commands, uploads, and server-side URL fetches; examine validation and output handling at the right boundary.
- Inspect production errors/debugging, public build outputs, source maps where relevant, secret references, lockfiles, and log/analytics data. Do not print secrets or upload code to prove a finding.
- Check dependency support/advisories when authorized tooling permits. A finding needs reachability/impact context; a clean scan does not prove no vulnerabilities. Do not blindly upgrade everything to clear a scanner.
- Evaluate HTTPS, applicable response protections, CSP, CORS, cookies, and upload limits against actual functionality. Test CSP before enforcing it; HSTS scope/preload can have lasting effects. Avoid universal header sets that break the app.
- Review necessary collection, retention, and access. Identify ownership for any required privacy/compliance review without declaring legal compliance.

**Evidence:** Relevant code paths/config, local redacted scans, safe negative tests, advisory links and dates/versions. Do not probe unknown third parties.

**Typical blocker:** Reachable injection, exposed privileged credentials, unprotected sensitive data, or a relevant exploitable critical dependency. A missing hardening header requires context rather than automatic critical severity.

## 5. Database and durable state

**Check:** Needed data stays correct and recoverable under the intended workload. Managed databases and object stores count; confirm absence of app-owned state before N/A.

- Inspect schema constraints, transactions, concurrency/idempotency, parameterized access, and tenant scoping. Use safe representative data for query-plan/performance checks.
- Examine migrations, locks, backfills, and mixed-version compatibility. Favor expand/contract transitions; down migrations can lose data.
- Check connection pooling/budgets, timeouts, exposure, and roles. A scaling serverless app can exhaust database connections.
- Establish backup coverage/retention/access and objectives: RPO (tolerated data loss), RTO (tolerated recovery time). “Backups enabled” is not a restore test.
- Seek a dated isolated restore result and important record/operation checks. If missing, mark recovery verification NOT RUN and explain release impact. Never restore over production during an audit.

**Evidence:** Migrations/schema, data tests, sanitized query evidence, backup policy, and restore record, covering uploaded files and other durable state too.

**Typical blocker:** Credible corruption/data loss, unsafe migration, tenant leakage, or no acceptable recovery route for critical state.

## 6. APIs and integrations

**Check:** Contracts, trust boundaries, and failure behavior remain correct.

- Identify exposed/consumed APIs, webhooks, forms, queues. Verify request schemas, authorization, response shape/status, pagination, and payload/file limits.
- Bound timeouts/retries appropriately. Use idempotency for retryable side effects; prevent duplicate consequential actions and retry storms.
- Review abuse controls, expected traffic, provider quotas. CORS is browser policy, not authentication.
- Verify webhook signatures over the correct payload and replay/duplicate handling using provider docs. Use mocks/test modes; never trigger real fulfillment just for coverage.
- Exercise invalid input, dependency failure, partial success, and degraded UI locally or in approved staging. Avoid sensitive payload logging.

**Evidence:** Contracts/routes, tests, redacted samples, dependency settings, and quota records.

**Typical blocker:** Unauthorized writes, duplicate consequential side effects, unbounded resource usage, or silent loss of important submissions.

## 7. Testing and user experience

**Check:** Important journeys and credible release failures have evidence.

- Discover real build, lint, type, unit, integration, and end-to-end commands. Run applicable safe ones; distinguish existing failures from regressions.
- Cover critical happy paths plus negative authorization, invalid input, dependency failures, and recovery. Use disposable data and controlled test credentials.
- Check production-mode assets, routing/deep links, forms, mobile layout, loading/empty/error states, keyboard access, focus, labels, and evident contrast issues. Choose representative browsers/devices.
- Combine relevant manual accessibility interaction with automated checks; a clean scan does not prove full accessibility. Use representative measured performance budgets, not universal scores.
- Test checkout, analytics, and consent only where present and in approved safe modes.

**Evidence:** Commands, exit codes, results/counts, browser observations/screenshots as useful, revision, and environment limits. Test or CI existence is not execution.

**Typical blocker:** Failed critical journey, build failure, or required regression failure. A missing runtime/dependency is an evidence blocker, not automatically a product bug.

## 8. CI/CD and release mechanics

**Check:** The reviewed revision can become a traceable, recoverable release.

- Check required jobs run real commands and honor failures. Watch for ignored exits/skips; examine lockfiles and build/runtime version compatibility.
- Trace commit to artifact to environment. Review preview/staging/production separation, workflow privileges, trusted action/dependency pinning, and exposure to untrusted pull-request code.
- Inspect deployment/migration sequencing, concurrency, health checks, proportionate staged rollout, and known-good recovery. Remote branch/environment protection cannot be inferred from YAML.
- Do not add paid runners, credentials, remote protection changes, pushes, merges, or deployments to complete an audit.

**Evidence:** Workflow files, actual candidate CI runs, artifact ID, deployment history, protection-setting evidence.

**Typical blocker:** Unreliable candidate build/release, untrusted code accessing production secrets, or no viable recovery for a critical release.

**Reference:** Use [GitHub's secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use) for GitHub Actions; consult the chosen provider for other CI systems.

## 9. Monitoring and operations

**Check:** Someone can detect and respond to meaningful user-visible failure.

- Define critical journeys, proportionate availability/latency objectives, and incident ownership. A portfolio may only need simple uptime checks; transactions need deeper signals.
- Inspect error reporting, structured logs/correlation, availability, latency, traffic, and saturation where relevant, including queues/jobs/dependencies affecting users.
- Verify alert destination, thresholds/window, owner, and actionable runbook. A dashboard is not a delivered notification. Test routing only when the resulting message/incident is authorized.
- Check redaction, retention, access, cardinality, and spend. Avoid tokens and unnecessary personal data in telemetry.

**Evidence:** Config, dated redacted alert test/incident, dashboards, runbook, ownership. Inaccessible telemetry is NOT RUN, not evidence that monitoring is absent.

**Typical blocker:** Consequential failure can persist undetected or no owner can recover within the required objective.

**Reference:** [Google SRE monitoring guidance](https://sre.google/sre-book/monitoring-distributed-systems/) explains latency, traffic, errors, saturation, and actionable alerts. Scale the burden to this service.

## 10. Scaling and cost

**Check:** Credible capacity for the stated workload, without unbounded costs/cascades.

- Establish peak traffic/concurrency, data volume, expensive operations, regions, and growth assumptions. Label planning scenarios if actual requirements are unknown.
- Identify likely bottlenecks: quota, CPU/memory, connections, slow queries, dependencies, queues, storage, or bandwidth.
- Examine bounded queues, backpressure, concurrency, timeouts, retries. Horizontal scaling must account for sessions, local files, scheduled jobs, and duplicate work.
- Review actual-plan limits, autoscaling bounds, and available cost alerts/caps. Do not provision or enable scaling without change/cost approval.
- Prefer existing measurements. A load test needs controlled targets, realistic workload, maximum rate/duration/cost, pass thresholds, and abort conditions. Forecast alone is not demonstrated capacity.

**Evidence:** Assumptions, measured representative performance, current actual-plan limits, saturation/queue observations, and qualified cost/capacity estimates.

**Typical blocker:** Demand exceeds a known limit or an exposed endpoint triggers unbounded paid work. Missing Kubernetes/multiple regions is not failure by itself.
