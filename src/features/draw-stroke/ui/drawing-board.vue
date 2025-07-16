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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

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

const props = withDefaults(
  defineProps<{
    template: KanjiTemplate
    showHints?: boolean
    hintColor?: string
  }>(),
  {
    showHints: false,
    hintColor: 'rgba(34,246,237,0.52)',
  },
)

const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

let isDrawing = false
let currentStroke: Point[] = []
const userStrokes: Point[][] = []
const currentHintIndex = ref(0)

const brushStyle = {
  color: '#000',
  width: 10,
  lineCap: 'round' as CanvasLineCap,
}

// Преобразование относительных координат в абсолютные
function toAbsolute(point: Point): Point {
  if (!canvas.value) return point
  return {
    x: point.x * canvas.value.width,
    y: point.y * canvas.value.height,
  }
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
  drawBackground()
}

function drawSmoothStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  style: {
    color: string
    width: number
    lineCap: CanvasLineCap
    dashed?: boolean
  },
) {
  if (points.length < 2) return

  const absPoints = points.map(toAbsolute)

  ctx.save()
  ctx.strokeStyle = style.color
  ctx.lineWidth = style.width
  ctx.lineCap = style.lineCap
  if (style.dashed) {
    ctx.setLineDash([5, 10])
  } else {
    ctx.setLineDash([])
  }

  ctx.beginPath()
  ctx.moveTo(absPoints[0].x, absPoints[0].y)

  for (let i = 1; i < absPoints.length - 1; i++) {
    const midX = (absPoints[i].x + absPoints[i + 1].x) / 2
    const midY = (absPoints[i].y + absPoints[i + 1].y) / 2

    ctx.quadraticCurveTo(absPoints[i].x, absPoints[i].y, midX, midY)
  }

  ctx.lineTo(absPoints[absPoints.length - 1].x, absPoints[absPoints.length - 1].y)
  ctx.stroke()
  ctx.restore()
}

function drawHint(stroke: Stroke) {
  if (!ctx || !canvas.value || !props.showHints) return

  const points = stroke.points
  if (points.length < 2) return

  // Рисуем пунктирную линию вдоль всего штриха
  drawSmoothStroke(ctx, points, {
    color: props.hintColor,
    width: brushStyle.width / 2,
    lineCap: 'round',
    dashed: true,
  })

  // Рисуем стрелку в начале штриха
  const p1 = toAbsolute(points[0])
  const p2 = toAbsolute(points[1])

  // Направление стрелки
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const angle = Math.atan2(dy, dx)

  // Размеры стрелки
  const arrowLength = canvas.value.width * 0.08

  ctx.save()
  ctx.strokeStyle = props.hintColor
  ctx.fillStyle = props.hintColor
  ctx.lineWidth = 3

  // Линия стрелки (короткая)
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p1.x + dx * 0.2, p1.y + dy * 0.2)
  ctx.stroke()

  // Голова стрелки
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(
    p1.x - arrowLength * Math.cos(angle - Math.PI / 3),
    p1.y - arrowLength * Math.sin(angle - Math.PI / 10),
  )

  ctx.lineTo(
    p1.x - arrowLength * Math.cos(angle + Math.PI / 3),
    p1.y - arrowLength * Math.sin(angle + Math.PI / 10),
  )
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function drawBackground() {
  if (!ctx || !canvas.value) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Рисуем фоновый иероглиф
  ctx.strokeStyle = '#000'
  ctx.globalAlpha = 0.2
  ctx.lineWidth = brushStyle.width
  ctx.lineCap = 'round'

  for (const stroke of props.template.strokes) {
    drawSmoothStroke(ctx, stroke.points, {
      color: '#000',
      width: brushStyle.width,
      lineCap: 'round',
    })
  }

  // Рисуем уже выполненные пользователем штрихи
  ctx.globalAlpha = 1
  for (const stroke of userStrokes) {
    drawSmoothStroke(ctx, stroke, {
      color: '#3a9f3a',
      width: brushStyle.width,
      lineCap: 'round',
    })
  }

  // Рисуем текущий штрих
  if (currentStroke.length > 1) {
    drawSmoothStroke(ctx, currentStroke, {
      color: '#000',
      width: brushStyle.width,
      lineCap: 'round',
    })
  }

  // Рисуем подсказку для текущего штриха
  if (props.showHints && currentHintIndex.value < props.template.strokes.length) {
    drawHint(props.template.strokes[currentHintIndex.value])
  }

  ctx.globalAlpha = 1
}

// Остальные функции остаются без изменений (getRelativePosition, startDrawing, draw, endDrawing, etc.)

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
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  }
}

function startDrawing(e: MouseEvent | TouchEvent) {
  const pos = getRelativePosition(e)
  isDrawing = true
  currentStroke = [pos]
  drawBackground()
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing || !ctx) return

  const pos = getRelativePosition(e)
  currentStroke.push(pos)
  drawBackground()
}

function endDrawing() {
  if (!isDrawing) {
    isDrawing = false
    return
  }
  isDrawing = false

  const expectedIndex = userStrokes.length
  if (expectedIndex >= props.template.strokes.length) return

  const expectedStroke = props.template.strokes[expectedIndex]

  if (isStrokeCorrect(currentStroke, expectedStroke.points)) {
    currentStroke = []
    animateFeedback(expectedStroke.points)
    userStrokes.push([...expectedStroke.points])

    // Переходим к следующей подсказке
    if (props.showHints) {
      currentHintIndex.value = userStrokes.length
    }
  } else {
    currentStroke = []
    drawBackground()
  }
}

function distance(p1: Point, p2: Point): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

function getPathLength(points: Point[]): number {
  let length = 0
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i])
  }
  return length
}

function normalizePoints(points: Point[], targetLength: number): Point[] {
  if (!points.length || targetLength <= 0) return []

  const result: Point[] = []
  const totalLength = getPathLength(points)

  let currentSegmentIndex = 0
  let accumulatedLength = 0

  const stepLength = totalLength / (targetLength - 1)

  result.push(points[0])

  for (let i = 1; i < targetLength - 1; i++) {
    const targetDistance = i * stepLength

    while (
      currentSegmentIndex + 1 < points.length &&
      accumulatedLength + distance(points[currentSegmentIndex], points[currentSegmentIndex + 1]) <
        targetDistance
    ) {
      accumulatedLength += distance(points[currentSegmentIndex], points[currentSegmentIndex + 1])
      currentSegmentIndex++
    }

    const p0 = points[currentSegmentIndex]
    const p1 = points[currentSegmentIndex + 1] || p0

    const segmentProgress = (targetDistance - accumulatedLength) / distance(p0, p1)

    result.push({
      x: p0.x + (p1.x - p0.x) * segmentProgress,
      y: p0.y + (p1.y - p0.y) * segmentProgress,
    })
  }

  result.push(points[points.length - 1])
  return result
}

function isStrokeCorrect(userPoints: Point[], targetPoints: Point[]): boolean {
  if (userPoints.length < 2 || targetPoints.length < 2) return false

  const startThreshold = 0.07
  const endThreshold = 0.07

  const startDist = distance(userPoints[0], targetPoints[0])
  const endDist = distance(userPoints[userPoints.length - 1], targetPoints[targetPoints.length - 1])

  if (startDist > startThreshold || endDist > endThreshold) {
    return false
  }

  const normalizedUser = normalizePoints(userPoints, 20)
  const normalizedTarget = normalizePoints(targetPoints, 20)

  const directionValid = checkDirection(normalizedUser, normalizedTarget)
  if (!directionValid) return false

  const shapeValid = checkShape(normalizedUser, normalizedTarget)
  if (!shapeValid) return false

  const { maxDeviation, avgDeviation } = calculateDeviations(normalizedUser, normalizedTarget)

  const MAX_DEVIATION = 0.08
  const AVG_DEVIATION = 0.05

  return maxDeviation <= MAX_DEVIATION && avgDeviation <= AVG_DEVIATION
}

function checkDirection(userPoints: Point[], targetPoints: Point[]): boolean {
  const midIndex = Math.floor(userPoints.length / 2)

  const userVectors = [
    { x: userPoints[midIndex].x - userPoints[0].x, y: userPoints[midIndex].y - userPoints[0].y },
    {
      x: userPoints[userPoints.length - 1].x - userPoints[midIndex].x,
      y: userPoints[userPoints.length - 1].y - userPoints[midIndex].y,
    },
  ]

  const targetVectors = [
    {
      x: targetPoints[midIndex].x - targetPoints[0].x,
      y: targetPoints[midIndex].y - targetPoints[0].y,
    },
    {
      x: targetPoints[targetPoints.length - 1].x - targetPoints[midIndex].x,
      y: targetPoints[targetPoints.length - 1].y - targetPoints[midIndex].y,
    },
  ]

  const dot1 = userVectors[0].x * targetVectors[0].x + userVectors[0].y * targetVectors[0].y
  const dot2 = userVectors[1].x * targetVectors[1].x + userVectors[1].y * targetVectors[1].y

  const magUser1 = Math.sqrt(userVectors[0].x ** 2 + userVectors[0].y ** 2)
  const magTarget1 = Math.sqrt(targetVectors[0].x ** 2 + targetVectors[0].y ** 2)
  const magUser2 = Math.sqrt(userVectors[1].x ** 2 + userVectors[1].y ** 2)
  const magTarget2 = Math.sqrt(targetVectors[1].x ** 2 + targetVectors[1].y ** 2)

  const angle1 = Math.acos(dot1 / (magUser1 * magTarget1 + 1e-8))
  const angle2 = Math.acos(dot2 / (magUser2 * magTarget2 + 1e-8))

  return angle1 < Math.PI / 3 && angle2 < Math.PI / 3
}

function checkShape(userPoints: Point[], targetPoints: Point[]): boolean {
  if (targetPoints.length <= 2) {
    return checkStraightLine(userPoints)
  }

  const userKeyPoints = getKeyPoints(userPoints)
  const targetKeyPoints = getKeyPoints(targetPoints)

  if (userKeyPoints.length !== targetKeyPoints.length) {
    return false
  }

  for (let i = 0; i < userKeyPoints.length; i++) {
    const dist = distance(userKeyPoints[i], targetKeyPoints[i])
    if (dist > 0.6) {
      return false
    }
  }

  return true
}

function getKeyPoints(points: Point[]): Point[] {
  if (points.length < 3) return [...points]

  const curvatures: { index: number; value: number }[] = []

  for (let i = 1; i < points.length - 1; i++) {
    const curvature = calculateCurvature(points[i - 1], points[i], points[i + 1])
    curvatures.push({ index: i, value: curvature })
  }

  curvatures.sort((a, b) => b.value - a.value)

  const keyPointCount = Math.min(3, curvatures.length)
  const keyPoints = curvatures
    .slice(0, keyPointCount)
    .sort((a, b) => a.index - b.index)
    .map((item) => points[item.index])

  return [points[0], ...keyPoints, points[points.length - 1]]
}

function calculateCurvature(p1: Point, p2: Point, p3: Point): number {
  const dx1 = p2.x - p1.x
  const dy1 = p2.y - p1.y
  const dx2 = p3.x - p2.x
  const dy2 = p3.y - p2.y

  const cross = dx1 * dy2 - dy1 * dx2
  const len1 = Math.hypot(dx1, dy1)
  const len2 = Math.hypot(dx2, dy2)

  return Math.abs(cross) / (len1 * len2 + 1e-8)
}

function checkStraightLine(points: Point[]): boolean {
  if (points.length < 3) return true

  const start = points[0]
  const end = points[points.length - 1]
  const lineLength = distance(start, end)

  if (lineLength < 0.01) return true

  let maxDeviation = 0
  for (let i = 1; i < points.length - 1; i++) {
    const dev = distanceToLine(points[i], start, end)
    maxDeviation = Math.max(maxDeviation, dev)
  }

  return maxDeviation / lineLength < 0.08
}

function calculateDeviations(userPoints: Point[], targetPoints: Point[]) {
  let maxDeviation = 0
  let totalDeviation = 0

  for (let i = 0; i < userPoints.length; i++) {
    const dist = distance(userPoints[i], targetPoints[i])
    maxDeviation = Math.max(maxDeviation, dist)
    totalDeviation += dist
  }

  return {
    maxDeviation,
    avgDeviation: totalDeviation / userPoints.length,
  }
}

function distanceToLine(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x
  const B = point.y - lineStart.y
  const C = lineEnd.x - lineStart.x
  const D = lineEnd.y - lineStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  const param = lenSq !== 0 ? dot / lenSq : -1

  let xx, yy

  if (param < 0) {
    xx = lineStart.x
    yy = lineStart.y
  } else if (param > 1) {
    xx = lineEnd.x
    yy = lineEnd.y
  } else {
    xx = lineStart.x + param * C
    yy = lineStart.y + param * D
  }

  return Math.hypot(point.x - xx, point.y - yy)
}

function animateFeedback(points: Point[]) {
  if (!ctx || !canvas.value) return

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = canvas.value.width
  tempCanvas.height = canvas.value.height

  let progress = 0
  const totalPoints = points.length
  const animationSpeed = 2

  const animate = () => {
    if (progress >= totalPoints) {
      drawBackground()
      return
    }

    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.strokeStyle = '#3a9f3a'
    tempCtx.lineWidth = brushStyle.width + 5
    tempCtx.lineCap = 'round'

    const visiblePoints = points.slice(0, progress + 1)
    if (visiblePoints.length > 1) {
      drawSmoothStroke(tempCtx, visiblePoints, {
        color: '#3a9f3a',
        width: brushStyle.width + 5,
        lineCap: 'round',
      })
    }

    ctx!.clearRect(0, 0, canvas.value!.width, canvas.value!.height)
    drawBackground()
    ctx!.drawImage(tempCanvas, 0, 0)

    progress += animationSpeed
    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}

function startDrawingTouch(e: TouchEvent) {
  e.preventDefault()
  startDrawing(e)
}

function drawTouch(e: TouchEvent) {
  e.preventDefault()
  draw(e)
}

function resetDrawing() {
  currentStroke = []
  userStrokes.length = 0
  currentHintIndex.value = 0
  drawBackground()
}

defineExpose({
  resetDrawing,
})

watch(
  () => props.showHints,
  (newVal) => {
    if (newVal) {
      currentHintIndex.value = userStrokes.length
    }
    drawBackground()
  },
)

onMounted(async () => {
  window.addEventListener('resize', initCanvas)
  initCanvas()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', initCanvas)
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
