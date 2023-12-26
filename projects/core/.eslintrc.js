module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    //"eslint:recommended",
    //'plugin:@typescript-eslint/recommended',
  ],

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', "file-extension-in-import-ts"],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    "file-extension-in-import-ts/file-extension-in-import-ts": "error"
  },
}
