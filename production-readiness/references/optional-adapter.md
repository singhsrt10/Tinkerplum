# Optional Tinkerplum evidence examples

The instruction skill remains usable without software dependencies. Tinkerplum's repository additionally provides an optional Node.js 24+ adapter for bundled synthetic fixtures only. It is not installed by copying this skill folder.

Use it only when the user asks to run these examples or develop the adapter. Locate the user's Tinkerplum clone and inspect its README, package scripts, `docs/evidence.md`, and `docs/provenance.md` first. Do not download, install dependencies, or execute code as a side effect of an ordinary website audit without appropriate scope.

The optional workflow from that clone is:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run verify
node adapter/cli.mjs portfolio --release
npm run validate -- reports/portfolio-release.json
```

The fixture suite uses synthetic data and loopback servers, with an in-process failing integration stub. It covers a static portfolio, a broken/fixed two-user app, and a failing integration with unavailable deployment evidence. Do not deploy the broken examples or use their synthetic identity headers in a real app.

The versioned JSON report retains check IDs, candidate/environment/tool information, observations, timestamps, and limits. The validator rejects internally unsupported PASS claims but cannot authenticate fabricated evidence. Unsupported deployment checks stay NOT RUN. Local READY is limited to the fixture contract; release mode requires unavailable deployment evidence and cannot yield READY with that gap.

No arbitrary URL or existing application is supported. In particular, Next.js-specific routing, authentication, and cache behavior are unverified. Do not substitute fixture results for actual project checks or omit the remaining manual ten-area review. Fix/recheck history, freshness enforcement, benchmarking, and pilots are future phases.
