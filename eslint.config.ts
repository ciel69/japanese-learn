import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// Для проверки импортов
import importPlugin from 'eslint-plugin-import';

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  skipFormatting,
  // Добавляем правила импорта
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-relative-parent-imports': 'warn',
      'import/no-cycle': ['error', { maxDepth: 5 }],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/pages',
              message: 'Нельзя импортировать из страниц.',
            },
            {
              name: '@/app',
              message: 'Нельзя импортировать из app.',
            },
          ],
          patterns: [
            '../app/*',
            '../pages/*',
            '../entities/*',
            '../features/*',
            '../widgets/*',
            '../shared/lib/utils/*',
          ],
        },
      ],
    }
  }
)
