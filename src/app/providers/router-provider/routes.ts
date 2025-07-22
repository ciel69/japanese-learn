import DrawPage from '@/pages/draw-page.vue'

export default function getRoutes() {
  return [
    {
      path: '/',
      name: 'home',
      component: DrawPage,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/pages/AboutView.vue'),
    },
    {
      path: '/draw',
      name: 'draw',
      component: () => import('@/pages/draw-page.vue'),
    },
    {
      path: '/grammar',
      name: 'grammar',
      component: () => import('@/pages/grammar-page.vue'),
    },
  ]
}
export const routes = getRoutes()
