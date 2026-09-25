import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'off',
      // A ratchet, not a target: the largest function today (the argument parser) is 39.
      // New code must not exceed it, and the limit should only go down. The "modified"
      // variant counts a switch once, so per-criterion evaluators aren't penalised for
      // having one case per criterion.
      complexity: ['error', { max: 40, variant: 'modified' }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        // Object keys often mirror external formats (JSON APIs, config files).
        { selector: ['objectLiteralProperty', 'typeProperty'], format: null },
        { selector: 'import', format: null },
      ],
    },
  },
);
