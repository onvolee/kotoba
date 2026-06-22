# Use Vitest for first-version tests

Kotoba will use Vitest as the required first-version test runner for pure logic, storage adapters, the IndexedDB history repository, translation service behavior, and Zustand workspace state. Vitest can run fast TypeScript tests and DOM-oriented tests with a simulated browser environment, which is enough for the first implementation layer. Full browser extension end-to-end tests are not a first-version hard dependency; they can be added later as a small Playwright smoke suite once the workspace UI and extension packaging exist.
