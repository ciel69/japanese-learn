<template>
  <div class="drawing-board" ref="container">
    <canvas
      ref="canvas"
      class="drawing-canvas"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="endDrawing"
      @mouseleave="endDrawing"
      @touchstart="startDrawingTouch"
      @touchmove="drawTouch"
      @touchend="endDrawing"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Типы
interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
}

interface KanjiTemplate {
  strokes: Stroke[]
}

// Props
const props = defineProps<{
  template: KanjiTemplate
}>()

// Refs
const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

let isDrawing = false
let currentStroke: Point[] = []
const userStrokes: Point[][] = []

// Настройки
const brushStyle = {
  color: '#000',
  width: 4,
  lineCap: 'round' as CanvasLineCap,
}

function initCanvas() {
  if (!canvas.value || !container.value) return

  const rect = container.value.getBoundingClientRect()
  canvas.value.width = rect.width
  canvas.value.height = rect.width // квадратный холст

  ctx = canvas.value.getContext('2d')
  if (!ctx) return

  ctx.lineWidth = brushStyle.width
  ctx.lineCap = brushStyle.lineCap
}

function drawSmoothStroke(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2

    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
  }

  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  ctx.stroke()
}

function drawBackground() {
  if (!ctx || !canvas.value) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  ctx.strokeStyle = '#000'
  ctx.globalAlpha = 0.2
  ctx.lineWidth = brushStyle.width
  ctx.lineCap = 'round'

  for (const stroke of props.template.strokes) {
    drawSmoothStroke(ctx, stroke.points)
  }

  ctx.globalAlpha = 1
}

function getRelativePosition(e: MouseEvent | TouchEvent): Point {
  if (!canvas.value) return { x: 0, y: 0 }

  const rect = canvas.value.getBoundingClientRect()
  let clientX = 0
  let clientY = 0

  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if ('clientX' in e && 'clientY' in e) {
    clientX = e.clientX
    clientY = e.clientY
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

function startDrawing(e: MouseEvent) {
  if (!ctx) return

  const pos = getRelativePosition(e)
  isDrawing = true
  currentStroke = [pos]

  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

function draw(e: MouseEvent) {
  if (!isDrawing || !ctx) return

  ctx.strokeStyle = '#000'

  const pos = getRelativePosition(e)
  currentStroke.push(pos)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

function endDrawing() {
  if (!isDrawing || !ctx) {
    isDrawing = false
    return
  }
  isDrawing = false
  ctx.closePath()

  const expectedIndex = userStrokes.length
  if (expectedIndex >= props.template.strokes.length) return

  const expectedStroke = props.template.strokes[expectedIndex]

  if (isStrokeCorrect(currentStroke, expectedStroke.points)) {
    animateFeedback() // запускаем анимацию эталонного штриха
    currentStroke = [] // очищаем текущий штрих
  } else {
    redrawAllButLast() // стираем только пользовательский штрих
  }
}
function distance(p1: Point, p2: Point): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

function normalizePoints(points: Point[], targetLength: number): Point[] {
  const result: Point[] = []
  const step = (points.length - 1) / (targetLength - 1)

  for (let i = 0; i < targetLength; i++) {
    const index = Math.round(i * step)
    result.push(points[index] || points[points.length - 1])
  }

  return result
}

function isStrokeCorrect(userPoints: Point[], targetPoints: Point[]): boolean {
  if (!userPoints.length || !targetPoints.length) return false

  // Если количество точек сильно отличается, нормализуем их количество
  const normalizedUser = normalizePoints(userPoints, targetPoints.length)

  let totalDistance = 0
  for (let i = 0; i < targetPoints.length; i++) {
    const d = distance(normalizedUser[i], targetPoints[i])
    totalDistance += d
  }

  const averageDistance = totalDistance / targetPoints.length

  console.log('Average Distance:', averageDistance)

  // Порог: настройте под себя
  const maxAllowedDistance = 25

  return averageDistance <= maxAllowedDistance
}

function redrawCanvas() {
  if (!ctx || !canvas.value) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  drawBackground() // фоновые эталонные штрихи (серые/полупрозрачные)

  // Рисуем все успешные штрихи
  for (const stroke of userStrokes) {
    ctx.strokeStyle = '#00ff00' // зелёный цвет для успешных штрихов
    drawSmoothStroke(ctx, stroke)
  }

  // Рисуем текущий штрих пользователя (чёрный)
  if (currentStroke.length > 1) {
    ctx.strokeStyle = '#000'
    ctx.beginPath()
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y)
    for (let i = 1; i < currentStroke.length; i++) {
      ctx.lineTo(currentStroke[i].x, currentStroke[i].y)
    }
    ctx.stroke()
  }
}

function redrawAllButLast() {
  if (!ctx || !canvas.value) return

  // Стираем только текущий пользовательский штрих
  currentStroke = []

  // Перерисовываем всё, кроме успешных зелёных штрихов
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  drawBackground()

  // Рисуем успешные штрихи
  for (const stroke of userStrokes) {
    ctx.strokeStyle = '#00ff00'
    drawSmoothStroke(ctx, stroke)
  }
}

function animateFeedback() {
  if (!ctx || !canvas.value) return

  const expectedIndex = userStrokes.length
  if (expectedIndex >= props.template.strokes.length) return

  const targetStroke = props.template.strokes[expectedIndex]
  const points = targetStroke.points

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')

  tempCanvas.width = canvas.value.width
  tempCanvas.height = canvas.value.height

  if (!tempCtx) return

  tempCtx.strokeStyle = '#00ff00'
  tempCtx.lineWidth = 6
  tempCtx.lineCap = 'round'

  let currentPointIndex = 1

  const drawDashLine = () => {
    if (!ctx || !canvas.value) return
    if (currentPointIndex > points.length) {
      // Сохраняем эталонный штрих как успешный
      userStrokes.push([...points])
      redrawCanvas() // обновляем всё, оставляя зелёные штрихи
      return
    }

    // Очистка временного канваса
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.beginPath()

    // Рисуем часть штриха с плавным скруглением
    tempCtx.moveTo(points[0].x, points[0].y)

    for (let i = 1; i < currentPointIndex && i < points.length; i++) {
      const midX = (points[i].x + points[Math.min(i + 1, points.length - 1)].x) / 2
      const midY = (points[i].y + points[Math.min(i + 1, points.length - 1)].y) / 2

      tempCtx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
    }

    // Если дошли до конца — дорисуем финальную точку
    if (currentPointIndex === points.length) {
      tempCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
    }

    tempCtx.stroke()

    // Перерисовываем основной холст
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    drawBackground() // фоновые штрихи полупрозрачные

    // Рисуем уже пройденные штрихи (зелёные)
    ctx.strokeStyle = '#00ff00'
    for (const stroke of userStrokes) {
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let j = 1; j < stroke.length - 1; j++) {
        const midX = (stroke[j].x + stroke[j + 1].x) / 2
        const midY = (stroke[j].y + stroke[j + 1].y) / 2

        ctx.quadraticCurveTo(stroke[j].x, stroke[j].y, midX, midY)
      }
      if (stroke.length > 1) {
        ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y)
      }
      ctx.stroke()
    }

    // Рисуем текущую анимацию
    ctx.drawImage(tempCanvas, 0, 0)

    currentPointIndex++
    requestAnimationFrame(drawDashLine)
  }

  requestAnimationFrame(drawDashLine)
}

function startDrawingTouch(e: TouchEvent) {
  e.preventDefault()
  startDrawing(e as unknown as MouseEvent)
}

function drawTouch(e: TouchEvent) {
  e.preventDefault()
  draw(e as unknown as MouseEvent)
}

onMounted(() => {
  window.addEventListener('resize', initCanvas)
  initCanvas()
  drawBackground()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', initCanvas)
  endDrawing()
})
</script>

<style scoped>
.drawing-board {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.drawing-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  touch-action: none;
}
</style>
