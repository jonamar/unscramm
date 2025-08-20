# Style Guide

## Color Palette
- **Background**: `#111` (html, body)
- **Panel & Neumorphic Buttons**: `#181818`
- **Primary Button**: `#333` (.btn)
- **Button Hover**: `#222`
- **Toggled-Off**: `#444` + `filter: grayscale(100%)`
- **Disabled**: `opacity: 0.5`
- **Letter Default**: `#fff` (.word .letter)
- **Unrevealed Letters**: `#555` (.orig-wrapper .letter)
- **Spellcheck**: `red` (border-bottom)
- **Secondary Text**: `#777` (#advancedLink)

Note: Prefer using the CSS variables defined in `src/index.css` under `@theme` instead of hard-coded hex values, e.g. `var(--color-bg)`, `var(--color-panel)`, `var(--color-button)`, `var(--color-text)`, `var(--color-text-secondary)`, `var(--color-deletion)`, `var(--color-insertion)`, `var(--color-move)`.

_Refer to SVG icons in `design_guidelines/ui/`:_
- `ui-colors.svg` for palette reference
- `ui-play.svg`, `ui-reload.svg`, `ui-rand.svg` for controls

## Typography & Spacing
- **Font**: `'Istok Web', sans-serif`
- **Font-Weight**: `bold`
- **Base Letter Size**:
  - `.word .letter`: `2rem`
  - `.orig-wrapper .letter`: `1.5rem`
- **Letter Gap**:
  - Words: `0.025em` margin
  - Original: `0.05em` gap

## Layout
```css
body {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
  background: #111;
}
.main {
  width: 100%;
  max-width: 600px;
  padding: 0 30px;
  box-sizing: border-box;
}
``` 
- Centered, columnar flex layout
- Content width capped at 600px with side padding

## Buttons
### Base `.btn`
```css
.btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #333;
  color: #fff;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease, background-color 0.2s ease;
  cursor: pointer;
}
.btn:hover { background: #222; }
.btn:active { transform: scale(0.95); }
.btn:disabled {
  opacity: 0.5;
  cursor: default;
}
``` 

### Neumorphic `.btn.neu`
```css
.btn.neu {
  background: #181818;
  border: 1px solid rgba(255,255,255,0.04);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.1),
    inset 0 -1px 0 rgba(0,0,0,0.6),
    -4px -4px 8px rgba(255,255,255,0.05),
     4px  4px 12px rgba(0,0,0,0.8);
  transition: box-shadow 0.2s ease, transform 0.1s ease;
}
.btn.neu:active,
.btn.neu.toggled-off {
  box-shadow:
    inset 4px 4px 12px rgba(0,0,0,0.8),
    inset -4px -4px 12px rgba(255,255,255,0.05);
  transform: scale(0.97);
}
.btn.neu:disabled {
  opacity: 0.5;
  box-shadow: none;
}
``` 
- Use inline SVG icons: `<button class="btn neu toggle-btn"><svg>…</svg></button>`
- Toggle state: swap `.play-icon`/`.refresh-icon` via `.is-playing`

## Input Panel
```css
.input-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 600px;
  margin-top: 50px;
  box-sizing: border-box;
}
.input-panel input[type="text"] {
  flex: 1;
  padding: 15px 10px;
  font-size: 1rem;
  border-radius: 3px;
  background: #181818;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.04);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.6), -4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.8);
}
.input-panel input[type="text"]:disabled {
  opacity: 0.5;
  cursor: default;
}
``` 
- Arrow `<span class="arrow">→</span>` sized `1.25rem`, no shrink

## Animations & Transitions

Note: Take this as a general reference guide for the intended animations and transitions. Implementation should follow the conventions and features of "Framer Motion".

Define in `:root`:
```css
:root {
  --remove-duration: 0.4s;
  --add-duration: 0.3s;
  --reorder-duration: 1s;
  --letter-shift-duration: 0.3s;
}
``` 
Use:
```css
.phase-remove    { transition: transform var(--remove-duration) ease, opacity var(--remove-duration) ease; }
.phase-add       { transition: all var(--add-duration) ease; transform: translateY(20px) scale(0.8); opacity: 0; }
.phase-reorder   { transition: transform var(--reorder-duration) cubic-bezier(0.1,2,0.3,1); }
.letter-shift    { transition: transform var(--letter-shift-duration) cubic-bezier(0.25,0.1,0.25,1); }
``` 
**Tip**: Always set a starting state (transform+opacity) for entry animations.

—

## Design Tokens (Source of Truth)

Tokens are named variables that store visual decisions (colors, typography, motion). They are defined in `src/index.css` under the `@theme` block and referenced via `var(--token-name)` or Tailwind arbitrary values.

Core tokens:

- Colors
  - `--color-bg` (background)
  - `--color-panel` (elevated surface)
  - `--color-button`, `--color-button-hover`
  - `--color-text`, `--color-text-secondary`
  - Semantic: `--color-deletion` (red), `--color-move` (yellow), `--color-insertion` (green)
- Typography
  - `--font-sans`

Usage examples:

- Tailwind with variables: `bg-[--color-panel] text-[--color-text]`
- Semantic utilities (defined in `src/index.css`): `.text-deletion`, `.text-move`, `.text-insertion`

Benefits: consistency, easy theming (dark/light/high-contrast), maintainability, accessibility tuning in one place.

## Semantic Color Utilities

Defined in `src/index.css`:

- `.text-deletion { color: var(--color-deletion); }`
- `.text-move { color: var(--color-move); }`
- `.text-insertion { color: var(--color-insertion); }`

Guidelines:

- Apply per-letter, not per-phase.
- Deleting: only soon-to-be-removed letters red.
- Moving: only letters that change position yellow.
- Inserting: only newly inserted letters green.
- Final: reset to neutral text color.

## Motion system and Reduced Motion

Durations (match component logic):

- Delete phase: 400ms
- Move phase: 1000ms
- Insert phase: 300ms
- Per-letter transition: 250ms

Debug/inspection: a speed multiplier may slow all timings in development.

Reduced motion policy:

- If `(prefers-reduced-motion: reduce)`, cap waits to 50ms and per-letter transitions to 50ms.
- Avoid large movements; prefer subtle opacity/scale changes.

Recommended easing:

- Reorder/movement: `cubic-bezier(0.1, 2, 0.3, 1)` or similarly gentle spring-like ease.
- Add/Remove fades: standard ease-in-out.

## Unscrambler Letter Behavior (Example: `tesd → tads`)

- Initial: neutral.
- Deleting: `e` is red for the full delete phase, then removed.
- Moving: only movers are yellow (`d` and `s`); non-movers (`t`) remain neutral.
- Inserting: `a` appears green; survivors stay neutral.
- Final: all neutral.

Preservation rule: survivors reuse their original identities (stable keys) to avoid re-creating letters during insert phase.

## Buttons and Focus

- Base size ~40px; consider 44px min tap target if space allows.
- Focus-visible: show a ring for keyboard users (`.btn:focus-visible`).
- Disabled: `opacity: 0.5` and non-interactive.
- Toggle states (e.g., Play vs. Reset): keep `aria-label` specific and update on state change.

## Accessibility

- Keyboard order: inputs → Play → Reset; ensure visible focus.
- Live announcements (optional): an `aria-live="polite"` region can announce phase changes (Deleting… Moving… Inserting… Completed.)
- Color contrast: ensure text and colored states meet AA against the dark background. Prefer adjusting tokens if needed.

## Layout with Tailwind mapping

- Container: `w-full max-w-[600px] px-6`
- Panels: `.panel` (predefined in `src/index.css`) for elevated surfaces.
- Inputs: `.input` for consistent background, border, and focus styles.

Provide both Tailwind examples and CSS snippets for contributors not using Tailwind utilities.

## Iconography

- Icons live in `docs/design_guidelines/ui/`.
- Size to fit buttons; inherit current color when used inside buttons (use `fill="currentColor"`).

## Responsive Breakpoints
```css
@media (max-width: 600px) { /* Stack inputs, rotate arrow, shrink font */ }
@media (max-width: 500px) { .letter { font-size: 1.6rem; } }
@media (max-width: 400px) { .letter { font-size: 1.3rem; } }
@media (max-width: 320px) { .letter { font-size: 1.1rem; } }
@media (max-width: 350px) { /* Smaller buttons, tighter gaps */ }
@media (max-height: 600px) { /* Reduce logo and padding */ }
``` 
- Refer to mocks in `design_guidelines/mocks/` for layout guidance.