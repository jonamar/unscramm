# Agent 1's perspective

Low hanging fruit  
1. **Single source of truth for phase necessity.** Extract a `derivePhaseRequirements(plan, source, target)` helper so phase skip logic lives alongside plan semantics instead of being duplicated inside the effect. Today the orchestrator hardcodes checks (e.g., `ctx.movingLetters.length > 0 && ctx.source !== ctx.target`) without documenting why, which keeps the mental model fragmented (@src/components/DiffVisualizer.tsx#301-318).  
2. **Align phase highlighting with plan fields.** Create a derived `movingIds` set from `plan.moves`/`highlightIndices` once, rather than recomputing inside `getLetterClass`. That eliminates repeated `plan.moves.some` scans per letter render and makes the visual contract explicit (@src/components/DiffVisualizer.tsx#365-382).  
3. **Document survivor prerequisites per phase.** Inline comments or a short block above each `perform*Phase` describing required inputs (e.g., “expects `movingLetters` sorted to target order from `computeSurvivorMapping`”) would surface the hidden dependencies you noted, keeping future edits predictable (@src/components/DiffVisualizer.tsx#93-193).  
4. **Clamp durations in one place.** Move the reduced-motion clamping (`prefersReduced ? 50 : undefined`) into the shared `DURATIONS` map or the `wait` helper so both delays and motion transitions can reuse it consistently (currently only `wait` applies the clamp, while motion spans use a hardcoded `0.25` scaled duration) (@src/components/DiffVisualizer.tsx#267-400).  

Medium effort obvious improvements  
1. **Redesign `EditPlan` to reflect animation phases.** Return explicit `survivors`, `movingOrder`, and `finalLetters` arrays from `computeEditPlan` so the renderer doesn’t have to re-derive `movingLetters` via `computeSurvivorMapping`. This collapses the “three different move concepts” into one canonical structure and lets the orchestrator ask “does the moving array differ from idle?” without bespoke mapping (@src/utils/editPlan.ts#50-126, @src/utils/survivorMapping.ts#32-67).  
2. **Introduce a lightweight phase state machine object.** Encapsulate transitions in a declarative array such as `const PHASES = [{ name:'idle', run: performIdlePhase, requires: ...}, …]`. Each item could expose `isRequired(planContext)` so the orchestrator simply iterates the list. That makes “phase execution vs necessity” explicit and reduces async sprawl inside `useEffect` (@src/components/DiffVisualizer.tsx#267-343).  
3. **Co-locate phase data derivation with the plan.** Move `computeSurvivorMapping` logic into `computeEditPlan`, outputting `targetToSourceMap` and `movingLetters` alongside `moves`. Consumers then receive one cohesive `PlanWithRenderData`, shrinking `DiffVisualizer`’s memo blocks and ensuring edits to survivor logic automatically propagate (@src/components/DiffVisualizer.tsx#236-247, @src/utils/survivorMapping.ts#32-67).  

Surprising improvements  
1. **Adopt an animation “script” object.** Instead of ad-hoc async awaits, build a script array like `[{phase:'deleting', letters, duration, metadata}, …]` where each entry is precomputed before animation begins. Rendering becomes a pure projection of the current script step, and debugging reduces to inspecting the script. This pattern makes the state machine observable, aligns with the PRD’s single-sequencer intent, and enables tooling (e.g., dumping the script for tests).  
2. **Use Framer Motion variants per phase with derived props only.** Rather than imperative phase functions, encode transitions inside motion variants keyed by `phase`, and drive timing through shared `DURATIONS`. The sequencer then only updates `phase` on a schedule while the view handles the rest declaratively. This would collapse the async mutation surface, bringing the architecture closer to the PRD’s “delegate animation to Framer Motion” guidance and dramatically shrinking the mental model (@docs/unscramm-v3-prd-spec.md#5.3).


-------------------------

# Agent 2's perspective

I'll start by gathering context from your documentation and codebase to formulate the best refactoring plan.

First, I'll read the provided guides and the core animation logic files.

I'll check `survivorMapping.ts` to understand how it handles survivor logic and if it overlaps with `editPlan`. This will help clarify the relationship between the diff description and the animation instructions.

I've analyzed the animation architecture and identified the root causes of the friction you're experiencing. The diagnosis was spot on: the "semantic distance" between the diff algorithm (what changed) and the animation steps (what to show) is too large.

Here is the remediation plan:

### 1. Low Hanging Fruit (Quick Fixes)

*   **Consolidate Survivor Logic**: [editPlan.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:0:0-0:0) calculates LCS pairs to find moves, and [survivorMapping.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/survivorMapping.ts:0:0-0:0) recalculates the *exact same thing* to find coordinates.
    *   **Fix**: Make `editPlan` return the `survivorPairs` it calculated. Delete [survivorMapping.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/survivorMapping.ts:0:0-0:0).
*   **Explicit Phase Triggers**: The visualizer currently guesses if it should run the moving phase (`survivors.length > 0 && source !== target`).
    *   **Fix**: Add explicit flags to the plan: `hasMovingPhase`, `hasDeletingPhase`, etc. This centralizes the decision logic in the pure function, not the UI component.
*   **Rename "Moves"**: The term `moves` in [EditPlan](cci:2://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:25:0-34:1) refers to "letters breaking monotonic order," but the "Moving Phase" animates *all* survivors.
    *   **Fix**: Rename `plan.moves` to `plan.outOfOrderIndices` or `plan.reorderingMoves` to disambiguate it from the phase itself.

### 2. Medium Effort (Obvious Improvements)

*   **The "Animation Plan" Abstraction**: Instead of just an [EditPlan](cci:2://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:25:0-34:1) (diff), generate an `AnimationPlan` that maps 1:1 to the visualizer's needs.
    *   **Fix**: Create a wrapper `computeAnimationSequence(source, target)` that returns:
        ```typescript
        {
          phases: {
            deleting: { items: LetterItem[], duration: 400 },
            moving: { items: LetterItem[], duration: 1000 },
            // ...
          }
        }
        ```
    *   This solves "State Transitions Buried in Async Functions" by making the states explicit data structures before animation even starts.

### 3. Surprising Improvements (Architectural Shift)

*   **"Keyframe" Architecture**:
    *   **Concept**: Stop thinking in "phases" and start thinking in "Keyframes." The [DiffVisualizer](cci:1://file:///Users/jonamar/Documents/unscramm/src/components/DiffVisualizer.tsx:194:0-409:1) shouldn't calculate state; it should just play a pre-computed storyboard.
    *   **Implementation**: Pre-calculate the exact [LetterItem[]](cci:2://file:///Users/jonamar/Documents/unscramm/src/components/DiffVisualizer.tsx:9:0-12:2) array for every step:
        1.  `Frame 0 (Idle)`: Source letters.
        2.  `Frame 1 (Post-Delete)`: Source letters minus deletions.
        3.  `Frame 2 (Post-Move)`: Survivors sorted to target positions.
        4.  `Frame 3 (Final)`: Target letters with insertions.
    *   **Benefit**: You can unit test the *entire animation sequence* without running the app. The React component becomes a dumb "Frame Player" with zero logic, just transitioning between these 4 arrays.

### Recommended Next Step

I recommend we start with the **Keyframe Architecture** (Surprising Improvement). It subsumes the other fixes and radically simplifies the mental model. It passes the "Agent Refactoring Guide" tests:
*   **Grep Test**: `grep "Frame 1"` shows exactly what the state is.
*   **15-Minute Human Test**: "The animation just plays these 4 arrays in order."
*   **Rollback Test**: Easy to revert to phase-based if needed.


-------------------------

# Agent 3's perspective

I'll analyze the animation architecture and provide actionable improvements. Let me start by examining the key documents and current implementation.

Now let me look at the survivor mapping utility to understand the full picture:

Perfect. Now I have a complete picture. Let me analyze the architecture against the diagnosis and the guiding principles.

# Animation Architecture Analysis

## Low Hanging Fruit (1-4 fixes)

### 1. **Unify the "move" concepts into a single source of truth**
**Problem**: `plan.moves`, `plan.highlightIndices`, and `movingLetters` are calculated by different algorithms.
**Fix**: Make [EditPlan](cci:2://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:25:0-34:1) the single authority. Remove duplicate logic in [survivorMapping.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/survivorMapping.ts:0:0-0:0) - the pairing algorithm is duplicated between [editPlan.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:0:0-0:0) (lines 89-103) and [survivorMapping.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/survivorMapping.ts:0:0-0:0) (lines 43-62). Compute pairs once in `editPlan`, export them, and derive everything else from that.

### 2. **Make phase skip conditions explicit in the plan**
**Problem**: Skip logic is scattered (lines 305, 311, 316 in DiffVisualizer).
**Fix**: Add boolean flags to [EditPlan](cci:2://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:25:0-34:1):
```typescript
interface EditPlan {
  // ... existing fields
  shouldDelete: boolean;
  shouldMove: boolean;
  shouldInsert: boolean;
}
```
Calculate these in [computeEditPlan](cci:1://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:36:0-125:1) based on the data, not in the orchestrator.

### 3. **Remove the confusing `deletingIds` state**
**Problem**: `deletingIds` is a separate piece of state that shadows information already in `plan.deletions`.
**Fix**: Derive it on-the-fly in [getLetterClass](cci:1://file:///Users/jonamar/Documents/unscramm/src/components/DiffVisualizer.tsx:364:2-383:4) from `plan.deletions` and current `phase`. No need to store it in state.

### 4. **Consolidate the duplicate pairing algorithms**
**Problem**: The greedy pairing logic exists in both [editPlan.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:0:0-0:0) (lines 89-103) and [survivorMapping.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/survivorMapping.ts:0:0-0:0) (lines 43-62).
**Fix**: Export `pairs` from [computeEditPlan](cci:1://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:36:0-125:1), use it directly in the component. Delete [survivorMapping.ts](cci:7://file:///Users/jonamar/Documents/unscramm/src/utils/survivorMapping.ts:0:0-0:0) entirely.

## Medium Effort Improvements (1-3)

### 1. **Make EditPlan output match animation needs**
**Problem**: The plan returns data structures that don't directly drive the animation.
**Fix**: Change [EditPlan](cci:2://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:25:0-34:1) to return renderable data:
```typescript
interface EditPlan {
  deletions: number[];
  insertions: Insertion[];
  // NEW: Pre-computed letter arrays for each phase
  idleLetters: LetterItem[];
  deletingLetters: LetterItem[];  // survivors only
  movingLetters: LetterItem[];    // survivors in target order
  insertingLetters: LetterItem[]; // final with insertions
  // Phase control
  shouldDelete: boolean;
  shouldMove: boolean;
  shouldInsert: boolean;
  // Styling hints
  trueMovers: Set<string>;  // letter ids to highlight yellow
}
```
This eliminates all the `useMemo` derivations in the component (lines 237-246).

### 2. **Extract phase execution into a declarative config**
**Problem**: Phase functions are imperative and hide the state machine.
**Fix**: Define phases as data:
```typescript
const PHASE_CONFIG = {
  deleting: {
    shouldRun: (plan) => plan.shouldDelete,
    getLetters: (plan) => plan.deletingLetters,
    duration: 400,
  },
  moving: {
    shouldRun: (plan) => plan.shouldMove,
    getLetters: (plan) => plan.movingLetters,
    duration: 1000,
  },
  // ...
};
```
Replace the manual phase functions with a generic executor that reads this config.

### 3. **Separate "what to render" from "how to animate"**
**Problem**: [getLetterClass](cci:1://file:///Users/jonamar/Documents/unscramm/src/components/DiffVisualizer.tsx:364:2-383:4) (lines 366-384) mixes phase logic with styling decisions.
**Fix**: Move styling hints into the plan itself:
```typescript
interface LetterItem {
  id: string;
  char: string;
  style: 'deletion' | 'insertion' | 'move' | 'normal';
}
```
The component just reads `item.style` without knowing about phases.

## Surprising Improvements (1-2)

### 1. **Invert control: Make phases pull their own data**
**Problem**: The orchestrator pushes data into phases via [AnimationContext](cci:2://file:///Users/jonamar/Documents/unscramm/src/components/DiffVisualizer.tsx:28:0-37:1).
**Surprising fix**: Make each phase a pure function that returns what to render:
```typescript
type PhaseRenderer = (plan: EditPlan) => {
  letters: LetterItem[];
  duration: number;
  shouldRun: boolean;
};

const phases: Record<Phase, PhaseRenderer> = {
  deleting: (plan) => ({
    letters: plan.deletingLetters,
    duration: DURATIONS.deleting,
    shouldRun: plan.shouldDelete,
  }),
  // ...
};
```
The orchestrator becomes a simple loop:
```typescript
for (const [phaseName, renderer] of Object.entries(phases)) {
  const { letters, duration, shouldRun } = renderer(plan);
  if (!shouldRun) continue;
  setState({ phase: phaseName, letters });
  await wait(duration);
}
```
This makes the entire animation system **data-driven and inspectable**.

### 2. **Make the plan testable by making it renderable**
**Problem**: You can't look at an [EditPlan](cci:2://file:///Users/jonamar/Documents/unscramm/src/utils/editPlan.ts:25:0-34:1) and predict what will animate.
**Surprising fix**: Add a `plan.preview()` method that returns a text representation:
```typescript
interface EditPlan {
  // ... existing fields
  preview(): string;
}

// Returns something like:
// "IDLE: 'tasd'
//  DELETE: 'tas' (removed 'd' at position 3)
//  MOVE: 'tads' (moved 's' from 2→3)
//  FINAL: 'tads'"
```
This makes debugging trivial - you can console.log the plan and see exactly what will happen. Even better: use this in tests to assert on animation behavior without running the animation.

---

## Summary

The **core insight** from your diagnosis is correct: there's too much semantic distance between concepts. The fixes follow a pattern:

1. **Low-hanging**: Remove duplication and make existing concepts explicit
2. **Medium**: Restructure data to match usage patterns
3. **Surprising**: Invert the architecture to make the plan the source of truth for *everything*

The most impactful change is #1 in "Surprising" - making phases data-driven. This would eliminate 90% of the opacity because you could literally print the phase config and see the entire state machine.