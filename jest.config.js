import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './' /** path to next.config.js and .env files in your test environment */,
});

/**
 * Configuration passed directly to Jest.
 *
 * @type {import('jest').Config}
 */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['<rootDir>/jest.setup.js'],

  setupFilesAfterEnv: ['@testing-library/jest-dom', '@testing-library/react'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
