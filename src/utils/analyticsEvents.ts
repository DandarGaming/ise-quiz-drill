import { z } from 'zod';
import { presets } from './presets';

// The only events /api/events accepts. Every field is an enum, a
// boolean or a bounded number, so a log line can never carry quiz content,
// free text or anything that identifies a person.

export const MAX_EVENT_BYTES = 1024;

export const PERCENT_BUCKETS = ['0-49', '50-69', '70-89', '90-100'] as const;

const presetIds = presets.map((preset) => preset.id) as [string, ...string[]];
const int = (min: number, max: number) => z.number().int().min(min).max(max);
const questionCount = int(1, 1000);

const event = <N extends string, P extends z.ZodRawShape>(name: N, props: P) =>
  z.strictObject({ event: z.literal(name), props: z.strictObject(props) });

export const analyticsEventSchema = z.discriminatedUnion('event', [
  z.strictObject({
    event: z.literal('app_opened'),
    props: z.strictObject({}).default({}),
  }),
  event('preset_applied', { presetId: z.enum(presetIds) }),
  // The creator allows 1 to 50 questions in a prompt
  event('prompt_copied', { questionCount: int(1, 50) }),
  event('quiz_imported', { valid: z.boolean() }),
  event('quiz_started', {
    questionCount,
    layout: z.enum(['paginated', 'scroll']),
    antiCheat: z.boolean(),
  }),
  event('quiz_submitted', {
    questionCount,
    percentBucket: z.enum(PERCENT_BUCKETS),
    durationMinutes: int(0, 600),
  }),
]);

// What the client sends (props may be left out on app_opened)
export type AnalyticsEvent = z.input<typeof analyticsEventSchema>;
export type PercentBucket = (typeof PERCENT_BUCKETS)[number];

// null for anything that is not one allowed event
export function parseAnalyticsEvent(text: string) {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  const result = analyticsEventSchema.safeParse(body);
  return result.success ? result.data : null;
}
