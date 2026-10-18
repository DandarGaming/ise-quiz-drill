import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { APIContext } from 'astro';
import { POST, prerender } from '../src/pages/api/feedback';
import {
  acceptFeedbackRequest,
  feedbackClientKey,
  resetFeedbackRateLimitForTests,
} from '../src/utils/feedback';

const post = (body: BodyInit | null, clientIp = '203.0.113.10') =>
  POST({
    request: new Request('http://localhost/api/feedback', {
      method: 'POST',
      body,
      headers: { 'x-forwarded-for': clientIp },
    }),
  } as unknown as APIContext);

let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  resetFeedbackRateLimitForTests();
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  resetFeedbackRateLimitForTests();
});

describe('POST /api/feedback', () => {
  it('runs on the server rather than at build time', () => {
    expect(prerender).toBe(false);
  });

  it('sends feedback with wrong-question context to the private app log', async () => {
    const response = await post(
      JSON.stringify({
        category: 'wrong_question',
        message: 'The answer key seems incorrect.',
        quizTitle: 'Cloud basics',
        questionNumber: 4,
      }),
    );

    expect(response.status).toBe(204);
    expect(JSON.parse(log.mock.calls[0][0] as string)).toMatchObject({
      type: 'user_feedback',
      category: 'wrong_question',
      message: 'The answer key seems incorrect.',
      quizTitle: 'Cloud basics',
      questionNumber: 4,
    });
  });

  it.each([
    ['invalid JSON', '{"category":'],
    ['empty text', JSON.stringify({ category: 'idea', message: '  ' })],
    [
      'unknown category',
      JSON.stringify({ category: 'spam', message: 'hello' }),
    ],
    [
      'overlong text',
      JSON.stringify({ category: 'bug', message: 'x'.repeat(2001) }),
    ],
    [
      'missing wrong-question context type',
      JSON.stringify({ category: 'bug', message: 'hello', questionNumber: 0 }),
    ],
  ])('rejects %s without logging it', async (_label, body) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });

  it('refuses additional feedback after five messages per client in one hour', async () => {
    const payload = JSON.stringify({
      category: 'idea',
      message: 'A useful idea.',
    });

    for (let index = 0; index < 5; index += 1) {
      expect((await post(payload)).status).toBe(204);
    }
    expect((await post(payload)).status).toBe(429);
    expect(log).toHaveBeenCalledTimes(5);
  });

  it('uses the CloudFront viewer address without its transient source port', () => {
    expect(
      feedbackClientKey('198.51.100.3, 198.51.100.4', '203.0.113.8:41234'),
    ).toBe('203.0.113.8');
    expect(feedbackClientKey('198.51.100.3, 198.51.100.4')).toBe(
      '198.51.100.4',
    );
  });

  it('releases an address quota after the one-hour window', () => {
    for (let count = 0; count < 5; count += 1) {
      expect(acceptFeedbackRequest('203.0.113.7', 10_000 + count)).toBe(true);
    }
    expect(acceptFeedbackRequest('203.0.113.7', 20_000)).toBe(false);
    expect(acceptFeedbackRequest('203.0.113.7', 10_000 + 60 * 60 * 1000)).toBe(
      true,
    );
  });

  it('rejects an oversized request body', async () => {
    const response = await post(
      JSON.stringify({ category: 'idea', message: 'x'.repeat(9000) }),
    );
    expect(response.status).toBe(413);
    expect(log).not.toHaveBeenCalled();
  });
});
