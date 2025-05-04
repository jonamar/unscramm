Overview

Build an interactive “animated spellcheck” widget as a Next.js + TypeScript application. The AI implementer should produce a complete codebase that:
	•	Takes a user-entered misspelling and correct word
	•	Computes an edit plan (deletions, insertions, moves, true-mover highlights)
	•	Animates each phase using Framer Motion with exaggerated motion and color highlights
	•	Is structured for future extension (API-driven word pairs, i18n, RTL support)
	•	Includes clear unit, integration, and end-to-end tests

⸻

Tech Stack
	•	Framework: Next.js 14+ with React 18, TypeScript
	•	Animation: Framer Motion
	•	Styling: CSS Modules (Next.js built-in support)
	•	Internationalization Prep: JSON resource files under /src/i18n
	•	Testing:
	•	Unit & Component: Jest + React Testing Library
	•	E2E: Cypress (or Playwright)
	•	Visual Regression: Storybook Test Runner for snapshot comparison across animation states
	•	Code Quality: ESLint + Prettier + TypeScript strict mode

⸻

Project Layout

/src
  /components
    WordTransform.tsx
    Letter.tsx
    Controls.tsx
  /services
    wordService.ts
  /utils
    lcs.ts
    editPlan.ts
    flipUtils.ts
  /i18n
    en.json
  /styles
    WordTransform.module.css
    Controls.module.css
  /pages
    index.tsx
/tests
  /unit
    editPlan.test.ts
    lcs.test.ts
  /component
    WordTransform.test.tsx
  /e2e
    spellcheck.spec.ts
next.config.js
tsconfig.json
jest.config.js
cypress.config.ts
package.json



⸻

1. Word Service Interface

File: src/services/wordService.ts

export interface WordPair {
  misspelling: string;
  correct: string;
}

export interface WordPairService {
  /** Returns one random local pair today, later via API */
  getRandomPair(): Promise<WordPair>;
}

// v1 implementation: read from local JSON object
export class LocalWordPairService implements WordPairService {
  private dictionary: Record<string, string[]> = {/* … */};

  async getRandomPair(): Promise<WordPair> { /* … */ }
}


⸻

2. Core Algorithm Modules (Fully Expanded)

2.1. Find the Longest Common Subsequence (LCS)

Purpose: Identify which letters can stay “as is” in the same relative order between the misspelling and the correct word.

Function signature:

findLCSPositions(source: string[], target: string[])
  → {
      pairs: Array<[sourceIdx: number, targetIdx: number]>,
      sourceIndices: number[],
      targetIndices: number[]
    }

How it works (plain English):
	1.	Build a DP table dp[i][j] = length of LCS of source[0..i-1] and target[0..j-1].
	2.	Walk backwards from dp[m][n] to collect the matched pairs:
	•	If source[i-1] === target[j-1], that letter is part of the LCS: record [i-1, j-1], then i--, j--.
	•	Otherwise, move in the direction of the larger neighbor (dp[i-1][j] vs. dp[i][j-1]).
	3.	Return:
	•	pairs in ascending order of positions.
	•	sourceIndices = the set of source positions in those pairs.
	•	targetIndices = the set of target positions.

⸻

2.2. Compute the Edit Plan

Purpose: Turn the two words into a list of “delete here,” “insert that there,” and “move this from→to” operations, plus which letters really “break formation” and should be highlighted.

Function signature:

computeEditPlan(sourceWord: string, targetWord: string)
  → {
      deletions:    number[],               // indices in source to delete
      insertions:   { letter: string; position: number }[],
      moves:        { fromIndex: number; toIndex: number }[],
      highlightIndices: number[]            // true movers in source
    }

Step-by-step pseudocode:

function computeEditPlan(sourceWord, targetWord):
  source = sourceWord.split('')
  target = targetWord.split('')

  // 1. Find LCS matches
  matches = findLCSPositions(source, target)
  //   matches.pairs is [[sIdx,tIdx], ...]

  // 2. Deletions = any source index not in matches.sourceIndices
  deletions = []
  for i in 0 .. source.length-1:
    if i NOT IN matches.sourceIndices:
      deletions.push(i)
  sort deletions descending   // so removing right→left doesn’t shift later indices

  // 3. Insertions = any target index not in matches.targetIndices
  insertions = []
  for j in 0 .. target.length-1:
    if j NOT IN matches.targetIndices:
      insertions.push({ letter: target[j], position: j })
  sort insertions ascending   // so we always insert left→right

  // 4. Moves = any matched pair where sourceIdx ≠ targetIdx
  moves = []
  for each [sIdx, tIdx] in matches.pairs:
    if sIdx ≠ tIdx:
      moves.push({ fromIndex: sIdx, toIndex: tIdx })

  // 5. Highlight = “true movers” = those matched letters whose shift deviates
  highlightIndices = identifyTrueMovers(matches.pairs)

  return { deletions, insertions, moves, highlightIndices }



⸻

2.3. Identify “True Movers”

Purpose: Letters that “break formation” – i.e. their individual shift (targetIdx–sourceIdx) doesn’t match the most common bulk shift – get colored yellow and moved with extra exaggeration.

Function signature:

identifyTrueMovers(pairs: Array<[sourceIdx, targetIdx]>)
  → number[]           // list of sourceIdx to highlight

Plain-English Algorithm:
	1.	For each matched pair [sIdx, tIdx], compute shift = tIdx – sIdx.
	2.	Tally how many times each shift value appears; the one with highest count is the “bulk shift.”
	3.	Any letter whose shift ≠ bulk shift is a true mover → collect its sourceIdx.

Pseudocode:

function identifyTrueMovers(pairs):
  shiftCounts = map from shift→count
  for each [sIdx, tIdx] in pairs:
    shift = tIdx – sIdx
    shiftCounts[shift]++

  bulkShift = the shift with max count in shiftCounts

  highlight = []
  for each [sIdx, tIdx] in pairs:
    if (tIdx – sIdx) ≠ bulkShift:
      highlight.push(sIdx)

  return highlight



⸻

2.4. FLIP Reordering Helpers

Purpose: Smoothly animate DOM reordering by:
	1.	First: record each letter’s bounding box (getBoundingClientRect()).
	2.	Layout: reorder the DOM nodes into their final sequence.
	3.	Invert: immediately apply a transform that moves each letter back to its old position.
	4.	Play: remove the transform so they animate to translateX(0).

You’ll implement small utilities like:
	•	recordPositions(letters: HTMLElement[]) → { elm, left, top }[]
	•	applyInvertedTransforms(positions, newRects, exaggerationFactor)
	•	clearTransformsAfterReflow()


⸻

3. Components & Animation

A. <WordTransform>

File: src/components/WordTransform.tsx
	•	Props:

misspelling: string;
correct: string;
speed: number;          // e.g. 1.0
colorsEnabled: boolean;


	•	State: array of letter nodes & edit plan
	•	Behavior:
	1.	On mount or props change → split misspelling → render <Letter> list
	2.	Call computeEditPlan → sequence Framer Motion animations:
	•	removals: letters fade/scale out in red (CONFIG.colors.removed)
	•	insertions: letters fade/scale in in green (CONFIG.colors.added)
	•	moves: reordering with FLIP and exaggerated X offset ×1.5 in yellow (CONFIG.colors.moved)
	3.	After each phase, wait for animation completion before next

B. <Letter>

File: src/components/Letter.tsx
	•	Renders one <motion.span>
	•	Accepts props:

char: string;
type: 'initial' | 'removed' | 'added' | 'moved' | 'normal';
initialIndex?: number;


	•	Defines Framer Motion variants for each phase

C. <Controls>

File: src/components/Controls.tsx
	•	Inputs for custom misspelling & correct word
	•	“Shuffle” button calls WordPairService.getRandomPair()
	•	Play/Reset button toggles animation
	•	Speed slider updates CSS variables or React context

⸻

4. Styling (CSS Modules)
	•	Naming: camelCase in CSS file, imported as styles
	•	Files:
	•	WordTransform.module.css
	•	Controls.module.css
	•	CSS Variables (in :root via globals.css):

:root {
  --remove-duration: 0.4s;
  --add-duration:    0.3s;
  --reorder-duration:1.0s;
}



⸻

5. Internationalization Preparation
	•	Directory: src/i18n
	•	File: en.json

{
  "controls": {
    "play": "Animate",
    "shuffle": "Shuffle"
  },
  "placeholders": {
    "misspelling": "Enter misspelling",
    "correct": "Enter correct word"
  }
}


	•	Note: “Structure your strings in /src/i18n/en.json from the start to make the later transition trivial.”

⸻

6. Testing Strategy

Unit Tests
	•	Tools: Jest
	•	Coverage:
	•	computeEditPlan for multiple cases (additions, deletions, moves, anagrams)
	•	findLCSPositions correctness

Component Tests
	•	Tools: React Testing Library
	•	Cases:
	•	<WordTransform> renders correct number of <Letter> before/after animation
	•	Letters with true-mover indices render with yellow color

End-to-End Tests
	•	Tools: Cypress (or Playwright)
	•	Spec (/tests/e2e/spellcheck.spec.ts):

it('animates to correct word', () => {
  cy.visit('/');
  cy.get('#misspelling').type('recieve');
  cy.get('#correct').type('receive');
  cy.get('#controlBtn').click();
  cy.wait(1500); // enough for all phases
  cy.get('#wordContainer span').then($letters => {
    const text = $letters.map((i, el) => el.textContent).get().join('');
    expect(text).to.equal('receive');
  });
});