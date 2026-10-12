import { useCallback, useEffect, useRef, useState } from 'react';
import type { AntiCheatOptions, QuizEventType } from '../types/quiz';

interface AntiCheatHandlers {
  // False once the attempt is submitted
  active: boolean;
  onEvent: (type: QuizEventType, details: string) => void;
  // Short message to show the student, e.g. why copying did nothing
  onNotice?: (message: string) => void;
}

export interface AntiCheatAlert {
  title: string;
  message: string;
}

const blocked: Record<string, [QuizEventType, string, string]> = {
  copy: [
    'copy_attempt',
    'Attempted to copy content',
    'Copying text is disabled during this exam.',
  ],
  paste: [
    'paste_attempt',
    'Attempted to paste content',
    'Pasting text is disabled during this exam.',
  ],
  contextmenu: [
    'context_menu_attempt',
    'Attempted to open context menu (Right-click)',
    'Right-click is disabled during this exam.',
  ],
};

export function useAntiCheat(
  options: AntiCheatOptions | undefined,
  { active, onEvent, onNotice }: AntiCheatHandlers,
) {
  const on = !!options?.enabled && active;
  const tabLock = on && !!options?.tabLock;
  const uiRestrictions = on && !!options?.uiRestrictions;
  const fullscreenLock = on && !!options?.fullscreenLock;

  const [alert, setAlert] = useState<AntiCheatAlert | null>(null);
  const [isFullscreen, setFullscreen] = useState(
    () => typeof document !== 'undefined' && !!document.fullscreenElement,
  );

  // Keep the latest callbacks without re-registering listeners
  const handlers = useRef({ onEvent, onNotice });
  useEffect(() => {
    handlers.current = { onEvent, onNotice };
  });

  useEffect(() => {
    if (!tabLock) return;
    const report = (type: QuizEventType, details: string) =>
      handlers.current.onEvent(type, details);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        report('focus_lost', 'User switched tabs or minimized browser');
      } else {
        report('focus_regained', 'User returned to the test tab');
        setAlert({
          title: 'Focus Lost Warning',
          message:
            'It appears you left the exam window. This activity has been recorded in the Audit Trail.',
        });
      }
    };
    const onBlur = () => {
      if (document.visibilityState === 'visible') {
        report('focus_lost', 'Window lost focus (Alt+Tab or clicked outside)');
      }
    };
    const onFocus = () => report('focus_regained', 'Window regained focus');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [tabLock]);

  useEffect(() => {
    if (!uiRestrictions) return;
    const block = (event: Event) => {
      const [type, details, notice] = blocked[event.type];
      event.preventDefault();
      handlers.current.onEvent(type, details);
      handlers.current.onNotice?.(notice);
    };
    for (const type of Object.keys(blocked)) {
      document.addEventListener(type, block);
    }
    return () => {
      for (const type of Object.keys(blocked)) {
        document.removeEventListener(type, block);
      }
    };
  }, [uiRestrictions]);

  useEffect(() => {
    if (!fullscreenLock) return;
    setFullscreen(!!document.fullscreenElement);
    const onChange = () => {
      const full = !!document.fullscreenElement;
      setFullscreen(full);
      if (!full)
        handlers.current.onEvent(
          'fullscreen_exit',
          'User exited fullscreen mode',
        );
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [fullscreenLock]);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // The browser refused (no user gesture or not supported); the overlay stays
    }
  }, []);

  return {
    alert,
    dismissAlert: () => setAlert(null),
    needsFullscreen: fullscreenLock && !isFullscreen,
    requestFullscreen,
  };
}
