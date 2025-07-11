/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Import API interceptor for maintenance page detection
import '@/services/apiInterceptor'

// Styles
import 'unfonts.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
