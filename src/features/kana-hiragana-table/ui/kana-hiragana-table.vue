<template>
  <div class="kana-table-container">
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Хирагана</h2>
    <!-- Таблица по колонкам -->
    <div class="overflow-x-hidden pb-4">
      <div class="w-full">
        <!-- Заголовки колонок -->
        <div class="flex gap-1 sm:gap-2 md:gap-3 mb-3 px-1 sm:px-2">
          <div
            v-for="vowel in ['a', 'i', 'u', 'e', 'o']"
            :key="vowel"
            class="flex-1 text-center text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400"
          >
            {{ vowel }}
          </div>
        </div>
        <!-- Группы строк с названиями -->
        <div class="space-y-3 sm:space-y-4">
          <div v-for="group in HIRAGANA_TABLE_ROWS" :key="group.name" class="kana-row-group">
            <!-- Название строки -->
            <div
              class="text-xs sm:text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2 ml-1 sm:ml-2 capitalize"
            >
              {{ group.name }}
            </div>
            <!-- Символы в колонках -->
            <div class="flex gap-1 sm:gap-2 md:gap-3">
              <div
                v-for="(symbol, vowelIndex) in group.symbols"
                :key="vowelIndex"
                class="kana-cell flex-1 aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 relative overflow-hidden min-w-[40px] sm:min-w-[50px] md:min-w-[64px]"
                :class="getCellClass(symbol)"
                @click="onKanaClick(symbol)"
                @touchstart="onTouchStart(symbol)"
                @touchend="onTouchEnd"
              >
                <!-- Фон ячейки -->
                <div class="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg"></div>
                <!-- Прогресс бар -->
                <div
                  v-if="symbol && progressMap[symbol] !== undefined"
                  class="absolute inset-0 pointer-events-none"
                >
                  <svg class="w-full h-full" viewBox="0 0 64 64">
                    <defs>
                      <linearGradient
                        :id="`progressGradient-${symbol}`"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          :stop-color="getProgressColor(progressMap[symbol]).start"
                        />
                        <stop
                          offset="100%"
                          :stop-color="getProgressColor(progressMap[symbol]).end"
                        />
                      </linearGradient>
                    </defs>
                    <!-- Фоновый круг -->
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="rgba(229, 231, 235, 0.4)"
                      stroke-width="3"
                    />
                    <!-- Прогресс -->
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      :stroke="`url(#progressGradient-${symbol})`"
                      stroke-width="3"
                      :stroke-dasharray="`${getProgressDashArray(progressMap[symbol])} 176`"
                      stroke-linecap="round"
                      transform="rotate(-90 32 32)"
                      class="transition-all duration-700 ease-out"
                    />
                  </svg>
                </div>
                <!-- Содержимое ячейки -->
                <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
                  <!-- Символ -->
                  <span class="text-lg sm:text-xl md:text-2xl font-medium mb-0.5">{{
                    symbol
                  }}</span>
                  <!-- Ромадзи -->
                  <span class="text-[10px] sm:text-xs md:text-sm opacity-80 font-normal">
                    {{ getRomaji(symbol) }}
                  </span>
                </div>
                <!-- Если символ не существует -->
                <div
                  v-if="!symbol"
                  class="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600"
                >
                  —
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Кнопка "Изучить" -->
    <div class="fixed bottom-4 sm:bottom-6 left-0 right-0 px-4 flex justify-center">
      <button
        class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-full shadow-md transform transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 w-full max-w-md"
        @click="startLesson"
      >
        <span>📚 Изучить</span>
        <span
          v-if="currentLessonSymbols.length > 0"
          class="text-xs bg-white/20 rounded-full px-2 py-0.5"
        >
          {{ currentLessonSymbols.length }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { HIRAGANA_GROUPS } from '@/entities/kana/model'
import type { Progress } from '@/entities/kana/model'

// Создаем таблицу с правильной структурой
const HIRAGANA_TABLE_ROWS = computed(() => {
  return [
    { name: 'a', symbols: ['あ', 'い', 'う', 'え', 'お'] },
    { name: 'ka', symbols: ['か', 'き', 'く', 'け', 'こ'] },
    { name: 'sa', symbols: ['さ', 'し', 'す', 'せ', 'そ'] },
    { name: 'ta', symbols: ['た', 'ち', 'つ', 'て', 'と'] },
    { name: 'na', symbols: ['な', 'に', 'ぬ', 'ね', 'の'] },
    { name: 'ha', symbols: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
    { name: 'ma', symbols: ['ま', 'み', 'む', 'め', 'も'] },
    { name: 'ya', symbols: ['や', null, 'ゆ', null, 'よ'] },
    { name: 'ra', symbols: ['ら', 'り', 'る', 'れ', 'ろ'] },
    { name: 'wa', symbols: ['わ', null, null, null, 'を'] },
    { name: 'n', symbols: [null, null, null, null, 'ん'] },
  ]
})

// Карта ромадзи
const ROMAJI_MAP: Record<string, string> = {
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  を: 'wo',
  ん: 'n',
}

// Прогресс пользователя
const localProgress = ref<Progress[]>([
  { entityId: 0, progress: 100, updatedAt: '2025-04-05T12:00:00Z' },
  { entityId: 1, progress: 80, updatedAt: '2025-04-05T12:05:00Z' },
  { entityId: 5, progress: 30, updatedAt: '2025-04-05T12:10:00Z' },
  { entityId: 10, progress: 15, updatedAt: '2025-04-04T10:00:00Z' },
  { entityId: 15, progress: 95, updatedAt: '2025-04-03T08:00:00Z' },
  { entityId: 2, progress: 60, updatedAt: '2025-04-02T09:00:00Z' },
  { entityId: 3, progress: 45, updatedAt: '2025-04-01T11:00:00Z' },
])

let pressTimer: number | null = null
const PRESS_DURATION = 500
const currentLessonSymbols = ref<string[]>([])

const progressMap = computed(() => {
  const map: Record<string, number> = {}
  localProgress.value.forEach((p) => {
    const symbol = getSymbolById(p.entityId)
    if (symbol) map[symbol] = p.progress
  })
  return map
})

function getRomaji(symbol: string | null): string {
  return symbol ? ROMAJI_MAP[symbol] || '' : ''
}

function getSymbolById(id: number): string | null {
  let count = 0
  for (const group of HIRAGANA_GROUPS) {
    for (const symbol of group.symbols) {
      if (count === id) return symbol
      count++
    }
  }
  return null
}

function getIdBySymbol(targetSymbol: string): number | null {
  let count = 0
  for (const group of HIRAGANA_GROUPS) {
    for (const symbol of group.symbols) {
      if (symbol === targetSymbol) return count
      count++
    }
  }
  return null
}

function getCellClass(symbol: string | null) {
  if (!symbol) return ''
  const progress = progressMap.value[symbol] ?? 0
  return progress === 0 ? 'opacity-70' : ''
}

function getProgressColor(progress: number) {
  if (progress < 30) return { start: '#ef4444', end: '#dc2626' }
  if (progress < 70) return { start: '#f59e0b', end: '#d97706' }
  return { start: '#10b981', end: '#059669' }
}

function getProgressDashArray(progress: number): string {
  return ((progress / 100) * 176).toFixed(2)
}

function onKanaClick(symbol: string | null) {
  if (!symbol || pressTimer) return
  console.log(`Clicked: ${symbol} (${getRomaji(symbol)})`)
}

function onTouchStart(symbol: string | null) {
  console.log('onTouchStart', symbol)
  if (!symbol) return
  pressTimer = window.setTimeout(() => {
    playSound(symbol)
    pressTimer = null
  }, PRESS_DURATION)
}

function onTouchEnd() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function playSound(romaji: string) {
  console.log('playSound', romaji)
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(romaji)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }
}

function selectLessonSymbols(): string[] {
  const allSymbols: string[] = []
  HIRAGANA_GROUPS.forEach((group) => {
    allSymbols.push(...group.symbols)
  })

  const symbolsToReview: string[] = []
  const symbolsInProgress: string[] = []
  const newSymbols: string[] = []

  allSymbols.forEach((symbol) => {
    const progress = progressMap.value[symbol] ?? 0
    const id = getIdBySymbol(symbol)

    if (id === null) return

    if (progress < 90 && progress > 0) {
      const progressItem = localProgress.value.find((p) => p.entityId === id)
      if (progressItem) {
        const hoursSinceUpdate =
          (Date.now() - new Date(progressItem.updatedAt).getTime()) / (1000 * 60 * 60)
        const hoursThreshold = Math.max(1, (100 - progress) / 10)

        if (hoursSinceUpdate >= hoursThreshold) {
          symbolsToReview.push(symbol)
        } else {
          symbolsInProgress.push(symbol)
        }
      }
    } else if (progress === 0) {
      newSymbols.push(symbol)
    }
  })

  const lessonSymbols: string[] = []
  lessonSymbols.push(...symbolsToReview.slice(0, 3))

  const remainingSlots = 5 - lessonSymbols.length
  if (remainingSlots > 0 && newSymbols.length > 0) {
    const canAddNew = symbolsInProgress.length === 0 && symbolsToReview.length === 0
    if (canAddNew || lessonSymbols.length === 0) {
      lessonSymbols.push(...newSymbols.slice(0, Math.min(remainingSlots, 2)))
    }
  }

  const finalRemainingSlots = 5 - lessonSymbols.length
  if (finalRemainingSlots > 0) {
    lessonSymbols.push(...symbolsInProgress.slice(0, finalRemainingSlots))
  }

  return lessonSymbols.slice(0, 5)
}

function startLesson() {
  const symbols = selectLessonSymbols()
  currentLessonSymbols.value = symbols
  console.log('Начинаем урок с символами:', symbols)
}

onMounted(() => {
  // await loadProgress();
})
</script>

<style scoped>
@reference 'tailwindcss';

.kana-table-container {
  @apply max-w-sm mx-auto px-2 sm:px-4 pb-24 sm:max-w-6/12;
}

.kana-cell {
  @apply transition-all duration-200;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 0;
}

.kana-cell:hover:not(.opacity-70) {
  @apply shadow-md transform -translate-y-0.5;
}

.kana-cell:active {
  @apply transform scale-95;
}

.kana-row-group {
  @apply mb-3 sm:mb-4 last:mb-0;
}

/* Темная тема */
.dark .kana-cell {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dark .kana-cell:hover:not(.opacity-70) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Анимация градиента для кнопки */
button {
  background-size: 200% auto;
  transition:
    background-position 0.5s ease,
    transform 0.2s ease;
}

button:hover {
  background-position: right center;
}

/* Скрытие скроллбара */
::-webkit-scrollbar {
  @apply hidden;
}
</style>
