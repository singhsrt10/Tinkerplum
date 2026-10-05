# Evidence adapter v0.1.0

## Audience and first stack

The first audience is solo developers and small teams who maintain a simple Node.js website or small authenticated HTTP application and want to understand what a readiness claim is supported by before adapting it to their own project.

The executable scope is narrower than that audience: **bundled synthetic fixtures only**, using Node.js 24+ core HTTP, plain HTML/CSS, in-memory records, and Node's test runner. The existing instruction skill remains stack-agnostic. Repository inspection found no app, framework, runtime, or build pipeline to extend. A Node HTTP contract is therefore the smallest testable first stack for these boundary examples. Ajv and ajv-formats validate JSON Schema; there is no custom schema engine.

Next.js was considered, but introducing its router, compilation, session integration, and framework caches would materially expand this milestone. This adapter does not support or validate Next.js, React server components, middleware, fetch caching, or production hosting. Those require a future adapter with framework-specific fixtures and evidence. Do not point the current adapter at a Next.js app or relabel its results as Next.js evidence.

## Three cases, four runnable variants

1. **Healthy static portfolio (`portfolio`):** local HTML and its stylesheet load; an absent route is 404. There are no accounts or integrations in this controlled fixture. Healthy means only these narrow checks pass, not accessibility, SEO, or browser certification.
2. **Two-user app (`two-user-broken`, `two-user-fixed`):** two synthetic identities and notes, with broken/fixed ownership enforcement and caching policy. Both A-to-B and B-to-A reads and mutations are tested. Owner reads and writes are positive controls, so denying everything cannot produce a pass. A second check sends A then B through a URL-keyed shared-cache model and observes whether A's response leaks to B.
3. **Failing integration (`integration-failure`):** an in-process dependency throws, but the target incorrectly returns success. No external provider is called. Deployment evidence is unavailable and remains NOT RUN. The integration defect means NOT READY even while deployment evidence is missing.

Fixture code under `fixtures/targets/` contains no expected findings. The runner dispatches fixture variants; the adapter owns request plans; `tests/expected.json` independently lists expected failures. The broken fixtures are intentional teaching targets. Never deploy them or reuse their header-based identities as authentication.

## Catalog: 14 bounded checks

| ID | Observed criterion | Applicability |
| --- | --- | --- |
| HTTP-01 | Homepage 200, HTML content type and heading | All |
| HTTP-02 | Missing route returns 404 | All |
| HTTP-03 | Referenced stylesheet returns CSS | All |
| AUTH-01 | Anonymous read and mutation rejected | Two-user |
| AUTH-02 | A and B can each read their own note | Two-user |
| AUTH-03 | A cannot read B's note | Two-user |
| AUTH-04 | B cannot read A's note | Two-user |
| AUTH-05 | A's attempted write to B is rejected and B's note stays unchanged | Two-user |
| AUTH-06 | B's attempted write to A is rejected and A's note stays unchanged | Two-user |
| AUTH-07 | Both owners can write and read back their own note | Two-user |
| CACHE-01 | Both personalized responses prohibit storage | Two-user |
| CACHE-02 | A then B remain isolated in the synthetic shared-cache model | Two-user |
| API-01 | Unavailable integration returns 503 and explicit failure | Integration |
| DEPLOY-01 | Candidate-specific deployment evidence | Always NOT RUN |

These IDs belong to adapter v0.1.0, not to an exhaustive standard. API-01's 503 contract and CACHE-01's no-store requirement are explicit fixture choices, not universal prescriptions for all applications. All checks except deployment are critical to the local contract. Deployment becomes critical in `--release` mode. With healthy local checks, `--release` returns INSUFFICIENT EVIDENCE. A READY local-fixture verdict never means release-ready.

Database restores, real sessions, TLS, browser interactions, accessibility, actual CDN behavior, deployed routing, capacity, costs, and monitoring are **not run by this adapter**. They remain manual skill review areas. Their absence from this small catalog is not a pass or an N/A judgment on a real application.

## Versioned contract

[schema/evidence-v1.schema.json](../schema/evidence-v1.schema.json) uses JSON Schema 2020-12. `schema_version` is `1.0.0`; breaking changes require a new version. The current validator accepts only this exact version and rejects unknown fields.

Each report includes:

- Fixture, assessment scope, Git revision and dirty state, plus a SHA-256 digest of adapter/fixture/schema sources and dependency manifests. The digest distinguishes local source edits at one revision; it is not a signature.
- Environment kind, OS/architecture, Node, adapter, and Ajv versions.
- UTC run/check/observation timestamps, explicit limits, check IDs and criteria.
- Observed request method/path/identity, response status/body and selected headers, and whether a response came from the origin or synthetic cache.
- Outcome, reason, criticality, probe error if applicable, and categorical verdict.

`adapter/validate.mjs` first applies the schema, then enforces the exact check set and applicability, request sequence, complete observations for PASS/FAIL, timestamp ordering, cache provenance, check predicates, and aggregate verdict. An unsupported deployment PASS, empty PASS, contradictory response, false N/A, duplicate check, altered criticality, or ready verdict contradicted by a critical failure is rejected. Incomplete probes require an error and are NOT RUN; infrastructure failure is not automatically a target defect.

The validator **cannot establish that recorded observations are truthful**. A person who fabricates internally consistent responses or metadata can fabricate a valid report. There is no signed attestation, live replay, freshness policy, external deployment proof, or protected evidence store. Trust the run context and inspect the source, not just a successful validation message. Historical comparison and stale-evidence enforcement are deferred.

## Execution and exit status

Use the commands in the README. Only allowlisted fixture names are accepted. Servers bind to `127.0.0.1` on random ports, use synthetic in-memory data, and close after each run. Probes have a two-second timeout and reject redirects and non-loopback origins. The target never calls an external service. Installing dependencies and CI setup can require network access; fixture execution does not.

The fixture command exits 0 when it successfully produces valid evidence, even if the deliberately broken fixture is NOT READY. A malformed command, invalid report, setup failure, or validation error exits 1. `npm test` compares outcomes to independent expected findings and fails if the broken example stops revealing its defects or the fixed example regresses. Do not use the fixture CLI's process status as an application release gate.

Reports go into ignored `reports/` files and are not committed. The adapter records full synthetic response bodies; it has no general-purpose production secret redactor. Its refusal to accept real targets is intentional.

## Verification limits

`npm run check` performs JavaScript syntax checks and documentation punctuation checks. `npm test` runs HTTP boundary and evidence validation regression tests. `npm run fixtures` regenerates and validates the four variants. `npm run verify` combines them. There is no TypeScript project, application build step, or full style linter to claim. CI repeats the aggregate checks on Node 24 with read-only repository permission, no credentials, and no deployment step. A passing synthetic suite establishes this fixture contract only.
