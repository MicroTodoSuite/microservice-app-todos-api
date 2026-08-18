// Jest config (spec 006 / T010). Coverage denominator is the business logic
// (todoController.js); server.js is bootstrap/wiring and excluded per research
// D2. The 70% threshold is enforced here so the unit gate fails on regression.
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['todoController.js'],
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: {
    global: { statements: 70, branches: 70, functions: 70, lines: 70 },
  },
};
