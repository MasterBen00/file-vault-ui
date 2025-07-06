/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Types
import type { App } from 'vue'

import router from '../router'
import pinia from '../stores'
// Plugins
import vuetify from './vuetify'

// SockJS shim must be imported first to fix global reference error
import './sockjs-shim'

export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}
