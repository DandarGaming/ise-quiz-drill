import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { APIContext } from 'astro';
import { POST, prerender } from '../src/pages/api/events';

// The route is called directly with a Request, the way the Node adapter does.

const headers = {
  'x-forwarded-for': '203.0.113.7',
  'user-agent': 'TestBrowser/1.0',
  referer: 'https://chat.example/group',
};

const post = (body: BodyInit | null, extra: Record<string, string> = {}) =>
  POST({
    request: new Request('http://localhost/api/events', {
      method: 'POST',
      body,
      headers: { ...headers, ...extra },
      // A stream body needs this in Node's fetch
      ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
    }),
  } as unknown as APIContext);

let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('POST /api/events', () => {
  it('runs on the server, not at build time', () => {
    expect(prerender).toBe(false);
  });

  it('logs one analytics line for an allowed event and returns 204', async () => {
    const response = await post(
      JSON.stringify({
        event: 'quiz_submitted',
        props: {
          questionCount: 5,
          percentBucket: '90-100',
          durationMinutes: 2,
        },
      }),
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(log).toHaveBeenCalledOnce();
    const line = JSON.parse(log.mock.calls[0][0] as string);
    expect(line).toEqual({
      type: 'analytics',
      event: 'quiz_submitted',
      props: { questionCount: 5, percentBucket: '90-100', durationMinutes: 2 },
      timestamp: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
    });
  });

  it('accepts the text/plain body a beacon sends', async () => {
    const response = await post('{"event":"app_opened"}', {
      'content-type': 'text/plain;charset=UTF-8',
    });

    expect(response.status).toBe(204);
    expect(JSON.parse(log.mock.calls[0][0] as string)).toMatchObject({
      event: 'app_opened',
      props: {},
    });
  });

  it('never logs the IP address, user agent or referrer', async () => {
    await post('{"event":"app_opened"}');

    const line = log.mock.calls[0][0] as string;
    for (const value of Object.values(headers)) {
      expect(line).not.toContain(value);
    }
  });

  it.each([
    ['broken JSON', '{"event":'],
    ['an unknown event', '{"event":"page_viewed"}'],
    ['an unknown field', '{"event":"app_opened","sessionId":"abc"}'],
    ['an empty body', null],
  ])('rejects %s with 400 and logs nothing', async (_, body) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });

  it('rejects a body over 1 KB with 413 and logs nothing', async () => {
    const padding = ' '.repeat(1100);
    const response = await post(`{"event":"app_opened"}${padding}`);

    expect(response.status).toBe(413);
    expect(log).not.toHaveBeenCalled();
  });

  it('stops reading a large body that does not declare its length', async () => {
    let pulled = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(512).fill(32));
      },
    });

    const response = await post(endless);

    expect(response.status).toBe(413);
    expect(pulled).toBeLessThan(10);
    expect(log).not.toHaveBeenCalled();
  });
});
