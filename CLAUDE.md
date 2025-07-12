# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Workflow
```bash
# Start development server (with port management)
npm run dev

# Run Storybook for component development
npm run storybook

# Build for production
npm run build
```

### Testing Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run visual regression tests
npm run storybook:test

# Update visual snapshots after intentional changes
npm run storybook:test -- -u
```

### Quality Assurance
```bash
# Lint code
npm run lint

# Clean build/cache files
npm run cache:clean
```

### Port Management
The project uses a custom port management system to prevent conflicts:
```bash
# Initialize port configuration
npm run ports:init

# Check configured ports
npm run ports:list

# Check port availability
npm run ports:check
```

### Task Management (Task Master CLI)
```bash
# List all project tasks
task-master list

# Show next recommended task
task-master next

# View specific task details
task-master show <id>

# Set task status
task-master set-status --id=<id> --status=<status>
```

## High-Level Architecture

### Word Transformation Pipeline
The core algorithm transforms misspelled words through a sophisticated multi-step process:

1. **LCS Analysis** (`src/utils/lcs.ts`): Uses dynamic programming to find the Longest Common Subsequence between source and target words, identifying which letters can remain in place
2. **Edit Planning** (`src/utils/editPlan.ts`): Builds on LCS results to create deletion, insertion, and movement operations, plus identifies "true movers" (letters that break formation)
3. **Animation Orchestration**: Custom state machine drives phase-based animations (delete → move → insert → complete)

### Component Architecture
- **WordTransform**: Master orchestrator managing the state machine and coordinating all animations
- **SourceLetters/TargetLetters**: Phase-specific rendering components (source for deletion/movement, target for insertion/completion)
- **Letter**: Atomic component with rich animation states (normal, deletion, insertion, movement, true-mover, exiting)
- **Controls**: User interaction layer for word input, playback control, and settings

### State Management Pattern
Uses a custom reducer-based state machine (not XState) with:
- **Phase-driven rendering**: Components conditionally render based on animation phase
- **Animation counting**: Ref-based counters track completion of animations within each phase
- **Smart phase skipping**: Automatically skips empty phases (e.g., no deletions needed)
- **Consecutive empty phase handling**: Prevents UI flicker when multiple phases are empty

### Animation System
- **Framer Motion integration** with custom variants for each letter state
- **FLIP utilities** available in `src/utils/flipUtils.ts` (currently unused but maintained for potential future use)
- **Motion preferences**: Automatic reduced-motion support via CSS and component-level detection
- **True mover highlighting**: Special visual treatment (yellow → orange) for letters that deviate from bulk movement patterns

### Testing Strategy
- **Component isolation**: Mock Framer Motion and complex dependencies to test logic
- **Data attribute targeting**: Extensive use of `data-testid` and `data-state` for stable test selectors
- **Animation testing**: Mock animation completion callbacks to test state transitions
- **Visual regression**: Storybook Test Runner captures snapshots across all component states

## Key Architectural Decisions

### Custom State Machine Choice
Replaced XState with a lightweight custom reducer for:
- Smaller bundle size
- Simpler debugging
- Easier testing without complex mocking
- Full control over transition logic

### True Mover Algorithm
Unique innovation that identifies letters whose movement breaks the common shift pattern:
- Calculates shift distances for all matching letters
- Identifies the most common "bulk shift"
- Highlights outliers as "true movers" with enhanced visual treatment
- Helps users understand which letter movements are key to the correction

### Phase-Based Component Rendering
Different components render in different animation phases:
- **SourceLetters**: Active during deletion and movement phases
- **TargetLetters**: Active during insertion and completion phases
- Enables clean separation of concerns and optimized rendering

### Service Layer Pattern
Implements `WordPairService` interface with current `LocalWordPairService` implementation, designed for future API integration while maintaining consistent interface.

## Development Notes

### Port Configuration
The project includes a sophisticated port management system that:
- Prevents conflicts with system services (Ollama, Open WebUI)
- Provides helpful error messages when ports are occupied
- Automatically suggests alternative ports
- Protects critical development ports

### Performance Optimizations
- Extensive use of `React.memo`, `useMemo`, and `useCallback`
- GPU acceleration via CSS transforms and `will-change` properties
- Tree-shaking friendly imports
- Webpack5 filesystem caching with 14-day expiration

### Accessibility Implementation
- Full WCAG compliance with ARIA state announcements
- Multiple layers of reduced motion support (CSS + JS + component-level)
- Keyboard navigation with proper focus management
- Color contrast meeting AAA standards with text shadows

### Testing Patterns
When working with animations:
- Mock `framer-motion` imports in test files
- Use `data-testid="letter"` and `data-state` attributes for targeting
- Mock animation completion callbacks to test state machine transitions
- Use fake timers for deterministic animation testing

### Task Management Integration
This project uses Task Master CLI for structured development. Always check `task-master next` to see recommended next tasks and respect the dependency chain when implementing features.