<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script lang="ts" setup>
  import { onMounted, watch } from 'vue'
  import { useTheme } from 'vuetify'

  const theme = useTheme()

  onMounted(() => {
    console.log('App.vue mounted.')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    console.log('System prefers dark mode (on mount):', systemPrefersDark)
    console.log('Initial Vuetify theme name:', theme.global.name.value)
    console.log('Is initial Vuetify theme dark?:', theme.global.current.value.dark)

    // If Vuetify's theme doesn't match the system preference, manually set it.
    if (theme.global.current.value.dark !== systemPrefersDark) {
      console.warn('Vuetify theme does not match system preference on mount! Manually setting it.')
      theme.global.name.value = systemPrefersDark ? 'dark' : 'light'
    }
  })

  watch(() => theme.global.name.value, newThemeName => {
    console.log('Vuetify theme name changed to:', newThemeName)
    console.log('Is new Vuetify theme dark?:', theme.global.current.value.dark)
  })

  // Watch for system color scheme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      console.log('System color scheme changed. System now prefers dark mode:', e.matches)
      // Manually set Vuetify's theme to match the new system preference.
      console.log(`Attempting to set Vuetify theme to: ${e.matches ? 'dark' : 'light'}`)
      theme.global.name.value = e.matches ? 'dark' : 'light'

      setTimeout(() => {
        console.log('Vuetify theme name after system change and manual set:', theme.global.name.value)
        console.log('Is Vuetify theme dark after system change and manual set?:', theme.global.current.value.dark)
        if (theme.global.current.value.dark !== e.matches) {
          console.warn('Vuetify theme STILL did not update to match system preference after manual set!')
        }
      }, 100)
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

  // It's good practice to clean up listeners, though for App.vue it might be less critical.
  // import { onUnmounted } from 'vue'; // if you decide to use onUnmounted
  // onUnmounted(() => {
  //   mediaQuery.removeEventListener('change', handleSystemThemeChange);
  // });
  }
</script>
