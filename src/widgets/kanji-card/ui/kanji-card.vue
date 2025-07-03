<script setup lang="ts">
import { ref } from 'vue'
import { DrawingBoard } from '@/features/draw-stroke'

// Координаты точек должны быть в относительных значениях (0-1)
// для корректной работы с разными размерами холста
const kanjiTemplate = ref({
  strokes: [
    {
      points: [
        { x: 0.25, y: 0.3 }, // Горизонтальная черта сверху
        { x: 0.75, y: 0.3 },
      ],
    },
    {
      points: [
        // Вертикальная черта посередине
        { x: 0.5, y: 0.15 },
        { x: 0.5, y: 0.85 },
      ],
    },
    {
      points: [
        // Левая наклонная черта
        { x: 0.5, y: 0.3 },
        { x: 0.45, y: 0.45 },
        { x: 0.3, y: 0.6 },
      ],
    },
    {
      points: [
        // Правая наклонная черта
        { x: 0.5, y: 0.3 },
        { x: 0.55, y: 0.45 },
        { x: 0.7, y: 0.6 },
      ],
    },
    {
      points: [
        // Горизонтальная черта снизу
        { x: 0.3, y: 0.7 },
        { x: 0.7, y: 0.7 },
      ],
    },
  ],
})
</script>

<template>
  <div class="kanji-card">
    <h2>Практика написания иероглифа</h2>
    <div class="drawing-container">
      <DrawingBoard :template="kanjiTemplate" class="drawing-board" />
    </div>
    <div class="instructions">
      <p>Нарисуйте иероглиф в правильном порядке штрихов</p>
    </div>
  </div>
</template>

<style scoped>
.kanji-card {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.drawing-container {
  margin: 20px auto;
  width: 100%;
  max-width: 500px;
}

.drawing-board {
  border: 2px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.instructions {
  margin-top: 20px;
  color: #666;
  font-size: 0.9rem;
}

h2 {
  color: #333;
  margin-bottom: 15px;
}
</style>
