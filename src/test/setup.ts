import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia reliably at setup time; provide a minimal stub on globalThis
type TestGlobal = typeof globalThis & {
  matchMedia?: (query: string) => MediaQueryList;
  __TEST_MATCH_MEDIA_REDUCED__?: boolean;
};

const testGlobal = globalThis as TestGlobal;

if (typeof testGlobal.matchMedia !== 'function') {
  const reduced = testGlobal.__TEST_MATCH_MEDIA_REDUCED__ ?? true;
  testGlobal.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: reduced && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }) as MediaQueryList;
}

// Mirror to window when available
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  if (typeof testGlobal.matchMedia === 'function') {
    window.matchMedia = testGlobal.matchMedia;
  }
}
