<template>
  <div class="grammar-exercise">
    <div class="sentence-container">
      <!-- Отображение предложения с пустыми местами -->
      <div class="sentence">
        <span v-for="(part, index) in displayParts" :key="index">
          <!-- Режим выбора частиц -->
          <span
            v-if="part === '___' && task.type === 'particle-choice'"
            class="blank-slot"
            @click="removeParticle(index)"
          >
            {{ filledBlanks[getBlankIndex(index)] || '___' }}
          </span>

          <!-- Режим ручного ввода -->
          <input
            v-else-if="part === '___' && task.type === 'fill-in-the-blank'"
            v-model="filledBlanks[getBlankIndex(index)]"
            class="blank-input"
            placeholder="?"
            @keyup.enter="checkAnswer"
          />

          <!-- Обычная часть предложения -->
          <span
            v-else
            class="word"
            v-tooltip="{
              content: () => getWordTranslation(part),
              triggers: ['click'],
              loadingContent: 'Please wait...',
              autoHide: true,
            }"
          >
            {{ part }}
          </span>
        </span>
      </div>

      <!-- Варианты частиц для выбора -->
      <div
        class="particle-options"
        v-if="task.type === 'particle-choice' && availableParticles.length > 0"
      >
        <div
          v-for="(particle, idx) in availableParticles"
          :key="idx"
          class="particle-option"
          @click="selectParticle(particle)"
        >
          {{ particle }}
        </div>
      </div>
    </div>

    <!-- Кнопка проверки -->
    <button
      class="check-button"
      @click="checkAnswer"
      :disabled="!isComplete"
      :class="{ disabled: !isComplete }"
    >
      Проверить
    </button>

    <!-- Результат проверки -->
    <div v-if="showFeedback" class="feedback">
      <p v-if="isAnswerCorrect" class="correct">✅ Правильно!</p>
      <p v-else class="incorrect">❌ Неправильно. Правильный ответ: {{ correctAnswerDisplay }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

type Props = {
  type: 'particle-choice' | 'fill-in-the-blank'
  sentence: string
  options?: string[]
  correctAnswer: string | string[]
  vocabulary?: Record<string, string> // Новое поле для словаря
}

const props = defineProps<{
  task: Props
}>()

const emit = defineEmits(['complete'])

// Состояние компонента
const sentenceParts = ref<string[]>([])
const displayParts = ref<string[]>([])
const filledBlanks = ref<(string | null)[]>([])
const selectedParticles = ref<string[]>([])
const showFeedback = ref(false)
const isAnswerCorrect = ref(false)

// Разбиваем предложение на части
const splitSentence = () => {
  const parts = []
  let lastIndex = 0
  let match

  // Находим все пропуски
  while ((match = props.task.sentence.indexOf('___', lastIndex)) !== -1) {
    parts.push(props.task.sentence.slice(lastIndex, match))
    parts.push('___')
    lastIndex = match + 3
  }

  // Добавляем оставшуюся часть предложения
  parts.push(props.task.sentence.slice(lastIndex))

  sentenceParts.value = parts
  displayParts.value = [...parts]
  filledBlanks.value = new Array(parts.filter((p) => p === '___').length).fill(null)
}

// Получаем перевод слова
// todo тут будет запрос к бэку за переводом
const getWordTranslation = (word: string) => {
  word = word.replace('。', '')
  if (!props.task.vocabulary) return 'Нет перевода'
  return props.task.vocabulary[word.trim().toLowerCase()] || 'Нет перевода'
}

// Доступные частицы для выбора (только для particle-choice)
const availableParticles = computed(() => {
  if (props.task.type !== 'particle-choice') return []
  return props.task.options?.filter((opt: string) => !selectedParticles.value.includes(opt)) || []
})

// Проверяем, заполнены ли все пропуски
const isComplete = computed(() => {
  return filledBlanks.value.every((part) => part !== null && part.trim() !== '')
})

// Отображаем правильный ответ
const correctAnswerDisplay = computed(() => {
  if (Array.isArray(props.task.correctAnswer)) {
    return props.task.correctAnswer.join(', ')
  }
  return props.task.correctAnswer
})

// Получаем индекс пропуска
const getBlankIndex = (index: number) => {
  return displayParts.value.slice(0, index).filter((p) => p === '___').length
}

// Выбираем частицу (только для particle-choice)
const selectParticle = (particle: string) => {
  if (props.task.type !== 'particle-choice') return

  const firstEmptyIndex = filledBlanks.value.findIndex((p) => p === null)
  if (firstEmptyIndex !== -1) {
    filledBlanks.value[firstEmptyIndex] = particle
    selectedParticles.value.push(particle)
  }
}

// Удаляем частицу (только для particle-choice)
const removeParticle = (index: number) => {
  if (props.task.type !== 'particle-choice' || displayParts.value[index] !== '___') return

  const blankIndex = getBlankIndex(index)
  if (filledBlanks.value[blankIndex]) {
    const particle = filledBlanks.value[blankIndex]
    filledBlanks.value[blankIndex] = null
    selectedParticles.value = selectedParticles.value.filter((p) => p !== particle)
  }
}

// Проверяем ответ
const checkAnswer = () => {
  let userAnswer
  let correct

  if (props.task.type === 'particle-choice') {
    userAnswer = filledBlanks.value.join(',')
    if (Array.isArray(props.task.correctAnswer)) {
      correct = props.task.correctAnswer.join(',') === userAnswer
    } else {
      correct = props.task.correctAnswer === filledBlanks.value[0]
    }
  } else {
    // Для fill-in-the-blank сравниваем каждый ответ отдельно
    if (Array.isArray(props.task.correctAnswer)) {
      correct = filledBlanks.value.every(
        (answer, i) =>
          answer?.toLowerCase().trim() === props.task.correctAnswer[i]?.toLowerCase().trim(),
      )
    } else {
      correct =
        filledBlanks.value[0]?.toLowerCase().trim() ===
        props.task.correctAnswer.toLowerCase().trim()
    }
  }

  isAnswerCorrect.value = correct
  showFeedback.value = true

  if (correct) {
    emit('complete')
  }
}

// Сбрасываем состояние при изменении задания
watch(
  () => props.task,
  () => {
    splitSentence()
    filledBlanks.value = []
    selectedParticles.value = []
    showFeedback.value = false
    isAnswerCorrect.value = false
  },
  { deep: true },
)

// Инициализация
onMounted(() => {
  splitSentence()
})
</script>

<style scoped>
.grammar-exercise {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.sentence-container {
  margin-bottom: 20px;
}

.sentence {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  cursor: default;
  color: #333;
}

.word {
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s;
  padding: 2px 4px;
  border-radius: 3px;
}

.word:hover {
  background-color: #f0f0f0;
}

.word-tooltip {
  position: absolute;
  background-color: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9rem;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  transform: translateX(-50%);
}

.word-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

.blank-slot {
  display: inline-block;
  min-width: 60px;
  padding: 5px 10px;
  margin: 0 3px;
  border-bottom: 2px dashed #aaa;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.blank-slot:hover {
  background-color: #f0f0f0;
}

.blank-input {
  width: 50px;
  padding: 5px;
  margin: 0 3px;
  border: none;
  border-bottom: 2px solid #aaa;
  text-align: center;
  font-size: 1.1rem;
  outline: none;
}

.blank-input:focus {
  border-bottom-color: #4caf50;
}

.particle-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

.particle-option {
  padding: 8px 15px;
  background-color: #e9ecef;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  color: #333;
}

.particle-option:hover {
  background-color: #dee2e6;
  transform: translateY(-2px);
}

.check-button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
  display: block;
  margin: 0 auto;
}

.check-button:hover:not(.disabled) {
  background-color: #45a049;
}

.check-button.disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.feedback {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.correct {
  color: #155724;
  background-color: #d4edda;
}

.incorrect {
  color: #721c24;
  background-color: #f8d7da;
}
</style>
