# Unscramm

Unscramm is a macOS-first animated spellcheck prototype. It takes a source word, suggests a correction, and visualizes the transition from one to the other with explicit deletion, move, and insertion phases.

The repo currently supports two development surfaces:
- the main macOS webview build
- an animation lab for tuning motion, timings, and edit-plan behavior

Canonical product/design docs:
- PRD: `docs/unscramm-v3-prd-spec.md`
- Design guide: `docs/design_guidelines/styleguide.md`
- Platform notes: `PLATFORM-GUIDE.md`

## Quick Start

```bash
npm install
npm run dev:macos
```

Other useful commands:

```bash
npm run build:macos
npm run dev:lab
npm test
```

## Runtime Shape

### macOS build
- Entry HTML: `index-macos.html`
- Entry TS: `src/main-macos.tsx`
- Vite config: `vite.config.macos.ts`
- Output directory: `dist-macos/`
- Native bridge: `src/platform/macos.ts`

### Animation lab
- Entry TS: `src/dev/main-lab.tsx`
- Vite config: `vite.config.lab.ts`
- Purpose: inspect timing, edit-plan output, and animation behavior without the full app flow

## Product Notes

- The app is designed around clear character-level transformations rather than generic spellcheck UI.
- Motion semantics matter: deletions, true movers, and insertions should stay visually distinct.
- Reduced motion should remain respected throughout the stack.

## Testing

```bash
npm test
```

The repo includes:
- unit tests for edit-plan logic
- animation-script coverage
- smoke coverage around the diff visualizer flow

## Runtime Hazards

- `dist-macos/` must be built before the macOS webview can load the app (`npm run build:macos`). The directory is gitignored; a fresh clone has no build output.
- `dev:macos` runs Vite in serve mode — the webview hot-reloads from localhost. Do not confuse the dev server URL with the production build path.

## Agent Notes

- Shared agent tooling lives in `.agents/` (propagated from product-ops). Do not edit those surfaces directly.
- Workflow guides: `.agents/skills/`, shared tools: `.agents/tools/`, risk modes: `.agents/meta/`.

## Repo Contract

`unscramm` is a `code-first + local workflow` repo.

That means:
- product code and stable product/design docs stay in git
- mayor/workstream/planning surfaces stay local-only
- the local-only layer is backed up off-box and is not part of the public repo contract
