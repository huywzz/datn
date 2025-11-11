module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
    semi: [2, 'always'],
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    'no-use-before-define': [
      'error',
      {
        functions: true,
        classes: true,
        variables: true,
        allowNamedExports: false,
      },
    ],
    'import/prefer-default-export': [0],
    'import/no-dynamic-require': [0],
    'no-underscore-dangle': ['off'],
    'no-console': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
