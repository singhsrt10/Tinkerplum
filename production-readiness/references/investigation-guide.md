# Investigating critical journeys

Use this procedure to connect the ten review areas to real behavior. Scope depth to the product and consequence; a profile selects emphasis, not automatic PASS or N/A.

## Establish the path

1. Identify the candidate, intended exposure, deployment boundary, critical journeys, and applicable release gates. List the actors and resources that must remain separated, including administrative and integration access on public sites.
2. Map relevant routes, actions, jobs, and configuration from the actual application. For each critical journey trace **actor -> entry point -> authorization -> data/side effects -> failure/recovery**. Follow enforcement into the service or data layer instead of stopping at a hidden button or route middleware.
3. Inspect representative implementations and their tests, then use bounded permitted checks to resolve consequential uncertainty. Start with critical paths and distinct permission, state, and dependency boundaries. Link observations to criteria and the smallest fix or next verification.

## Controls that distinguish a working boundary

- Pair a successful authorized operation with anonymous and inappropriate-user attempts. Establish that the resource exists and the correct user can reach it. A denial caused by a broken route is not proof of authorization.
- For isolation, test each relevant direction using separate synthetic owners and known records. Do not assume a passing read proves write protection or that one route covers exports, jobs, and attachments.
- For denied mutations, read owner-visible state before and after. Check relevant mock deliveries, queued jobs, audit events, or other consequential side effects where the test setup permits. A handler may mutate and then return an error. If effects cannot be observed, record that limitation instead of passing the entire criterion.
- A deliberate 404 can safely conceal a protected resource. Assess its body, disclosure and effects alongside the positive control; do not require 401/403 universally or infer a vulnerability from a status code alone.
- Exercise the failure that matters: invalid input, unavailable dependency, retry/duplicate delivery, or partial success. Use isolated fixtures and test modes within authorization; do not trigger real fulfillment to prove coverage.

## Sample deliberately and stop explicitly

Record the capability inventory, selected routes/cases and why they represent different boundaries. Reuse evidence for shared enforcement only after tracing that each grouped path actually uses it. Note untested methods, roles, tenants, devices, providers and deployment settings that matter to the conclusion.

For a public-content site, emphasize delivery, forms and admin/integration boundaries where present. For an authenticated application, emphasize ownership, sessions and durable state. For sensitive transactions, deepen side effects, idempotency, recovery and observation. None of these profiles substitutes for checking applicability across all ten areas in a full audit.

Stop when applicable critical gates have sufficient evidence or explicit decision-critical gaps, and further permitted sampling is unlikely to change the decision. A demonstrated blocker can establish NOT READY without exhaustive testing; record remaining coverage and continue independent useful checks within scope. If missing access or a bounded failed attempt prevents verification, state NOT RUN and the precise next step. Do not rummage indefinitely or equate a sample with exhaustive assurance.

## Reuse evidence by dependency, not elapsed time alone

Record evidence date, candidate/artifact, environment, scope and relevant dependency identities without secret values. Before reuse, check for changes in deployed artifacts, identity/session settings, permission policy, migrations/data shape, secret versions, provider configuration and runtime/tool versions. An unchanged commit does not prove an unchanged deployment or configuration.

Invalidate or qualify affected claims when those dependencies change or cannot be confirmed; retain still-applicable evidence with its limits. Historical before/after reports may compare different artifacts if the criterion and runtime context are comparable, but the old artifact's results do not establish the new artifact's readiness. Use project-specific freshness requirements and events requiring rechecks. The synthetic adapter's age limit is not a universal audit policy.
