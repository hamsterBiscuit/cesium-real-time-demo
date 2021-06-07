import { createApp } from 'vue'
import App from './App.vue'
import 'element-plus/lib/theme-chalk/index.css'
;(window as any).CESIUM_BASE_URL = '/Cesium'

createApp(App).mount('#app')
