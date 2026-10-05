# Tinkerplum

**A clearer answer to “is this website ready to launch?”**

Tinkerplum is an instruction-only Codex skill that reviews production readiness, prioritizes launch blockers, and verifies fixes you authorize. It adapts to your website's architecture: a public portfolio gets a proportionate review, while a SaaS application gets deeper attention to identity, data isolation, recovery, and operations.

**Tinkerplum is the repository name. `production-readiness` is the skill name.** Keep the installed folder and invocation as `production-readiness`; the selector may display **Production Readiness**.

[Install](#install) · [First audit](#run-your-first-audit) · [Understand results](#understand-results) · [Update or remove](#update-or-remove) · [Troubleshooting](#troubleshooting)

## What it does

- **Audit by default:** inspect the project, run safe checks within scope, and explain risks without editing application files.
- **Implement when requested:** make bounded fixes, add relevant regression coverage, and report verification results.
- **Assess a release:** evaluate a specific candidate and environment, including missing evidence and recovery needs.

There is no install-time code, bundled scanner, API key, subscription, or package dependency. Your Codex access and the tools required by the website itself are separate prerequisites. The skill guides Codex; it is not a standalone program you run in a terminal.

It does not deploy your application, provision infrastructure, certify security or compliance, or replace a specialist penetration test. It does not require every website to have accounts, a database, Redis, or Kubernetes.

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
    │   └── release-gates.md             # Decisions and recovery requirements
    └── assets/
        └── report-template.md          # Evidence-based review structure
```

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
| Tests or builds cannot run | Provide the project's required runtime/dependencies and safe test configuration. The report should say NOT RUN, not pretend the check passed. |
| Production checks are missing | Supply authorized environment access or dated evidence. Local files alone cannot establish remote state. |
| Git fails on macOS with an Xcode license error | Resolve the developer-tools setup in your own terminal, or use GitHub's ZIP download. The skill does not require Xcode. |

## Privacy and permission boundaries

Keep credentials, customer data, and client-specific reports out of this public repository. The `.gitignore` excludes common sensitive files and generated report folders, but it is not a secret scanner and cannot protect files already committed.

The skill instructs Codex to redact secrets, avoid destructive checks, inspect commands before running them, and honor host permissions. Uploading project material to a new external service requires authorization. Deployment, production data changes, access settings, paid infrastructure, and load testing require appropriate explicit scope and approval. Never bypass an approval denial to complete a review.

A review can expose sensitive implementation details. Store it in an appropriately restricted location and review it before sharing. Audit mode is the default; application edits require an implementation request.

## Maintenance and licensing

Keep provider-specific configuration in the website project. Recheck official documentation when tools change, preserve the skill folder structure, and verify representative audits after modifying instructions.

This repository currently has no license file. Public visibility alone does not grant an open-source license. No automated CI badge, security certification, or deployment guarantee is claimed.
