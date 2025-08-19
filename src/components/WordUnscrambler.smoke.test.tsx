import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import WordUnscrambler from './WordUnscrambler';

// Helper to read current letters from DOM
function textFromLetters(container: HTMLElement): string {
  const spans = Array.from(container.querySelectorAll('[data-testid="letter"]')) as HTMLElement[];
  return spans.map((s) => s.textContent ?? '').join('');
}

describe('WordUnscrambler smoke', () => {
  it('reaches final target text after animation', async () => {
    const source = 'tesd';
    const target = 'tads';
    const { container, rerender: rr, unmount } = render(
      <WordUnscrambler source={source} target={target} animateSignal={0} />
    );

    // Trigger animation by bumping animateSignal
    rr(<WordUnscrambler source={source} target={target} animateSignal={1} />);

    await waitFor(
      () => {
        const current = textFromLetters(container);
        expect(current).toBe(target);
      },
      { timeout: 3000 }
    );

    // Clean up
    unmount();
  });
});
