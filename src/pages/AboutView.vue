<template>
  <div
    class="min-h-screen flex flex-col"
    :class="darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'"
  >
    <!-- Header -->
    <header
      class="p-4 flex justify-between items-center border-b"
      :class="darkMode ? 'border-gray-700' : 'border-gray-200'"
    >
      <div class="flex items-center space-x-2">
        <div
          class="w-8 h-8 rounded-full"
          :class="darkMode ? 'bg-indigo-600' : 'bg-indigo-500'"
        ></div>
        <h1 class="font-bold text-xl">日本語学習</h1>
      </div>
      <button
        @click="toggleTheme"
        class="p-2 rounded-full"
        :class="darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'"
      >
        <MoonIcon v-if="darkMode" class="h-5 w-5" />
        <SunIcon v-else class="h-5 w-5" />
      </button>
    </header>

    <!-- Main Content - Learning Map -->
    <main class="flex-1 overflow-hidden relative">
      <div class="absolute inset-0 overflow-auto p-4">
        <div class="relative" :style="{ height: `${mapHeight}px`, width: '100%' }">
          <!-- SVG Container -->
          <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <!-- Smooth Path -->
            <path
              :d="pathData"
              fill="none"
              :stroke="darkMode ? 'rgba(79, 70, 229, 0.3)' : 'rgba(99, 102, 241, 0.3)'"
              stroke-width="15"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Nodes -->
            <g
              v-for="node in nodes"
              :key="node.id"
              @click="onNodeClick(node)"
              @mouseenter="hoveredNodeId = node.id"
              @mouseleave="hoveredNodeId = null"
              style="cursor: pointer"
            >
              <circle
                class="node-circle"
                :cx="node.svg.x"
                :cy="node.svg.y"
                :r="getNodeRadius(node)"
                :fill="getNodeFillColor(node)"
                :stroke="darkMode ? '#0f172a' : '#ffffff'"
                :stroke-width="node.nodeType === 'group' ? 3 : 1.5"
              />

              <!-- Icon -->
              <foreignObject
                v-if="node.icon"
                :x="node.svg.x - (node.nodeType === 'group' ? 12 : 10.5)"
                :y="node.svg.y - (node.nodeType === 'group' ? 12 : 10.5)"
                :width="node.nodeType === 'group' ? 24 : 21"
                :height="node.nodeType === 'group' ? 24 : 21"
                style="pointer-events: none"
              >
                <div class="w-full h-full flex items-center justify-center">
                  <component
                    :is="node.icon"
                    :class="node.nodeType === 'group' ? 'h-5 w-5' : 'h-4 w-4'"
                    :stroke="darkMode ? '#ffffff' : '#ffffff'"
                  />
                </div>
              </foreignObject>

              <!-- Label -->
              <text
                :x="node.svg.x"
                :y="node.nodeType === 'lesson' ? node.svg.y + 28 : node.svg.y + 36"
                text-anchor="middle"
                :font-size="node.nodeType === 'lesson' ? '11' : '12'"
                :font-weight="node.nodeType === 'lesson' ? 'normal' : '600'"
                :fill="
                  darkMode
                    ? node.nodeType === 'lesson'
                      ? '#D1D5DB'
                      : '#EDE9FE'
                    : node.nodeType === 'lesson'
                      ? '#374151'
                      : '#3730A3'
                "
                style="pointer-events: none"
              >
                {{ node.title }}
              </text>
            </g>
          </svg>

          <!-- Popup -->
          <div
            v-if="activePopupNode && activePopupNode.nodeType === 'lesson'"
            ref="popupRef"
            class="absolute z-50 w-72 bg-gray-800 text-white p-4 rounded-2xl shadow-lg border border-gray-700"
            :style="{
              left: `calc(${activePopupNode.position.x}% - 144px)`,
              top: `${activePopupNode.position.y + 4}%`,
              transform: activePopupNode.position.x < 50 ? 'translateX(0)' : 'translateX(-100%)',
            }"
            @mouseenter="keepPopupOpen = true"
            @mouseleave="handlePopupLeave(activePopupNode.id)"
          >
            <h3 class="font-semibold text-lg mb-1">{{ activePopupNode.title }}</h3>
            <p class="text-sm text-gray-300 mb-3">{{ activePopupNode.description }}</p>
            <div class="flex gap-3">
              <button
                class="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-md text-sm"
                @click="startLesson(activePopupNode)"
              >
                練習
              </button>
              <button
                class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-md text-sm"
                @click="openTheory(activePopupNode)"
              >
                理論
              </button>
            </div>
            <button
              class="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-sm"
              @click="activePopup = null"
            >
              ✖
            </button>
            <div
              class="absolute left-1/2 transform -translate-x-1/2 -bottom-3 w-0 h-0"
              :style="{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid ' + (darkMode ? '#1F2937' : '#ffffff'),
              }"
            ></div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Navigation -->
    <nav
      class="border-t p-2"
      :class="darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'"
    >
      <div class="grid grid-cols-3 items-center max-w-md mx-auto">
        <div class="flex justify-center">
          <button
            class="p-3 rounded-full flex flex-col items-center"
            :class="darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'"
          >
            <BookOpenIcon class="h-6 w-6" />
            <span class="text-xs mt-1">Словарь</span>
          </button>
        </div>

        <div class="flex justify-center -mt-8">
          <button
            class="p-4 rounded-full shadow-lg"
            :class="
              darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
            "
          >
            <AcademicCapIcon class="h-8 w-8 text-white" />
          </button>
        </div>

        <div class="flex justify-center">
          <button
            class="p-3 rounded-full flex flex-col items-center"
            :class="darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'"
          >
            <UserIcon class="h-6 w-6" />
            <span class="text-xs mt-1">Профиль</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  MoonIcon,
  SunIcon,
  BookOpenIcon,
  AcademicCapIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  LanguageIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  PuzzlePieceIcon,
  BookmarkIcon,
  TrophyIcon,
  SparklesIcon,
  LightBulbIcon,
} from '@heroicons/vue/24/outline'

// Configuration
const NODE_SPACING = 12
const HORIZONTAL_RANGE = 30
const MAP_PADDING = 8
const PATH_SMOOTHNESS = 0.3

// Reactive state
const darkMode = ref(true)
const activePopup = ref<any>(null)
const keepPopupOpen = ref(false)
const hoveredNodeId = ref<string | null>(null)
const mapHeight = ref(800)
const svgWidth = ref(1000)
const svgHeight = ref(1200)

// Data
const groups = ref([
  {
    id: 'group-1',
    title: 'Основы',
    unlocked: true,
    completed: false,
    icon: LightBulbIcon,
  },
  {
    id: 'group-2',
    title: 'Фразы',
    unlocked: true,
    completed: false,
    icon: SparklesIcon,
  },
  {
    id: 'group-3',
    title: 'Продвинутые',
    unlocked: false,
    completed: false,
    icon: TrophyIcon,
  },
])

const lessons = ref([
  {
    id: 'greetings',
    groupId: 'group-1',
    title: 'Приветствия',
    description: 'Основные приветствия и повседневные выражения',
    unlocked: true,
    completed: true,
    kanjiCount: 5,
    vocabCount: 10,
    grammarPoints: 2,
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    id: 'basics',
    groupId: 'group-1',
    title: 'Основы',
    description: 'Основные фразы для повседневного общения',
    unlocked: true,
    completed: true,
    kanjiCount: 8,
    vocabCount: 15,
    grammarPoints: 3,
    icon: LanguageIcon,
  },
  {
    id: 'numbers',
    groupId: 'group-1',
    title: 'Числа',
    description: 'Числа, даты, время и счётные слова',
    unlocked: true,
    completed: false,
    kanjiCount: 10,
    vocabCount: 20,
    grammarPoints: 4,
    icon: BookmarkIcon,
  },
  {
    id: 'restaurant',
    groupId: 'group-2',
    title: 'В ресторане',
    description: 'Фразы для заказа еды и общения в ресторане',
    unlocked: true,
    completed: false,
    kanjiCount: 12,
    vocabCount: 25,
    grammarPoints: 5,
    icon: ShoppingCartIcon,
  },
  {
    id: 'shopping',
    groupId: 'group-2',
    title: 'Покупки',
    description: 'Фразы для шоппинга и торговли',
    unlocked: false,
    completed: false,
    kanjiCount: 15,
    vocabCount: 30,
    grammarPoints: 6,
    icon: ArrowPathIcon,
  },
  {
    id: 'grammar',
    groupId: 'group-3',
    title: 'Грамматика',
    description: 'Основные грамматические конструкции',
    unlocked: false,
    completed: false,
    kanjiCount: 20,
    vocabCount: 40,
    grammarPoints: 10,
    icon: PuzzlePieceIcon,
  },
])

// Computed
const positionedGroups = computed(() => {
  return groups.value
    .filter((g) => g.unlocked)
    .map((group, index) => {
      const yPos = MAP_PADDING + index * 20
      const xPos = 50 + (index % 2 === 0 ? -1 : 1) * (HORIZONTAL_RANGE / 2)

      return {
        ...group,
        position: {
          x: Math.max(MAP_PADDING, Math.min(100 - MAP_PADDING, xPos)),
          y: Math.max(MAP_PADDING, Math.min(100 - MAP_PADDING, yPos)),
        },
      }
    })
})

const positionedLessons = computed(() => {
  const result: any[] = []

  positionedGroups.value.forEach((group) => {
    const groupLessons = lessons.value
      .filter((l) => l.groupId === group.id)
      .sort((a, b) => a.title.localeCompare(b.title))

    groupLessons.forEach((lesson, lessonIndex) => {
      const yOffset = 5 + (lessonIndex + 1) * NODE_SPACING
      const xVariation = ((lessonIndex % 3) - 1) * (HORIZONTAL_RANGE / 3)

      result.push({
        ...lesson,
        position: {
          x: Math.max(MAP_PADDING, Math.min(100 - MAP_PADDING, group.position!.x + xVariation)),
          y: Math.max(MAP_PADDING, Math.min(100 - MAP_PADDING, group.position!.y + yOffset)),
        },
        popupSide: lessonIndex % 2 === 0 ? 'right' : 'left',
      })
    })
  })

  return result
})

const nodes = computed(() => {
  const items = [
    ...positionedGroups.value.map((g) => ({ ...g, nodeType: 'group' })),
    ...positionedLessons.value.map((l) => ({ ...l, nodeType: 'lesson' })),
  ]
  const sorted = items.sort((a, b) => a.position.y - b.position.y)
  return sorted.map((n) => ({
    ...n,
    svg: toSvgCoords(n.position.x, n.position.y),
  }))
})

const activePopupNode = computed(() => {
  if (!activePopup.value) return null
  return nodes.value.find((n: any) => n.id === activePopup.value) || null
})

function catmullRomToBezier(points: { x: number; y: number }[], tension = 0.3) {
  if (!points || points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i + 2 < points.length ? points[i + 2] : p2

    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

const pathData = computed(() => {
  const pts = nodes.value.map((n: any) => toSvgCoords(n.position.x, n.position.y))
  if (pts.length < 2) return ''
  return catmullRomToBezier(pts, PATH_SMOOTHNESS)
})

// Methods
const toSvgCoords = (xPercent: number, yPercent: number) => {
  return {
    x: (xPercent / 100) * svgWidth.value,
    y: (yPercent / 100) * svgHeight.value,
  }
}

const getNodeRadius = (node: any) => {
  const isHovered = hoveredNodeId.value === node.id
  const baseRadius = node.nodeType === 'group' ? 18 : 14
  return isHovered ? baseRadius * 1.15 : baseRadius
}

const getNodeFillColor = (node: any) => {
  if (!node.unlocked) return darkMode.value ? '#374151' : '#D1D5DB'
  if (node.completed) return darkMode.value ? '#16A34A' : '#10B981'
  return darkMode.value ? '#4F46E5' : '#6366F1'
}

const toggleTheme = () => {
  darkMode.value = !darkMode.value
}

const startLesson = (lesson: any) => {
  console.log('Starting lesson:', lesson.title)
  activePopup.value = null
}

const openTheory = (lesson: any) => {
  console.log('Opening theory for:', lesson.title)
  activePopup.value = null
}

const onNodeClick = (node: any) => {
  if (node.nodeType === 'lesson') {
    activePopup.value = node.id
  }
}

const handlePopupLeave = (id: any) => {
  keepPopupOpen.value = false
  setTimeout(() => {
    if (!keepPopupOpen.value && activePopup.value === id) {
      activePopup.value = null
    }
  }, 300)
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', () => {
    if (activePopup.value) {
      const node = nodes.value.find((n: any) => n.id === activePopup.value)
      if (node) {
        activePopup.value = null
        nextTick(() => {
          activePopup.value = node.id
        })
      }
    }
  })
})
</script>

<style scoped>
.node-circle {
  transition: r 0.2s ease;
}

.dark ::-webkit-scrollbar {
  width: 8px;
}
.dark ::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.5);
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(79, 70, 229, 0.5);
  border-radius: 4px;
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(79, 70, 229, 0.7);
}
</style>
