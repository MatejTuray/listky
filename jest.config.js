module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'handlers/**/*.{js,ts}',
    '!**/**/*.{spec,test,fixture}.ts',
    '!**/node_modules/**',
  ],
};
