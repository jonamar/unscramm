import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia reliably at setup time; provide a minimal stub on globalThis
if (typeof (globalThis as any).matchMedia !== 'function') {
  const reduced = (globalThis as any).__TEST_MATCH_MEDIA_REDUCED__ ?? true;
  (globalThis as any).matchMedia = (query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

// Mirror to window when available
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  // @ts-ignore
  window.matchMedia = (globalThis as any).matchMedia;
}
