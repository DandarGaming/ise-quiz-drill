# ADR-006: Test Layers and a CI Gate on Deploys

## Status: Accepted (Date: 2026-10-13)

## Context

The project had unit and component tests only. Nothing ran the whole app, so
bugs that need real layout or several screens together (a blank page in
Scroll Form mode, answers carried over between attempts) were found by hand.
The deploy and the image push also started on every merge to `main` in
parallel with CI, so a failing test did not stop a release.

## Decision

- Keep three layers: unit and component tests next to the code, integration
  tests in `tests/integration/` that drive the whole app in jsdom with a real
  localStorage, and end-to-end tests in `e2e/` that drive a real Chromium
  against the production build with Playwright.
- CI runs the layers as three parallel jobs (`validate`, `integration`,
  `e2e`) on every pull request.
- On `main`, the static deploy and the image push call CI as a reusable
  workflow and `needs` it, so they start only when all three jobs have passed.
  Pull requests skip that step and keep their dry run.
- Run the end-to-end tests locally inside the official Playwright image with
  Podman, at the same version as `@playwright/test`. Newer Playwright no
  longer installs browsers on Ubuntu 20.04, which the main development machine
  runs, and an older pinned version had a high severity advisory (browser
  downloads without certificate checks). CI installs Chromium directly.

## Consequences

- Positive: a failing test of any layer now blocks a release, and the browser
  tests catch layout problems that jsdom cannot see.
- Negative: CI runs twice on `main`, once for each gated workflow, and the
  end-to-end job adds about two minutes.
- Negative: the image tag in `test:e2e:podman` must follow `@playwright/test`
  on every upgrade; a unit test fails when they drift apart.
- The end-to-end layer is small on purpose: a few journeys, not every screen,
  to keep it fast and stable. Layout bugs found later get one test each.
