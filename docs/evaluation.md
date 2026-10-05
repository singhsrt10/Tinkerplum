# Reproducible evaluation

## Executed protocol comparison

Run `npm run evaluate` from the clone after installing root dependencies. The evaluator starts fresh isolated targets and actually executes both conditions:

- Baseline: homepage, missing-route and stylesheet smoke probes.
- Treatment: the adapter's complete evidence and boundary-check protocol, reflecting the skill's requirement to investigate authorization, caching and missing evidence.

The same four core variants are used. Expected check failures are stored outside targets in `tests/expected.json`. Each result retains raw baseline responses, the validated treatment report, detected/missed/unexpected check IDs, incomplete critical checks and verdict mismatch. A source/revision change across the entire comparison aborts it. Incomplete treatment evidence or mismatches cause a failing process exit.

The known dataset has six access/cache failures in the broken two-user case and one integration failure. Healthy portfolio and fixed two-user cases are controls. The smoke baseline does not examine the seven defect checks; the treatment does. This is a check-level demonstration of coverage, not seven independent vulnerabilities, a statistical benchmark, or a numeric production-readiness score. The dataset was developed with these checks and is not held out.

The generated report explicitly records model-assisted effectiveness as **NOT RUN**. Deterministic code does not measure whether a skill improves an agent's reasoning or behavior.

## Actual paired model study: runnable scorer, no fabricated study

The repository supplies two fixed prompts under `evaluation/prompts/` and the strict [record schema](../schema/model-record-v1.schema.json). No model runs are performed by this software. No actual model-study records are bundled. Tests use clearly labelled synthetic records only to verify validation behavior.

For a future separately authorized study:

1. Pin the fixture-source revision and hashes. Prepare separate target-only directories with neutral labels. Keep `tests/expected.json`, adapter predicates, evaluation results and condition labels hidden from both reviewers. The known dataset is still not a holdout benchmark.
2. Use independent fresh sessions, the same model/version, tool access, budget, and settings. Record those settings and their SHA-256. Randomize condition order and run multiple matched repetitions. The skill-assisted condition receives the exact skill package; the baseline does not. Do not let sessions read each other's output.
3. Use the supplied condition prompt verbatim and record its SHA-256. Give each session only the synthetic target and equivalent bounded local execution access. Do not scan production, call paid services or contact external users as part of this repository workflow.
4. Preserve the actual raw output per fixture. A human who did not author that run should map supported findings to catalog check IDs using citations that occur verbatim in the raw output. Do not add a finding merely because the expected answer contains it. Record uncertainty as missing rather than inventing a result.
5. Fill a `model-record-1.0.0` JSON for each condition. Required metadata: condition, study ID, exact model version, settings hash, reference dataset hash, published prompt hash, run timestamps, `run_status: COMPLETED`, and all four cases. The scorer refuses NOT RUN/FAILED records rather than counting them as completed study results. Each case contains `fixture`, `raw_output`, and `findings` entries with `check_id` and a supporting `citation`.
6. Obtain the exact reference dataset and prompt hashes with `node evaluation/score-model.mjs protocol`. The dataset hash binds the current core fixture source and expected findings; a report for a different dataset is refused. Record that `dataset_sha256` without exposing answer files to model sessions. Score a matched pair:

   ```sh
   node evaluation/score-model.mjs baseline.json skill-assisted.json
   ```

The scorer checks schema, prompt identity, matched model/settings/dataset/study metadata, complete case sets, unique finding IDs, and citations in recorded outputs. It reports detected, missed and unexpected IDs per condition. It does not authenticate that a model actually ran or judge whether a quotation logically supports a finding. Retain original session logs and independent human adjudication. Pairing, blinding and repetition cannot be inferred from a valid JSON file alone.

Model efficacy, generalization to unfamiliar apps, false-positive rates in real projects, and comparative time/cost remain unmeasured until genuine records exist. A real-user pilot additionally requires explicit participant consent, protected data handling and agreed acceptance criteria. No outreach or pilot was performed here.
