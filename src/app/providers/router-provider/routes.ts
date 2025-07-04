export default function getRoutes() {
  return [
    {
      path: '/',
      name: 'home',
      component: import('@/pages/draw-page.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/pages/AboutView.vue'),
    },
    {
      path: '/draw',
      name: 'draw',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/pages/draw-page.vue'),
    },
  ]
}
export const routes = getRoutes()
