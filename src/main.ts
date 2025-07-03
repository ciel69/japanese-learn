import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './app/app.vue'
import { router } from '@/app/providers/router-provider/router-provider.ts'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
