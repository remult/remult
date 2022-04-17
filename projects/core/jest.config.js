/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: "(.*).backend-spec.ts",
  globals: {
    'ts-jest': {
      tsconfig: 'projects/core/tsconfig.backend-spec.json'
    }
  }
};