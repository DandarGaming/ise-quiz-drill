import { useEffect, useRef, useState } from 'react';

interface QuizTimerOptions {
  // Epoch milliseconds when the time limit runs out
  deadline: number;
  onExpire: () => void;
  running?: boolean;
}

const secondsLeft = (deadline: number) =>
  Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

// Time left is worked out from the wall clock on every tick, not by
// subtracting one per tick, so it stays right after the tab was closed,
// throttled in the background or the laptop slept.
export function useQuizTimer({
  deadline,
  onExpire,
  running = true,
}: QuizTimerOptions): number {
  const [remaining, setRemaining] = useState(() => secondsLeft(deadline));
  const onExpireRef = useRef(onExpire);
  // Remember which deadline already expired, so a re-run of the effect
  // (StrictMode, re-render) never fires onExpire twice
  const expiredFor = useRef<number | null>(null);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (!running) return;
    const update = () => {
      const next = secondsLeft(deadline);
      setRemaining(next);
      if (next === 0 && expiredFor.current !== deadline) {
        expiredFor.current = deadline;
        onExpireRef.current();
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline, running]);

  return remaining;
}
