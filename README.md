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