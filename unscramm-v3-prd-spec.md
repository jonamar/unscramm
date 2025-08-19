# Product Requirements: Unscramm v3

**Version:** 1.0
**Status:** Proposed
**Author:** Cascade

---

## 1. Overview & Goal

Unscramm is an interactive animated spellcheck tool. It provides a visually engaging way to see a misspelled word transform into its correct spelling by animating the individual character transitions.

The goal of v3 is to successfully build a stable, maintainable, and delightful version of this tool by learning from past attempts and aggressively prioritizing simplicity.

## 2. Lessons Learned from v1 and v2

Our previous attempts failed for two opposite but related reasons:

*   **v1 (`unscramm-0.1.0`) Failed due to Lack of Structure:** A single, large vanilla JavaScript file with direct DOM manipulation was brittle, unpredictable, and impossible to debug or extend reliably. It was a classic "spaghetti code" problem.

*   **v2 (`unscramm`) Failed due to Over-Engineering:** In an attempt to solve v1's problems, v2 introduced excessive complexity (Next.js, XState, Storybook, complex testing rigs). This created an abstraction labyrinth that was equally difficult to manage, violating the core principle of making code simple and predictable for agentic development.

**The Core Lesson:** The fundamental challenge is orchestrating a multi-stage animation. Both attempts tried to solve this manually—one with raw JS, the other with a complex state machine. Both failed. The path forward is to **delegate the hard work of animation to a specialized library.**

## 3. Guiding Principles & What to Avoid

This project will be guided by radical simplicity. We will build only what is necessary for the core experience to function correctly.

### What to Do:

*   **Use a lightweight build tool.**
*   **Use a component-based framework (React).**
*   **Delegate animation to a dedicated library (Framer Motion).**
*   **Keep state management simple and local to the component.**
*   **Write clean, readable TypeScript.**
*   **Keep the component hierarchy flat.**

### What to AVOID:

*   **NO** manual DOM manipulation.
*   **NO** complex, external state machines (e.g., XState, Redux).
*   **NO** full-stack frameworks (e.g., Next.js) for this purely client-side application.
*   **NO** premature abstractions. Do not build for a future that doesn't exist.
*   **NO** complex testing infrastructure (e.g., visual regression, Storybook) for the initial build.
*   **NO** deep or nested component trees.

### 3.1. Branch Strategy: Rewrite on `v3` Branch

We will keep the existing GitHub repo but perform a clean, isolated rewrite on a new branch to minimize risk.

- Create branch: `v3` from `main`.
- Nuke-and-pave on `v3`: replace current app with the minimal structure in 5.2.
- Keep `main` unchanged until `v3` meets acceptance criteria (see Section 7).
- Optionally switch the default branch to `v3` once stable; later archive legacy code as needed.

Do:
- Keep only the minimal files needed for v3.
- Port the working algorithm utilities (`editPlan.ts`, `lcs.ts`) with unchanged names/exports.

Don’t:
- Carry over unused configs, deep tooling, or state machines.
- Introduce new frameworks/systems during the rewrite.

## 4. Core User Story

As a user, I want to enter a "source" (misspelled) word and a "target" (correct) word. When I click an "Animate" button, I want to see a clear, fluid animation that transforms the source word into the target word by showing characters being deleted, added, and moved into their new positions.

## 5. Technical Specification

### 5.1. Stack (Opinionated)

*   **Build Tool:** **Vite**. It's fast, simple, and perfect for client-side React apps.
*   **Framework:** **React** with **TypeScript**. Provides a solid, typed foundation.
*   **Animation:** **Framer Motion**. Its `layout` and `AnimatePresence` features are purpose-built for this exact animation problem and will handle the complexity automatically.
*   **Styling:** **Tailwind CSS**. For utility-first styling that is fast and avoids separate CSS files.

### 5.2. Project Structure

The repository will be wiped clean. The new structure will be minimal:

```
/unscramm
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── components/
    │   └── WordUnscrambler.tsx
    └── utils/
        ├── editPlan.ts
        └── lcs.ts
```

### 5.3. Core Logic

*   **`editPlan.ts`:** Reuse `computeEditPlan` (depends on `lcs.ts`). It produces a deterministic plan of deletions, insertions, moves, and highlight indices. Keep names/exports unchanged to remain grep-friendly.
*   **`WordUnscrambler.tsx`:** The single, primary component responsible for the entire feature.
    *   State: `source`, `target`, `phase` where `phase: 'idle' | 'deleting' | 'moving' | 'inserting' | 'final'`.
    *   Orchestration: a single `async function runAnimation()` sequences phases via `await delay(DURATIONS[phase])`.
    *   Controls: disable the Animate button while running; prevent concurrent runs (e.g., with a ref boolean or run token).
    *   Rendering: render letters with `.map()` using a stable identity key (see Guardrails) and the current phase.
    *   **State Derivation by Phase:** The component will use the `editPlan` to derive the list of letters to render at each step. This is the crucial link between the plan and the animation.
        1.  **`phase: 'idle'`**: Render the initial source word letters.
        2.  **`phase: 'deleting'`**: Filter the source word's letters, removing those whose indices are in `plan.deletions`.
        3.  **`phase: 'moving'`**: Render the remaining letters (the LCS members), but now sorted into their final target positions. This triggers the FLIP animation for re-ordering.
        4.  **`phase: 'inserting'`**: Render the final target word letters. This introduces the new letters from `plan.insertions` at their final positions, triggering the enter animation.
        5.  **`phase: 'final'`**: The animation is complete. The list of letters is the final target word.
*   **Animation Strategy:**
    *   Render letters as `<motion.span layout>` keyed by a stable identity.
    *   Wrap list in `<AnimatePresence>` for enter/exit.
    *   Variants keyed by `phase` control color and small transforms; rely on Framer Motion to handle FLIP reordering.
    *   Reduced motion: if user prefers reduced motion, collapse durations and minimize transforms.

### 5.4. Visual Design & Styling

All styling will adhere to the project's visual guidelines. Use Tailwind utility classes for speed and consistency.

*   **Style Guide Location:** `design_guidelines/styleguide.md`
*   **Color semantics:**
    *   Deletions = red (e.g., `text-red-500`)
    *   Insertions = green (e.g., `text-green-500`)
    *   Moves/true-movers = yellow (e.g., `text-yellow-500`)
*   **Reduced motion:** Respect OS setting. Collapse durations and avoid large movements when `prefers-reduced-motion` is enabled.

### 5.5. Core Algorithm Outline

The transformation logic resides within `computeEditPlan`. This function takes a source and target string and returns a structured plan for the animation. The process is as follows:

*   **Fast Paths:**
    *   If `source === target`, no animation is needed (no-op).
    *   If words are anagrams (same character counts), skip delete/insert phases and run only the move phase.

1.  **Find Longest Common Subsequence (LCS):**
    *   First, identify the characters that are common to both the source and target strings and appear in the same order. This is the stable "backbone" of the transformation.
    *   The `findLCSPositions` utility will be used for this, returning the indices of the LCS characters in both the source and target strings.

2.  **Identify Operations by Comparing to LCS:**
    *   **Deletions:** Any source index not in LCS → delete.
    *   **Insertions:** Any target index not in LCS → insert at that position.
    *   **Moves:** LCS-matched letters move from source index to target index.

3.  **Construct the Edit Plan (Return Shape):**
    *   `computeEditPlan(source, target)` returns:
        ```typescript
        export type EditPlan = {
          deletions: number[]; // indices in source to delete (sorted desc)
          insertions: { letter: string; position: number }[]; // sorted asc by position
          moves: { fromIndex: number; toIndex: number }[]; // for LCS letters, sorted by toIndex
          highlightIndices: number[]; // original source indices that are true movers
        };
        ```
    *   `highlightIndices` are mapped to the corresponding letter identity for yellow emphasis (see Guardrails).

## 6. Out of Scope (for this version)

The following features are explicitly out of scope to ensure focus on the core problem:

*   Server-side anything.
*   User accounts, saving/loading data.
*   Internationalization (i18n).
*   Advanced UI controls, themes, or settings.
*   A complex test suite. We will focus on manual testing first; minimal unit/smoke tests are allowed (see Section 10).
*   Storybook component library.
*   Performance optimization for extremely long words.

## 7. Acceptance Criteria

*   **Canonical scenarios pass end-to-end:**
    *   Anagram: `tasd → tads`
    *   Mixed ops: `tesd → tads`
*   **Final DOM text equals target** after animation.
*   **Stable identity preserved:** letters that move are not remounted; the same identity ends in the new position.
*   **Color semantics correct:** red for deletions, green for insertions, yellow for true movers.
*   **Reduced motion respected** when enabled.
*   **Character Scope:** Treat any character as an atomic symbol. v3 targets single-word, left-to-right inputs. Spaces and punctuation are allowed but not specially handled.

## 8. Guardrails (Agentic & Simplicity)

*   **One brain only:** Use React `useState` for `phase`; no XState or external state machines.
*   **Single sequencer:** `runAnimation()` is the only orchestrator; no nested orchestration.
*   **Stable identity for letters:**
    *   Each letter instance gets a durable `id` derived from its original index and occurrence (e.g., `src-<index>-<occurrence>`).
    *   When letters duplicate, pair LCS matches in left-to-right order (first occurrence to first match) to ensure stable, non-crossing mappings.
    *   Insertions get new ids; deletions remove by id; moves re-order by id.
    *   Keys for `<motion.span>` are these ids to enable FLIP and prevent remounts.
*   **Single source of truth for timings:** central `DURATIONS` used by both `delay()` and motion `transition` props to avoid drift.
*   **Concurrency guard:** disable controls while running; ignore/cancel overlapping runs.
*   **No deep component trees:** keep everything inside `WordUnscrambler` for v3.

## 9. Implementation Plan (Branch `v3`)

1. Create `v3` branch; remove legacy app files; scaffold minimal Vite + React TS + Tailwind, and install `framer-motion`.
2. Port `src/utils/lcs.ts` and `src/utils/editPlan.ts` with unchanged APIs.
3. Implement `src/components/WordUnscrambler.tsx` with state, `runAnimation`, and Framer Motion wiring.
4. Wire inputs + Animate button in `App.tsx`; disable during runs; optional Reset.
5. Manual verify two canonical scenarios; tune durations/colors.
6. Add minimal tests (see Section 10). Keep CI minimal (build + tests only).

## 10. Minimal Quality Gates

*   **Unit tests (2):** `computeEditPlan` for `tasd→tads` and `tesd→tads`.
*   **Component smoke (1):** mounts `WordUnscrambler`, runs animation, asserts final text equals target.
*   These are intentionally minimal; no Storybook/visual/E2E for v3.

## 11. Risks & Mitigations

*   **Race conditions / double-runs:** disable controls; guard in code.
*   **Timing drift:** use shared `DURATIONS` for `delay()` and motion transitions.
*   **Remounting on reorder:** enforce stable keys by durable ids.
*   **Overreach:** resist adding frameworks or abstractions; defer non-core features.
