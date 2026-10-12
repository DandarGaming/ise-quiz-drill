import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';

interface Step {
  name: string;
  if?: string;
  run?: string;
  uses?: string;
}

const workflow = parse(readFileSync('.github/workflows/container.yml', 'utf8'));
const steps: Step[] = workflow.jobs.image.steps;
const step = (name: string) => {
  const found = steps.find((s) => s.name === name);
  expect(found, name).toBeDefined();
  return found!;
};
const onMainOnly = "github.event_name == 'push'";

describe('container image workflow', () => {
  it('runs on pull requests and on pushes to main', () => {
    expect(workflow.on.pull_request.branches).toEqual(['main']);
    expect(workflow.on.push.branches).toEqual(['main']);
  });

  it('builds with Podman in Docker format so the HEALTHCHECK is kept', () => {
    expect(step('Build image with Podman').run).toMatch(
      /podman build --format docker/,
    );
  });

  it('smoke tests the health endpoint and the quiz page', () => {
    const run = step('Smoke test the container').run;
    expect(run).toContain('/api/health');
    expect(run).toContain('<title>Quiz Drill</title>');
  });

  it('only logs in and pushes on main', () => {
    for (const name of [
      'Configure AWS credentials',
      'Log in to Amazon ECR',
      'Push image to ECR',
    ]) {
      expect(step(name).if, name).toBe(onMainOnly);
    }
  });

  it('pushes to the ise-quiz-drill repository', () => {
    expect(workflow.env.REPOSITORY).toBe('ise-quiz-drill');
  });
});
