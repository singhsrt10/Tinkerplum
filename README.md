# Website Production Readiness for Codex

A reusable, stack-agnostic skill for deciding whether a website is ready to launch, prioritizing gaps, and verifying fixes you authorize.

Covers **caching, CDN, authentication, security, database, APIs, testing, CI/CD, monitoring, and scaling**. Static portfolios get proportionate reviews; SaaS products get the identity, data, and operational depth their architecture needs.

## Package

```text
production-readiness/
├── SKILL.md
├── agents/openai.yaml
├── references/
│   ├── readiness-checks.md
│   └── release-gates.md
└── assets/report-template.md
```

Instruction-only: no install-time code, API key, scanner subscription, or package dependency. Codex uses your project's tools where appropriate. References guide investigation; the template keeps evidence and missing checks visible.

## Install locally in Codex

Copy the **whole `production-readiness` folder**, not just `SKILL.md`. Choose one scope to avoid duplicate entries.

### Personal: across projects

Run from this repository's root in a macOS/Linux shell:

```sh
dest="$HOME/.agents/skills/production-readiness"
if [ -e "$dest" ] || [ -L "$dest" ]; then
  printf 'Already exists: %s\nReview the existing skill before updating.\n' "$dest"
else
  mkdir -p "$HOME/.agents/skills" && cp -R production-readiness "$dest"
fi
```

### Project: one website repository

Run from this skill repository's root after replacing the project path:

```sh
project="/absolute/path/to/your-website-repository"
dest="$project/.agents/skills/production-readiness"
if [ ! -d "$project" ]; then
  printf 'Project folder does not exist: %s\n' "$project"
elif [ -e "$dest" ] || [ -L "$dest" ]; then
  printf 'Already exists: %s\nReview the existing skill before updating.\n' "$dest"
else
  mkdir -p "$project/.agents/skills" && cp -R production-readiness "$dest"
fi
```

For shared project use, review and commit that folder through your normal workflow. On Windows, copy to `%USERPROFILE%\.agents\skills\` (personal) or `<project>\.agents\skills\` (project).

### Verify discovery

In Codex CLI/IDE, use `/skills` or type `$` and select `production-readiness`. In ChatGPT's desktop skill selector, use `@` and choose it. Confirm its description and try the audit-only example below. If missing, check folder nesting and refresh/reopen the Skills page where available.

Locations and invocation were checked against [OpenAI's current skills documentation](https://learn.chatgpt.com/docs/build-skills) on **2026-10-05**. This is a standalone local/repo package; downloading it does not install it on another computer or publish a plugin.

## Example prompts

### Audit without edits

```text
Use $production-readiness to audit this website before launch.
Inspect the repo and run safe local checks. Do not change application files,
deploy, or create services. Report blockers, evidence, and checks not run.
```

### Keep a portfolio simple

```text
Use $production-readiness on this public portfolio. It has no user accounts
or application database. Review the integrations you find, mark genuinely
irrelevant checks N/A, and focus on practical launch risks.
```

### Fix a bounded issue

```text
Use $production-readiness to fix the authorization and cache-isolation
findings from the review in this repo, add regression tests, and rerun
relevant checks. Do not deploy or change production settings.
```

### Review a candidate

```text
Use $production-readiness to assess this commit for a staging release.
Use available CI results and the runbook. Give a go/no-go recommendation,
missing evidence, and rollback plan. Ask before deployment or paid actions.
```

Use a selected `@production-readiness` mention instead in the ChatGPT desktop skill interface.

## What results mean

- **PASS:** Evidence supports the specific criterion and scope.
- **FAIL:** Evidence shows the criterion is unmet.
- **NOT RUN:** A check was not performed or evidence was insufficient.
- **N/A:** It does not apply, with a reason.

Overall: **READY**, **NOT READY**, or **INSUFFICIENT EVIDENCE**, tied to a candidate/environment and critical journeys. Reports include prioritized risks, next steps, and recovery needs. A local build passing does not prove deployed behavior. No percentage score or blanket security guarantee is used.

## Boundaries

Audit is default. Fixes require an implementation request. Deployment, paid infrastructure, production data changes, security/access settings, and scoped load testing require appropriate authorization. The skill protects secrets, avoids destructive checks, and respects stronger host permissions.

It does not force accounts, a database, Redis, another CDN, or Kubernetes onto every website. It does not replace a specialist security assessment or required compliance review.

## Private GitHub repository

Use this folder as your repository root and review the complete file list before committing. Keep credentials, customer data, client-specific reports, and unrelated project files out. The ignore file helps avoid mistakes but cannot guarantee secret protection.

This package contains original reusable guidance and no project-specific private data. Creating a repository, choosing its visibility, and pushing are separate actions; this package does not perform them. No public redistribution license has been added.

## Maintenance

Keep provider-specific values in the website project rather than this skill. Recheck official docs when tooling changes. Preserve the folder structure, validate frontmatter, and try harmless representative audits after edits before relying on a release recommendation.
