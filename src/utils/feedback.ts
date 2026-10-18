export const MAX_FEEDBACK_LENGTH = 2000;
export const FEEDBACK_LIMIT = 5;
export const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;
const MAX_FEEDBACK_CLIENTS = 10_000;

const feedbackAttempts = new Map<string, number[]>();

export type FeedbackCategory = 'bug' | 'idea' | 'wrong_question';

export interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  quizTitle?: string;
  questionNumber?: number;
}

export function parseFeedbackPayload(text: string): FeedbackPayload | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  const body = value as Record<string, unknown>;
  if (
    !['bug', 'idea', 'wrong_question'].includes(String(body.category)) ||
    typeof body.message !== 'string' ||
    body.message.trim().length === 0 ||
    body.message.length > MAX_FEEDBACK_LENGTH
  ) {
    return null;
  }
  if (
    body.quizTitle !== undefined &&
    (typeof body.quizTitle !== 'string' || body.quizTitle.length > 200)
  ) {
    return null;
  }
  if (
    body.questionNumber !== undefined &&
    (typeof body.questionNumber !== 'number' ||
      !Number.isInteger(body.questionNumber) ||
      body.questionNumber < 1)
  ) {
    return null;
  }

  return {
    category: body.category as FeedbackCategory,
    message: body.message,
    ...(typeof body.quizTitle === 'string'
      ? { quizTitle: body.quizTitle }
      : {}),
    ...(typeof body.questionNumber === 'number'
      ? { questionNumber: body.questionNumber }
      : {}),
  };
}

function addressWithoutPort(value: string): string {
  const address = value.trim();
  const bracketedIpv6 = address.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketedIpv6) return bracketedIpv6[1];
  const ipv4WithPort = address.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  return ipv4WithPort?.[1] ?? address;
}

export function feedbackClientKey(
  forwardedFor: string | null,
  viewerAddress: string | null = null,
): string {
  if (viewerAddress) return addressWithoutPort(viewerAddress);
  const lastForwardedAddress = forwardedFor?.split(',').at(-1)?.trim();
  return lastForwardedAddress
    ? addressWithoutPort(lastForwardedAddress)
    : 'unknown';
}

export function acceptFeedbackRequest(
  clientKey: string,
  now = Date.now(),
): boolean {
  for (const [key, timestamps] of feedbackAttempts) {
    const recent = timestamps.filter(
      (timestamp) => now - timestamp < FEEDBACK_WINDOW_MS,
    );
    if (recent.length === 0) feedbackAttempts.delete(key);
    else feedbackAttempts.set(key, recent);
  }

  const attempts = feedbackAttempts.get(clientKey) ?? [];
  if (attempts.length >= FEEDBACK_LIMIT) return false;
  if (
    !feedbackAttempts.has(clientKey) &&
    feedbackAttempts.size >= MAX_FEEDBACK_CLIENTS
  ) {
    return false;
  }
  attempts.push(now);
  feedbackAttempts.set(clientKey, attempts);
  return true;
}

export function resetFeedbackRateLimitForTests(): void {
  feedbackAttempts.clear();
}
