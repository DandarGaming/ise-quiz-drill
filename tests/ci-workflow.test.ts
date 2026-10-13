import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';

interface Step {
  name?: string;
  if?: string;
  run?: string;
  uses?: string;
}

const load = (file: string) =>
  parse(readFileSync(`.github/workflows/${file}`, 'utf8'));

const ci = load('ci.yml');
const runs = (job: string) =>
  (ci.jobs[job].steps as Step[]).map((s) => s.run ?? '').join('\n');

describe('CI workflow', () => {
  it('runs on pull requests and can be called by the deploy workflows', () => {
    expect(ci.on.pull_request.branches).toEqual(['main']);
    expect(ci.on).toHaveProperty('workflow_call');
  });

  it('has a separate job for each test layer', () => {
    expect(Object.keys(ci.jobs)).toEqual(['validate', 'integration', 'e2e']);
  });

  it('validates formatting, lint, types and unit tests', () => {
    const run = runs('validate');
    for (const command of [
      'npm run format:check',
      'npm run lint',
      'npm run check',
      'npm run test:unit:run',
    ]) {
      expect(run).toContain(command);
    }
  });

  it('runs the integration tests', () => {
    expect(runs('integration')).toContain('npm run test:integration');
  });

  it('builds the app, installs Chromium and runs the end-to-end tests', () => {
    const run = runs('e2e');
    expect(run).toContain('npm run build');
    expect(run).toContain('npx playwright install --with-deps chromium');
    expect(run).toContain('npm run test:e2e');
  });

  it('keeps the Playwright report when the end-to-end tests fail', () => {
    const upload = (ci.jobs.e2e.steps as Step[]).find((s) =>
      s.uses?.startsWith('actions/upload-artifact'),
    );
    expect(upload?.if).toBe('failure()');
  });
});

describe('deploys wait for CI', () => {
  const gated = [
    ['static site deploy', 'deploy-static.yml', 'deploy'],
    ['container image push', 'container.yml', 'image'],
  ] as const;

  for (const [name, file, job] of gated) {
    it(`${name} starts only after CI has passed on main`, () => {
      const workflow = load(file);

      expect(workflow.jobs.test.uses).toBe('./.github/workflows/ci.yml');
      expect(workflow.jobs.test.if).toBe("github.event_name == 'push'");
      expect(workflow.jobs[job].needs).toBe('test');
      expect(workflow.jobs[job].if).toContain("needs.test.result == 'success'");
      // Pull requests skip the test job, and must still reach the dry run
      expect(workflow.jobs[job].if).toContain("needs.test.result == 'skipped'");
    });
  }
});
