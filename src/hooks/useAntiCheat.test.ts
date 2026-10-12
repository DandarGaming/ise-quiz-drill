// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAntiCheat } from './useAntiCheat';
import type { AntiCheatOptions } from '../types/quiz';

const allOn: AntiCheatOptions = {
  enabled: true,
  tabLock: true,
  uiRestrictions: true,
  fullscreenLock: true,
};

let visibility: DocumentVisibilityState = 'visible';
Object.defineProperty(document, 'visibilityState', {
  configurable: true,
  get: () => visibility,
});
let fullscreenElement: Element | null = null;
Object.defineProperty(document, 'fullscreenElement', {
  configurable: true,
  get: () => fullscreenElement,
});

afterEach(() => {
  visibility = 'visible';
  fullscreenElement = null;
});

const setup = (options: AntiCheatOptions | undefined, active = true) => {
  const onEvent = vi.fn();
  const onNotice = vi.fn();
  const hook = renderHook(() =>
    useAntiCheat(options, { active, onEvent, onNotice }),
  );
  return { ...hook, onEvent, onNotice };
};

const fire = (target: EventTarget, type: string) => {
  const event = new Event(type, { cancelable: true });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
};

describe('useAntiCheat', () => {
  it('logs leaving and returning to the tab and warns on return', () => {
    const { result, onEvent } = setup(allOn);

    visibility = 'hidden';
    fire(document, 'visibilitychange');
    visibility = 'visible';
    fire(document, 'visibilitychange');

    expect(onEvent.mock.calls.map(([type]) => type)).toEqual([
      'focus_lost',
      'focus_regained',
    ]);
    expect(result.current.alert?.title).toBe('Focus Lost Warning');

    act(() => result.current.dismissAlert());
    expect(result.current.alert).toBeNull();
  });

  it('blocks copy, paste and the context menu and says why', () => {
    const { onEvent, onNotice } = setup(allOn);

    expect(fire(document, 'copy').defaultPrevented).toBe(true);
    expect(fire(document, 'paste').defaultPrevented).toBe(true);
    expect(fire(document, 'contextmenu').defaultPrevented).toBe(true);

    expect(onEvent.mock.calls.map(([type]) => type)).toEqual([
      'copy_attempt',
      'paste_attempt',
      'context_menu_attempt',
    ]);
    expect(onNotice).toHaveBeenCalledWith(
      'Copying text is disabled during this exam.',
    );
  });

  it('asks for fullscreen and logs leaving it', () => {
    const { result, onEvent } = setup(allOn);
    expect(result.current.needsFullscreen).toBe(true);

    fullscreenElement = document.body;
    fire(document, 'fullscreenchange');
    expect(result.current.needsFullscreen).toBe(false);

    fullscreenElement = null;
    fire(document, 'fullscreenchange');
    expect(result.current.needsFullscreen).toBe(true);
    expect(onEvent).toHaveBeenLastCalledWith(
      'fullscreen_exit',
      expect.any(String),
    );
  });

  it('does nothing when anti-cheat is off or the attempt is over', () => {
    for (const [options, active] of [
      [undefined, true],
      [{ ...allOn, enabled: false }, true],
      [allOn, false],
    ] as const) {
      const { result, onEvent, unmount } = setup(options, active);

      expect(fire(document, 'copy').defaultPrevented).toBe(false);
      expect(result.current.needsFullscreen).toBe(false);
      expect(onEvent).not.toHaveBeenCalled();
      unmount();
    }
  });
});
