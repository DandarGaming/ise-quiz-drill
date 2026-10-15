import type { APIRoute } from 'astro';
import {
  MAX_EVENT_BYTES,
  parseAnalyticsEvent,
} from '../../utils/analyticsEvents';

// Anonymous usage events. Anyone can POST here, so the body is
// capped and only allow-listed events are logged. No header (IP, user agent,
// referrer) is ever read or logged.
export const prerender = false;

// The body as text, or null once it is longer than the limit. Reading stops
// there, so a large or endless body costs nothing more.
async function readCapped(request: Request, limit: number) {
  if (Number(request.headers.get('content-length')) > limit) return null;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export const POST: APIRoute = async ({ request }) => {
  const text = await readCapped(request, MAX_EVENT_BYTES);
  if (text === null) return new Response(null, { status: 413 });

  const event = parseAnalyticsEvent(text);
  if (!event) return new Response(null, { status: 400 });

  console.log(
    JSON.stringify({
      type: 'analytics',
      event: event.event,
      props: event.props,
      timestamp: new Date().toISOString(),
    }),
  );
  return new Response(null, { status: 204 });
};
