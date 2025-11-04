import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    // Aplica as regras a todos os arquivos JavaScript e JSX.
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }, // Habilita o parsing de JSX.
      },
    },
    // Adiciona plugins específicos para React.
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    // Define as regras que o ESLint vai aplicar.
    rules: {
      // Usa as regras recomendadas pelo ESLint e pelo plugin de hooks do React.
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Gera um erro para variáveis não utilizadas, exceto as que começam com letra maiúscula ou _.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Garante que o Fast Refresh do React funcione corretamente.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
