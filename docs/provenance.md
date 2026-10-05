# Provenance and overlap review

Reviewed 2026-10-05 for the first evidence-fixture milestone. This is a bounded comparison of the sources listed below, not an exhaustive originality search, legal opinion, or claim that audit checklists are novel. No source code, checklist text, report text, or configuration example from these repositories was copied into this implementation. Existing Tinkerplum guidance predates this milestone; its earlier authorship is not independently established by this review.

## Comparable projects inspected

| Primary source and pinned revision | What was inspected | Overlap | Decision for this milestone |
| --- | --- | --- | --- |
| [magallon/website-audit-toolkit](https://github.com/magallon/website-audit-toolkit/tree/ba091851f30c80fb4cdc1cdb424afff7450e4b61) | README and [audit-security/SKILL.md](https://github.com/magallon/website-audit-toolkit/blob/ba091851f30c80fb4cdc1cdb424afff7450e4b61/audit-security/SKILL.md) | Pre-launch review, skill packaging, delivery, accessibility, security, evidence and prioritized findings | Its documented focus is static cPanel sites and an ordered set of ten audits. Tinkerplum does not reuse that sequence or server configuration. This milestone instead demonstrates synthetic identity boundaries and cache isolation. |
| [commitshow/production-audit](https://github.com/commitshow/production-audit/tree/12c3bd37c6318a0f8b9b6fb075be2e1ab813f4a5) | README and [.claude/skills/production-audit/SKILL.md](https://github.com/commitshow/production-audit/blob/12c3bd37c6318a0f8b9b6fb075be2e1ab813f4a5/.claude/skills/production-audit/SKILL.md) | Production-readiness workflow, structured audit results, actionable failures, separation between source and deployed evidence | Its documented workflow invokes an external audit CLI and presents a numerical score. This adapter only runs bundled local fixtures and uses explicit check evidence and categorical verdicts. The external engine and its detection accuracy were not evaluated. |

Both inspected repositories identify MIT licensing. That observation neither assigns a license to Tinkerplum nor establishes that all related upstream assets share that license. No new license is selected here. Tinkerplum still has no license file; public availability does not itself grant an open-source license.

## Primary technical influences

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): supports server-side object authorization and negative access tests. This motivated both-direction read/mutation tests with owner readback. Synthetic header identities are deliberately not a real login system.
- [MDN HTTP caching guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching): informed the distinction between shared caching and private/no-store responses. The tiny URL-keyed cache model is explicitly incomplete; its results make no claim about a real CDN.
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) and [Ajv documentation](https://ajv.js.org/json-schema.html): supply the established structural validation format and implementation. Additional predicates check consistency of recorded observations with check outcomes.
- [Node.js test runner](https://nodejs.org/docs/latest-v24.x/api/test.html): supplies local test execution and assertions without a custom test framework.
- [OpenAI skills documentation](https://learn.chatgpt.com/docs/build-skills): informs existing local installation and invocation instructions. The repository brand and skill identifier remain distinct.

These are acknowledged influences, not endorsements. Descriptions above are paraphrases. Upstream source was inspected as reference material, not installed or executed.

## Differentiation that can actually be demonstrated

The first milestone provides three repeatable synthetic cases, a small explicit check catalog, raw local HTTP observations, and a validator that rejects internally unsupported PASS claims. Expected findings are kept in `tests/expected.json`, outside the target applications. This makes behavior reviewable without submitting a project to an external audit service.

It does not establish superior detection coverage, original ownership of general security ideas, framework support, or production effectiveness. A broader comparison, real-project pilot, benchmark, stale-evidence policy, and fix/recheck history remain future work. New source use should be documented here, with license decisions brought to the owner separately.
