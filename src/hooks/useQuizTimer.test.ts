// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useQuizTimer } from './useQuizTimer';

const START = Date.parse('2026-10-12T09:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});
afterEach(() => vi.useRealTimers());

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('useQuizTimer', () => {
  it('counts down from the deadline', () => {
    const { result } = renderHook(() =>
      useQuizTimer({ deadline: START + 90_000, onExpire: () => {} }),
    );
    expect(result.current).toBe(90);

    tick(3000);
    expect(result.current).toBe(87);
  });

  it('keeps real time while the page was closed or asleep', () => {
    const { result } = renderHook(() =>
      useQuizTimer({ deadline: START + 600_000, onExpire: () => {} }),
    );

    // No ticks for a minute, as when the tab is suspended
    vi.setSystemTime(START + 60_000);
    tick(1000);

    expect(result.current).toBe(539);
  });

  it('calls onExpire once when time runs out', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useQuizTimer({ deadline: START + 2000, onExpire }),
    );

    tick(5000);

    expect(result.current).toBe(0);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('expires straight away when the deadline has already passed', () => {
    const onExpire = vi.fn();
    renderHook(() => useQuizTimer({ deadline: START - 1000, onExpire }));
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('does nothing while stopped', () => {
    const onExpire = vi.fn();
    renderHook(() =>
      useQuizTimer({ deadline: START + 1000, onExpire, running: false }),
    );

    tick(5000);

    expect(onExpire).not.toHaveBeenCalled();
  });
});
