# Tinkerplum

**A clearer answer to “is this website ready to launch?”**

Tinkerplum is an instruction-only Codex skill that reviews production readiness, prioritizes launch blockers, and verifies fixes you authorize. It adapts to your website's architecture: a public portfolio gets a proportionate review, while a SaaS application gets deeper attention to identity, data isolation, recovery, and operations.

**Tinkerplum is the repository name. `production-readiness` is the skill name.** Keep the installed folder and invocation as `production-readiness`; the selector may display **Production Readiness**.

[Install](#install) · [Run synthetic examples](#optional-reproducible-evidence-examples) · [First audit](#run-your-first-audit) · [Understand results](#understand-results) · [Update or remove](#update-or-remove) · [Troubleshooting](#troubleshooting)

## What it does

- **Audit by default:** inspect the project, run safe checks within scope, and explain risks without editing application files.
- **Implement when requested:** make bounded fixes, add relevant regression coverage, and report verification results.
- **Assess a release:** evaluate a specific candidate and environment, including missing evidence and recovery needs.

The instruction skill has no install-time code, bundled scanner, API key, subscription, or package dependency. This repository also includes an optional Node.js fixture adapter with two pinned validation dependencies; it is not copied when you install the skill. Your Codex access and the tools required by the website itself are separate prerequisites. The skill guides Codex; it is not a standalone program you run in a terminal.

It does not deploy your application, provision infrastructure, certify security or compliance, or replace a specialist penetration test. It does not require every website to have accounts, a database, Redis, or Kubernetes.

## Who this milestone is for

The first executable milestone targets solo developers and small teams learning to verify a simple Node.js site's HTTP access and caching boundaries. Its runnable examples use **Node.js 24+ core HTTP, plain HTML/CSS, and in-memory synthetic data**. The instruction skill still supports broader stack-aware manual reviews.

The adapter accepts only bundled fixtures. It cannot scan your website, Next.js app, or a production URL. An optional production-built Next.js 16.3.8 fixture now covers the same synthetic access and caching contract. It does not validate arbitrary Next.js applications; [the scope decision](docs/evidence.md#audience-and-first-stack) explains why this small repository starts with a minimal HTTP contract. [The provenance review](docs/provenance.md) documents overlap and influences without claiming exhaustive originality.

## The ten review areas

| Area | Questions the review investigates |
| --- | --- |
| Caching | Are assets fresh, cache keys correct, and private responses isolated? |
| CDN and delivery | Do HTTPS, domains, redirects, routes, and assets work as intended? |
| Authentication and authorization | Are sessions and protected actions enforced, including user and tenant boundaries? |
| Security and privacy | Are there plausible injection paths, exposed secrets, unsafe dependencies, or unnecessary data exposure? |
| Database and durable state | Are writes consistent, migrations safe, and critical data recoverable? |
| APIs and integrations | Are inputs, permissions, retries, webhooks, and failure cases handled correctly? |
| Testing and user experience | Do important journeys work, including errors, mobile layouts, and basic accessibility? |
| CI/CD and release mechanics | Is the candidate traceable, buildable, and recoverable through the release process? |
| Monitoring and operations | Can an owner detect and respond to consequential failures? |
| Scaling and cost | Are capacity, quotas, resource use, and spending bounded for the expected workload? |

An area can be **N/A with a reason**. Missing access or evidence is **NOT RUN**, not N/A. The full criteria live in [readiness-checks.md](production-readiness/references/readiness-checks.md).

## Repository layout

```text
Tinkerplum/
├── README.md
├── .gitignore
└── production-readiness/
    ├── SKILL.md                         # Workflow, modes, and safety boundaries
    ├── agents/
    │   └── openai.yaml                  # Display name and default prompt
    ├── references/
    │   ├── readiness-checks.md          # Ten-area investigation guide
    │   ├── release-gates.md             # Decisions and recovery requirements
    │   └── optional-adapter.md          # Optional synthetic evidence workflow
    └── assets/
        └── report-template.md          # Evidence-based review structure
```

The optional development tools live separately in `adapter/`, `schema/`, `fixtures/`, and `tests/`. Expected findings are in `tests/expected.json`, outside the target applications. See [the evidence contract and check catalog](docs/evidence.md) for their structure and limits.

## Install

### 1. Check prerequisites

You need a Codex environment that supports local skills, access to the website project you want reviewed, and Git if you use the clone commands. The shell examples below are for macOS/Linux using a POSIX-compatible shell such as Bash or Zsh.

Check Git before cloning:

```sh
git --version
```

Read [SKILL.md](production-readiness/SKILL.md) before installing. Install the **entire `production-readiness` folder**, including its references and template. Cloning alone does not install it.

### 2. Download the repository

In a directory where you keep source repositories, run:

```sh
git clone https://github.com/singhsrt10/Tinkerplum.git && cd Tinkerplum
```

If `Tinkerplum` already exists, Git will stop rather than overwrite it. Inspect that directory before reusing it. You can also use GitHub's **Code > Download ZIP**, extract it, and open a terminal in the extracted repository folder containing `README.md` and `production-readiness/`. ZIP downloads do not support the Git update command below.

### 3. Choose one installation scope

Use **personal** for your projects on this machine, or **project** to keep the skill with one website repository. Avoid duplicate copies with the same skill name.

#### Option A: Personal installation

Run from the downloaded Tinkerplum repository root:

```sh
(
  dest="$HOME/.agents/skills/production-readiness"
  if [ ! -f production-readiness/SKILL.md ]; then
    printf 'Run this from the Tinkerplum repository root.\n'
    exit 1
  fi
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    printf 'Already exists: %s\nReview it before updating. Nothing copied.\n' "$dest"
    exit 1
  fi
  mkdir -p "$HOME/.agents/skills" &&
    cp -R production-readiness "$dest" &&
    printf 'Installed: %s\n' "$dest"
)
```

#### Option B: Project installation

Replace the example path with the existing website repository you want to review. Keep the quotes if its path contains spaces. Run from the Tinkerplum repository root:

```sh
(
  project="/absolute/path/to/your-website-repository"
  dest="$project/.agents/skills/production-readiness"
  if [ ! -f production-readiness/SKILL.md ]; then
    printf 'Run this from the Tinkerplum repository root.\n'
    exit 1
  fi
  if [ ! -d "$project" ]; then
    printf 'Project folder does not exist: %s\n' "$project"
    exit 1
  fi
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    printf 'Already exists: %s\nReview it before updating. Nothing copied.\n' "$dest"
    exit 1
  fi
  mkdir -p "$project/.agents/skills" &&
    cp -R production-readiness "$dest" &&
    printf 'Installed: %s\n' "$dest"
)
```

For a team, review and commit the installed project folder through your normal workflow. This does not automatically install a personal copy for teammates or on other machines.

### 4. Verify discovery

Open your website project in Codex. In CLI/IDE, run `/skills` or type `$` and select `production-readiness`. In the ChatGPT desktop skill interface, open **Skills** and use `@` to select it. If the new skill does not appear, restart Codex.

The expected installed file is `~/.agents/skills/production-readiness/SKILL.md` for personal use or `<website-repository>/.agents/skills/production-readiness/SKILL.md` for project use. There should not be an extra nested `production-readiness` directory.

Local skill locations and invocation were checked against [OpenAI's skills documentation](https://learn.chatgpt.com/docs/build-skills) on **2026-10-05**. These instructions cover local skill folders, not a published plugin or cloud installation. Native Windows installation is not validated by this guide.

## Run your first audit

Start in the **website project**, not this skill repository. Paste this into Codex, selecting the skill mention where supported:

```text
Use $production-readiness to audit this website before launch.
Inspect the repository and run safe local checks. Do not change application
files, deploy, create services, or modify production settings.
Report launch blockers, supporting evidence, checks not run, and next steps.
```

In the ChatGPT desktop interface, select `@production-readiness` instead of the `$` mention. Supply the intended environment, critical user journeys, traffic assumptions, and any existing CI or recovery evidence when available. Never paste credentials into the prompt.

### Keep a portfolio review proportionate

```text
Use $production-readiness on this public portfolio. It has no visitor accounts
or application database. Inspect the integrations you find, explain N/A areas,
and focus on practical launch risks. Audit only; do not edit or deploy.
```

### Authorize a bounded fix

After reading the findings, identify the exact issues you want fixed:

```text
Use $production-readiness to fix findings AUTH-01 and CACHE-02 from the review
in this project. Make minimal changes, add relevant regression tests, and
rerun the affected checks. Report remaining gaps. Do not deploy, change
production data or settings, or create paid resources.
```

Replace those example IDs with actual findings. A request for fixes authorizes that implementation scope, not a production release.

### Review a release candidate

```text
Use $production-readiness to assess the current commit for a staging release.
Use available CI results and the runbook. State the candidate and environment,
give a go/no-go recommendation, identify missing evidence, and outline recovery.
Do not deploy or modify external settings.
```

## Understand results

| Check status | Meaning |
| --- | --- |
| PASS | Evidence supports this criterion for the stated scope. |
| FAIL | Evidence demonstrates that the criterion is unmet. |
| NOT RUN | The check was not performed or evidence is insufficient. |
| N/A | The criterion does not apply, with an explanation. |

The overall verdict is **READY**, **NOT READY**, or **INSUFFICIENT EVIDENCE**. A demonstrated blocker means NOT READY; a decision-critical evidence gap prevents READY. Accepted risks are recorded separately and do not turn failed checks into passes.

Expect prioritized findings, file or command evidence, the revision/environment reviewed, verification limits, and actionable next steps. A passing local build does not prove deployed behavior. No percentage score or blanket security guarantee is provided.

For a saved review, ask Codex to use [the report template](production-readiness/assets/report-template.md) and specify a private destination. [Release gates](production-readiness/references/release-gates.md) explain recovery and final decision criteria.

## Optional reproducible evidence examples

These examples are for the **Tinkerplum clone**, not your website directory or the installed skill folder. They start temporary servers only on `127.0.0.1`, use invented users and notes, and stop automatically. They never deploy, contact an integration provider, or accept arbitrary target URLs. Do not deploy the intentionally broken targets.

### 1. Prepare the optional tools

Use Node.js 24 or newer and npm. From the Tinkerplum repository root:

```sh
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
```

Dependency installation uses the npm registry. `--ignore-scripts` prevents dependency lifecycle scripts. No npm installation is needed for the instruction-only skill. Node's standard test runner and Ajv JSON Schema validation provide the underlying tools.

### 2. Run all validation and examples

```sh
npm run verify
```

This runs JavaScript syntax checks, the core regression suite, and all four core fixture variants. The separate Next.js commands below run a real production build and integration tests. There is no standalone TypeScript project or browser audit.

| Case | Expected local verdict | What it demonstrates |
| --- | --- | --- |
| `portfolio` | READY | HTML, stylesheet delivery, and missing-route behavior only |
| `two-user-broken` | NOT READY | Cross-user reads/writes and shared-cache leakage |
| `two-user-fixed` | READY | Both user directions blocked, owners still work, private responses not shared |
| `integration-failure` | NOT READY | Unavailable dependency incorrectly reported as success; deployment NOT RUN |

**READY here means the small local fixture contract passed. It does not mean a real website is ready for production.** All variants record unavailable deployment evidence as NOT RUN.

### 3. Inspect a single case and its evidence

```sh
node adapter/cli.mjs two-user-broken
npm run validate -- reports/two-user-broken.json
```

Open `reports/two-user-broken.json`. Check the revision, dirty state, source digest, environment/tool versions, timestamps, limits, and request/response observations. The broken case should fail `AUTH-03` through `AUTH-06`, `CACHE-01`, and `CACHE-02`. The validator rejects unsupported PASS claims, incomplete evidence, and a verdict that contradicts the observations.

Reports are ignored by Git. Their full response bodies are safe only because these targets contain synthetic data. Validation checks internal consistency; it cannot prove that someone has not fabricated the entire report.

### 4. See how missing release evidence changes the decision

```sh
node adapter/cli.mjs portfolio --release
npm run validate -- reports/portfolio-release.json
```

The verdict is **INSUFFICIENT EVIDENCE**: healthy local responses do not supply deployment evidence. No deployment is contacted by `--release`; it only makes that missing evidence decision-critical.

The CLI exits successfully when evidence is produced and validated, even for a deliberately NOT READY fixture. `npm test` fails on mismatches against the expected findings. Do not use the fixture command's exit status as a release approval.

### 5. Link a failure to its recheck

```sh
npm run example
node adapter/lifecycle-cli.mjs validate-link reports/fix-recheck.json
```

This reruns the broken and fixed two-user variants, retains both reports, and writes a hash-linked comparison. Six previously failing access/cache checks resolve in this controlled example. It selects bundled variants; it does not claim to patch a real application or prove that a code change caused an outcome.

For your own recorded runs of a supported fixture, use:

```sh
node adapter/lifecycle-cli.mjs link reports/before.json reports/after.json reports/fix-recheck.json "Describe the authorized change or recheck"
```

Linkage rejects unrelated targets, different scopes/tools, reversed run order, and altered hashes or transitions. See [the lifecycle guide](docs/lifecycle.md) for regressions, unresolved failures, and trust limits.

### 6. Check whether old evidence can be reused

```sh
node adapter/lifecycle-cli.mjs current reports/after.json two-user-fixed
```

Evidence is reusable only for a clean matching revision, identical repository inputs, target, scope, environment/tool versions, and a 24-hour age window. Any changed, added, or deleted non-ignored file invalidates all checks, including documentation changes. Stale output names changed paths and returns exit code 2 with INSUFFICIENT EVIDENCE. It leaves the original report untouched. Structural validation alone does not establish freshness.

Work-in-progress reports can still help debugging, but a dirty working tree prevents reuse. Commit the intended changes, rerun the fixture, then check freshness. Use `--release` with `current` only when reviewing a release-scope report; it does not grant deployment access.

### 7. Reproduce the protocol comparison

```sh
npm run evaluate
```

Read `reports/evaluation.json`. The baseline actually performs three HTTP smoke checks. The fuller protocol actually executes the skill's encoded access, caching, and evidence checks. The supplied broken cases contain seven expected check-level failures: smoke checks miss them, while the fuller protocol detects them. Healthy controls must not produce unexpected findings. Incomplete applicable evidence fails the evaluation rather than counting as a clean result.

This is a deterministic protocol comparison on known synthetic cases, **not a measured improvement in model behavior**. No model calls are made. The repository includes fixed baseline/skill-assisted prompts and a paired-record scorer for a future approved experiment:

```sh
node evaluation/score-model.mjs baseline.json skill-assisted.json
```

Those files must contain actual recorded outputs matching [the study protocol and schema](docs/evaluation.md). No real model-study results are bundled. Unit-test records are explicitly synthetic and are not research results.

### 8. Verify the bounded Next.js integration

```sh
npm run next:install
npm run next:verify
node adapter/cli.mjs nextjs-fixed
npm run validate -- reports/nextjs-fixed.json
```

The optional dependency set pins Next.js 16.3.8 and React 19.3.0. The build runs with telemetry disabled. Tests start the production build on loopback, exercise actual App Router handlers and read/write boundaries, and inspect private-cache headers. Source and executable-build hashes are checked; changed sources or build output require a rebuild. Synthetic headers still stand in for identity, and the cache replay is a small model, not a real CDN.

No browser, real session provider, server actions, middleware, distributed state, edge runtime, or deployment is covered. Do not interpret this one fixture as broad Next.js support.

### Development and CI

```sh
npm run check
npm test
npm run fixtures
```

After installing both dependency sets, `npm run verify:all` runs the core suite, comparison, fix/recheck example, and Next.js build/integration tests. The GitHub workflow installs both sets and repeats that aggregate on Node 24 with read-only repository permissions. This is synthetic regression coverage, not a production security certification. There are no paid services, scanners, deployment credentials, or license changes in this milestone.

The bounded engineering workflow is implemented: evidence linkage, conservative invalidation, deterministic comparison, and one real framework fixture. Real-user pilots, model-assisted effectiveness measurements, and external/live production verification remain unperformed. [Completion and pending criteria](docs/completion.md) distinguish those from completed engineering; no rollout, public outreach, or new license is implied.

## Update or remove

### Update without losing local changes

1. Open your Tinkerplum clone and inspect `git status`. Preserve any local edits before updating.
2. For a clean clone, run:

   ```sh
   git pull --ff-only
   ```

3. Compare the new `production-readiness/` folder with your installed copy. Installation copies files; a Git pull does not update the installed skill.
4. Move the existing installed folder to a backup location **outside any `.agents/skills` directory**. Check the destination does not already exist, and keep local customizations for review. Do not leave the backup inside a scanned skills folder.
5. Rerun your chosen installation block, then verify discovery and try the audit-only prompt. If needed, remove the new copy and restore the backup.

For a ZIP download, obtain and inspect a fresh ZIP instead of running `git pull`. If a Git pull fails or reports local changes, resolve the situation deliberately; do not use a hard reset to force the update.

### Remove safely

Locate the personal or project installation you chose. Move **only its `production-readiness` folder** outside `.agents/skills` as a reversible backup, then restart Codex and check the selector. Delete the backup later if no longer needed. Do not delete the entire `.agents` directory or other skills. Removing the clone alone does not remove an installed copy.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Skill does not appear | Check the installation path and exact `SKILL.md` name, then restart Codex. For a project install, open that website repository. |
| Installation says “Already exists” | The protection worked. Inspect the existing copy and follow the update steps; do not blindly overwrite it. |
| Duplicate selector entries | Check for personal and project copies with the same skill name. Keep the intended scope and move the other copy outside scanned skill folders. |
| Referenced guide or template is missing | Copy the whole folder, including `references/`, `assets/`, and `agents/`. |
| `$Tinkerplum` is not found | Invoke `$production-readiness`; Tinkerplum is the repository brand. |
| Review examines this skill instead of your website | Open the website repository and start the audit there. |
| Evidence is STALE | Check the reported paths, revision, dirty state, tools and age. Rerun on the intended clean candidate; do not edit hashes to force reuse. |
| Next.js reports a stale build | Rerun `npm run next:build`, then the integration tests. The fixture refuses to relabel an old or modified build as new evidence. |
| Optional fixture commands fail | Run from the clone with Node 24+ and `npm ci` completed. Check loopback permission and Git availability; do not point the adapter at a real URL. |
| Tests or builds cannot run | Provide the project's required runtime/dependencies and safe test configuration. The report should say NOT RUN, not pretend the check passed. |
| Production checks are missing | Supply authorized environment access or dated evidence. Local files alone cannot establish remote state. |
| Git fails on macOS with an Xcode license error | Resolve the developer-tools setup in your own terminal, or use GitHub's ZIP download. The skill does not require Xcode. |

## Privacy and permission boundaries

Keep credentials, customer data, and client-specific reports out of this public repository. The `.gitignore` excludes common sensitive files and generated report folders, but it is not a secret scanner and cannot protect files already committed.

The skill instructs Codex to redact secrets, avoid destructive checks, inspect commands before running them, and honor host permissions. Uploading project material to a new external service requires authorization. Deployment, production data changes, access settings, paid infrastructure, and load testing require appropriate explicit scope and approval. Never bypass an approval denial to complete a review.

A review can expose sensitive implementation details. Store it in an appropriately restricted location and review it before sharing. Audit mode is the default; application edits require an implementation request.

The optional adapter is deliberately restricted to synthetic fixtures and is not an authorization to scan other systems.

## Maintenance and licensing

Keep provider-specific configuration in the website project. Recheck official documentation when tools change, preserve the skill folder structure, and verify representative audits after modifying instructions.

This repository currently has no license file. Public visibility alone does not grant an open-source license. No automated CI badge, security certification, or deployment guarantee is claimed.
