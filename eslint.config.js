import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser, // Keep browser globals as before
        process: 'readonly', // Add process as a readonly global
        Buffer: "readonly",
      },
    },
  },
  pluginJs.configs.recommended,
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/src/tests/**'],
  },
];
