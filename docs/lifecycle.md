# Evidence lifecycle

## Separate three questions

1. **Does the report validate?** `adapter/cli.mjs validate` checks structure and consistency of observations with claims. It preserves historical evidence, including v1/v2 with their original check semantics.
2. **Can it be reused now?** `adapter/lifecycle-cli.mjs current REPORT FIXTURE [--release]` applies policy 2.0.0 to the current repository and tool environment. Exit 0 means reusable, 2 means stale, and 1 means invalid input or execution error. Reusable NOT READY evidence is still NOT READY.
3. **What changed on recheck?** `adapter/lifecycle-cli.mjs link BEFORE AFTER OUTPUT NOTE` writes a versioned bundle with embedded reports, canonical SHA-256 report hashes, changed file paths, and derived check transitions. `validate-link` recomputes those values and rejects edits. A valid link is historical comparison, not currentness approval.

## Conservative invalidation

New v3 evidence records all tracked and non-ignored repository input files, including skill instructions, tests, docs and lockfiles. Any content addition, change or deletion invalidates every check. Revision changes also invalidate even if content returns to an earlier state. Both old and current candidates must be clean. Target variant, scope, OS/architecture, Node/adapter/Ajv/Next versions and the Next build digest must match.

A report more than 24 hours old or timestamped in the future is stale. The 24-hour limit is a conservative local policy, not a security standard or freshness guarantee. It cannot detect unobserved external changes; external deployment evidence is never supplied by this adapter. Older v1 reports lack a complete input manifest. Both v1 and v2 use the historical check protocol and must be regenerated for current-protocol reuse.

Invalidation emits reasons, changed paths, all invalidated check IDs, and INSUFFICIENT EVIDENCE. It does not rewrite the historical statuses or erase previously discovered defects. Review prior failures while collecting new evidence. A dirty working tree can produce diagnostic reports but cannot get reuse approval.

Ignored dependencies and reports are not input files. Dependency lockfiles and selected tool versions are captured, but this is not a complete software-supply-chain attestation. Next.js build output has its own digest: top-level cache/diagnostics and `server/route-cache` are excluded because Next.js writes rendered route cache entries during requests; executable server bundles and static assets are covered. Actual response bodies remain in the observations. Runtime cache state is not a signed artifact. The runner checks source and artifact stamps, and rejects source/environment changes during collection. Concurrent edit-and-revert races or malicious evidence fabrication are outside these non-atomic local checks.

## Before and after

```sh
npm run example
node adapter/lifecycle-cli.mjs validate-link reports/fix-recheck.json
```

The reproducible example uses `two-user-broken` followed by `two-user-fixed`. It preserves each request and owner readback. AUTH-03 through AUTH-06 and CACHE-01/CACHE-02 transition from FAIL to PASS. The report identifies this as `fixture-variant`: both variants already exist in source; no real application was patched.

For rechecks at different commits of the same supported fixture, changed paths come from the before/after manifests and the link is `code-change`. An artifact-only rebuild is `artifact-change`; a repeated unchanged target is `recheck`. None of these labels proves causation. An observed FAIL-to-PASS is RESOLVED for that check and scope, PASS-to-FAIL is REGRESSED, continued failure is STILL FAILING, and missing new evidence is INCONCLUSIVE. An unperformed check that later passes is NEWLY VERIFIED, not a resolved defect. Other outcomes are UNCHANGED.

New `link-2.0.0` bundles require the same target family, scope, check protocol (both v2 or both v3), runtime/tool versions, and non-overlapping chronological order. Artifact hashes may differ: both are retained in the embedded reports and `change.artifact_changed` records the difference. This comparison never relaxes freshness, which still requires the exact artifact. Historical `link-1.0.0` bundles retain their original stricter comparison rules and validate unchanged. The two bundled core user variants share one family. Core versus Next.js targets do not. Comparisons may remain historical after either report becomes stale; use the currentness command on the after report separately before reuse.

## Trust boundary

Hashes detect mismatched files within a bundle, not a hostile actor who recomputes everything. No secret signing key, external service, immutable storage, automatic patching, or deployment is introduced. Review the change note and source diff, preserve original reports privately, and use fresh authorized project evidence for actual releases.
