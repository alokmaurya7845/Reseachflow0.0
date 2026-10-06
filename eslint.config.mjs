import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { chrome: 'readonly', React: 'readonly', process: 'readonly', console: 'readonly' },
    },
    rules: { '@typescript-eslint/no-explicit-any': 'warn' },
  },
);
