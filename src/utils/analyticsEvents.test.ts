import { describe, it, expect } from 'vitest';
import { MAX_EVENT_BYTES, parseAnalyticsEvent } from './analyticsEvents';

const parse = (body: unknown) => parseAnalyticsEvent(JSON.stringify(body));

describe('parseAnalyticsEvent', () => {
  it.each([
    [{ event: 'app_opened' }],
    [{ event: 'app_opened', props: {} }],
    [{ event: 'preset_applied', props: { presetId: 'devops' } }],
    [{ event: 'prompt_copied', props: { questionCount: 10 } }],
    [{ event: 'quiz_imported', props: { valid: false } }],
    [
      {
        event: 'quiz_started',
        props: { questionCount: 5, layout: 'scroll', antiCheat: true },
      },
    ],
    [
      {
        event: 'quiz_submitted',
        props: { questionCount: 5, percentBucket: '70-89', durationMinutes: 3 },
      },
    ],
  ])('accepts %j', (body) => {
    expect(parse(body)).toMatchObject({ event: body.event });
  });

  it('gives an event without props an empty props object', () => {
    expect(parse({ event: 'app_opened' })).toEqual({
      event: 'app_opened',
      props: {},
    });
  });

  it.each([
    ['an unknown event', { event: 'page_viewed' }],
    ['no event', { props: {} }],
    ['an extra top-level field', { event: 'app_opened', userId: 'u1' }],
    [
      'props on an event without props',
      { event: 'app_opened', props: { a: 1 } },
    ],
    [
      'an extra prop',
      { event: 'quiz_imported', props: { valid: true, title: 'My quiz' } },
    ],
    ['a missing prop', { event: 'quiz_imported', props: {} }],
    [
      'a preset that is not built in',
      { event: 'preset_applied', props: { presetId: 'my own preset' } },
    ],
    [
      'text in place of a number',
      { event: 'prompt_copied', props: { questionCount: 'ten' } },
    ],
    ['a fraction', { event: 'prompt_copied', props: { questionCount: 2.5 } }],
    [
      'more questions than the creator allows',
      { event: 'prompt_copied', props: { questionCount: 51 } },
    ],
    [
      'an unknown layout',
      {
        event: 'quiz_started',
        props: { questionCount: 5, layout: 'grid', antiCheat: false },
      },
    ],
    [
      'a raw score in place of a bucket',
      {
        event: 'quiz_submitted',
        props: { questionCount: 5, percentBucket: '87', durationMinutes: 3 },
      },
    ],
    [
      'a negative duration',
      {
        event: 'quiz_submitted',
        props: {
          questionCount: 5,
          percentBucket: '0-49',
          durationMinutes: -1,
        },
      },
    ],
    ['an array', [{ event: 'app_opened' }]],
    ['null', null],
  ])('rejects %s', (_, body) => {
    expect(parse(body)).toBeNull();
  });

  it('rejects text that is not JSON', () => {
    expect(parseAnalyticsEvent('{"event":')).toBeNull();
    expect(parseAnalyticsEvent('')).toBeNull();
  });

  it('caps a body at about 1 KB', () => {
    expect(MAX_EVENT_BYTES).toBe(1024);
  });
});
