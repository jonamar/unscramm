# Unscramm v3 (Vite + React + TypeScript)

Radically simple rewrite of Unscramm with a minimal stack:

- Vite + React + TypeScript
- Tailwind CSS v4 (tokens via `@theme` in CSS)
- Framer Motion for animations
- Vitest + Testing Library for tests

See PRD: `docs/unscramm-v3-prd-spec.md` and style guide: `docs/design_guidelines/styleguide.md`.

## Purpose & Intent

Unscramm is an interactive "animated spellcheck" that shows how a misspelled word transforms into the correct word via clear, accessible character transitions. It serves two goals:

- Accessibility-focused visualization for dyslexic readers to see how letters change through deletion, movement, and insertion.
- A process experiment in rigorous, modular development where the majority of implementation is driven through AI-assisted workflows with clear specs and tests.

## Getting Started

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test (CI): `npm test`

## Design Tokens

Source of truth: `src/index.css` under the `@theme` block. These CSS variables define colors, typography, and semantic states used across the app.

- Colors: `--color-bg`, `--color-panel`, `--color-button`, `--color-button-hover`, `--color-text`, `--color-text-secondary`
- Semantic colors: `--color-deletion` (red), `--color-move` (yellow), `--color-insertion` (green)
- Typography: `--font-sans`

Usage:

- Tailwind with variables: `bg-[--color-panel] text-[--color-text]`
- Utilities from `src/index.css`: `.text-deletion`, `.text-move`, `.text-insertion`

Benefits: consistency, easy theming, maintainability, and accessible contrast tuning from a single place.

## Testing Stack

- __Runner__: Vitest (v2)
- __Environment__: jsdom
- __Library__: `@testing-library/react` + `@testing-library/jest-dom`
- __Setup__: `src/test/setup.ts`

The setup file does two things:

1. __jest-dom matchers__ via `@testing-library/jest-dom/vitest` so you can use matchers like `toBeInTheDocument()`.
2. __matchMedia polyfill__ for jsdom so components using reduced-motion queries work in tests.

### matchMedia polyfill
In `src/test/setup.ts`, we define a minimal `matchMedia` on `globalThis` and mirror it to `window`:

```ts
import '@testing-library/jest-dom/vitest'

if (typeof (globalThis as any).matchMedia !== 'function') {
  const reduced = (globalThis as any).__TEST_MATCH_MEDIA_REDUCED__ ?? true
  ;(globalThis as any).matchMedia = (query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  })
}
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  // @ts-ignore
  window.matchMedia = (globalThis as any).matchMedia
}
```

Tip: set `(globalThis as any).__TEST_MATCH_MEDIA_REDUCED__ = false` if you need to simulate non-reduced motion in specific tests.

### Running tests

```bash
npm test
```

There are unit tests for `computeEditPlan()` and a smoke test for `WordUnscrambler` that asserts the final DOM equals the target word after animation.

## Tailwind CSS

This project uses Tailwind CSS v4 with tokens defined directly in CSS (no `tailwind.config.js` required). See `src/index.css`:

```css
@import "tailwindcss";
@theme {
  --color-bg: #111;
  --color-panel: #181818;
  --color-button: #333;
  --color-button-hover: #222;
  --color-text: #ffffff;
  --color-text-secondary: #777777;
  --color-deletion: #ef4444;
  --color-insertion: #22c55e;
  --color-move: #eab308;
  --font-sans: "Istok Web", system-ui, Avenir, Helvetica, Arial, sans-serif;
}
```

These map 1:1 to the semantic tokens in `docs/design_guidelines/styleguide.md`.

## Component: WordUnscrambler

The core component lives at `src/components/WordUnscrambler.tsx` and follows the PRD phases:

- __idle__ → __deleting__ → __moving__ → __inserting__ → __final__

It uses `computeEditPlan()` to determine deletions/insertions and performs a FLIP-style reorder for survivors. Reduced motion is respected via `matchMedia('(prefers-reduced-motion: reduce)')`.

