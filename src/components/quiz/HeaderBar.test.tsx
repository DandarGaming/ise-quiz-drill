// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderBar, formatDuration } from './HeaderBar';

describe('formatDuration', () => {
  it('formats seconds as h:mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00:00');
    expect(formatDuration(59)).toBe('0:00:59');
    expect(formatDuration(14 * 60 + 32)).toBe('0:14:32');
    expect(formatDuration(3600 + 61)).toBe('1:01:01');
  });

  it('never shows negative or fractional time', () => {
    expect(formatDuration(-5)).toBe('0:00:00');
    expect(formatDuration(9.7)).toBe('0:00:09');
  });
});

describe('HeaderBar', () => {
  const props = {
    title: 'DevOps Midterm',
    remainingSeconds: 872,
    totalSeconds: 900,
    onExit: () => {},
  };

  it('shows the quiz title as the page heading', () => {
    render(<HeaderBar {...props} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'DevOps Midterm' }),
    ).toBeInTheDocument();
  });

  it('shows the time left in a timer region', () => {
    render(<HeaderBar {...props} />);
    expect(screen.getByRole('timer')).toHaveTextContent('0:14:32 remaining');
  });

  it('can hide the timer', () => {
    render(<HeaderBar {...props} showTimer={false} />);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('reports a click on the exit button', async () => {
    const onExit = vi.fn();
    render(<HeaderBar {...props} onExit={onExit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exit quiz' }));

    expect(onExit).toHaveBeenCalledOnce();
  });
});
