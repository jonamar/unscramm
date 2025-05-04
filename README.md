# Unscramm

An interactive "animated spellcheck" widget that shows the transformation from misspelled to correctly spelled words with animated character transitions.

## Testing Setup

The project uses Jest for unit and component testing with the following configuration:

### Running Tests

```bash
# Run all tests
npm test

# Run tests with watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

- `tests/unit/`: Unit tests for utility functions and algorithms
- `tests/component/`: React component tests using Testing Library
- `tests/e2e/`: End-to-end tests using Cypress or Playwright
- `tests/utils/`: Shared test utilities and helpers

### Testing Conventions

The project follows these testing conventions:

- **Unit/Component Tests**: Jest + React Testing Library for DOM structure, state transitions, and ARIA attribute verification
- **Visual Regression**: Storybook + `@storybook/experimental-addon-test` for visual snapshot testing of all component states
- **Local "CI"**: Husky Git hooks that run linting, unit tests, and Storybook tests automatically

To update Storybook visual snapshots after intentional changes:
```bash
npm run storybook:test -- -u
```

For component tests, rely on `data-testid="letter"` and `data-state` attributes for stable selectors.

### Git Hooks Workflow

The project uses a two-stage Git hooks workflow to balance fast feedback with thorough validation:

1. **Pre-Commit Hook (Fast Feedback)**:
   - Uses lint-staged to run ESLint only on changed files
   - Automatically fixes simple linting issues
   - Provides immediate quality feedback without disrupting workflow
   - Fast enough to run on every commit

2. **Pre-Push Hook (Thorough Validation)**:
   - Runs full Storybook visual test suite
   - Uses parallel test execution (`--maxWorkers=50%`) for optimal performance
   - Catches visual regressions before code is shared
   - Only runs when pushing code

**Bypassing Hooks:**
- For pre-commit: `git commit --no-verify`
- For pre-push: `git push --no-verify`

**Configuration Files:**
- `.husky/pre-commit`: Runs lint-staged
- `.husky/pre-push`: Runs Storybook tests
- `package.json`: Contains lint-staged configuration

### Visual Testing Workflow

The project uses Storybook Test Runner for visual testing with the following workflow:

1. **Snapshot Creation**: Initial snapshots are created with:
   ```bash
   npm run storybook:visual-test
   ```
   This starts the Storybook server and runs the test runner in update mode.

2. **Regular Testing**: Regular visual tests run with:
   ```bash
   npm run storybook:test
   ```
   This uses parallel test execution (50% of available CPU cores) for up to 40% faster testing on modern machines.

3. **Automated Pre-Push Validation**: Husky pre-push hooks automatically run visual tests before code is pushed to the repository:
   - Prevents visual regressions from being shared
   - Uses parallel execution for faster validation
   - Can be bypassed with `git push --no-verify` when needed

4. **Reduced Motion Tests**: Special test cases verify proper behavior when users have prefers-reduced-motion enabled.

### Animation Testing

The testing setup includes special utilities for testing animations:

- CSS variables from styleguide are automatically set in the test environment
- Helper functions for working with animations and transitions
- Mock DOM elements and positioning for FLIP animation testing

### Key Testing Files

- `jest.config.js`: Main Jest configuration
- `tsconfig.jest.json`: TypeScript configuration for tests
- `tests/setup.ts`: Global setup for test environment
- `tests/utils/testHelpers.ts`: Shared testing utilities
- `.husky/pre-commit`: Git hook for linting on commit
- `.husky/pre-push`: Git hook for automated visual testing
- `.storybook/test-runner.js`: Visual test configuration 