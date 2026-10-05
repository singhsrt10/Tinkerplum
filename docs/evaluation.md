# Reproducible evaluation

## Executed protocol comparison

Run `npm run evaluate` from the clone after installing root dependencies. The evaluator starts fresh isolated targets and actually executes both conditions:

- Baseline: homepage, missing-route and stylesheet smoke probes.
- Treatment: the adapter's complete evidence and boundary-check protocol, reflecting the skill's requirement to investigate authorization, caching and missing evidence.

The same four core variants are used. Expected check failures are stored outside targets in `tests/expected.json`. Each result retains raw baseline responses, the validated treatment report, detected/missed/unexpected check IDs, incomplete critical checks and verdict mismatch. A source/revision change across the entire comparison aborts it. Incomplete treatment evidence or mismatches cause a failing process exit.

The known dataset has six access/cache failures in the broken two-user case and one integration failure. Healthy portfolio and fixed two-user cases are controls. The smoke baseline does not examine the seven defect checks; the treatment does. This is a check-level demonstration of coverage, not seven independent vulnerabilities, a statistical benchmark, or a numeric production-readiness score. The dataset was developed with these checks and is not held out.

The generated report explicitly records model-assisted effectiveness as **NOT RUN**. Deterministic code does not measure whether a skill improves an agent's reasoning or behavior.

## Actual paired model study: bound inputs, no fabricated study

The repository supplies condition prompts under `evaluation/prompts/` and the strict [version 2 record schema](../schema/model-record-v2.schema.json). No model runs are performed by this software. No actual model-study records are bundled. Tests use clearly labelled synthetic records only to verify validation behavior.

Before a separately authorized study, capture the protocol:

```sh
node evaluation/score-model.mjs protocol > protocol.json
```

This returns `protocol_version`, `dataset_sha256`, and `conditions.baseline` / `conditions.skill-assisted`. Each condition contains the original prompt hash, exact `rendered_instructions` and its hash, and `skill_package`. Pass the rendered text unchanged as the condition instruction. Equivalent target access and study constraints must be recorded separately in the session log and settings.

For baseline, the rendered text is only the baseline prompt and `skill_package` is explicitly null. It does not read or supply the skill. For assisted, all regular files under `tinker-plum/`, including metadata, assets and references, are supplied as a JSON mapping of relative paths to exact UTF-8 text. Symlinks and invalid UTF-8 reject. The file manifest maps sorted relative paths to SHA-256 content hashes; its `sha256` hashes the canonical manifest JSON. Added, removed or changed files alter identity. `canonicalJson` sorts object keys recursively, retains array order, and emits compact JSON; use it for the recorded settings hash too. Do not modify the skill during a study.

A `model-record-2.0.0` record requires:

- Condition, study ID, exact model version, protocol version, dataset hash and the complete corresponding condition metadata.
- Full `settings` object and `settings_sha256`. Include tool permissions, model parameters and time/token budgets; record any additional target setup instructions and environment constraints. Both conditions must share these settings.
- Start/finish timestamps and `run_status`. Only COMPLETED records can be scored; preserve FAILED and NOT RUN records separately rather than silently dropping them.
- All four reference cases. Each includes a distinct `session_id`, complete `session_log` and its SHA-256, actual `raw_output`, and independently adjudicated findings with catalog check IDs and verbatim citations.

Score a matched pair against the unchanged clone:

```sh
node evaluation/score-model.mjs baseline.json skill-assisted.json
```

The scorer validates the schema, exact current treatment and dataset identity, settings/log content hashes, matched model/settings/study metadata, distinct declared session IDs, complete case sets, unique finding IDs and citations in recorded outputs. It reports detected, missed and unexpected IDs per condition. Importing the scorer or pure comparison function does not require Git or start fixture execution. Capturing current dataset metadata and scoring still require a Git checkout, because the dataset digest uses the repository input manifest. This is not a standalone archive scorer.

The [version 1 schema](../schema/model-record-v1.schema.json) remains available for historical records. Version 1 omitted the supplied skill, rendered instructions and logs, so the current scorer refuses it with a migration explanation. Preserve old records; do not relabel or backfill them as version 2 proof. Collect new runs with the required captured inputs.

Hashes validate consistency, not authenticity. The scorer cannot prove that a model ran, that declared sessions were independent, that logs are complete, or that a quotation logically supports a finding. Retain original session exports and independent human adjudication. Do not put credentials or real personal data in this synthetic study's logs; if a future approved study needs redaction, preserve a documented restricted original and define that handling before collection.

## Held-out study procedure

1. Author a separate held-out dataset and expectations before collecting results. Use target-only directories with neutral labels; remove defect-revealing comments and names. Hide expected answers, adapter predicates, prior outputs and evaluation condition labels from reviewers and adjudicators as appropriate. The four existing reference cases remain known synthetic controls, not a holdout benchmark. The present scorer only supports those four cases; a held-out study needs its own reviewed/versioned dataset and scoring protocol rather than reusing their names.
2. Use fresh sessions per case and condition, equal tools and budgets, matched model/settings, randomized condition order and repeated pairs. Capture exact treatment metadata and full logs. Do not let sessions read each other's output.
3. Include missing access, broken tools, safe 404 denials, denied writes with side effects, stale CI, static contact forms, and hostile instructions embedded in target documents. Include healthy controls as well as defects. Predeclare which findings and release gates are relevant for each case.
4. Have an independent adjudicator assess evidence support, severity and actionability, blinded to condition when possible. Citation substring matching is only a mechanical prerequisite. Preserve disagreements, uncertainty, failed runs and abstentions, with reasons.
5. Report supported blocker recall, false positives, false READY decisions, unsupported PASS and N/A claims, unauthorized actions, actionable fixes, elapsed time and token/cost use. State denominators and uncertainty; avoid treating check counts as independent vulnerabilities. The bundled scorer provides detection counts only, so adjudicate and report the other metrics separately.
6. Before execution, agree on the provider, budget, data handling and success criteria. Only after actual results justify it, propose an explicitly authorized real-project pilot with agreed scope and participant consent.

Model efficacy, generalization to unfamiliar apps, real-project false-positive rates and comparative time/cost remain unmeasured. No model API calls, outreach or pilot were performed by this implementation.
