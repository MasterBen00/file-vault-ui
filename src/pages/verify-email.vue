<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-4" :loading="loading">
      <v-card-title class="text-center">{{ message }}</v-card-title>
      <v-card-actions v-if="!loading && !error">
        <v-btn block color="primary" @click="redirectToLogin">Go to Login</v-btn>
      </v-card-actions>
      <v-alert v-if="error" class="mt-4" type="error">
        {{ errorMessage }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router/auto'
  import { useAuthStore } from '@/stores/authStore'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const loading = ref(true)
  const message = ref('Verifying your email...')
  const error = ref(false)
  const errorMessage = ref('')

  onMounted(async () => {
    const token = route.query.token as string | undefined

    if (!token) {
      message.value = 'Email verification token is missing.'
      error.value = true
      errorMessage.value = 'No token provided in the URL.'
      loading.value = false
      return
    }

    try {
      const response = await authStore.verifyEmail(token)
      message.value = response || 'Email verified successfully!'
      error.value = false
      setTimeout(() => {
        redirectToLogin()
      }, 3000) // 3 seconds delay
    } catch (error_: any) {
      message.value = 'Email verification failed.'
      error.value = true
      errorMessage.value = error_.response?.data?.message || error_.message || 'An unexpected error occurred.'
    } finally {
      loading.value = false // Ensure loading is set to false in the finally block
    }
  })

  const redirectToLogin = () => {
    router.push('/login')
  }
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
