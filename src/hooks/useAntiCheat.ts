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
    'Tried to copy content',
    'Copying is disabled during this quiz.',
  ],
  paste: [
    'paste_attempt',
    'Tried to paste content',
    'Pasting is disabled during this quiz.',
  ],
  contextmenu: [
    'context_menu_attempt',
    'Tried to open the context menu',
    'Right-click is disabled during this quiz.',
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
        report('focus_lost', 'Switched tab or minimised the browser');
      } else {
        report('focus_regained', 'Came back to the quiz tab');
        setAlert({
          title: 'You left the quiz',
          message:
            'Leaving the quiz window has been recorded in the proctoring log.',
        });
      }
    };
    const onBlur = () => {
      if (document.visibilityState === 'visible') {
        report('focus_lost', 'Window lost focus');
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
      if (!full) handlers.current.onEvent('fullscreen_exit', 'Left fullscreen');
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
