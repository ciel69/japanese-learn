import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import FloatingVue from 'floating-vue'

import 'floating-vue/dist/style.css'

import App from './app/app.vue'
import { router } from '@/app/providers/router-provider/router-provider.ts'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(FloatingVue)

app.mount('#app')
