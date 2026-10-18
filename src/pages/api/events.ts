import type { APIRoute } from 'astro';
import {
  MAX_EVENT_BYTES,
  parseAnalyticsEvent,
} from '../../utils/analyticsEvents';
import { readCappedText } from '../../utils/requestBody';

// Anonymous usage events. Anyone can POST here, so the body is
// capped and only allow-listed events are logged. No header (IP, user agent,
// referrer) is ever read or logged.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const text = await readCappedText(request, MAX_EVENT_BYTES);
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
