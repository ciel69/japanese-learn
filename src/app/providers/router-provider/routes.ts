import HomeView from '@/pages/HomeView.vue'
import DrawView from '@/pages/draw-page.vue'
import GrammarView from '@/pages/grammar-page.vue'

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
      component: () => DrawView,
    },
    {
      path: '/grammar',
      name: 'grammar',
      component: () => GrammarView,
    },
  ]
}
export const routes = getRoutes()
