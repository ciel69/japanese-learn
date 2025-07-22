import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from './routes.ts'

export const router = createRouter({
  // history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})
