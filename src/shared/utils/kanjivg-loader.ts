const svhPath = import.meta.env.PROD ? '/japanese-learn' : ''
const KANJI_BASE_URL = `${svhPath}/kanjivg/kanjivg-master/kanji`

export async function loadKanjiSvg(character: string) {
  try {
    const codePoint = character.codePointAt(0)?.toString(16).padStart(5, '0')
    const response = await fetch(`${KANJI_BASE_URL}/${codePoint}.svg`)
    if (!response.ok) throw new Error('Kanji not found')

    return await response.text()
  } catch (error) {
    console.error(`Failed to load KanjiVG data for ${character}:`, error)
    return null
  }
}

export async function loadKanjiData(character: string) {
  try {
    const svgText = await loadKanjiSvg(character)
    if (svgText) {
      return parseKanjiSvg(svgText)
    }
    return null
  } catch (error) {
    console.error(`Failed to load KanjiVG data for ${character}:`, error)
    return null
  }
}

function normalizePoints(points: Point[], width: number, height: number): Point[] {
  return points.map((p) => ({
    x: p.x / width,
    y: p.y / height,
  }))
}

interface Point {
  x: number
  y: number
}

function parseArgs(str: string): number[] {
  return str
    .trim()
    .replace(/([+-]?[\d\.]+)/g, '$1,')
    .split(',')
    .filter(Boolean)
    .map(Number)
}

function parsePathD(d: string): Point[] {
  const points: Point[] = []
  let currentX = 0
  let currentY = 0

  // Разбиваем путь на отдельные команды
  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || []

  for (const cmd of commands) {
    const type = cmd[0]
    const args = parseArgs(cmd.slice(1))

    if (type === 'M') {
      // MoveTo - абсолютная точка
      currentX = args[0]
      currentY = args[1]
      points.push({ x: currentX, y: currentY })
    } else if (type === 'L') {
      // LineTo - абсолютная точка
      currentX = args[0]
      currentY = args[1]
      points.push({ x: currentX, y: currentY })
    } else if (type === 'H') {
      // Горизонтальная линия
      currentX = args[0]
      points.push({ x: currentX, y: currentY })
    } else if (type === 'V') {
      // Вертикальная линия
      currentY = args[0]
      points.push({ x: currentX, y: currentY })
    } else if (type === 'Q') {
      // Квадратичная кривая Безье (абсолютные координаты)
      const x1 = args[0],
        y1 = args[1]
      const x = args[2],
        y = args[3]

      for (let i = 0; i <= 30; i++) {
        const t = i / 30
        const xq = (1 - t) ** 2 * currentX + 2 * t * (1 - t) * x1 + t ** 2 * x
        const yq = (1 - t) ** 2 * currentY + 2 * t * (1 - t) * y1 + t ** 2 * y
        points.push({ x: xq, y: yq })
      }

      currentX = x
      currentY = y
    } else if (type === 'q') {
      // Относительная квадратичная кривая Безье
      const dx1 = args[0],
        dy1 = args[1]
      const dx = args[2],
        dy = args[3]

      const x1 = currentX + dx1
      const y1 = currentY + dy1
      const x = currentX + dx
      const y = currentY + dy

      for (let i = 0; i <= 30; i++) {
        const t = i / 30
        const xq = (1 - t) ** 2 * currentX + 2 * t * (1 - t) * x1 + t ** 2 * x
        const yq = (1 - t) ** 2 * currentY + 2 * t * (1 - t) * y1 + t ** 2 * y
        points.push({ x: xq, y: yq })
      }

      currentX = x
      currentY = y
    } else if (type === 'C') {
      // Кубическая кривая Безье (абсолютные координаты)
      const x1 = args[0],
        y1 = args[1]
      const x2 = args[2],
        y2 = args[3]
      const x = args[4],
        y = args[5]

      for (let i = 0; i <= 30; i++) {
        const t = i / 30
        const xq =
          currentX * (1 - t) ** 3 +
          3 * x1 * t * (1 - t) ** 2 +
          3 * x2 * t ** 2 * (1 - t) +
          x * t ** 3

        const yq =
          currentY * (1 - t) ** 3 +
          3 * y1 * t * (1 - t) ** 2 +
          3 * y2 * t ** 2 * (1 - t) +
          y * t ** 3

        points.push({ x: xq, y: yq })
      }

      currentX = x
      currentY = y
    } else if (type === 'c') {
      // Относительная кубическая кривая Безье
      const dx1 = args[0],
        dy1 = args[1]
      const dx2 = args[2],
        dy2 = args[3]
      const dx = args[4],
        dy = args[5]

      const x1 = currentX + dx1
      const y1 = currentY + dy1
      const x2 = currentX + dx2
      const y2 = currentY + dy2
      const x = currentX + dx
      const y = currentY + dy

      for (let i = 0; i <= 30; i++) {
        const t = i / 30
        const xq =
          currentX * (1 - t) ** 3 +
          3 * x1 * t * (1 - t) ** 2 +
          3 * x2 * t ** 2 * (1 - t) +
          x * t ** 3

        const yq =
          currentY * (1 - t) ** 3 +
          3 * y1 * t * (1 - t) ** 2 +
          3 * y2 * t ** 2 * (1 - t) +
          y * t ** 3

        points.push({ x: xq, y: yq })
      }

      currentX = x
      currentY = y
    }
  }

  return points.length > 0 ? points : [{ x: 0, y: 0 }]
}

export function getPathLength(d: string): number {
  if (!d) return 0

  // Создаем временный SVG элемент для точного расчета длины
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.style.position = 'absolute'
  svg.style.visibility = 'hidden'
  svg.style.width = '0'
  svg.style.height = '0'

  const path = document.createElementNS(svgNS, 'path')
  path.setAttribute('d', d)

  svg.appendChild(path)
  document.body.appendChild(svg)

  let length = 0
  try {
    // Используем встроенный метод getTotalLength() для точного расчета
    length = path.getTotalLength()
  } catch (e) {
    console.error('Error calculating path length:', e)
    // Фолбэк: приблизительный расчет на основе количества команд
    length = d.length * 0.3
  }

  document.body.removeChild(svg)
  return length
}

export function getPathKanjiSvg(svgText: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')

  // Извлекаем и сортируем штрихи по порядку рисования
  return Array.from(doc.querySelectorAll('path[id*="-s"]')).sort((a, b) => {
    const aNum = parseInt(a.id.match(/-s(\d+)/)?.[1] || '0', 10)
    const bNum = parseInt(b.id.match(/-s(\d+)/)?.[1] || '0', 10)
    return aNum - bNum
  })
}

export function parseKanjiSvg(svgText: string) {
  // Извлекаем и сортируем штрихи по порядку рисования
  const strokePaths = getPathKanjiSvg(svgText)
  const strokes: Point[][] = []

  strokePaths.forEach((path) => {
    const pathData = path.getAttribute('d')
    if (pathData) {
      const points = parsePathD(pathData)
      const normalizePoint = normalizePoints(points, 109, 109)
      strokes.push(normalizePoint)
    }
  })

  return strokes
}
