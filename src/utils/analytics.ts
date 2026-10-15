import type { QuizConfig } from '../types/quiz';
import type { AnalyticsEvent, PercentBucket } from './analyticsEvents';

// Anonymous usage events. Only types come from analyticsEvents, so
// zod stays out of the browser bundle. No ids, cookies or storage: an event
// is a name and a few small fields, nothing more.

export type { AnalyticsEvent };
export type AnalyticsSender = (event: AnalyticsEvent) => void;

const ENDPOINT = '/api/events';

// Fire and forget: the beacon is queued by the browser and survives leaving
// the page. The static S3 site has no /api, so there the request just fails.
export const beaconSender: AnalyticsSender = (event) => {
  const body = JSON.stringify(event);
  try {
    if (navigator.sendBeacon(ENDPOINT, body)) return;
  } catch {
    // No sendBeacon here; try fetch
  }
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      body,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  } catch {
    // Nothing can send; the app carries on
  }
};

// Tests send nothing unless they inject a sender
let sender: AnalyticsSender | null =
  import.meta.env.MODE === 'test' ? null : beaconSender;

export function setAnalyticsSender(next: AnalyticsSender | null) {
  sender = next;
}

export function track(event: AnalyticsEvent): void {
  try {
    sender?.(event);
  } catch {
    // Analytics must never break a click
  }
}

export function percentBucket(percentage: number): PercentBucket {
  if (percentage >= 90) return '90-100';
  if (percentage >= 70) return '70-89';
  if (percentage >= 50) return '50-69';
  return '0-49';
}

export const quizStarted = (quiz: QuizConfig) =>
  ({
    event: 'quiz_started',
    props: {
      questionCount: quiz.questions.length,
      layout: quiz.templateMode === 'paginated' ? 'paginated' : 'scroll',
      antiCheat: !!quiz.antiCheat?.enabled,
    },
  }) satisfies AnalyticsEvent;

export const quizSubmitted = (
  quiz: QuizConfig,
  percentage: number,
  timeTakenSeconds: number,
) =>
  ({
    event: 'quiz_submitted',
    props: {
      questionCount: quiz.questions.length,
      percentBucket: percentBucket(percentage),
      durationMinutes: Math.round(timeTakenSeconds / 60),
    },
  }) satisfies AnalyticsEvent;
