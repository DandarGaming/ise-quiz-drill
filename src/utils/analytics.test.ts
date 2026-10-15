// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import type { QuizConfig } from '../types/quiz';
import {
  beaconSender,
  percentBucket,
  quizStarted,
  quizSubmitted,
  setAnalyticsSender,
  track,
} from './analytics';

const quiz = (overrides: Partial<QuizConfig> = {}): QuizConfig => ({
  id: 'q',
  title: 'Secret title',
  courseCode: 'CS1',
  description: '',
  templateMode: 'paginated',
  timeLimitMinutes: 10,
  questionsPerPage: 1,
  questions: Array.from({ length: 4 }, (_, i) => ({
    id: `q${i}`,
    number: i + 1,
    page: i + 1,
    type: 'mcq' as const,
    points: 1,
    prompt: 'Secret prompt',
    options: [{ id: 'a', text: 'A' }],
    correctAnswer: 'a',
  })),
  ...overrides,
});

afterEach(() => {
  setAnalyticsSender(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('track', () => {
  it('sends nothing during tests unless a sender is injected', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { ...navigator, sendBeacon });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    track({ event: 'app_opened' });

    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('hands the event to the injected sender', () => {
    const sender = vi.fn();
    setAnalyticsSender(sender);

    track({ event: 'quiz_imported', props: { valid: true } });

    expect(sender).toHaveBeenCalledWith({
      event: 'quiz_imported',
      props: { valid: true },
    });
  });

  it('never throws when the sender fails', () => {
    setAnalyticsSender(() => {
      throw new Error('offline');
    });

    expect(() => track({ event: 'app_opened' })).not.toThrow();
  });
});

describe('beaconSender', () => {
  it('queues the event as a beacon to /api/events', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { ...navigator, sendBeacon });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    beaconSender({ event: 'app_opened' });

    expect(sendBeacon).toHaveBeenCalledWith(
      '/api/events',
      '{"event":"app_opened"}',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['is missing', undefined],
    ['refuses the beacon', vi.fn(() => false)],
    [
      'throws',
      vi.fn(() => {
        throw new TypeError('blocked');
      }),
    ],
  ])('falls back to a keepalive fetch when sendBeacon %s', (_, sendBeacon) => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon });
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null)));
    vi.stubGlobal('fetch', fetchMock);

    beaconSender({ event: 'app_opened' });

    expect(fetchMock).toHaveBeenCalledWith('/api/events', {
      method: 'POST',
      body: '{"event":"app_opened"}',
      keepalive: true,
      credentials: 'omit',
    });
  });

  it('swallows a failed fetch', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: undefined });
    const failed = Promise.reject(new TypeError('offline'));
    vi.stubGlobal(
      'fetch',
      vi.fn(() => failed),
    );

    expect(() => beaconSender({ event: 'app_opened' })).not.toThrow();
    await expect(failed).rejects.toThrow('offline');
  });

  it('never throws when nothing can send', () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: undefined });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new TypeError('no fetch');
      }),
    );

    expect(() => beaconSender({ event: 'app_opened' })).not.toThrow();
  });
});

describe('percentBucket', () => {
  it.each([
    [0, '0-49'],
    [49.99, '0-49'],
    [50, '50-69'],
    [69.99, '50-69'],
    [70, '70-89'],
    [89.99, '70-89'],
    [90, '90-100'],
    [100, '90-100'],
  ])('puts %d%% in %s', (percentage, bucket) => {
    expect(percentBucket(percentage)).toBe(bucket);
  });
});

describe('quiz events', () => {
  it('describes a started quiz by size, layout and anti-cheat only', () => {
    expect(quizStarted(quiz())).toEqual({
      event: 'quiz_started',
      props: { questionCount: 4, layout: 'paginated', antiCheat: false },
    });
    expect(
      quizStarted(
        quiz({
          templateMode: 'single-page',
          antiCheat: {
            enabled: true,
            tabLock: true,
            uiRestrictions: true,
            fullscreenLock: false,
          },
        }),
      ).props,
    ).toMatchObject({ layout: 'scroll', antiCheat: true });
  });

  it('describes a submitted quiz by size, score bucket and whole minutes', () => {
    expect(quizSubmitted(quiz(), 75, 150)).toEqual({
      event: 'quiz_submitted',
      props: { questionCount: 4, percentBucket: '70-89', durationMinutes: 3 },
    });
    expect(quizSubmitted(quiz(), 0, 20).props.durationMinutes).toBe(0);
  });

  it('never carries quiz content', () => {
    const sent = JSON.stringify([
      quizStarted(quiz()),
      quizSubmitted(quiz(), 100, 60),
    ]);
    expect(sent).not.toMatch(/Secret|CS1/);
  });
});
