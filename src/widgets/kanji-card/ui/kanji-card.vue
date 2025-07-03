<script setup lang="ts">
import { DrawingBoard } from '@/features/draw-stroke'
const kanjiTemplate = {
  width: 512,
  height: 512,
  strokes: [
    {
      points: [
        { x: 100, y: 150 },
        { x: 400, y: 150 },
      ],
    },
    {
      points: [
        { x: 250, y: 80 },
        { x: 250, y: 420 },
      ],
    },
    {
      points: [
        { x: 250, y: 150 },
        { x: 220, y: 230 },
        { x: 150, y: 300 },
      ],
    },
    {
      points: [
        { x: 250, y: 150 },
        { x: 280, y: 230 },
        { x: 350, y: 300 },
      ],
    },
    {
      points: [
        { x: 150, y: 350 },
        { x: 350, y: 350 },
      ],
    },
  ],
}
</script>

<template>
  <div>
    <div>kanji-card</div>
    <DrawingBoard :template="kanjiTemplate" />
  </div>
</template>

<style scoped></style>
