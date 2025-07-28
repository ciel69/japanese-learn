import HomeView from '@/pages/HomeView.vue'
import DrawView from '@/pages/draw-page.vue'
import GrammarView from '@/pages/grammar-page.vue'
import KanaView from '@/pages/kana-page.vue'

export default function getRoutes() {
  return [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/pages/AboutView.vue'),
    },
    {
      path: '/draw',
      name: 'draw',
      component: DrawView,
    },
    {
      path: '/grammar',
      name: 'grammar',
      component: GrammarView,
    },
    {
      path: '/kana',
      name: 'kana',
      component: KanaView,
    },
  ]
}
export const routes = getRoutes()
