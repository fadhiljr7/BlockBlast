import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Strict, not recommended: this site is the shop window for an
      // accessibility-first game, so an unlabelled control is a build failure.
      jsxA11y.flatConfigs.strict,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      // Pinned rather than 'detect': eslint-plugin-react's version sniffing
      // calls an ESLint 9 context API that ESLint 10 no longer provides, and
      // every rule that consults the React version crashes on the way in.
      react: { version: '19.2' },
    },
    rules: {
      // Positive tabindex reorders the tab sequence away from DOM order and is
      // never correct here.
      'jsx-a11y/tabindex-no-positive': 'error',
      'jsx-a11y/no-autofocus': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The prerender entry is a Node module, not a component file: it never
    // takes part in Fast Refresh, and exporting render functions beside it is
    // the entire point.
    files: ['src/entry-server.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
