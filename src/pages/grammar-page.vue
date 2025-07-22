<template>
  <GrammarExercise :task="currentTask" @complete="handleComplete" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GrammarExercise } from '@/features/grammar-exercise'

type Task = {
  type: 'particle-choice' | 'fill-in-the-blank'
  sentence: string
  options?: string[]
  correctAnswer: string | string[]
}

const currentTask = ref<Task>({
  type: 'particle-choice',
  sentence: '彼は ___ 本 ___ 読みました。',
  options: ['は', 'を', 'が', 'に'],
  correctAnswer: ['は', 'を'],
})

const handleComplete = () => {
  alert('Задание выполнено правильно!')
}
</script>
