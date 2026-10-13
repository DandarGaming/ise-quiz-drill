# ISE QUIZ DRILL

A practice tool that recreates the Brightspace quiz interface, so students can
take mock tests built from their own notes. It runs entirely in the browser:
quizzes and attempts are stored in localStorage, with no backend.

Open the site to create a mock test: pick the options, copy the generated
prompt into an AI chat together with your notes, and paste the JSON it returns.
Quizzes run with a real-time timer, are saved in the browser and keep a history
of attempts.
See [ADR-003](docs/adr/ADR-003-pivot-to-quiz-simulator.md) for why it replaced
the original blog.

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
- **Container Image** (`.github/workflows/container.yml`) builds the SSR
  server image with Podman and smoke tests `/api/health` on pull requests. On
  `main` it pushes the image to ECR, tagged with the short commit SHA and
  `latest` ([ADR-005](docs/adr/ADR-005-build-images-with-podman.md)).

## Container image

The `Dockerfile` builds the SSR server image, which exposes `/api/health`.
Build in Docker format so the `HEALTHCHECK` is kept:

```sh
podman build --format docker -t ise-quiz-drill .
podman run --rm -p 4321:4321 ise-quiz-drill
```

To push by hand (CI does this on every merge to `main`):

```sh
REGISTRY=468204079455.dkr.ecr.eu-west-1.amazonaws.com
aws ecr get-login-password --region eu-west-1 |
  podman login --username AWS --password-stdin "$REGISTRY"
podman push ise-quiz-drill "$REGISTRY/ise-quiz-drill:v2.0.0"
```

## Documentation

- [Architecture decisions](docs/adr/)
- [Product requirements and quiz spec](docs/product/)
- [Workflow, board and label rules](docs/process/workflow.md)
