# ADR-005: Build and Push the Image with Podman

## Status: Accepted (Date: 2026-10-12)

## Context

ADR-002 added a Dockerfile and an ECR repository, but the image was built
with Docker on a developer machine and pushed by hand. The only image in ECR
was built before the quiz app replaced the blog, so it no longer matched the
code. The course tooling uses Podman.

## Decision

- Build, run and push the image with Podman. It reads the same Dockerfile, so
  nothing in the image changes.
- Build with `--format docker`. Podman's default OCI format has no
  HEALTHCHECK instruction and silently drops it, which would remove the
  `/api/health` probe from ADR-002.
- Add a Container Image workflow. Every pull request builds the image, starts
  it and checks `/api/health` and the quiz page. Pushes to `main` also push it
  to ECR, tagged with the short commit SHA and `latest`.
- Rename the ECR repository from `astro-blog` to `ise-quiz-drill` and keep
  only the 20 most recent images.

## Consequences

- Positive: Podman runs without a daemon and rootless by default, so building
  an image does not need a root process. The registry always holds an image
  built from the latest `main`, and a broken Dockerfile fails the pull request
  instead of the release.
- Negative: Docker and Podman differ in small ways, such as the image format
  above, so local Docker builds are not exactly what CI builds.
- Negative: Ubuntu 20.04 does not ship Podman; it has to be installed from the
  openSUSE Kubic repository, which only has Podman 3.4.
- The old `astro-blog` repository is kept (retain policy) with its `v1.0.0`
  image and can be deleted by hand.
