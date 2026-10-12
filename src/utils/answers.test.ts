import { describe, it, expect } from 'vitest';
import { isAnswered } from './answers';

describe('isAnswered', () => {
  it('is false for a missing or blank text answer', () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered('')).toBe(false);
    expect(isAnswered('   ')).toBe(false);
  });

  it('is true for any non-blank text answer', () => {
    expect(isAnswered('b')).toBe(true);
  });

  it('is true for a list with at least one non-blank entry', () => {
    expect(isAnswered([])).toBe(false);
    expect(isAnswered(['', ' '])).toBe(false);
    expect(isAnswered(['', 'Integration'])).toBe(true);
  });
});
