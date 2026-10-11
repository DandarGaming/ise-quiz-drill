import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Clock } from 'lucide-react';

describe('React toolchain', () => {
  it('renders JSX with a lucide icon', () => {
    const html = renderToString(
      <p>
        <Clock aria-hidden="true" /> Time left
      </p>,
    );

    expect(html).toContain('<svg');
    expect(html).toContain('Time left');
  });
});
