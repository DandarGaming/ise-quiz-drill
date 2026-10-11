import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';

interface LabelDefinition {
  name: string;
  color: string;
  description: string;
}

const read = (path: string) => parse(readFileSync(path, 'utf8'));

const labels: LabelDefinition[] = read('.github/labels.yml');
const defined = new Set(labels.map((label) => label.name));

describe('label definitions', () => {
  it('gives every label a colour and a description', () => {
    for (const label of labels) {
      expect(label.color, label.name).toMatch(/^#[0-9a-f]{6}$/);
      expect(label.description, label.name).not.toBe('');
    }
  });

  it('uses one colour per type and area group', () => {
    for (const group of ['type: ', 'area: ']) {
      const colours = labels
        .filter((label) => label.name.startsWith(group))
        .map((label) => label.color);
      expect(new Set(colours).size, group).toBe(1);
    }
  });

  it('defines every label the pull request labeler applies', () => {
    const applied = Object.keys(read('.github/labeler.yml'));
    expect(applied.length).toBeGreaterThan(0);
    for (const name of applied) expect(defined, name).toContain(name);
  });

  it('defines every label Dependabot applies', () => {
    const updates: { labels?: string[] }[] = read(
      '.github/dependabot.yml',
    ).updates;
    for (const update of updates) {
      expect(update.labels?.length).toBeGreaterThan(0);
      for (const name of update.labels ?? []) {
        expect(defined, name).toContain(name);
      }
    }
  });
});
