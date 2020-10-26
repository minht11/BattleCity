module.exports = {
  extends:  [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions:  {
    ecmaVersion:  2020,
    sourceType:  'module',
    project: 'tsconfig.json',
  },
  rules: {
    'import/no-cycle': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/semi': [2, 'never'],
    '@typescript-eslint/indent': ['off', 2],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'comma',
      },
      singleline: {
        delimiter: 'comma',
      },
    }],
    'no-restricted-syntax': 'off',
  },
  env: {
    browser: true,
  },
  ignorePatterns: [
    'src/**/*.css',
    'src/**/*.json',
    'src/**/*.html',
    'src/assets/',
    'node_modules/',
    'rollup-plugins/',
    'rollup.config.js',
  ]
}
