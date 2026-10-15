import { afterEach, describe, it, expect, vi } from 'vitest';
import type { APIContext, MiddlewareNext } from 'astro';
import { onRequest } from './middleware';

afterEach(() => vi.restoreAllMocks());

// The request log is for operations only: no IP, user agent, referrer,
// query string or body
describe('request log', () => {
  it('logs only time, level, route, method, status and latency', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const request = new Request('http://localhost/api/events?ref=chat', {
      method: 'POST',
      body: '{"event":"app_opened"}',
      headers: {
        'x-forwarded-for': '203.0.113.7',
        'user-agent': 'TestBrowser/1.0',
        referer: 'https://chat.example/group',
      },
    });
    const next: MiddlewareNext = async () =>
      new Response(null, { status: 204 });

    await onRequest(
      { request, url: new URL(request.url) } as unknown as APIContext,
      next,
    );

    expect(log).toHaveBeenCalledOnce();
    const line = log.mock.calls[0][0] as string;
    expect(Object.keys(JSON.parse(line)).sort()).toEqual([
      'latencyMs',
      'level',
      'method',
      'route',
      'statusCode',
      'timestamp',
    ]);
    expect(JSON.parse(line)).toMatchObject({
      route: '/api/events',
      method: 'POST',
      statusCode: 204,
    });
    expect(line).not.toMatch(/203\.0\.113\.7|TestBrowser|chat|app_opened/);
  });
});
