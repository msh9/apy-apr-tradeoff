import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginLit from 'eslint-plugin-lit';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  eslintPluginImport.flatConfigs.recommended,
  prettierConfig,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2023,
      },
    },
    plugins: {
      lit: eslintPluginLit,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/named': 'off',
      'import/no-unresolved': 'off',
      'lit/no-duplicate-template-bindings': 'error',
      'lit/no-invalid-html': 'error',
      'prettier/prettier': 'error',
    },
  },
];
