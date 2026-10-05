# Evidence adapter v0.2.0

## Audience and first stack

The first audience is solo developers and small teams who maintain a simple Node.js website or small authenticated HTTP application and want to understand what a readiness claim is supported by before adapting it to their own project.

The executable scope is narrower than that audience: **bundled synthetic fixtures only**, using Node.js 24+ core HTTP, plain HTML/CSS, in-memory records, and Node's test runner. The existing instruction skill remains stack-agnostic. Repository inspection found no app, framework, runtime, or build pipeline to extend. A Node HTTP contract is therefore the smallest testable first stack for these boundary examples. Ajv and ajv-formats validate JSON Schema; there is no custom schema engine.

The continuation adds one optional Next.js 16.3.8 / React 19.3.0 production-build fixture. Actual App Router GET/PATCH handlers enforce synthetic ownership and return private/no-store headers. It covers the same contract as the fixed core fixture, not arbitrary Next.js apps, real sessions, server actions, middleware, framework fetch caches, CDN behavior, or production hosting. Source and build-output hashes are checked before use; sources changing during a build or run require a rerun.

## Three cases, four core variants and a framework integration

1. **Healthy static portfolio (`portfolio`):** local HTML and its stylesheet load; an absent route is 404. There are no accounts or integrations in this controlled fixture. Healthy means only these narrow checks pass, not accessibility, SEO, or browser certification.
2. **Two-user app (`two-user-broken`, `two-user-fixed`):** two synthetic identities and notes, with broken/fixed ownership enforcement and caching policy. Both A-to-B and B-to-A reads and mutations are tested. Owner reads and writes are positive controls, so denying everything cannot produce a pass. A second check sends A then B through a URL-keyed shared-cache model and observes whether A's response leaks to B.
3. **Failing integration (`integration-failure`):** an in-process dependency throws, but the target incorrectly returns success. No external provider is called. Deployment evidence is unavailable and remains NOT RUN. The integration defect means NOT READY even while deployment evidence is missing.

The optional `nextjs-fixed` integration implements the fixed two-user contract independently in Next.js Route Handlers. Its assertions and expected contract remain outside the target.

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

These IDs belong to adapter v0.2.0, not to an exhaustive standard. API-01's 503 contract and CACHE-01's no-store requirement are explicit fixture choices, not universal prescriptions for all applications. All checks except deployment are critical to the local contract. Deployment becomes critical in `--release` mode. With healthy local checks, `--release` returns INSUFFICIENT EVIDENCE. A READY local-fixture verdict never means release-ready.

Database restores, real sessions, TLS, browser interactions, accessibility, actual CDN behavior, deployed routing, capacity, costs, and monitoring are **not run by this adapter**. They remain manual skill review areas. Their absence from this small catalog is not a pass or an N/A judgment on a real application.

## Versioned contract

[schema/evidence-v2.schema.json](../schema/evidence-v2.schema.json) uses JSON Schema 2020-12. New reports use `schema_version: 2.0.0` and reject unknown fields. Historical v1 reports remain structurally readable, but their missing input manifest prevents freshness approval or new lifecycle linkage.

Each report includes:

- Fixture, assessment scope, Git revision and dirty state, plus hashes for every tracked or non-ignored repository file and their aggregate digest. Added/deleted files are included in change detection. Non-regular inputs are refused. Generated reports, dependencies and build outputs are ignored by Git; the Next.js executable build has a separate environment digest. Digests are not signatures.
- Environment kind, OS/architecture, Node, adapter, and Ajv versions.
- UTC run/check/observation timestamps, explicit limits, check IDs and criteria.
- Observed request method/path/identity, response status/body and selected headers, and whether a response came from the origin or synthetic cache.
- Outcome, reason, criticality, probe error if applicable, and categorical verdict.

`adapter/validate.mjs` first applies the schema, then enforces the exact check set and applicability, request sequence, complete observations for PASS/FAIL, timestamp ordering, cache provenance, check predicates, and aggregate verdict. An unsupported deployment PASS, empty PASS, contradictory response, false N/A, duplicate check, altered criticality, or ready verdict contradicted by a critical failure is rejected. Incomplete probes require an error and are NOT RUN; infrastructure failure is not automatically a target defect.

The validator **cannot establish that recorded observations are truthful**. A person who fabricates internally consistent responses or metadata can fabricate a valid report. There is no signed attestation, external deployment proof, or protected evidence store. Trust the run context and inspect the source, not just a successful validation message. The separate [lifecycle policy](lifecycle.md) checks currentness conservatively and links historical reports without authenticating them.

## Execution and exit status

Use the commands in the README. Only allowlisted fixture names are accepted. Servers bind to `127.0.0.1` on random ports, use synthetic in-memory data, and close after each run. Probes have a two-second timeout and reject redirects and non-loopback origins. The target never calls an external service. Installing dependencies and CI setup can require network access; fixture execution does not.

The fixture command exits 0 when it successfully produces valid evidence, even if the deliberately broken fixture is NOT READY. A malformed command, invalid report, setup failure, or validation error exits 1. `npm test` compares outcomes to independent expected findings and fails if the broken example stops revealing its defects or the fixed example regresses. Do not use the fixture CLI's process status as an application release gate.

Reports go into ignored `reports/` files and are not committed. The adapter records full synthetic response bodies; it has no general-purpose production secret redactor. Its refusal to accept real targets is intentional.

## Verification limits

`npm run check` performs JavaScript syntax checks and documentation punctuation checks. `npm test` runs HTTP boundary and evidence validation regression tests. `npm run fixtures` regenerates and validates the four variants. `npm run verify` combines them. The optional `npm run next:verify` performs a real Next.js production build and integration tests. There is no standalone TypeScript project or full style linter to claim. `npm run verify:all` adds evaluation, lifecycle examples and Next.js checks. CI repeats the full aggregate checks on Node 24 with read-only repository permission, no credentials, and no deployment step. A passing synthetic suite establishes this fixture contract only.
