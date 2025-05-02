/**
 * Jest configuration for unscramm project
 * @type {import('jest').Config}
 */
export default {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  
  // Set up test environment for DOM testing
  testEnvironment: 'jsdom',
  
  // Increase timeout for tests (useful for animation tests)
  testTimeout: 10000,
  
  // Configure module name mapping to match tsconfig paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Set up test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',
  ],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Configure coverage reporting
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
        useESM: true,
      },
    ],
  },
  
  // Enable ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Ignore specific directories
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/temp-next/',
  ],
  
  // Simplify module resolution for test files
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>'],
} 