import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const dockerfile = readFileSync('Dockerfile', 'utf8');

const version = (text: string) => text.split('.').map(Number);
const atLeast = (actual: string, minimum: string) => {
  const [a, b] = [version(actual), version(minimum)];
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

describe('Playwright', () => {
  const playwright = pkg.devDependencies['@playwright/test'];

  it('is a version that verifies browser downloads (1.55.1 or newer)', () => {
    expect(atLeast(playwright, '1.55.1')).toBe(true);
  });

  // The browsers in the image must match the library, or the tests refuse to run
  it('runs locally in the Playwright image of the same version', () => {
    expect(pkg.scripts['test:e2e:podman']).toContain(
      `mcr.microsoft.com/playwright:v${playwright}-noble`,
    );
  });
});

describe('runtime image', () => {
  it('upgrades the Alpine packages of the base image', () => {
    const runner = dockerfile.slice(dockerfile.indexOf('AS runner'));
    expect(runner).toMatch(/RUN apk upgrade --no-cache/);
  });
});
