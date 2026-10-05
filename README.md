# Tinkerplum

Production-readiness review instructions for Codex. The installed skill is named **`production-readiness`**.

The skill guides repository inspection, safe verification, prioritized findings, and release decisions. It adapts the review to the application's stack, data, critical journeys, and failure consequences.

## Components

| Component | Purpose | Requirements |
| --- | --- | --- |
| `production-readiness/` | Instruction skill, reference guides, and report template | A host that loads Codex skills; access to the application and its tools |
| `scripts/install-skill.mjs` | Optional portable file-copy installer | Node.js 24+; no npm packages, Git, or network required |
| Evidence adapter | Reproducible tests against bundled synthetic applications | Git checkout, Node.js 24+, npm dependencies, and loopback server permission |

The instruction skill has no executable dependency or separate API key. It is not a standalone scanner. Installing the skill does not install or execute the optional adapter.

## Installation

Choose the route supported by the Codex environment where the skill will run.

| Route | Use when |
| --- | --- |
| Built-in skill installer | Codex provides `skill-installer` and can access GitHub |
| Portable local installer | A downloaded copy and Node.js are available; personal, project, or custom placement is needed |
| Manual folder copy | No command-line installer or Node.js is desired |
| Cloud or remote setup | Codex executes in a separate workspace, container, VM, or managed host |

### Built-in skill installer

In a Codex environment that provides the installer, request:

```text
Use $skill-installer to install production-readiness from the
singhsrt10/Tinkerplum GitHub repository, path production-readiness.
```

The built-in installer determines its supported destination and access requirements. Verify that the installed skill appears in the destination environment's selector. For a specific version, include the desired Git commit or tag in the request.

### Portable local installer

Download and extract the repository ZIP, or clone it:

```sh
git clone https://github.com/singhsrt10/Tinkerplum.git
cd Tinkerplum
```

Read [SKILL.md](production-readiness/SKILL.md), then run **one** command from the repository root. These commands use the same Node.js script in PowerShell, Command Prompt, Bash, and Zsh; no shell-specific copy command is required.

**Personal installation** into the current execution user's `.agents/skills` directory:

```sh
node scripts/install-skill.mjs --user
```

**Project installation** into an existing application's `.agents/skills` directory:

```sh
node scripts/install-skill.mjs --project "path/to/website-repository"
```

**Custom installation** into a host-provided skills directory:

```sh
node scripts/install-skill.mjs --dest "path/to/skills-directory"
```

Replace the example paths with actual paths. Windows paths such as `C:\Projects\Website` are accepted on Windows. Relative paths are resolved from the current working directory. `--dest` names the parent skills directory; the installer appends `production-readiness`.

The installer copies the complete skill, refuses existing destinations, and prevents copying into its own source folder. It does not update host configuration, install dependencies, or contact the network. A custom destination must be one the host actually scans.

### Manual installation

Copy the complete `production-readiness` folder, including `agents/`, `references/`, and `assets/`, into one destination:

| Scope | Destination |
| --- | --- |
| Personal | `<user-home>/.agents/skills/production-readiness` |
| Project | `<website-repository>/.agents/skills/production-readiness` |
| Custom | `<host-configured-skills-directory>/production-readiness` |

Use Finder, File Explorer, or a Linux file manager. A typical Windows personal path is `C:\Users\<username>\.agents\skills\production-readiness`. Check that `SKILL.md` is directly inside the installed folder, with no extra nested copy. Do not merge over an existing installation; preserve local changes first.

### Cloud, remote hosts, and containers

Install in the filesystem **where Codex executes**, not necessarily on the computer displaying its UI.

- For a writable remote workspace, run the portable installer there or copy the skill to its supported directory.
- For repository-based cloud work, commit a reviewed project copy under `.agents/skills/production-readiness` if the host supports repository skill discovery.
- For ephemeral containers or workspaces, provision the folder through the image or setup process; a one-time copy may disappear when the workspace is recreated.
- For managed interfaces without filesystem access, use the host's supported skill or plugin import mechanism. This repository's local installer cannot add a capability the host does not expose, and this repository is not a published plugin.

WSL uses its own Linux filesystem and user home. Install there when that is where Codex runs. Cloud use does not require deploying the fixture applications.

### Verify discovery

Open the application project and select `production-readiness` from the skill selector. In Codex CLI or the IDE extension, use `/skills` or `$production-readiness`. In the ChatGPT desktop skill interface, use `@` to select the skill. Restart the host if it does not discover the files.

Paths and invocation follow [OpenAI's skills documentation](https://learn.chatgpt.com/docs/build-skills), checked on 2026-10-06. Avoid duplicate personal and project copies unless duplicate selector entries are intentional.

## Compatibility and verification

**The skill is designed to be OS-independent. Successful checks still depend on the host and the application's toolchain.** Markdown and YAML instructions do not require a specific operating system. A host must support loading the skill, and any requested verification needs appropriate tools and permissions.

| Environment | Installation approach | Verification status |
| --- | --- | --- |
| macOS | Built-in installer, portable installer, or folder copy | Local development checks; see CI for ongoing coverage |
| Linux | Same routes | Ubuntu CI coverage; other distributions and architectures are not individually verified |
| Native Windows | Same routes; portable installer avoids POSIX shell commands | Windows CI job configured; support remains unverified until that job passes |
| WSL | Install inside the Linux environment used by Codex | Expected Linux behavior; not separately verified |
| Cloud, containers, remote hosts | Workspace copy, setup provisioning, or host-supported import | Depends on skill discovery, persistence, and available tools; not universally verified |
| Other operating systems | Compatible skill host; manual copy or supported Node.js runtime | Not verified |

The optional development workflow uses native Node.js file operations and launches the Next.js CLI through Node, avoiding `/bin/sh`, Windows `npm.cmd` execution, and privileged directory symlinks. [CI](.github/workflows/verify.yml) is configured for Ubuntu, macOS, and Windows on Node 24. A configured job is not evidence that it has passed.

The application's hosting OS can differ from the OS running Codex. Local results establish local behavior only. Release decisions require evidence from the intended deployment environment, including configuration, identity, data services, and recovery.

## Review scope

| Area | Focus |
| --- | --- |
| Caching | Asset freshness, cache keys, and private-response isolation |
| CDN and delivery | HTTPS, domains, redirects, routes, and assets |
| Authentication and authorization | Sessions, protected actions, object ownership, and tenant boundaries |
| Security and privacy | Injection paths, exposed secrets, dependencies, and data exposure |
| Database and durable state | Write consistency, migrations, backups, and recovery |
| APIs and integrations | Validation, permissions, retries, webhooks, and dependency failures |
| Testing and user experience | Critical journeys, failure states, responsive layouts, and accessibility |
| CI/CD and release mechanics | Candidate identity, builds, deployment sequencing, and rollback |
| Monitoring and operations | Failure detection, alert routing, ownership, and runbooks |
| Scaling and cost | Capacity, quotas, resource bounds, and expected spending |

The review traces critical journeys through entry points, authorization, state changes, and recovery. It pairs denied operations with successful authorized controls and checks for side effects after denied writes. Sampling and untested paths must be disclosed. Inapplicable areas require a reason; missing evidence is not inapplicability.

## Usage

Start in the **application repository**, not Tinkerplum. Supply the intended environment, critical journeys, important data, and available CI or operational evidence. Select the skill using the host's supported mention interface.

| Mode | Behavior |
| --- | --- |
| Audit, default | Inspect files and evidence; run safe checks within scope; report findings without editing application files |
| Implement | Make explicitly requested fixes, verify affected behavior, and report remaining gaps |
| Release verification | Assess a specific candidate and environment against release gates without deploying |

**Audit**

```text
Use $production-readiness to audit this application for production readiness.
Inspect the repository and run safe local checks. Do not edit or deploy.
Report prioritized findings, evidence, checks not run, and next steps.
```

**Fix selected findings**

```text
Use $production-readiness to fix findings <IDs> from this project's review.
Make minimal changes and verify the affected behavior. Report remaining gaps.
Do not deploy or change production settings or data.
```

**Assess a release**

```text
Use $production-readiness to assess <commit/artifact> for <environment>.
Evaluate critical journeys, CI evidence, recovery, and operational readiness.
Return a verdict with evidence gaps. Do not deploy.
```

## Results and limits

| Status | Meaning |
| --- | --- |
| PASS | Evidence supports the criterion within the stated scope |
| FAIL | Evidence demonstrates that the criterion is unmet |
| NOT RUN | Verification was not performed or evidence is insufficient |
| N/A | The criterion does not apply, with a reason |

The overall verdict is **READY**, **NOT READY**, or **INSUFFICIENT EVIDENCE** for the defined scope. A demonstrated blocker means NOT READY. A decision-critical evidence gap prevents READY. Accepted risks remain separate from passing checks.

Reports identify the candidate and environment, prioritized findings, supporting evidence, sampled paths, limitations, and next actions. Use the [report template](production-readiness/assets/report-template.md) for saved assessments and [release gates](production-readiness/references/release-gates.md) for release decisions.

The skill does not certify security or compliance, replace a penetration test, or guarantee detection of every defect. Model-assisted effectiveness and real-project false-positive rates have not been established by the bundled tests. Local PASS does not establish deployed behavior.

## Optional synthetic examples

The adapter accepts **bundled fixtures only**, not arbitrary websites, repositories, or production URLs. It starts temporary loopback servers with synthetic users and in-memory data. Never deploy the broken targets or reuse their header-based identity as authentication.

From a Git checkout with Node.js 24+ and npm:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run verify
```

Dependency installation requires registry access. Collection requires Git and permission to bind to `127.0.0.1`. Historical report/link validation can run from an archive with dependencies installed.

| Fixture | Expected local verdict | Scope |
| --- | --- | --- |
| `portfolio` | READY | HTML, CSS, and missing-route behavior |
| `two-user-broken` | NOT READY | Intentional cross-user access and shared-cache defects |
| `two-user-fixed` | READY | Synthetic ownership and cache-isolation contract |
| `integration-failure` | NOT READY | Dependency failure incorrectly reported as success |
| `nextjs-fixed` | READY | Same fixed contract in production-built Next.js Route Handlers; separate setup required |

Local READY applies only to the small fixture contract. Deployment evidence is always NOT RUN; `--release` makes it critical and prevents READY.

| Task | Command |
| --- | --- |
| Generate one report | `node adapter/cli.mjs two-user-broken` |
| Validate its consistency | `npm run validate -- reports/two-user-broken.json` |
| Demonstrate missing release evidence | `node adapter/cli.mjs portfolio --release` |
| Generate before/after comparison | `npm run example` |
| Validate that comparison | `node adapter/lifecycle-cli.mjs validate-link reports/fix-recheck.json` |
| Check freshness of a recorded run | `node adapter/lifecycle-cli.mjs current reports/after.json two-user-fixed` |
| Run deterministic protocol comparison | `npm run evaluate` |
| Capture model-study metadata | `node evaluation/score-model.mjs protocol` |
| Score separately collected records | `node evaluation/score-model.mjs baseline.json skill-assisted.json` |

Reports are written to ignored `reports/` files. The fixture CLI exits 0 for valid evidence, including NOT READY evidence; its exit status is not a release gate. Freshness checks exit 0 for reusable evidence, 2 for stale evidence, and 1 for invalid input or execution failure.

Current evidence uses schema 3.0.0. Historical v1/v2 reports retain their original checks and require rerunning for current-protocol reuse. Freshness requires clean matching inputs, revision, target, scope, tools, environment, artifact, and a 24-hour age window. Historical comparisons can retain different artifact hashes without approving reuse. Hashes establish consistency, not authenticity.

### Next.js fixture

```sh
npm run next:install
npm run next:verify
node adapter/cli.mjs nextjs-fixed
```

The fixture pins Next.js 16.3.8 and React 19.3.0. Builds disable telemetry. Checks cover actual Route Handlers, synthetic ownership, response headers, and source/build identity. Real authentication, browsers, server actions, middleware, distributed state, CDN behavior, and deployment are not covered.

### Development verification

After installing both dependency sets, `npm run verify:all` runs syntax/documentation checks, core tests, fixture generation, deterministic evaluation, lifecycle examples, and Next.js build/integration tests. CI runs with read-only repository permissions and no deployment step.

The deterministic evaluation compares three smoke checks with the full fixture protocol on known cases. It does not measure improvement in model behavior. Real model runs are collected separately; synthetic test records are not study results.

## Reference files

| Path | Contents |
| --- | --- |
| [production-readiness/SKILL.md](production-readiness/SKILL.md) | Workflow, modes, and permission boundaries |
| [Investigation guide](production-readiness/references/investigation-guide.md) | Journey tracing, sampling, and evidence reuse |
| [Readiness checks](production-readiness/references/readiness-checks.md) | Ten-area criteria |
| [Worked examples](production-readiness/references/worked-examples.md) | Fictional assessments illustrating the method |
| `production-readiness/agents/openai.yaml` | Display metadata and default prompt |
| `adapter/`, `schema/` | Collection, validation, and versioned formats |
| `fixtures/`, `tests/`, `evaluation/` | Synthetic applications, regression tests, and evaluation |
| [Evidence guide](docs/evidence.md) | Evidence contract and 14-check catalog |
| [Lifecycle guide](docs/lifecycle.md) | Freshness, comparison, and trust limits |
| [Evaluation guide](docs/evaluation.md) | Evaluation method and model-study requirements |
| [Completion status](docs/completion.md) | Completed engineering and unperformed validation |
| [Provenance](docs/provenance.md) | Influences and scope of the originality review |

## Update or remove

1. Preserve local changes in the clone and installed skill.
2. Update a clean clone with `git pull --ff-only`, or download a fresh ZIP.
3. Compare the new skill folder with the installed copy. Updating the clone does not update copied installations.
4. Move the old installed folder to a backup **outside scanned skill directories**, then install the new complete folder and verify discovery.

To uninstall, move only the installed `production-readiness` folder outside the host's scanned directories. Keep unrelated skills and project files. Remove the backup when no longer needed. For a host-managed installation, use that host's removal mechanism.

## Troubleshooting

| Problem | Action |
| --- | --- |
| Skill missing or duplicated | Check scope, exact `SKILL.md` path, nesting, and duplicate copies; restart the host |
| Installer refuses an existing destination | Preserve and compare the existing installation before replacement |
| Missing reference or template | Copy the complete skill folder |
| Audit examines Tinkerplum | Open the application repository before invoking the skill |
| Cloud installation disappears | Provision it through persistent repository content or workspace setup |
| Local server checks fail | Check loopback permissions and required dependencies; record unexecuted checks as NOT RUN |
| Git fails on macOS with an Xcode license error | Repair developer-tools setup; ZIP installation remains sufficient for the instruction skill |
| Evidence is stale | Rerun against the intended clean candidate; do not edit recorded hashes |
| Next.js build is stale or modified | Run `npm run next:build`, then repeat verification |
| Production evidence is unavailable | Record the gap and obtain authorized target-specific evidence |

## Data handling and permissions

Audit mode does not authorize application edits. Fix requests do not authorize deployment. Production mutations, credentials, access settings, paid infrastructure, external uploads, and load testing require appropriate scope and host permission.

Keep credentials, customer data, and sensitive reports out of this repository. Store assessments in restricted locations and review them before sharing. Git ignore rules are not a secret scanner and do not protect already tracked files.

## License

This repository currently has no license file. No open-source license is declared.
