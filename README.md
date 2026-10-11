# Brightspace Quiz Simulator

A practice tool that recreates the Brightspace quiz interface, so students can
take mock tests built from their own notes. It runs entirely in the browser:
quizzes and attempts are stored in localStorage, with no backend.

The quiz is being moved over from a prototype in small slices (see
[ADR-003](docs/adr/ADR-003-pivot-to-quiz-simulator.md)). Until that is done,
the original blog still lives at `/blog` and a preview of every question type
is at `/quiz`.

## Stack

- [Astro](https://astro.build) with the Node adapter (SSR server plus
  prerendered pages)
- React islands for the quiz UI, styled with Tailwind CSS on quiz pages only
  ([ADR-004](docs/adr/ADR-004-scope-tailwind-to-quiz-pages.md))
- Vitest and Testing Library for tests, ESLint and Prettier for code style
- AWS CDK for infrastructure: S3 and CloudFront for the static site, ECR for
  the container image

## Getting started

Requires Node 22.12 or later.

```sh
npm ci
npm run dev
```

| Command                 | What it does                             |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start the dev server on `localhost:4321` |
| `npm run build`         | Build the site into `dist/`              |
| `npm run preview`       | Serve the production build               |
| `npm run lint`          | Run ESLint                               |
| `npm run check`         | Type check with `astro check`            |
| `npm run test:unit:run` | Run the Vitest suite once                |
| `npm run format:check`  | Check formatting with Prettier           |

## CI and deployment

- **CI** (`.github/workflows/ci.yml`) runs format check, lint, type check and
  tests on every pull request and push to `main`.
- **Deploy** (`.github/workflows/deploy-static.yml`) builds the site and runs
  `cdk synth` on pull requests. On `main` it deploys the prerendered pages to
  S3 and CloudFront and smoke tests the live URL.
- The `Dockerfile` builds the SSR server image, which exposes `/api/health`.

## Documentation

- [Architecture decisions](docs/adr/)
- [Product requirements and quiz spec](docs/product/)
- [Workflow, board and label rules](docs/process/workflow.md)
