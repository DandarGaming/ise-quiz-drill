# ADR-003: Pivot to a Quiz Simulator App

## Status: Accepted (Date: 2026-10-11)

## Context

The site is still the Astro blog starter with little real content. We want
to turn it into a useful product: a practice tool that replicates the
Brightspace quiz interface, so students can take mock tests built from
their own notes. A working prototype already exists outside this repo as a
React app inside Astro, with no backend. The current pipeline (CI, static
deploy to S3 and CloudFront, SSR container image on ECR) should keep working
through the change.

## Decision

- Build the quiz app inside this repo instead of starting a new one. The CI,
  CDK stacks, Dockerfile and ECR repository are reused as they are.
- Go frontend-first. Quiz data, attempts and refresh resilience live in the
  browser (localStorage). A backend is added only when a feature needs it,
  such as accounts, shared tests or calling an LLM with a secret key.
- Render the quiz UI as React islands in Astro. The quiz is highly
  interactive (timer, navigator, answer state), which React handles well,
  and Astro keeps the static pages, the SSR server and /api/health.
- Style with Tailwind CSS. The spec asks for a close visual match with
  Brightspace, and utility classes make those exact values easy to apply.
- Keep quiz pages prerendered, so the app still deploys as static files to
  S3 and CloudFront without depending on the container runtime.
- Model every question with one generic schema and render it with a single
  QuestionRenderer, as the spec requires.
- Move the prototype in small slices, one issue and pull request each, and
  fix its weak spots on the way: duplicated grading logic, a timer that
  pauses when the tab closes, no input validation and no tests.
- Serve the quiz at / and keep the blog at /blog for now. The blog is
  removed later in its own change.

## Consequences

- Positive: the repo becomes a real product without breaking the existing
  delivery pipeline, and each slice is small enough to review properly.
- Positive: no database or second runtime, so no extra AWS cost yet.
- Negative: data stays in one browser. It is lost when site data is
  cleared and cannot sync between devices or be shared.
- Negative: correct answers ship to the client, so a user can read them in
  dev tools. Acceptable for self-practice, not for real assessment.
- Negative: React and Tailwind add dependencies and bundle size, and both
  the blog and the quiz styles live in one app until the blog is removed.
