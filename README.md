# Unscramm

An interactive "animated spellcheck" tool that shows the transformation from misspelled to correctly spelled words with animated character transitions.

This project is two things at once: 

1. An experiment in accessibly, and visually, unscrambling words that my dyslexic brain sometimes mixes up
2. An experiment in using rigerous project management techniques and best practices in modular, scalable development to build a complex project where an AI does all of the coding and code reviews. 

So far it's painstaking work but very informative. I've yet to produce a useable, bug free prototype but we're not at the end of the spec of plan yet so I'll keep my fingers crossed until then. Feel free to take a look inside the spec.md, the /scripts/phase_1-prd.md or the '/tasks' folder for a more detailed account of where this project is experimenting its way towards. 

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Initialize port configuration
npm run ports:init

# Start the development server
npm run dev

# Start Storybook for component development
npm run storybook
```

### Build & Production

```bash
# Build the application for production
npm run build

# Start the production server
npm run start

# Build Storybook as a static site
npm run build-storybook
```

### Port Management System

The project includes a port management system to prevent conflicts during development:

```bash
# Initialize port configuration
npm run ports:init

# View configured ports
npm run ports:list

# Check port availability
./scripts/check-and-run.sh 8000 "python -m http.server 8000"
```

Key features:
- Prevents port conflicts between services
- Provides helpful error messages when ports are in use
- Protects system-critical ports (Ollama, Open WebUI)
- Automatically suggests alternative ports

For detailed documentation, see [PORT_MANAGEMENT.md](PORT_MANAGEMENT.md).

### Performance Optimizations

The project uses filesystem caching to significantly improve build times:

- **Webpack5 Filesystem Cache**: Configured in `.storybook/main.ts` with a 14-day expiration
- **Cache Cleanup**: Run `npm run cache:clean` to manually clear caches
- **Recommended**: Set up a monthly cron job to automatically clean caches:

```bash
# Add to crontab (runs at 3am on the 1st of each month)
0 3 1 * * cd /path/to/unscramm && npm run cache:clean
```

To add this cron job on macOS/Linux:
1. Run `crontab -e` to edit crontab
2. Add the line above (update path to your project)
3. Save and exit

Benefits:
- 40-60% faster builds after initial compilation
- Managed cache growth (~200-300MB)

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

### Rebaselining Visual Snapshots

When intentional visual changes are made, snapshots need to be rebaselined:

1. **Make UI Changes**: Implement your visual changes in the component code
2. **Update the Snapshots**:
   ```bash
   npm run storybook:visual-test
   ```
3. **Verify New Snapshots**: 
   ```bash
   npm run storybook:test
   ```
   - All tests should pass with the updated snapshots
   - If failures persist, check for unintended visual regressions
4. **Commit the Changes**:
   ```bash
   git add __snapshots__/
   git commit -m "update: rebased visual snapshots for <component>"
   ```

**Important Note**: Always include snapshot changes in the same commit as the code changes that caused them, to maintain a clear connection between implementation and visual appearance.

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